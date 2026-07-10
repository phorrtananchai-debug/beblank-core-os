#!/usr/bin/env node

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { spawnSync } from 'node:child_process'
import { pathToFileURL } from 'node:url'
import {
  getMission,
  initializeRuntime,
  parseTaskPacket,
  readState,
  REPO_ROOT,
} from './hermes-runtime-store.mjs'
import { classifyMission, validateDispatchPacket } from './hermes-dispatch.mjs'

function run(command, args, options = {}) {
  return spawnSync(command, args, { encoding: 'utf8', windowsHide: true, ...options })
}

function git(repo, args) {
  const result = run('git', ['-C', repo, ...args])
  return { command: `git ${args.join(' ')}`, exit_code: result.status ?? 1, stdout: result.stdout || '', stderr: result.stderr || '' }
}

export function parseStatus(text) {
  return text.split(/\r?\n/).filter(Boolean).map(line => ({ code: line.slice(0, 2), path: line.slice(3).replace(/^"|"$/g, '') }))
}

function matchesScope(file, pattern) {
  const target = file.replaceAll('\\', '/').toLowerCase()
  const scope = pattern.replaceAll('\\', '/').replace(/^\.\//, '').toLowerCase()
  if (scope.endsWith('/**')) return target === scope.slice(0, -3) || target.startsWith(scope.slice(0, -2))
  if (scope.endsWith('/')) return target.startsWith(scope)
  if (scope.startsWith('*.')) return target.endsWith(scope.slice(1))
  return target === scope
}

export function changedSinceBaseline(current, baseline = []) {
  const previous = new Map(baseline.map(item => [item.path, item.code]))
  return current.filter(item => previous.get(item.path) !== item.code)
}

function runCheck(repo, name, args) {
  const result = process.platform === 'win32'
    ? run(process.env.ComSpec || 'cmd.exe', ['/d', '/s', '/c', name, ...args], { cwd: repo, maxBuffer: 20 * 1024 * 1024 })
    : run(name, args, { cwd: repo, maxBuffer: 20 * 1024 * 1024 })
  return { command: [name, ...args].join(' '), exit_code: result.status ?? 1, status: result.status === 0 ? 'PASS' : 'FAIL', output: `${result.stdout || ''}${result.stderr || ''}${result.error?.message || ''}`.slice(-4000) }
}

function requiredChecks(repo, packet, changedFiles) {
  const checks = []
  const requested = packet.required_checks.join(' ').toLowerCase()
  checks.push(runCheck(repo, process.platform === 'win32' ? 'npm.cmd' : 'npm', ['run', 'lint']))
  checks.push(runCheck(repo, process.platform === 'win32' ? 'npm.cmd' : 'npm', ['run', 'build']))
  if (/\btest/.test(requested)) {
    const script = JSON.parse(readFileSync(join(repo, 'package.json'), 'utf8')).scripts?.test
    checks.push(script ? runCheck(repo, process.platform === 'win32' ? 'npm.cmd' : 'npm', ['test']) : { command: 'npm test', exit_code: 1, status: 'FAIL', output: 'Test requested but no test script is configured.' })
  }
  return checks
}

const REQUIRED_CLOSEOUT_HEADINGS = [
  'Mission Metadata', 'Task Summary', 'Files Changed', 'Files Inspected', 'Commands Run',
  'Screenshots / QA Artifacts', 'Validation', 'Risk Score', 'Confirmed NOT Modified',
  'Cost / Quota', 'Scope Summary', 'Evidence Summary', 'Review Recommendation',
  'Reopen Criteria', 'Git Confirmation', 'Risks / Remaining Issues', 'Suggested Next Mission',
]

function closeoutCompleteness(path) {
  if (!path || !existsSync(path)) return { complete: false, missing: ['closeout file'] }
  const text = readFileSync(path, 'utf8')
  const missing = REQUIRED_CLOSEOUT_HEADINGS.filter(heading => !new RegExp(`^##\\s+${heading.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*$`, 'mi').test(text))
  return { complete: missing.length === 0, missing }
}

export function reviewMission(missionId, { closeoutPath = null } = {}) {
  initializeRuntime()
  const mission = getMission(missionId)
  if (!mission) throw new Error(`Mission not found: ${missionId}`)
  const packet = parseTaskPacket(mission.packet_path)
  const validation = validateDispatchPacket(packet)
  const analysis = classifyMission(packet)
  const runtime = readState('runtime.json')
  const execution = runtime.executions[missionId] || null
  const assignment = runtime.active_assignments[missionId] || null
  const statusResult = git(packet.repo, ['status', '--short'])
  const currentStatus = parseStatus(statusResult.stdout)
  const changed = changedSinceBaseline(currentStatus, mission.baseline_status || [])
  const changedFiles = changed.map(item => item.path)
  const outsideScope = changedFiles.filter(file => !packet.allowed_files.some(pattern => matchesScope(file, pattern)))
  const forbiddenTouched = changedFiles.filter(file => packet.forbidden_files.some(pattern => matchesScope(file, pattern)))
  const conflicts = currentStatus.filter(item => /U|AA|DD/.test(item.code)).map(item => item.path)
  const headResult = git(packet.repo, ['rev-parse', 'HEAD'])
  const head = headResult.stdout.trim()
  const headChanged = Boolean(mission.baseline_head && head && head !== mission.baseline_head)
  const lock = readState('locks.json').locks.find(item => item.mission_id === missionId && item.status !== 'released') || null
  const checks = execution?.status === 'COMPLETED' ? requiredChecks(packet.repo, packet, changedFiles) : []
  const closeout = closeoutCompleteness(closeoutPath || execution?.closeout_path)
  const issues = []
  const warnings = []
  if (!validation.valid) issues.push(...validation.issues)
  if (outsideScope.length) issues.push(`Changed files outside allowed scope: ${outsideScope.join(', ')}`)
  if (forbiddenTouched.length) issues.push(`Forbidden files changed: ${forbiddenTouched.join(', ')}`)
  if (conflicts.length) issues.push(`Unresolved conflicts: ${conflicts.join(', ')}`)
  if (headChanged) issues.push(`Worker changed HEAD before review: ${mission.baseline_head} -> ${head}`)
  if (!closeout.complete) issues.push(`Closeout Packet v3 incomplete: ${closeout.missing.join(', ')}`)
  if (!execution) issues.push('Execution evidence is missing')
  else if (execution.status !== 'COMPLETED') issues.push(`Execution status is ${execution.status}`)
  if (checks.some(check => check.status === 'FAIL')) issues.push(`Required checks failed: ${checks.filter(check => check.status === 'FAIL').map(check => check.command).join(', ')}`)
  const qaRequired = /qa|screenshot/i.test(packet.required_checks.join(' '))
  const qaArtifacts = changedFiles.filter(file => /(^|\/)_(qa)(\/|$)|screenshot|qa_report/i.test(file))
  if (qaRequired && !qaArtifacts.length) issues.push('Required QA artifacts are missing')
  if (analysis.protected_paths.length || ['HIGH', 'CRITICAL'].includes(analysis.risk)) issues.push(`Protected/high-risk scope requires Por: ${analysis.protected_paths.join(', ') || analysis.risk}`)
  if (!lock && mission.state === 'RUNNING') warnings.push('Running mission has no active lock')
  if (execution?.quota_block) issues.push('Codex quota/cost evidence block is active')
  const pushed = false
  const merged = false
  let verdict = 'AUTO_ACCEPT'
  if (forbiddenTouched.length || outsideScope.length) verdict = 'REJECT'
  else if (analysis.protected_paths.length || ['HIGH', 'CRITICAL'].includes(analysis.risk) || conflicts.length || headChanged || checks.some(check => check.status === 'FAIL') || (qaRequired && !qaArtifacts.length) || (execution && !closeout.complete)) verdict = 'HUMAN_REQUIRED'
  else if (!execution || !closeout.complete) verdict = 'HOLD_FOR_EVIDENCE'
  else if (execution.status !== 'COMPLETED') verdict = 'NEEDS_REWORK'
  else if (warnings.length) verdict = 'ACCEPT_WITH_WARNINGS'
  const result = {
    mission_id: missionId, verdict, risk: analysis.risk, packet_valid: validation.valid,
    changed_files: changedFiles, allowed_files: packet.allowed_files, outside_scope: outsideScope,
    forbidden_touched: forbiddenTouched, protected_paths: analysis.protected_paths, conflicts,
    checks, qa_required: qaRequired, qa_artifacts: qaArtifacts,
    closeout, execution_status: execution?.status || 'MISSING', lock_active: Boolean(lock),
    git_status: statusResult.stdout.trim(), baseline_head: mission.baseline_head, head, head_changed: headChanged, commit_created: false, pushed, merged,
    quota_note: assignment?.cost_quota_note || 'Codex quota status: unknown — evidence required.',
    issues, warnings, reviewed_at: new Date().toISOString(),
  }
  const reportDir = join(REPO_ROOT, '.hermes', 'reviews')
  mkdirSync(reportDir, { recursive: true })
  const reportPath = join(reportDir, `${missionId}.json`)
  writeFileSync(reportPath, `${JSON.stringify(result, null, 2)}\n`, 'utf8')
  return { ...result, report_path: reportPath }
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  try {
    const [missionId, closeout] = process.argv.slice(2)
    if (!missionId) throw new Error('Usage: hermes:review <mission-id> [closeout-path]')
    const result = reviewMission(missionId, { closeoutPath: closeout || null })
    console.log(JSON.stringify(result, null, 2))
    if (['REJECT', 'HUMAN_REQUIRED', 'NEEDS_REWORK'].includes(result.verdict)) process.exitCode = 2
    else if (['HOLD_FOR_EVIDENCE', 'ACCEPT_WITH_WARNINGS'].includes(result.verdict)) process.exitCode = 1
  } catch (error) { console.error(`Hermes review error: ${error.message}`); process.exit(2) }
}
