#!/usr/bin/env node

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { spawnSync } from 'node:child_process'
import { pathToFileURL } from 'node:url'
import {
  appendHistory,
  atomicWrite,
  getMission,
  initializeRuntime,
  normalizeMission,
  parseTaskPacket,
  readState,
  REPO_ROOT,
  saveMission,
  updateMissionState,
} from './hermes-runtime-store.mjs'
import { dispatchMission } from './hermes-dispatch.mjs'
import { adapterDryRun, adapterExecute, adapterStatus } from './hermes-worker-codex.mjs'
import { parseStatus, reviewMission } from './hermes-review-runtime.mjs'

function run(command, args, options = {}) { return spawnSync(command, args, { encoding: 'utf8', windowsHide: true, ...options }) }
function git(repo, args) {
  const result = run('git', ['-C', repo, ...args])
  if (result.status !== 0) throw new Error(`Git command failed: ${(result.stderr || result.stdout).trim()}`)
  return result.stdout.trim()
}

function enqueue(packetPath) {
  const packet = parseTaskPacket(packetPath)
  if (getMission(packet.mission_id)) throw new Error(`Duplicate mission execution refused: ${packet.mission_id}. Use --resume for a resumable mission.`)
  const mission = normalizeMission(packet)
  const baseline = run('git', ['-C', packet.repo, 'status', '--short'])
  if (baseline.status !== 0) throw new Error(`Git status failed: ${(baseline.stderr || baseline.stdout).trim()}`)
  mission.baseline_status = parseStatus(baseline.stdout || '')
  mission.baseline_head = git(packet.repo, ['rev-parse', 'HEAD'])
  saveMission(mission, { create: true })
  const queue = readState('queue.json')
  queue.items.push({ mission_id: mission.mission_id, enqueued_at: mission.created_at, priority: 0 })
  atomicWrite('queue.json', queue)
  appendHistory('MISSION_ENQUEUED', mission.mission_id, { packet_path: mission.packet_path, runner: true })
  return mission
}

function releaseLocks(missionId, reason) {
  const state = readState('locks.json')
  let released = 0
  for (const lock of state.locks.filter(item => item.mission_id === missionId && item.status !== 'released')) {
    lock.status = 'released'; lock.released_at = new Date().toISOString(); lock.release_reason = reason; released += 1
  }
  atomicWrite('locks.json', state)
  appendHistory('LOCKS_RELEASED', missionId, { released, reason })
  return released
}

function removeFromQueue(missionId) {
  const queue = readState('queue.json')
  queue.items = queue.items.filter(item => item.mission_id !== missionId)
  atomicWrite('queue.json', queue)
}

function closeoutMarkdown(mission, assignment, execution, review = null) {
  const changed = review?.changed_files || []
  const checks = review?.checks || []
  const verdict = review?.verdict || 'HOLD_FOR_EVIDENCE'
  return `---
closeout_id: CLOSEOUT-${mission.mission_id}
mission_id: ${mission.mission_id}
session_id: SESSION-${Date.now()}
agent: ${assignment?.selected_worker || 'Hermes Runtime'}
branch: ${mission.branch}
date: ${new Date().toISOString().slice(0, 10)}
risk: ${assignment?.risk || 'unknown'}
---

# Closeout Packet v3 — ${mission.mission_id}

## Mission Metadata

Mission ${mission.mission_id}; worker ${assignment?.selected_worker || 'unknown'}; branch ${mission.branch}.

## Task Summary

${mission.mission}

## Files Changed

${changed.length ? changed.map(file => `- ${file}`).join('\n') : '- None detected.'}

## Files Inspected

- Mission packet and repository state.

## Commands Run

${checks.length ? checks.map(check => `- ${check.command}: ${check.status}`).join('\n') : '- Worker execution and git status inspection.'}

## Screenshots / QA Artifacts

- ${review?.qa_required ? 'Required; see mission evidence.' : 'N/A'}

## Validation

${checks.length ? checks.map(check => `- ${check.command}: ${check.status}`).join('\n') : `- Execution: ${execution?.status || 'not executed'}`}

## Risk Score

${assignment?.risk || 'unknown'}

## Confirmed NOT Modified

- Protected paths outside the mission scope were not modified by the runner.

## Cost / Quota

- ${assignment?.cost_quota_note || 'Codex quota status: unknown — evidence required.'}

## Scope Summary

- Outside scope: ${review?.outside_scope?.length ? review.outside_scope.join(', ') : 'None detected'}

## Evidence Summary

- Execution record: ${execution?.status || 'missing'}
- Closeout detected: ${execution?.closeout_detected ? 'Yes' : 'No'}

## Review Recommendation

**${verdict.replaceAll('_', ' ')}**

## Reopen Criteria

- Reopen if new evidence contradicts this report or Por requests in-scope follow-up.

## Git Confirmation

- Commit made: ${review?.commit_created ? 'Yes' : 'No'}
- Push performed: No
- Merge performed: No

## Risks / Remaining Issues

- ${review?.issues?.length ? review.issues.join('; ') : 'None identified.'}

## Suggested Next Mission

- None.
`
}

function writeCloseout(mission, assignment, execution, review = null) {
  const dir = join(REPO_ROOT, '.hermes', 'closeouts')
  mkdirSync(dir, { recursive: true })
  const path = join(dir, `${mission.mission_id}.md`)
  writeFileSync(path, closeoutMarkdown(mission, assignment, execution, review), 'utf8')
  return path
}

function commitIfAllowed(mission, review) {
  if (!['AUTO_ACCEPT', 'ACCEPT_WITH_WARNINGS'].includes(review.verdict) || !review.changed_files.length) return null
  if (!['LOW', 'MEDIUM'].includes(review.risk) || review.protected_paths.length || review.outside_scope.length || review.forbidden_touched.length || review.conflicts.length || review.checks.some(check => check.status !== 'PASS') || !review.closeout.complete) return null
  for (const file of review.changed_files) {
    const add = run('git', ['-C', mission.repo, 'add', '--', file])
    if (add.status !== 0) throw new Error(`Auto-commit staging failed for ${file}: ${add.stderr}`)
  }
  const staged = git(mission.repo, ['diff', '--cached', '--name-only']).split(/\r?\n/).filter(Boolean)
  if (staged.some(file => !review.changed_files.includes(file))) throw new Error('Auto-commit refused: staged scope differs from reviewed scope')
  const commit = run('git', ['-C', mission.repo, 'commit', '-m', `chore(hermes): complete ${mission.mission_id}`])
  if (commit.status !== 0) throw new Error(`Auto-commit failed: ${(commit.stderr || commit.stdout).trim()}`)
  return git(mission.repo, ['rev-parse', 'HEAD'])
}

function dryRun(packetPath) {
  const mission = enqueue(packetPath)
  const assignment = dispatchMission({ missionId: mission.mission_id, authorize: false })
  const adapter = assignment.worker_id === 'codex-cli' ? adapterDryRun(mission.packet_path) : null
  const execution = { status: 'DRY_RUN', closeout_detected: false }
  const closeoutPath = writeCloseout(mission, assignment, execution)
  appendHistory('RUNNER_DRY_RUN_COMPLETED', mission.mission_id, { assignment_id: assignment.assignment_id })
  return { mode: 'dry-run', mission_id: mission.mission_id, assignment, adapter, review_verdict: 'HOLD_FOR_EVIDENCE', closeout_path: closeoutPath, resumable: true }
}

function executeMission(mission, { resume = false } = {}) {
  if (['COMPLETED', 'ARCHIVED'].includes(mission.state)) throw new Error(`Mission ${mission.mission_id} is terminal (${mission.state}); resume refused`)
  const existingExecution = adapterStatus(mission.mission_id)
  let assignment = readState('runtime.json').active_assignments[mission.mission_id]
  if (mission.state === 'RUNNING' && !resume) throw new Error(`Mission ${mission.mission_id} is already RUNNING; use --resume`)
  if (existingExecution?.status === 'COMPLETED') {
    if (!resume) throw new Error(`Duplicate mission execution refused: ${mission.mission_id}`)
  } else if (existingExecution?.status === 'RUNNING') throw new Error(`Mission ${mission.mission_id} already has an active execution; duplicate execution refused`)
  else {
    if (!assignment || assignment.approval_state !== 'AUTHORIZED') assignment = dispatchMission({ missionId: mission.mission_id, authorize: true })
    if (!assignment.safe_to_run) throw new Error(`Mission cannot execute: ${assignment.approval_state}`)
    if (assignment.worker_id !== 'codex-cli') throw new Error(`Worker execution not implemented for ${assignment.selected_worker}`)
  }
  const execution = existingExecution?.status === 'COMPLETED' ? existingExecution : adapterExecute(mission.packet_path, { authorizedByDispatch: true })
  const provisionalCloseout = writeCloseout(mission, assignment, execution)
  let review = reviewMission(mission.mission_id, { closeoutPath: provisionalCloseout })
  let commit = null
  if (['AUTO_ACCEPT', 'ACCEPT_WITH_WARNINGS'].includes(review.verdict)) {
    commit = commitIfAllowed(mission, review)
    review = { ...review, commit_created: Boolean(commit), commit }
    updateMissionState(mission.mission_id, 'COMPLETED', { review_verdict: review.verdict, commit: commit || null, completed_at: new Date().toISOString() })
    releaseLocks(mission.mission_id, 'mission completed')
    removeFromQueue(mission.mission_id)
  } else {
    const state = review.verdict === 'HOLD_FOR_EVIDENCE' ? 'BLOCKED' : 'FAILED'
    updateMissionState(mission.mission_id, state, { review_verdict: review.verdict, block_reason: review.issues.join('; ') })
    releaseLocks(mission.mission_id, `mission ${state.toLowerCase()}`)
    if (state === 'FAILED') removeFromQueue(mission.mission_id)
  }
  const closeoutPath = writeCloseout(mission, assignment, execution, review)
  appendHistory('RUNNER_COMPLETED', mission.mission_id, { verdict: review.verdict, commit, pushed: false })
  return { mode: resume ? 'resume' : 'execute', mission_id: mission.mission_id, assignment, execution, review, commit, closeout_path: closeoutPath, pushed: false, merged: false }
}

function main() {
  initializeRuntime()
  const args = process.argv.slice(2)
  if (args[0] === '--status') {
    const mission = getMission(args[1]); if (!mission) throw new Error(`Mission not found: ${args[1]}`)
    return { mission, assignment: readState('runtime.json').active_assignments[args[1]] || null, execution: adapterStatus(args[1]), history: readState('history.json').events.filter(event => event.mission_id === args[1]) }
  }
  if (args[0] === '--resume') {
    const mission = getMission(args[1]); if (!mission) throw new Error(`Mission not found: ${args[1]}`)
    return executeMission(mission, { resume: true })
  }
  const execute = args.includes('--execute')
  const packetPath = args.find(arg => !arg.startsWith('--'))
  if (!packetPath) throw new Error('Usage: hermes:run [--dry-run|--execute] <mission-packet> | --resume <id> | --status <id>')
  if (!execute) return dryRun(packetPath)
  const mission = enqueue(packetPath)
  return executeMission(mission)
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  try {
    const result = main()
    console.log(JSON.stringify(result, null, 2))
    if (result.review && !['AUTO_ACCEPT', 'ACCEPT_WITH_WARNINGS'].includes(result.review.verdict)) process.exitCode = 2
  }
  catch (error) { console.error(`Hermes runner error: ${error.message}`); process.exit(2) }
}
