#!/usr/bin/env node

import {
  copyFileSync,
  appendFileSync,
  existsSync,
  lstatSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  readlinkSync,
  renameSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import { dirname, isAbsolute, join, relative, resolve, sep } from 'node:path'
import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { fileURLToPath } from 'node:url'
import { V2_STATES, migrateMissionStateV1ToV2 } from './hermes-state-model-v2.mjs'

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url))
export const REPO_ROOT = resolve(SCRIPT_DIR, '..')
export const RUNTIME_DIR = resolve(process.env.HERMES_RUNTIME_DIR || join(REPO_ROOT, '.hermes', 'runtime'))
export const RUNTIME_VERSION = 1
export const MISSION_STATES = Object.freeze([
  'PENDING', 'RUNNING', 'WAITING_REVIEW', 'WAITING_APPROVAL', 'BLOCKED',
  'NEEDS_REWORK', 'COMPLETED', 'FAILED', 'PAUSED', 'ARCHIVED',
])

const STATE_FACTORIES = Object.freeze({
  'mission-store.json': () => ({ version: RUNTIME_VERSION, missions: [] }),
  'queue.json': () => ({ version: RUNTIME_VERSION, items: [] }),
  'runtime.json': () => ({ version: RUNTIME_VERSION, active_assignments: {}, executions: {} }),
  'agents.json': () => ({ version: RUNTIME_VERSION, agents: [] }),
  'locks.json': () => ({ version: RUNTIME_VERSION, locks: [] }),
  'history.json': () => ({ version: RUNTIME_VERSION, events: [] }),
})

export const STATE_FILES = Object.freeze(Object.keys(STATE_FACTORIES))

function clone(value) {
  return JSON.parse(JSON.stringify(value))
}

export function statePath(name) {
  if (!STATE_FACTORIES[name]) throw new Error(`Unknown runtime state file: ${name}`)
  return join(RUNTIME_DIR, name)
}

export function defaultState(name) {
  if (!STATE_FACTORIES[name]) throw new Error(`Unknown runtime state file: ${name}`)
  return STATE_FACTORIES[name]()
}

export function validateState(name, value) {
  const errors = []
  if (!value || typeof value !== 'object' || Array.isArray(value)) errors.push('root must be an object')
  if (errors.length) return errors
  if (value.version !== RUNTIME_VERSION) errors.push(`version must be ${RUNTIME_VERSION}`)
  const arrayField = {
    'mission-store.json': 'missions',
    'queue.json': 'items',
    'agents.json': 'agents',
    'locks.json': 'locks',
    'history.json': 'events',
  }[name]
  if (arrayField && !Array.isArray(value[arrayField])) errors.push(`${arrayField} must be an array`)
  if (name === 'runtime.json') {
    if (!value.active_assignments || typeof value.active_assignments !== 'object' || Array.isArray(value.active_assignments)) errors.push('active_assignments must be an object')
    if (!value.executions || typeof value.executions !== 'object' || Array.isArray(value.executions)) errors.push('executions must be an object')
  }
  if (name === 'mission-store.json' && Array.isArray(value.missions)) {
    const seen = new Set()
    for (const mission of value.missions) {
      if (!mission || typeof mission !== 'object') { errors.push('missions must contain objects'); continue }
      if (!mission.mission_id) errors.push('mission is missing mission_id')
      if (!MISSION_STATES.includes(mission.state)) errors.push(`${mission.mission_id || 'mission'} has invalid state ${mission.state}`)
      if (seen.has(mission.mission_id)) errors.push(`duplicate mission_id: ${mission.mission_id}`)
      seen.add(mission.mission_id)
    }
  }
  return errors
}

function parseState(name, path) {
  const parsed = JSON.parse(readFileSync(path, 'utf8'))
  const errors = validateState(name, parsed)
  if (errors.length) throw new Error(`${name}: ${errors.join('; ')}`)
  return parsed
}

export function readState(name, { restore = true } = {}) {
  const path = statePath(name)
  try {
    if (!existsSync(path)) throw new Error(`${name} is missing`)
    return parseState(name, path)
  } catch (error) {
    const backup = `${path}.bak`
    if (restore && existsSync(backup)) {
      try {
        const recovered = parseState(name, backup)
        atomicWrite(name, recovered, { backup: false })
        return recovered
      } catch (backupError) {
        throw new Error(`Cannot read ${name}: ${error.message}. Backup invalid: ${backupError.message}`)
      }
    }
    throw new Error(`Cannot read ${name}: ${error.message}`)
  }
}

export function atomicWrite(name, value, { backup = true } = {}) {
  const errors = validateState(name, value)
  if (errors.length) throw new Error(`Refusing invalid ${name}: ${errors.join('; ')}`)
  mkdirSync(RUNTIME_DIR, { recursive: true })
  const path = statePath(name)
  const temp = `${path}.${process.pid}.${Date.now()}.tmp`
  try {
    if (backup && existsSync(path)) copyFileSync(path, `${path}.bak`)
    writeFileSync(temp, `${JSON.stringify(value, null, 2)}\n`, { encoding: 'utf8', flag: 'wx' })
    renameSync(temp, path)
  } catch (error) {
    if (existsSync(temp)) rmSync(temp, { force: true })
    throw new Error(`Atomic write failed for ${name}: ${error.message}`)
  }
  return value
}

function initialAgents() {
  const candidates = [
    join(REPO_ROOT, '.hermes', 'state', 'agent-registry.json'),
    join(REPO_ROOT, '.hermes.example', 'state', 'agent-registry.example.json'),
  ]
  for (const candidate of candidates) {
    if (!existsSync(candidate)) continue
    try {
      const registry = JSON.parse(readFileSync(candidate, 'utf8'))
      if (Array.isArray(registry.agents)) return { version: RUNTIME_VERSION, agents: registry.agents }
    } catch { /* doctor will report runtime problems; legacy registry remains untouched */ }
  }
  return defaultState('agents.json')
}

export function initializeRuntime({ force = false } = {}) {
  mkdirSync(RUNTIME_DIR, { recursive: true })
  const created = []
  for (const name of STATE_FILES) {
    const path = statePath(name)
    if (!existsSync(path) || force) {
      const value = name === 'agents.json' ? initialAgents() : defaultState(name)
      atomicWrite(name, value)
      created.push(name)
    } else {
      readState(name)
    }
  }
  return { runtime_dir: RUNTIME_DIR, created }
}

export function appendHistory(type, missionId, details = {}) {
  const history = readState('history.json')
  const event = {
    event_id: `EVT-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    at: new Date().toISOString(),
    type,
    mission_id: missionId || null,
    details,
  }
  history.events.push(event)
  atomicWrite('history.json', history)
  return event
}

export function getMission(missionId) {
  return readState('mission-store.json').missions.find(mission => mission.mission_id === missionId) || null
}

export function saveMission(mission, { create = false } = {}) {
  const store = readState('mission-store.json')
  const index = store.missions.findIndex(item => item.mission_id === mission.mission_id)
  if (create && index >= 0) throw new Error(`Duplicate mission ID rejected: ${mission.mission_id}`)
  if (index >= 0) store.missions[index] = clone(mission)
  else store.missions.push(clone(mission))
  atomicWrite('mission-store.json', store)
  return mission
}

export function resolvePacketPath(input) {
  return isAbsolute(input) ? resolve(input) : resolve(process.cwd(), input)
}

export function parseFrontmatter(text) {
  const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---/)
  if (!match) return {}
  const result = {}
  let currentArray = null
  for (const raw of match[1].split(/\r?\n/)) {
    const item = raw.match(/^\s+-\s+(.+)$/)
    if (item && currentArray) { result[currentArray].push(unquote(item[1].trim())); continue }
    const pair = raw.match(/^([A-Za-z0-9_]+):\s*(.*)$/)
    if (!pair) continue
    const [, key, rawValue] = pair
    if (!rawValue) { result[key] = []; currentArray = key }
    else { result[key] = unquote(rawValue.trim()); currentArray = null }
  }
  return result
}

function unquote(value) {
  return value.replace(/^(['"])(.*)\1$/, '$2')
}

export function getMissionDirectory(missionId) {
  if (!/^[A-Za-z0-9._-]+$/.test(missionId || '')) throw new Error('Invalid mission ID for mission directory')
  return join(dirname(RUNTIME_DIR), 'state', 'missions', missionId)
}

export function ensureMissionDirectoryV2(missionId) {
  const root = getMissionDirectory(missionId)
  for (const part of ['packet', 'plan', 'approval', 'baseline', 'attempts']) mkdirSync(join(root, part), { recursive: true })
  return root
}

export function detectMissionSchemaVersion(record) {
  if (!record || typeof record !== 'object') throw new Error('Mission record must be an object')
  if (record.schemaVersion === 2) return 2
  if (record.schemaVersion !== undefined) throw new Error(`Unsupported mission schema version: ${record.schemaVersion}`)
  return 1
}

const V2_CHECKPOINT_VALUES = Object.freeze(['pending', 'complete', 'accepted', 'not-required'])

function validateMissionStateV2(state) {
  if (!state || state.schemaVersion !== 2) throw new Error('State must use schemaVersion 2')
  if (!state.missionId || !/^[A-Za-z0-9._-]+$/.test(state.missionId)) throw new Error('State requires a valid missionId')
  if (!V2_STATES.includes(state.state)) throw new Error(`Unknown v2 mission state: ${state.state}`)
  if (!state.createdAt || !state.updatedAt) throw new Error('State requires createdAt and updatedAt')
  if (Number.isNaN(Date.parse(state.createdAt)) || Number.isNaN(Date.parse(state.updatedAt))) throw new Error('State timestamps must be valid ISO timestamps')
  if (!state.checkpoints || typeof state.checkpoints !== 'object') throw new Error('State requires checkpoints')
  for (const [checkpoint, value] of Object.entries(state.checkpoints)) {
    if (!V2_CHECKPOINT_VALUES.includes(value)) throw new Error(`State checkpoint ${checkpoint} has invalid value: ${value}`)
  }
}

function v2StoreError(code, message, cause) {
  const error = new Error(message)
  error.code = code
  if (cause) error.cause = cause
  return error
}

function parseMissionRecord(path) {
  try { return JSON.parse(readFileSync(path, 'utf8')) }
  catch (error) { throw v2StoreError('HERMES_V2_MISSION_PARSE_ERROR', `Cannot parse v2 mission record: ${error.message}`, error) }
}

export function saveMissionStateV2(missionId, state, { fileOps = {} } = {}) {
  validateMissionStateV2(state)
  if (state.missionId !== missionId) throw new Error('Mission ID does not match v2 state')
  const root = ensureMissionDirectoryV2(missionId)
  const path = join(root, 'mission.json')
  if (existsSync(path)) {
    const existing = parseMissionRecord(path)
    if (detectMissionSchemaVersion(existing) !== 2) throw new Error('Refusing to overwrite legacy mission evidence')
  }
  const temp = `${path}.${process.pid}.${Date.now()}.tmp`
  const write = fileOps.writeFileSync || writeFileSync
  const rename = fileOps.renameSync || renameSync
  const remove = fileOps.rmSync || rmSync
  try { write(temp, `${JSON.stringify(state, null, 2)}\n`, { encoding: 'utf8', flag: 'wx' }); rename(temp, path) }
  catch (error) {
    try { if (existsSync(temp)) remove(temp, { force: true }) } catch { /* retain the original write error */ }
    throw v2StoreError('HERMES_V2_ATOMIC_WRITE_FAILED', `Atomic v2 mission write failed: ${error.message}`, error)
  }
  return state
}

export function loadMissionStateV2(missionId, { migrateLegacy = true } = {}) {
  const path = join(getMissionDirectory(missionId), 'mission.json')
  if (existsSync(path)) {
    const record = parseMissionRecord(path)
    const version = detectMissionSchemaVersion(record)
    if (version === 2) { validateMissionStateV2(record); return { schemaVersion: 2, state: record, legacy: null, warnings: [] } }
    const migration = migrateMissionStateV1ToV2(record)
    return { schemaVersion: 1, state: migrateLegacy ? migration.state : null, legacy: record, warnings: migration.warning ? [migration.warning] : [] }
  }
  let legacy = null
  try { legacy = getMission(missionId) }
  catch (error) {
    if (/mission-store\.json is missing/.test(error.message)) throw v2StoreError('HERMES_V2_MISSION_NOT_FOUND', `Mission not found: ${missionId}`, error)
    throw error
  }
  if (!legacy) throw new Error(`Mission not found: ${missionId}`)
  const migration = migrateMissionStateV1ToV2(legacy)
  return { schemaVersion: 1, state: migrateLegacy ? migration.state : null, legacy, warnings: migration.warning ? [migration.warning] : [] }
}

export function appendMissionEventV2(missionId, event) {
  const root = ensureMissionDirectoryV2(missionId)
  if (!event || event.missionId !== missionId) throw new Error('Event missionId must match mission directory')
  if (!event.eventId || !event.timestamp || !event.actor || !event.type) throw new Error('Event requires eventId, timestamp, actor, and type')
  if (Number.isNaN(Date.parse(event.timestamp))) throw new Error('Event timestamp is invalid')
  appendFileSync(join(root, 'events.jsonl'), `${JSON.stringify(event)}\n`, 'utf8')
  return event
}

export function createMissionAttemptDirectory(missionId, attempt) {
  if (!Number.isInteger(attempt) || attempt < 1) throw new Error('Attempt must be a positive integer')
  const path = join(ensureMissionDirectoryV2(missionId), 'attempts', String(attempt).padStart(3, '0'))
  for (const name of ['worker', 'validation', 'review', 'closeout', 'sync', 'commit']) mkdirSync(join(path, name), { recursive: true })
  return path
}

export function listMissionAttempts(missionId) {
  const attempts = join(getMissionDirectory(missionId), 'attempts')
  if (!existsSync(attempts)) return []
  return readdirSync(attempts, { withFileTypes: true }).filter(item => item.isDirectory() && /^\d{3,}$/.test(item.name)).map(item => Number(item.name)).sort((a, b) => a - b)
}

const V2_ATTEMPT_STAGES = new Set(['worker-start', 'worker', 'validation', 'review', 'closeout', 'sync', 'commit', 'resume'])

export function writeMissionAttemptEvidenceV2(missionId, attempt, stage, evidence, { fileOps = {} } = {}) {
  if (!V2_ATTEMPT_STAGES.has(stage)) throw new Error(`Unsupported v2 attempt evidence stage: ${stage}`)
  if (!evidence || typeof evidence !== 'object') throw new Error('Attempt evidence must be an object')
  const attemptRoot = createMissionAttemptDirectory(missionId, attempt)
  const stageRoot = join(attemptRoot, stage)
  mkdirSync(stageRoot, { recursive: true })
  const path = join(stageRoot, 'evidence.json')
  const temp = `${path}.${process.pid}.${Date.now()}.tmp`
  const write = fileOps.writeFileSync || writeFileSync
  const rename = fileOps.renameSync || renameSync
  const remove = fileOps.rmSync || rmSync
  try {
    write(temp, `${JSON.stringify(evidence, null, 2)}\n`, { encoding: 'utf8', flag: 'wx' })
    rename(temp, path)
  } catch (error) {
    try { if (existsSync(temp)) remove(temp, { force: true }) } catch { /* preserve original failure */ }
    throw v2StoreError('HERMES_V2_EVIDENCE_WRITE_FAILED', `Atomic v2 evidence write failed: ${error.message}`, error)
  }
  return path
}

export function readMissionAttemptEvidenceV2(missionId, attempt, stage) {
  if (!V2_ATTEMPT_STAGES.has(stage)) throw new Error(`Unsupported v2 attempt evidence stage: ${stage}`)
  const path = join(getMissionDirectory(missionId), 'attempts', String(attempt).padStart(3, '0'), stage, 'evidence.json')
  if (!existsSync(path)) return null
  try { return JSON.parse(readFileSync(path, 'utf8')) }
  catch (error) { throw v2StoreError('HERMES_V2_EVIDENCE_PARSE_ERROR', `Cannot parse v2 attempt evidence: ${error.message}`, error) }
}

function booleanValue(value, fallback) {
  if (value === undefined || value === null || value === '') return fallback
  if (typeof value === 'boolean') return value
  if (/^(true|yes|1)$/i.test(String(value))) return true
  if (/^(false|no|0)$/i.test(String(value))) return false
  throw new Error(`Invalid boolean value: ${value}`)
}

export function pathMatchesScope(file, pattern) {
  const target = file.replaceAll('\\', '/').replace(/^\.\//, '').toLowerCase()
  const scope = pattern.replaceAll('\\', '/').replace(/^\.\//, '').toLowerCase()
  if (scope.endsWith('/**')) return target === scope.slice(0, -3) || target.startsWith(scope.slice(0, -2))
  if (scope.endsWith('/')) return target.startsWith(scope)
  if (scope.startsWith('*.')) return target.endsWith(scope.slice(1))
  if (scope.includes('*')) {
    const escaped = scope.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replaceAll('**', '\u0000').replaceAll('*', '[^/]*').replaceAll('\u0000', '.*')
    return new RegExp(`^${escaped}$`).test(target)
  }
  return target === scope
}

export function parseGitStatus(text) {
  return text.split(/\r?\n/).filter(Boolean).map(line => ({ code: line.slice(0, 2), path: line.slice(3).replace(/^"|"$/g, '') }))
}

export function changedSinceBaseline(current, baseline = []) {
  const previous = new Map(baseline.map(item => [item.path, item.code]))
  return current.filter(item => previous.get(item.path) !== item.code)
}

function normalizedRelative(repo, absolute) {
  return relative(repo, absolute).replaceAll('\\', '/').replace(/^\.\//, '')
}

function trackedPath(repo, path) {
  const result = spawnSync('git', ['-C', repo, 'ls-files', '--error-unmatch', '--', path], { encoding: 'utf8', windowsHide: true })
  return result.status === 0
}

function outputRoot(repo, scope) {
  const normalized = scope.replaceAll('\\', '/').replace(/^\.\//, '')
  if (normalized.includes('*') && !normalized.endsWith('/**')) throw new Error(`Unsupported output fingerprint scope: ${scope}`)
  const stable = normalized.endsWith('/**') ? normalized.slice(0, -3) : normalized.endsWith('/') ? normalized.slice(0, -1) : normalized
  const absolute = resolve(repo, stable)
  if (absolute !== repo && !absolute.startsWith(`${repo}${sep}`)) throw new Error(`Output fingerprint scope escapes repository: ${scope}`)
  return { scope: normalized, absolute, path: normalizedRelative(repo, absolute) }
}

function entryFingerprint(repo, absolute) {
  const path = normalizedRelative(repo, absolute)
  if (!existsSync(absolute)) return [{ path, exists: false, type: 'missing', size: null, sha256: null, tracked: false }]
  const stat = lstatSync(absolute)
  if (stat.isSymbolicLink()) return [{ path, exists: true, type: 'symlink', size: null, sha256: createHash('sha256').update(readlinkSync(absolute)).digest('hex'), tracked: trackedPath(repo, path) }]
  if (stat.isFile()) return [{ path, exists: true, type: 'file', size: stat.size, sha256: createHash('sha256').update(readFileSync(absolute)).digest('hex'), tracked: trackedPath(repo, path) }]
  if (!stat.isDirectory()) throw new Error(`Unsupported output file type at ${path}`)
  const entries = [{ path, exists: true, type: 'directory', size: null, sha256: null, tracked: trackedPath(repo, path) }]
  for (const child of readdirSync(absolute).sort((a, b) => a.localeCompare(b))) entries.push(...entryFingerprint(repo, join(absolute, child)))
  return entries
}

export function captureOutputFingerprints(repoPath, scopes = []) {
  const repo = resolve(repoPath)
  const fingerprints = []
  const errors = []
  for (const scope of scopes) {
    try {
      const root = outputRoot(repo, scope)
      fingerprints.push({ scope: root.scope, entries: entryFingerprint(repo, root.absolute) })
    } catch (error) {
      errors.push({ scope, error: error.message })
    }
  }
  return { captured_at: new Date().toISOString(), scopes: fingerprints, errors, ok: errors.length === 0 }
}

export function compareOutputFingerprints(before, after) {
  const changes = []
  const errors = [...(before?.errors || []), ...(after?.errors || [])]
  const beforeEntries = new Map((before?.scopes || []).flatMap(scope => scope.entries || []).map(entry => [entry.path, entry]))
  const afterEntries = new Map((after?.scopes || []).flatMap(scope => scope.entries || []).map(entry => [entry.path, entry]))
  const paths = [...new Set([...beforeEntries.keys(), ...afterEntries.keys()])].sort((a, b) => a.localeCompare(b))
  for (const path of paths) {
    const initial = beforeEntries.get(path) || { path, exists: false, type: 'missing' }
    const final = afterEntries.get(path) || { path, exists: false, type: 'missing' }
    let reason = null
    if (!initial.exists && final.exists) reason = 'created'
    else if (initial.exists && !final.exists) reason = 'deleted'
    else if (initial.type !== final.type) reason = 'type_changed'
    else if (initial.type === 'file' && initial.sha256 !== final.sha256) reason = 'modified'
    else if (initial.type === 'symlink' && initial.sha256 !== final.sha256) reason = 'modified'
    if (reason) changes.push({ path, reason, initial, final })
  }
  return { changed: changes.length > 0, changes, errors, ok: errors.length === 0 }
}

export function detectMissionChanges(currentStatus, baselineStatus = [], outputBaseline = null, outputFinal = null) {
  const gitChanges = changedSinceBaseline(currentStatus, baselineStatus).map(item => ({ path: item.path, reason: 'git_status_changed' }))
  const fingerprint = outputBaseline && outputFinal ? compareOutputFingerprints(outputBaseline, outputFinal) : { changes: [], errors: [], ok: true }
  const reasons = new Map()
  for (const change of [...gitChanges, ...fingerprint.changes]) {
    const list = reasons.get(change.path) || []
    list.push(change.reason)
    reasons.set(change.path, list)
  }
  return { changed_files: [...reasons.keys()].sort((a, b) => a.localeCompare(b)), change_reasons: [...reasons.entries()].map(([path, reasons]) => ({ path, reasons })), fingerprint, ok: fingerprint.ok }
}

export function inspectMissionObjective(packet, changedFiles) {
  const issues = []
  const requiredOutputs = packet.required_outputs || []
  const missingOutputs = []
  const unchangedOutputs = []
  const repoRoot = resolve(packet.repo)
  if (!packet.output_required) {
    if (changedFiles.length) issues.push(`Read-only mission changed files: ${changedFiles.join(', ')}`)
  } else {
    if (!changedFiles.length) issues.push('Writing mission produced zero changed files')
    for (const output of requiredOutputs) {
      const matchedChange = changedFiles.some(file => pathMatchesScope(file, output))
      if (!matchedChange) unchangedOutputs.push(output)
      if (!output.includes('*')) {
        const absolute = resolve(repoRoot, output)
        const insideRepo = absolute === repoRoot || absolute.startsWith(`${repoRoot}${sep}`)
        if (!insideRepo || !existsSync(absolute)) missingOutputs.push(output)
      } else if (!matchedChange) missingOutputs.push(output)
    }
    if (missingOutputs.length) issues.push(`Required outputs missing: ${missingOutputs.join(', ')}`)
    if (unchangedOutputs.length) issues.push(`Required outputs not created or modified: ${unchangedOutputs.join(', ')}`)
  }
  return {
    output_required: packet.output_required,
    required_outputs: requiredOutputs,
    missing_outputs: [...new Set(missingOutputs)],
    unchanged_outputs: [...new Set(unchangedOutputs)],
    objective_verified: issues.length === 0,
    issues,
  }
}

export function markdownSection(text, title) {
  const escaped = title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const match = new RegExp(`^#{1,3}\\s+${escaped}\\s*\\r?\\n([\\s\\S]*?)(?=^#{1,3}\\s+|(?![\\s\\S]))`, 'im').exec(text)
  return match ? match[1].trim() : ''
}

export function sectionList(text, title) {
  const section = markdownSection(text, title)
  const fenced = [...section.matchAll(/```[^\n]*\n([\s\S]*?)```/g)].flatMap(match => match[1].split(/\r?\n/))
  const bullets = section.split(/\r?\n/).filter(line => /^\s*[-*]\s+/.test(line)).map(line => line.replace(/^\s*[-*]\s+/, ''))
  const source = fenced.length ? fenced : bullets
  return source.map(line => line.trim().replace(/^`|`$/g, '')).filter(Boolean)
}

export function parseTaskPacket(packetPath) {
  const path = resolvePacketPath(packetPath)
  if (!existsSync(path)) throw new Error(`Packet not found: ${path}`)
  const text = readFileSync(path, 'utf8')
  const meta = parseFrontmatter(text)
  const allowed = Array.isArray(meta.allowed_files) && meta.allowed_files.length ? meta.allowed_files : sectionList(text, 'Allowed Files')
  const forbidden = Array.isArray(meta.forbidden_files) && meta.forbidden_files.length ? meta.forbidden_files : sectionList(text, 'Forbidden Files')
  const outputRequired = booleanValue(meta.output_required, true)
  const requiredOutputs = Array.isArray(meta.required_outputs) && meta.required_outputs.length
    ? meta.required_outputs
    : outputRequired ? allowed : []
  return {
    path,
    text,
    meta,
    mission_id: meta.mission_id || meta.packet_id || '',
    mission: meta.mission || markdownSection(text, 'Mission').split(/\r?\n/)[0]?.trim() || '',
    repo: meta.repo || REPO_ROOT,
    branch: meta.branch || '',
    agent_role: meta.agent_role || '',
    allowed_files: allowed,
    forbidden_files: forbidden,
    required_checks: Array.isArray(meta.required_checks) ? meta.required_checks : sectionList(text, 'Required Commands'),
    output_required: outputRequired,
    required_outputs: requiredOutputs,
    approval_gate: meta.approval_gate || markdownSection(text, 'Approval'),
  }
}

export function normalizeMission(packet) {
  const now = new Date().toISOString()
  if (!packet.mission_id) throw new Error('Packet must provide mission_id or packet_id')
  return {
    mission_id: packet.mission_id,
    packet_path: packet.path,
    mission: packet.mission,
    repo: resolve(packet.repo),
    branch: packet.branch,
    agent_role: packet.agent_role,
    allowed_files: packet.allowed_files,
    forbidden_files: packet.forbidden_files,
    required_checks: packet.required_checks,
    output_required: packet.output_required,
    required_outputs: packet.required_outputs,
    approval_gate: packet.approval_gate,
    state: 'PENDING',
    created_at: now,
    updated_at: now,
    attempts: 0,
  }
}

export function updateMissionState(missionId, state, details = {}) {
  if (!MISSION_STATES.includes(state)) throw new Error(`Invalid mission state: ${state}`)
  const store = readState('mission-store.json')
  const mission = store.missions.find(item => item.mission_id === missionId)
  if (!mission) throw new Error(`Mission not found: ${missionId}`)
  if (state === 'COMPLETED') {
    if (['FAILED', 'BLOCKED', 'NEEDS_REWORK'].includes(mission.state)) throw new Error(`Completion invariant rejected: ${mission.state} mission cannot become COMPLETED`)
    if (details.completion_evidence?.ready !== true) throw new Error('Completion invariant rejected: verified completion evidence is required')
  }
  mission.state = state
  mission.updated_at = new Date().toISOString()
  Object.assign(mission, details)
  atomicWrite('mission-store.json', store)
  appendHistory('MISSION_STATE_CHANGED', missionId, { state, ...details })
  return mission
}
