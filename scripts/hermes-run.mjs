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
import { syncCloseout } from './hermes-sync.mjs'

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
- Worker verdict: ${execution?.worker_verdict || 'unknown'}
- Objective verified: ${review?.objective?.objective_verified ? 'Yes' : 'No'}

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

export function commitEligibility({ review, finalState, syncResult, closeoutPath }) {
  const reasons = []
  if (finalState !== 'COMPLETED') reasons.push(`Final mission state is ${finalState || 'missing'}`)
  if (!syncResult?.synced || syncResult.runtime_state !== 'COMPLETED') reasons.push('Mission sync did not preserve COMPLETED')
  if (!closeoutPath || !existsSync(closeoutPath)) reasons.push('Final closeout is missing')
  if (!review?.completion_ready || !['AUTO_ACCEPT', 'ACCEPT_WITH_WARNINGS'].includes(review?.verdict)) reasons.push('Review did not accept verified completion')
  if (!review?.changed_files?.length) reasons.push('Mission has no approved changed files')
  if (!['LOW', 'MEDIUM'].includes(review?.risk)) reasons.push(`Risk is ${review?.risk || 'unknown'}`)
  if (review?.protected_paths?.length || review?.outside_scope?.length || review?.forbidden_touched?.length || review?.conflicts?.length) reasons.push('Scope, protection, or conflict gate failed')
  if (review?.checks?.some(check => check.status !== 'PASS')) reasons.push('A required validation check failed')
  if (!review?.closeout?.complete || !review?.worker_closeout?.passing || !review?.objective?.objective_verified) reasons.push('Completion evidence is incomplete')
  return { eligible: reasons.length === 0, reasons }
}

export function validateStagedScope(approvedFiles, stagedFiles) {
  const outside = stagedFiles.filter(file => !approvedFiles.includes(file))
  return { valid: outside.length === 0, outside }
}

export function resolveCommitMessage(missionId, explicitMessage = null) {
  return explicitMessage || `chore(hermes): complete ${missionId}`
}

function commitIfAllowed(mission, review, { message, finalState, syncResult, closeoutPath }) {
  const eligibility = commitEligibility({ review, finalState, syncResult, closeoutPath })
  if (!eligibility.eligible) throw new Error(`Commit prohibited: ${eligibility.reasons.join('; ')}`)
  for (const file of review.changed_files) {
    const add = run('git', ['-C', mission.repo, 'add', '--', file])
    if (add.status !== 0) throw new Error(`Auto-commit staging failed for ${file}: ${add.stderr}`)
  }
  const staged = git(mission.repo, ['diff', '--cached', '--name-only']).split(/\r?\n/).filter(Boolean)
  const stagedScope = validateStagedScope(review.changed_files, staged)
  if (!stagedScope.valid) throw new Error(`Auto-commit refused: staged scope includes ${stagedScope.outside.join(', ')}`)
  const commit = run('git', ['-C', mission.repo, 'commit', '-m', resolveCommitMessage(mission.mission_id, message)])
  if (commit.status !== 0) throw new Error(`Auto-commit failed: ${(commit.stderr || commit.stdout).trim()}`)
  return git(mission.repo, ['rev-parse', 'HEAD'])
}

export function finalizeAcceptedMission({ mission, assignment, execution, review, commitEnabled = true, commitMessage = null, operations = {} }) {
  const write = operations.writeCloseout || writeCloseout
  const sync = operations.syncCloseout || syncCloseout
  const lookup = operations.getMission || getMission
  const commitOperation = operations.commit || commitIfAllowed
  const closeoutPath = write(mission, assignment, execution, review)
  if (!closeoutPath || !(operations.closeoutExists ? operations.closeoutExists(closeoutPath) : existsSync(closeoutPath))) throw new Error('Final closeout verification failed')
  const completionEvidence = {
    ready: true,
    execution_status: execution.status,
    objective_verified: review.objective.objective_verified,
    worker_closeout_passing: review.worker_closeout.passing,
    review_verdict: review.verdict,
    blocking_evidence: false,
    closeout_path: closeoutPath,
    sync_required: true,
  }
  const syncResult = sync(closeoutPath, { completionEvidence })
  if (!syncResult?.synced) throw new Error('Mission sync did not complete')
  const finalMission = lookup(mission.mission_id)
  if (finalMission?.state !== 'COMPLETED') throw new Error(`Final mission state verification failed: ${finalMission?.state || 'missing'}`)
  const eligibility = commitEligibility({ review, finalState: finalMission.state, syncResult, closeoutPath })
  if (!eligibility.eligible) throw new Error(`Completion gates failed: ${eligibility.reasons.join('; ')}`)
  const commit = commitEnabled ? commitOperation(mission, review, { message: commitMessage, finalState: finalMission.state, syncResult, closeoutPath }) : null
  return { closeoutPath, syncResult, finalMission, commit, commitEnabled, commitMessage }
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

function executeMission(mission, { resume = false, commitEnabled = true, commitMessage = null } = {}) {
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
  if (execution.status === 'COMPLETED') updateMissionState(mission.mission_id, 'WAITING_REVIEW', { execution_status: execution.status })
  let review = reviewMission(mission.mission_id, { closeoutPath: execution.closeout_path })
  let commit = null
  let closeoutPath = null
  let syncResult = null
  if (review.completion_ready && ['AUTO_ACCEPT', 'ACCEPT_WITH_WARNINGS'].includes(review.verdict)) {
    const finalized = finalizeAcceptedMission({ mission, assignment, execution, review, commitEnabled, commitMessage })
    commit = finalized.commit
    closeoutPath = finalized.closeoutPath
    syncResult = finalized.syncResult
    review = { ...review, commit_created: Boolean(commit), commit }
    releaseLocks(mission.mission_id, 'mission completed')
    removeFromQueue(mission.mission_id)
  } else {
    const state = review.verdict === 'NEEDS_REWORK' ? 'NEEDS_REWORK' : review.verdict === 'HOLD_FOR_EVIDENCE' || execution.status === 'BLOCKED' ? 'BLOCKED' : 'FAILED'
    updateMissionState(mission.mission_id, state, { review_verdict: review.verdict, block_reason: review.issues.join('; ') })
    appendHistory('MISSION_COMPLETION_REJECTED', mission.mission_id, { state, verdict: review.verdict, issues: review.issues })
    releaseLocks(mission.mission_id, `mission ${state.toLowerCase()}`)
    if (state === 'FAILED') removeFromQueue(mission.mission_id)
    closeoutPath = writeCloseout(mission, assignment, execution, review)
    syncResult = syncCloseout(closeoutPath)
  }
  appendHistory('RUNNER_COMPLETED', mission.mission_id, { verdict: review.verdict, commit, sync_state: syncResult?.runtime_state, pushed: false })
  return { mode: resume ? 'resume' : 'execute', mission_id: mission.mission_id, assignment, execution, review, sync: syncResult, commit, closeout_path: closeoutPath, pushed: false, merged: false }
}

export function parseCommitControls(args) {
  const noCommit = args.includes('--no-commit')
  const messageIndex = args.indexOf('--commit-message')
  const commitMessage = messageIndex >= 0 ? args[messageIndex + 1] : null
  if (messageIndex >= 0 && (!commitMessage || commitMessage.startsWith('--'))) throw new Error('--commit-message requires a non-empty value')
  return { commitEnabled: !noCommit, commitMessage }
}

function main() {
  initializeRuntime()
  const args = process.argv.slice(2)
  const commitControls = parseCommitControls(args)
  if (args[0] === '--status') {
    const mission = getMission(args[1]); if (!mission) throw new Error(`Mission not found: ${args[1]}`)
    return { mission, assignment: readState('runtime.json').active_assignments[args[1]] || null, execution: adapterStatus(args[1]), history: readState('history.json').events.filter(event => event.mission_id === args[1]) }
  }
  if (args[0] === '--resume') {
    const mission = getMission(args[1]); if (!mission) throw new Error(`Mission not found: ${args[1]}`)
    return executeMission(mission, { resume: true, ...commitControls })
  }
  const execute = args.includes('--execute')
  const messageIndex = args.indexOf('--commit-message')
  const values = new Set(messageIndex >= 0 ? [args[messageIndex + 1]] : [])
  const packetPath = args.find(arg => !arg.startsWith('--') && !values.has(arg))
  if (!packetPath) throw new Error('Usage: hermes:run [--dry-run|--execute] [--no-commit] [--commit-message <message>] <mission-packet> | --resume <id> [commit controls] | --status <id>')
  if (!execute) return dryRun(packetPath)
  const mission = enqueue(packetPath)
  return executeMission(mission, commitControls)
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  try {
    const result = main()
    console.log(JSON.stringify(result, null, 2))
    if (result.review && !['AUTO_ACCEPT', 'ACCEPT_WITH_WARNINGS'].includes(result.review.verdict)) process.exitCode = 2
  }
  catch (error) { console.error(`Hermes runner error: ${error.message}`); process.exit(2) }
}
