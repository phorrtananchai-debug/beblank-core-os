#!/usr/bin/env node

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath, pathToFileURL } from 'node:url'
import {
  appendHistory,
  atomicWrite,
  getMission,
  initializeRuntime,
  parseTaskPacket,
  readState,
  REPO_ROOT,
} from './hermes-runtime-store.mjs'

// Codex CLI 0.133.0 ships gpt-5.5 in its bundled catalog. Pin the worker to
// that locally supported model instead of inheriting a newer desktop config.
export const CODEX_MODEL = 'gpt-5.5'

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

FULL VALIDATED TASK PACKET:
--- BEGIN PACKET ---
${packet.text}
--- END PACKET ---
`
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
  const prompt = buildCodexPrompt(packet, effort)
  return {
    mode: 'dry-run', mission_id: packet.mission_id, availability, repo,
    selected_model: CODEX_MODEL,
    reasoning_effort: effort,
    quota_note: 'Codex quota status: unknown — evidence required.',
    command_preview: `codex exec --ignore-user-config --model ${CODEX_MODEL} --sandbox workspace-write --cd ${JSON.stringify(repo.repo)} --ephemeral --config model_reasoning_effort=${JSON.stringify(effort)} <prompt>`,
    prompt,
  }
}

export function adapterExecute(packetPath, { authorizedByDispatch = false } = {}) {
  const dryRun = adapterDryRun(packetPath)
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
  let record = { mission_id: dryRun.mission_id, status: 'RUNNING', worker: 'codex-cli', started_at: started, repo: dryRun.repo.repo, branch: dryRun.repo.branch, reasoning_effort: dryRun.reasoning_effort, stdout_log: stdoutPath, stderr_log: stderrPath, closeout_path: closeoutPath, pid: null }
  saveExecution(record)
  appendHistory('CODEX_EXECUTION_STARTED', dryRun.mission_id, { started_at: started })
  const args = [
    ...dryRun.availability.prefix, 'exec', '--ignore-user-config', '--model', dryRun.selected_model,
    '--sandbox', 'workspace-write', '--cd', dryRun.repo.repo,
    '--ephemeral', '--color', 'never', '--config', `model_reasoning_effort=${JSON.stringify(dryRun.reasoning_effort)}`,
    '--output-last-message', closeoutPath, '-',
  ]
  const result = run(dryRun.availability.command, args, { cwd: dryRun.repo.repo, input: dryRun.prompt, maxBuffer: 20 * 1024 * 1024 })
  writeFileSync(stdoutPath, redact(result.stdout || ''), 'utf8')
  writeFileSync(stderrPath, redact(result.stderr || result.error?.message || ''), 'utf8')
  record = { ...record, status: result.status === 0 ? 'COMPLETED' : 'FAILED', exit_code: result.status ?? 1, completed_at: new Date().toISOString(), closeout_detected: existsSync(closeoutPath) && readFileSync(closeoutPath, 'utf8').trim().length > 0, quota_block: /quota (?:exceeded|exhausted)|rate limit|usage limit/i.test(result.stderr || '') }
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
