#!/usr/bin/env node

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve, sep } from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath, pathToFileURL } from 'node:url'
import {
  appendHistory,
  atomicWrite,
  captureOutputFingerprints,
  detectMissionChanges,
  getMission,
  initializeRuntime,
  inspectMissionObjective,
  parseTaskPacket,
  parseGitStatus,
  pathMatchesScope,
  readState,
  REPO_ROOT,
} from './hermes-runtime-store.mjs'

// Codex CLI 0.133.0 ships gpt-5.5 in its bundled catalog. Pin the worker to
// that locally supported model instead of inheriting a newer desktop config.
export const CODEX_MODEL = 'gpt-5.5'

export function resolveCodexSandbox(packet) {
  const repoRoot = resolve(packet.repo)
  if (!packet.output_required) return { mode: 'read-only', root: repoRoot }
  const writableDirs = packet.allowed_files.map(scope => {
    const normalized = scope.replaceAll('\\', '/')
    const wildcard = normalized.search(/[*?]/)
    const stable = wildcard >= 0 ? normalized.slice(0, wildcard) : normalized
    const candidate = resolve(repoRoot, wildcard >= 0 || normalized.endsWith('/') ? stable : dirname(stable))
    if (candidate !== repoRoot && !candidate.startsWith(`${repoRoot}${sep}`)) throw new Error(`Allowed scope escapes repository: ${scope}`)
    return candidate
  })
  if (!writableDirs.length) throw new Error('Writing mission has no writable scope')
  let common = writableDirs[0]
  for (const candidate of writableDirs.slice(1)) {
    while (candidate !== common && !candidate.toLowerCase().startsWith(`${common.toLowerCase()}${sep}`)) {
      const parent = dirname(common)
      if (parent === common) throw new Error('Cannot resolve safe writable scope')
      common = parent
    }
  }
  if (common !== repoRoot && !common.startsWith(`${repoRoot}${sep}`)) throw new Error('Resolved writable scope escapes repository')
  return { mode: 'workspace-write', root: common }
}

export function detectEffectiveSandbox(stderr = '', requested = 'unknown') {
  const match = /^sandbox:\s*([^\r\n]+)/im.exec(stderr)
  const effective = match?.[1]?.trim().split(/\s+/)[0] || 'unknown'
  return {
    requested,
    effective,
    downgraded: requested === 'workspace-write' && effective !== 'workspace-write',
  }
}

export function buildCodexArgs(dryRun, closeoutPath, platform = process.platform) {
  const platformConfig = platform === 'win32' ? ['-c', 'windows.sandbox="elevated"'] : []
  return [
    ...dryRun.availability.prefix, 'exec', '--ignore-user-config', ...platformConfig,
    '--model', dryRun.selected_model, '--sandbox', dryRun.sandbox_mode, '--cd', dryRun.sandbox_root,
    '--ephemeral', '--color', 'never', '--config', `model_reasoning_effort=${JSON.stringify(dryRun.reasoning_effort)}`,
    '--output-last-message', closeoutPath, '-',
  ]
}

function run(command, args, options = {}) {
  return spawnSync(command, args, { encoding: 'utf8', windowsHide: true, ...options })
}

function npmCodexScript() {
  const appData = process.env.APPDATA
  if (!appData) return null
  const path = join(appData, 'npm', 'node_modules', '@openai', 'codex', 'bin', 'codex.js')
  return existsSync(path) ? path : null
}

export function detectCodex() {
  const configured = process.env.HERMES_CODEX_BIN
  const configuredScript = process.env.HERMES_CODEX_SCRIPT
  const npmScript = npmCodexScript()
  const candidates = []
  if (configured) candidates.push({ command: configured, prefix: [] })
  if (configuredScript) candidates.push({ command: process.execPath, prefix: [configuredScript] })
  if (npmScript) candidates.push({ command: process.execPath, prefix: [npmScript] })
  candidates.push({ command: 'codex.exe', prefix: [] }, { command: 'codex', prefix: [] })
  for (const candidate of candidates) {
    const result = run(candidate.command, [...candidate.prefix, '--version'])
    if (!result.error && result.status === 0) {
      return { available: true, command: candidate.command, prefix: candidate.prefix, version: result.stdout.trim() || result.stderr.trim() }
    }
  }
  return { available: false, command: null, prefix: [], version: null, reason: 'Codex CLI not found or not executable' }
}

function gitValue(repo, args) {
  const result = run('git', ['-C', repo, ...args])
  if (result.status !== 0) throw new Error(`Git check failed in ${repo}: ${(result.stderr || result.stdout).trim()}`)
  return result.stdout.trim()
}

export function verifyRepo(packet) {
  const requested = resolve(packet.repo)
  if (!existsSync(requested)) throw new Error(`Wrong repo rejected: path does not exist: ${requested}`)
  const actual = resolve(gitValue(requested, ['rev-parse', '--show-toplevel']))
  if (actual.toLowerCase() !== requested.toLowerCase()) throw new Error(`Wrong repo rejected: packet=${requested}; git_root=${actual}`)
  const branch = gitValue(requested, ['branch', '--show-current'])
  if (packet.branch && branch !== packet.branch) throw new Error(`Wrong branch rejected: packet=${packet.branch}; current=${branch}`)
  return { repo: actual, branch }
}

function effortFor(packet, mission) {
  if (mission?.reasoning_effort && ['low', 'medium', 'high'].includes(mission.reasoning_effort)) return mission.reasoning_effort
  const text = `${packet.mission} ${packet.allowed_files.join(' ')}`.toLowerCase()
  if (/auth|finance|trading|security|core data|database/.test(text)) return 'high'
  if (/architecture|refactor|multi-file|ui|component|scripts\//.test(text)) return 'medium'
  return 'low'
}

export function buildCodexPrompt(packet, effort) {
  return `You are the controlled Codex CLI worker for Hermes mission ${packet.mission_id}.

Mission: ${packet.mission}
Repository: ${resolve(packet.repo)}
Branch: ${packet.branch || '(current branch, verified by adapter)'}
Reasoning effort: ${effort}

ALLOWED PATHS (exclusive write scope):
${packet.allowed_files.map(path => `- ${path}`).join('\n') || '- none'}

FORBIDDEN PATHS:
${packet.forbidden_files.map(path => `- ${path}`).join('\n') || '- none'}

NON-NEGOTIABLE SAFETY RULES:
- Do not commit. Do not push. Do not merge. Do not fetch or pull.
- Do not modify files outside ALLOWED PATHS.
- Do not expose, print, copy, or persist secrets or environment values.
- Do not install dependencies or add services, watchers, daemons, or background processes.
- Preserve unrelated working-tree changes exactly as found.
- Stop and report if scope, evidence, or required authority is unclear.

EVIDENCE AND CLOSEOUT:
- Run only the packet's required checks and safe read-only diagnostics.
- Record actual changed files, git status, checks, risks, and limitations.
- End with a complete Closeout Packet v3 following docs/hermes/CLOSEOUT_PACKET_V3.md.
- Explicitly state commit, push, and merge status. Never push or merge.
- A writing mission is successful only when every required output exists and was created or modified.
- If a required output cannot be produced, return HOLD FOR EVIDENCE or NEEDS REWORK; do not claim success.

FULL VALIDATED TASK PACKET:
--- BEGIN PACKET ---
${packet.text}
--- END PACKET ---
`
}

export function inspectWorkerCloseout(path) {
  if (!path || !existsSync(path)) return { detected: false, verdict: 'MISSING', passing: false, blocking: true }
  const text = readFileSync(path, 'utf8')
  const match = /^##\s+(?:\d+\.\s*)?Review Recommendation\s*\r?\n([\s\S]*?)(?=^##\s+|(?![\s\S]))/im.exec(text)
  const section = (match?.[1] || '').toUpperCase().replaceAll('_', ' ')
  if (/\b(HOLD|BLOCKED|FAILED|FAIL|NEEDS REWORK|REJECT)\b/.test(section)) {
    return { detected: true, verdict: section.includes('REJECT') ? 'REJECT' : section.includes('NEEDS REWORK') ? 'NEEDS_REWORK' : 'HOLD', passing: false, blocking: true }
  }
  if (/\b(AUTO ACCEPT|ACCEPT WITH WARNINGS|ACCEPT|APPROVE)\b/.test(section)) {
    return { detected: true, verdict: section.match(/AUTO ACCEPT|ACCEPT WITH WARNINGS|APPROVE|ACCEPT/)?.[0].replaceAll(' ', '_') || 'APPROVE', passing: true, blocking: false }
  }
  return { detected: true, verdict: 'UNKNOWN', passing: false, blocking: true }
}

function redact(text = '') {
  return text
    .replace(/(api[_-]?key|token|secret|password)\s*[:=]\s*[^\s]+/gi, '$1=[REDACTED]')
    .replace(/\b(sk-[A-Za-z0-9_-]{12,})\b/g, '[REDACTED_TOKEN]')
}

function executionDir(missionId) {
  return join(REPO_ROOT, '.hermes', 'executions', missionId)
}

function saveExecution(record) {
  const runtime = readState('runtime.json')
  runtime.executions[record.mission_id] = record
  atomicWrite('runtime.json', runtime)
}

export function adapterDryRun(packetPath) {
  initializeRuntime()
  const packet = parseTaskPacket(packetPath)
  const repo = verifyRepo(packet)
  const availability = detectCodex()
  const mission = getMission(packet.mission_id)
  const effort = effortFor(packet, mission)
  const sandbox = resolveCodexSandbox(packet)
  const prompt = buildCodexPrompt(packet, effort)
  const previewArgs = buildCodexArgs({ availability, selected_model: CODEX_MODEL, sandbox_mode: sandbox.mode, sandbox_root: sandbox.root, reasoning_effort: effort }, '<closeout-path>')
  return {
    mode: 'dry-run', mission_id: packet.mission_id, availability, repo,
    selected_model: CODEX_MODEL,
    reasoning_effort: effort,
    quota_note: 'Codex quota status: unknown — evidence required.',
    sandbox_mode: sandbox.mode,
    sandbox_root: sandbox.root,
    command_args: previewArgs,
    command_preview: `codex ${previewArgs.map(value => JSON.stringify(value)).join(' ')} <prompt>`,
    prompt,
  }
}

export function adapterExecute(packetPath, { authorizedByDispatch = false } = {}) {
  const dryRun = adapterDryRun(packetPath)
  const packet = parseTaskPacket(packetPath)
  if (!dryRun.availability.available) throw new Error(`Codex CLI unavailable: ${dryRun.availability.reason}`)
  const runtime = readState('runtime.json')
  const assignment = runtime.active_assignments[dryRun.mission_id]
  const mission = getMission(dryRun.mission_id)
  if (!authorizedByDispatch || !assignment || assignment.worker_id !== 'codex-cli' || assignment.approval_state !== 'AUTHORIZED' || !assignment.safe_to_run) {
    throw new Error('Execution rejected: a safe, authorized Codex dispatcher assignment is required')
  }
  if (mission?.state !== 'RUNNING') throw new Error(`Execution rejected: mission must be RUNNING, found ${mission?.state || 'missing'}`)
  const dir = executionDir(dryRun.mission_id)
  mkdirSync(dir, { recursive: true })
  const closeoutPath = join(dir, 'closeout.md')
  const stdoutPath = join(dir, 'stdout.log')
  const stderrPath = join(dir, 'stderr.log')
  const started = new Date().toISOString()
  let record = { mission_id: dryRun.mission_id, status: 'RUNNING', worker: 'codex-cli', started_at: started, repo: dryRun.repo.repo, branch: dryRun.repo.branch, reasoning_effort: dryRun.reasoning_effort, selected_model: dryRun.selected_model, sandbox_mode: dryRun.sandbox_mode, requested_sandbox_mode: dryRun.sandbox_mode, effective_sandbox_mode: 'unknown', sandbox_downgraded: false, sandbox_root: dryRun.sandbox_root, stdout_log: stdoutPath, stderr_log: stderrPath, closeout_path: closeoutPath, pid: null }
  saveExecution(record)
  appendHistory('CODEX_EXECUTION_STARTED', dryRun.mission_id, { started_at: started })
  const args = buildCodexArgs(dryRun, closeoutPath)
  const result = run(dryRun.availability.command, args, { cwd: dryRun.repo.repo, input: dryRun.prompt, maxBuffer: 20 * 1024 * 1024 })
  writeFileSync(stdoutPath, redact(result.stdout || ''), 'utf8')
  writeFileSync(stderrPath, redact(result.stderr || result.error?.message || ''), 'utf8')
  const statusResult = run('git', ['-C', dryRun.repo.repo, 'status', '--short'])
  const currentStatus = statusResult.status === 0 ? parseGitStatus(statusResult.stdout || '') : []
  const outputFingerprints = captureOutputFingerprints(dryRun.repo.repo, packet.allowed_files)
  const changeDetection = detectMissionChanges(currentStatus, mission.baseline_status || [], mission.output_baseline, outputFingerprints)
  const changedFiles = changeDetection.changed_files
  const outsideScope = changedFiles.filter(file => !packet.allowed_files.some(pattern => pathMatchesScope(file, pattern)))
  const objective = inspectMissionObjective(packet, changedFiles)
  const workerCloseout = inspectWorkerCloseout(closeoutPath)
  const sandbox = detectEffectiveSandbox(result.stderr || '', dryRun.sandbox_mode)
  const quotaBlock = /(?:^|\n)ERROR:.*(?:quota (?:exceeded|exhausted)|rate limit|usage limit)/im.test(result.stderr || '')
  const executionIssues = []
  if ((result.status ?? 1) !== 0) executionIssues.push(`Codex process exited ${result.status ?? 1}`)
  if (!workerCloseout.detected) executionIssues.push('Worker closeout is missing')
  else if (!workerCloseout.passing) executionIssues.push(`Worker closeout verdict is ${workerCloseout.verdict}`)
  if (outsideScope.length) executionIssues.push(`Worker changed files outside scope: ${outsideScope.join(', ')}`)
  if (!changeDetection.ok) executionIssues.push(`Output fingerprint capture failed: ${changeDetection.fingerprint.errors.map(item => `${item.scope}: ${item.error}`).join('; ')}`)
  if (packet.output_required && sandbox.downgraded) executionIssues.push(`Effective sandbox is ${sandbox.effective}; workspace-write is required for this writing mission`)
  executionIssues.push(...objective.issues)
  if (quotaBlock) executionIssues.push('Codex quota/cost evidence block is active')
  let status = 'COMPLETED'
  if ((result.status ?? 1) !== 0 || outsideScope.length) status = 'FAILED'
  else if (!workerCloseout.passing || !objective.objective_verified || quotaBlock || !changeDetection.ok || (packet.output_required && sandbox.downgraded)) status = 'BLOCKED'
  record = { ...record, status, exit_code: result.status ?? 1, completed_at: new Date().toISOString(), effective_sandbox_mode: sandbox.effective, sandbox_downgraded: sandbox.downgraded, closeout_detected: workerCloseout.detected, worker_verdict: workerCloseout.verdict, worker_closeout_passing: workerCloseout.passing, changed_files: changedFiles, change_reasons: changeDetection.change_reasons, output_baseline: mission.output_baseline, output_fingerprints: outputFingerprints, output_changes: changeDetection.fingerprint.changes, outside_scope: outsideScope, objective_verified: objective.objective_verified, objective, quota_block: quotaBlock, execution_issues: executionIssues }
  saveExecution(record)
  appendHistory('CODEX_EXECUTION_FINISHED', dryRun.mission_id, { status: record.status, exit_code: record.exit_code, closeout_detected: record.closeout_detected })
  return record
}

export function adapterStatus(missionId) {
  initializeRuntime()
  return readState('runtime.json').executions[missionId] || null
}

function main() {
  const [first, second, ...rest] = process.argv.slice(2)
  const modes = ['dry-run', 'execute', 'status', 'cancel']
  const mode = modes.includes(first) ? first : 'dry-run'
  const target = modes.includes(first) ? second : first
  if (mode === 'status') return adapterStatus(target)
  if (mode === 'cancel') return { mission_id: target, status: 'NOT_SUPPORTED', message: 'Safe cancellation is not supported by the synchronous Codex CLI adapter.' }
  if (!target) throw new Error(`Usage: hermes:codex [dry-run|execute|status|cancel] <packet|mission-id>`)
  if (mode === 'execute') return adapterExecute(target, { authorizedByDispatch: rest.includes('--authorized-by-dispatch') })
  return adapterDryRun(target)
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  try { console.log(JSON.stringify(main(), null, 2)) }
  catch (error) { console.error(`Hermes Codex adapter error: ${error.message}`); process.exit(2) }
}
