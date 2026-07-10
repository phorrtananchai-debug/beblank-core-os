#!/usr/bin/env node

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { spawnSync } from 'node:child_process'
import { pathToFileURL } from 'node:url'
import {
  changedSinceBaseline,
  captureOutputFingerprints,
  detectMissionChanges,
  getMission,
  initializeRuntime,
  inspectMissionObjective,
  parseGitStatus,
  parseTaskPacket,
  pathMatchesScope,
  readState,
  REPO_ROOT,
} from './hermes-runtime-store.mjs'
import { classifyMission, validateDispatchPacket } from './hermes-dispatch.mjs'
import { CLOSEOUT_V3_HEADINGS, inspectWorkerCloseout } from './hermes-worker-codex.mjs'

function run(command, args, options = {}) {
  return spawnSync(command, args, { encoding: 'utf8', windowsHide: true, ...options })
}

function git(repo, args) {
  const result = run('git', ['-C', repo, ...args])
  return { command: `git ${args.join(' ')}`, exit_code: result.status ?? 1, stdout: result.stdout || '', stderr: result.stderr || '' }
}

export const parseStatus = parseGitStatus
export { changedSinceBaseline }

function runCheck(repo, name, args) {
  const result = process.platform === 'win32'
    ? run(process.env.ComSpec || 'cmd.exe', ['/d', '/s', '/c', name, ...args], { cwd: repo, maxBuffer: 20 * 1024 * 1024 })
    : run(name, args, { cwd: repo, maxBuffer: 20 * 1024 * 1024 })
  return { command: [name, ...args].join(' '), exit_code: result.status ?? 1, status: result.status === 0 ? 'PASS' : 'FAIL', output: `${result.stdout || ''}${result.stderr || ''}${result.error?.message || ''}`.slice(-4000) }
}

export function normalizeRequiredChecks(requiredChecks, scripts = {}) {
  const plans = []
  const seen = new Set()
  for (const raw of requiredChecks || []) {
    const text = String(raw || '').trim().replace(/\s+/g, ' ')
    let plan
    if (text === 'npm test') {
      plan = scripts.test
        ? { command: 'npm test', args: ['test'] }
        : { command: 'npm test', error: 'Required check "npm test" was declared, but package.json has no test script.' }
    } else {
      const match = /^npm run ([A-Za-z0-9:_-]+)(?: (.*))?$/.exec(text)
      if (!match) {
        plan = { command: text || '<empty>', error: `Unknown or malformed required check: ${text || '<empty>'}` }
      } else {
        const [, script, trailing = ''] = match
        if (!scripts[script]) plan = { command: text, error: `Required npm script "${script}" is not configured.` }
        else {
          const extra = trailing ? trailing.split(' ') : []
          plan = { command: text, args: ['run', script, ...extra] }
        }
      }
    }
    if (!seen.has(plan.command)) { seen.add(plan.command); plans.push(plan) }
  }
  return plans
}

export function requiredChecks(repo, packet) {
  const scripts = JSON.parse(readFileSync(join(repo, 'package.json'), 'utf8')).scripts || {}
  const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm'
  return normalizeRequiredChecks(packet.required_checks, scripts).map(plan => plan.error
    ? { command: plan.command, exit_code: 1, status: 'FAIL', output: plan.error }
    : runCheck(repo, npm, plan.args))
}

const REQUIRED_CLOSEOUT_HEADINGS = CLOSEOUT_V3_HEADINGS

function closeoutCompleteness(path) {
  if (!path || !existsSync(path)) return { complete: false, missing: ['closeout file'] }
  const text = readFileSync(path, 'utf8')
  const missing = REQUIRED_CLOSEOUT_HEADINGS.filter(heading => !new RegExp(`^#{1,6}\\s+(?:\\d+\\.\\s*)?${heading.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*$`, 'mi').test(text))
  return { complete: missing.length === 0, missing }
}

export function determineReviewVerdict(facts) {
  if (facts.outside_scope || facts.forbidden_touched) return 'REJECT'
  if (facts.protected_scope || facts.conflicts || facts.head_changed || facts.checks_failed) return 'HUMAN_REQUIRED'
  if (facts.execution_missing) return 'HOLD_FOR_EVIDENCE'
  if (facts.execution_failed || facts.objective_failed || facts.worker_blocking || facts.closeout_missing || facts.blocking_evidence || facts.fingerprint_failed) return 'NEEDS_REWORK'
  if (facts.warnings) return 'ACCEPT_WITH_WARNINGS'
  return 'AUTO_ACCEPT'
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
  const currentStatus = parseGitStatus(statusResult.stdout)
  const outputFingerprints = captureOutputFingerprints(packet.repo, packet.allowed_files)
  const changeDetection = detectMissionChanges(currentStatus, mission.baseline_status || [], mission.output_baseline, outputFingerprints)
  const changedFiles = changeDetection.changed_files
  const outsideScope = changedFiles.filter(file => !packet.allowed_files.some(pattern => pathMatchesScope(file, pattern)))
  const forbiddenTouched = changedFiles.filter(file => packet.forbidden_files.some(pattern => pathMatchesScope(file, pattern)))
  const conflicts = currentStatus.filter(item => /U|AA|DD/.test(item.code)).map(item => item.path)
  const headResult = git(packet.repo, ['rev-parse', 'HEAD'])
  const head = headResult.stdout.trim()
  const headChanged = Boolean(mission.baseline_head && head && head !== mission.baseline_head)
  const lock = readState('locks.json').locks.find(item => item.mission_id === missionId && item.status !== 'released') || null
  const checks = execution?.status === 'COMPLETED' ? requiredChecks(packet.repo, packet) : []
  const workerCloseoutPath = closeoutPath || execution?.closeout_path
  const closeout = closeoutCompleteness(workerCloseoutPath)
  const workerCloseout = inspectWorkerCloseout(workerCloseoutPath, { changedFiles })
  const objective = inspectMissionObjective(packet, changedFiles)
  const issues = []
  const warnings = []
  if (!validation.valid) issues.push(...validation.issues)
  if (outsideScope.length) issues.push(`Changed files outside allowed scope: ${outsideScope.join(', ')}`)
  if (forbiddenTouched.length) issues.push(`Forbidden files changed: ${forbiddenTouched.join(', ')}`)
  if (conflicts.length) issues.push(`Unresolved conflicts: ${conflicts.join(', ')}`)
  if (headChanged) issues.push(`Worker changed HEAD before review: ${mission.baseline_head} -> ${head}`)
  if (!changeDetection.ok) issues.push(`Output fingerprint capture failed: ${changeDetection.fingerprint.errors.map(item => `${item.scope}: ${item.error}`).join('; ')}`)
  if (!closeout.complete) issues.push(`Closeout Packet v3 incomplete: ${closeout.missing.join(', ')}`)
  if (!execution) issues.push('Execution evidence is missing')
  else if (execution.status !== 'COMPLETED') issues.push(`Execution status is ${execution.status}`)
  if (!workerCloseout.passing) issues.push(`Worker closeout verdict is ${workerCloseout.verdict}`)
  issues.push(...objective.issues)
  if (checks.some(check => check.status === 'FAIL')) issues.push(`Required checks failed: ${checks.filter(check => check.status === 'FAIL').map(check => check.command).join(', ')}`)
  const qaRequired = /qa|screenshot/i.test(packet.required_checks.join(' '))
  const qaArtifacts = changedFiles.filter(file => /(^|\/)_(qa)(\/|$)|screenshot|qa_report/i.test(file))
  if (qaRequired && !qaArtifacts.length) issues.push('Required QA artifacts are missing')
  if (analysis.protected_paths.length || ['HIGH', 'CRITICAL'].includes(analysis.risk)) issues.push(`Protected/high-risk scope requires Por: ${analysis.protected_paths.join(', ') || analysis.risk}`)
  if (!lock && mission.state === 'RUNNING') warnings.push('Running mission has no active lock')
  if (execution?.quota_block) issues.push('Codex quota/cost evidence block is active')
  const pushed = false
  const merged = false
  const verdict = determineReviewVerdict({
    outside_scope: outsideScope.length > 0,
    forbidden_touched: forbiddenTouched.length > 0,
    protected_scope: analysis.protected_paths.length > 0 || ['HIGH', 'CRITICAL'].includes(analysis.risk),
    conflicts: conflicts.length > 0,
    head_changed: headChanged,
    checks_failed: checks.some(check => check.status === 'FAIL') || (qaRequired && !qaArtifacts.length),
    execution_missing: !execution,
    execution_failed: Boolean(execution && execution.status !== 'COMPLETED'),
    objective_failed: !objective.objective_verified,
    worker_blocking: !workerCloseout.passing,
    closeout_missing: !closeout.complete,
    blocking_evidence: Boolean(execution?.quota_block),
    fingerprint_failed: !changeDetection.ok,
    warnings: warnings.length > 0,
  })
  const completionReady = ['AUTO_ACCEPT', 'ACCEPT_WITH_WARNINGS'].includes(verdict)
    && execution?.status === 'COMPLETED'
    && objective.objective_verified
    && workerCloseout.passing
    && closeout.complete
    && !execution.quota_block
    && changeDetection.ok
    && !outsideScope.length
    && !forbiddenTouched.length
    && !conflicts.length
    && !headChanged
    && checks.every(check => check.status === 'PASS')
    && !analysis.protected_paths.length
  const result = {
    mission_id: missionId, verdict, risk: analysis.risk, packet_valid: validation.valid,
    changed_files: changedFiles, change_reasons: changeDetection.change_reasons, output_baseline: mission.output_baseline, output_fingerprints: outputFingerprints, output_changes: changeDetection.fingerprint.changes, allowed_files: packet.allowed_files, outside_scope: outsideScope,
    forbidden_touched: forbiddenTouched, protected_paths: analysis.protected_paths, conflicts,
    checks, qa_required: qaRequired, qa_artifacts: qaArtifacts,
    closeout, worker_closeout: workerCloseout, objective, completion_ready: completionReady, execution_status: execution?.status || 'MISSING', lock_active: Boolean(lock),
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
