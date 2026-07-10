#!/usr/bin/env node

import { existsSync } from 'node:fs'
import { relative, resolve } from 'node:path'
import {
  appendHistory,
  atomicWrite,
  getMission,
  initializeRuntime,
  markdownSection,
  parseTaskPacket,
  readState,
  REPO_ROOT,
  updateMissionState,
} from './hermes-runtime-store.mjs'

const RISK_ORDER = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']
const PROTECTED = [
  { re: /(^|\/)auth(\/|$)|src\/core\/auth/i, label: 'auth' },
  { re: /(^|\/)finance(\/|$)/i, label: 'finance' },
  { re: /(^|\/)trading(\/|$)/i, label: 'trading' },
  { re: /(^|\/)creator(\/|$)/i, label: 'creator' },
  { re: /(^|\/)os\/brain(\/|$)|brain/i, label: 'brain' },
  { re: /firebase|firestore/i, label: 'firebase' },
  { re: /(^|\/)\.env($|\.)|secret/i, label: 'secrets/env' },
]

function maxRisk(a, b) { return RISK_ORDER.indexOf(a) >= RISK_ORDER.indexOf(b) ? a : b }
function normalized(path) { return path.replaceAll('\\', '/').replace(/^\.\//, '').toLowerCase() }

export function validateDispatchPacket(packet) {
  const issues = []
  if (!packet.mission_id) issues.push('mission_id or packet_id is required')
  if (!packet.mission) issues.push('Mission content is required')
  if (!packet.allowed_files.length) issues.push('Allowed Files must contain at least one path')
  if (!packet.forbidden_files.length) issues.push('Forbidden Files must contain at least one path')
  for (const heading of ['Evidence', 'Approval', 'Closeout']) {
    if (!markdownSection(packet.text, heading)) issues.push(`${heading} section is required`)
  }
  return { valid: issues.length === 0, issues }
}

export function classifyMission(packet) {
  const scope = packet.allowed_files.map(normalized)
  const text = `${packet.mission} ${scope.join(' ')}`.toLowerCase()
  const capabilities = new Set()
  let risk = 'LOW'
  if (/docs?|documentation|report|closeout|summary|markdown/.test(text)) capabilities.add('documentation')
  if (/review|qa|checklist|evidence/.test(text)) capabilities.add('qa-review')
  if (/inspect|audit|scan|read-only/.test(text)) capabilities.add('repo-inspection')
  if (/architecture|refactor|deep|multi-file/.test(text)) { capabilities.add('architecture-review'); risk = maxRisk(risk, 'MEDIUM') }
  if (/\bui\b|component|page|layout|css|style/.test(text)) { capabilities.add('ui-implementation'); risk = maxRisk(risk, 'MEDIUM') }
  if (/core data|data-flow|database|schema migration/.test(text)) { capabilities.add('code-review'); risk = maxRisk(risk, 'HIGH') }
  const protected_paths = []
  for (const entry of PROTECTED) {
    if (scope.some(path => entry.re.test(path)) || entry.re.test(packet.mission)) protected_paths.push(entry.label)
  }
  if (protected_paths.length) risk = maxRisk(risk, protected_paths.some(label => ['firebase', 'secrets/env'].includes(label)) ? 'CRITICAL' : 'HIGH')
  if (!capabilities.size) capabilities.add('repo-inspection')
  return { risk, capabilities: [...capabilities], protected_paths: [...new Set(protected_paths)] }
}

function scopeOverlaps(a, b) {
  const left = normalized(a).replace(/\/\*\*$/, '')
  const right = normalized(b).replace(/\/\*\*$/, '')
  return left === right || left.startsWith(`${right}/`) || right.startsWith(`${left}/`)
}

export function checkCentralLocks(missionId, files) {
  const state = readState('locks.json')
  const conflicts = []
  for (const lock of state.locks.filter(item => item.status !== 'released' && item.mission_id !== missionId)) {
    for (const file of files) {
      const conflict = (lock.files || []).find(locked => scopeOverlaps(file, locked))
      if (conflict) conflicts.push({ file, locked_file: conflict, owner: lock.mission_id, worker: lock.worker || lock.agent || 'unknown' })
    }
  }
  return { verdict: conflicts.length ? 'BLOCKED' : 'SAFE', conflicts }
}

function chooseWorker(packet, analysis, agents) {
  if (analysis.protected_paths.length || ['HIGH', 'CRITICAL'].includes(analysis.risk)) return { id: 'por', name: 'HUMAN_REQUIRED', status: 'HUMAN_REQUIRED' }
  const requested = packet.agent_role.toLowerCase()
  if (requested.includes('opencode') || requested.includes('deepseek')) {
    const id = requested.includes('deepseek') ? 'deepseek' : 'opencode'
    const agent = agents.find(item => item.id === id)
    return { id, name: agent?.name || id, status: 'ADVISORY_ONLY' }
  }
  if (analysis.capabilities.includes('documentation') && !analysis.capabilities.some(cap => ['ui-implementation', 'architecture-review'].includes(cap))) {
    return { id: 'hermes-direct', name: 'Hermes Direct', status: 'READY' }
  }
  return { id: 'codex-cli', name: 'Codex CLI', status: 'READY' }
}

function reasoningEffort(analysis) {
  if (analysis.risk === 'LOW' && !analysis.capabilities.includes('architecture-review')) return 'low'
  if (analysis.risk === 'MEDIUM') return 'medium'
  return 'high'
}

function acquireLock(missionId, worker, files) {
  const state = readState('locks.json')
  const existing = state.locks.find(lock => lock.mission_id === missionId && lock.status !== 'released')
  const lock = { mission_id: missionId, worker, files, acquired: new Date().toISOString(), status: 'running' }
  if (existing) Object.assign(existing, lock)
  else state.locks.push(lock)
  atomicWrite('locks.json', state)
  return lock
}

export function dispatchMission({ missionId, authorize = false } = {}) {
  initializeRuntime()
  let mission = missionId ? getMission(missionId) : null
  if (!mission) {
    const missions = readState('mission-store.json').missions
    mission = readState('queue.json').items.map(item => missions.find(candidate => candidate.mission_id === item.mission_id)).find(candidate => candidate?.state === 'PENDING') || null
  }
  if (!mission) throw new Error(missionId ? `Mission not found: ${missionId}` : 'No eligible PENDING mission')
  if (mission.state !== 'PENDING' && !(mission.state === 'WAITING_APPROVAL' && authorize)) throw new Error(`Mission ${mission.mission_id} is not dispatchable from ${mission.state}`)
  const packet = parseTaskPacket(mission.packet_path)
  const validation = validateDispatchPacket(packet)
  const analysis = classifyMission(packet)
  const agents = readState('agents.json').agents
  const worker = chooseWorker(packet, analysis, agents)
  const locks = checkCentralLocks(mission.mission_id, packet.allowed_files)
  const approvalRequired = packet.approval_gate && !/^none|not required$/i.test(packet.approval_gate.trim())
  let approval_state = approvalRequired && !authorize ? 'WAITING_APPROVAL' : 'AUTHORIZED'
  if (!validation.valid || locks.verdict === 'BLOCKED' || worker.status === 'HUMAN_REQUIRED') approval_state = 'HUMAN_REQUIRED'
  if (worker.status === 'ADVISORY_ONLY') approval_state = 'ADVISORY_ONLY'
  const safe = validation.valid && locks.verdict === 'SAFE' && worker.status === 'READY' && approval_state === 'AUTHORIZED'
  const effort = reasoningEffort(analysis)
  const command = worker.id === 'codex-cli'
    ? `npm run hermes:codex -- dry-run ${JSON.stringify(packet.path)}`
    : worker.id === 'hermes-direct' ? 'Hermes Direct (in-process, no external command)' : 'NOT_IMPLEMENTED'
  const assignment = {
    assignment_id: `ASSIGN-${Date.now()}`,
    mission_id: mission.mission_id,
    selected_worker: worker.name,
    worker_id: worker.id,
    worker_status: worker.status,
    selected_model: null,
    reasoning_effort: effort,
    risk: analysis.risk,
    capabilities: analysis.capabilities,
    file_scope: packet.allowed_files,
    protected_paths: analysis.protected_paths,
    lock_result: locks,
    cost_quota_note: worker.id === 'codex-cli' ? 'Codex quota status: unknown — evidence required.' : worker.status === 'ADVISORY_ONLY' ? 'Paid worker recommendation is advisory only; execution is not implemented.' : 'No paid executor or Codex quota used.',
    approval_state,
    execution_command_preview: command,
    packet_validation: validation,
    safe_to_run: safe,
    created_at: new Date().toISOString(),
  }
  const runtime = readState('runtime.json')
  runtime.active_assignments[mission.mission_id] = assignment
  atomicWrite('runtime.json', runtime)
  if (safe) {
    acquireLock(mission.mission_id, worker.id, packet.allowed_files)
    updateMissionState(mission.mission_id, 'RUNNING', { assignment_id: assignment.assignment_id, selected_worker: worker.id, started_at: new Date().toISOString() })
  } else if (approval_state === 'WAITING_APPROVAL' && mission.state === 'PENDING') {
    updateMissionState(mission.mission_id, 'WAITING_APPROVAL', { assignment_id: assignment.assignment_id })
  } else if (approval_state === 'HUMAN_REQUIRED') {
    updateMissionState(mission.mission_id, 'BLOCKED', { block_reason: validation.issues.join('; ') || analysis.protected_paths.join(', ') || 'lock conflict' })
  }
  appendHistory('MISSION_DISPATCHED', mission.mission_id, { assignment_id: assignment.assignment_id, worker: worker.id, safe, approval_state })
  return { ...assignment, human_summary: safe ? `${mission.mission_id} assigned to ${worker.name}.` : `${mission.mission_id} not started: ${approval_state}.` }
}

function print(result) {
  console.log(`Hermes dispatch: ${result.human_summary}`)
  console.log(`Worker: ${result.selected_worker} | Risk: ${result.risk} | Lock: ${result.lock_result.verdict} | Approval: ${result.approval_state}`)
  console.log('--- JSON ---')
  console.log(JSON.stringify(result, null, 2))
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(new URL(import.meta.url).pathname.replace(/^\/(.:)/, '$1'))) {
  try {
    const args = process.argv.slice(2)
    const authorize = args.includes('--authorize')
    const missionId = args.find(arg => !arg.startsWith('--'))
    print(dispatchMission({ missionId, authorize }))
  } catch (error) {
    console.error(`Hermes dispatch error: ${error.message}`)
    process.exit(2)
  }
}
