#!/usr/bin/env node

import { createHash, randomUUID } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import {
  appendMissionEventV2,
  getMission,
  getMissionDirectory,
  readState,
  saveMissionStateV2,
  statePath,
} from './hermes-runtime-store.mjs'
import { LEGACY_STATE_MAP, migrateMissionStateV1ToV2 } from './hermes-state-model-v2.mjs'

const validId = value => typeof value === 'string' && /^[A-Za-z0-9._-]+$/.test(value)
const sha256 = value => createHash('sha256').update(typeof value === 'string' || Buffer.isBuffer(value) ? value : JSON.stringify(value)).digest('hex')
const stableJson = value => `${JSON.stringify(value, null, 2)}\n`

function atomicJson(path, value, fileOps = {}) {
  const temp = `${path}.${process.pid}.${Date.now()}.tmp`
  const write = fileOps.writeFileSync || writeFileSync
  const rename = fileOps.renameSync || renameSync
  const remove = fileOps.rmSync || rmSync
  mkdirSync(dirname(path), { recursive: true })
  try { write(temp, stableJson(value), { encoding: 'utf8', flag: 'wx' }); rename(temp, path) }
  catch (error) {
    try { if (existsSync(temp)) remove(temp, { force: true }) } catch { /* retain original error */ }
    throw error
  }
}

function runtimeDependencies(overrides = {}) {
  return {
    getLegacyMission: getMission,
    readRuntimeState: readState,
    missionDirectory: getMissionDirectory,
    saveV2: saveMissionStateV2,
    appendEvent: appendMissionEventV2,
    sourceReference: statePath('mission-store.json'),
    now: () => new Date().toISOString(),
    migrationId: () => `MIG-${randomUUID()}`,
    exists: existsSync,
    readFile: readFileSync,
    rename: renameSync,
    remove: rmSync,
    writeJson: atomicJson,
    ...overrides,
  }
}

function conflictsFor(missionId, deps) {
  const queue = deps.readRuntimeState('queue.json')?.items || []
  const locks = deps.readRuntimeState('locks.json')?.locks || []
  const runtime = deps.readRuntimeState('runtime.json') || { active_assignments: {}, executions: {} }
  const conflicts = []
  if (queue.some(item => item.mission_id === missionId)) conflicts.push({ type: 'queue', code: 'HERMES_V2_MIGRATION_QUEUE_CONFLICT' })
  if (locks.some(lock => lock.mission_id === missionId && lock.status !== 'released')) conflicts.push({ type: 'lock', code: 'HERMES_V2_MIGRATION_LOCK_CONFLICT' })
  if (runtime.active_assignments?.[missionId]) conflicts.push({ type: 'assignment', code: 'HERMES_V2_MIGRATION_ASSIGNMENT_CONFLICT' })
  if (runtime.executions?.[missionId]?.status === 'RUNNING') conflicts.push({ type: 'execution', code: 'HERMES_V2_MIGRATION_EXECUTION_CONFLICT' })
  return conflicts
}

export function inspectMigrationV2({ missionId }, overrides = {}) {
  const deps = runtimeDependencies(overrides)
  const base = { missionId, dryRun: true, eligible: false, pushAllowed: false, pushPerformed: false }
  if (!validId(missionId)) return { ...base, code: 'HERMES_V2_MIGRATION_INVALID_ID', reason: 'Mission ID is invalid.' }
  const legacy = deps.getLegacyMission(missionId)
  if (!legacy) return { ...base, code: 'HERMES_V2_MIGRATION_SOURCE_NOT_FOUND', reason: 'Legacy mission was not found.' }
  if (!LEGACY_STATE_MAP[legacy.state] || legacy.state === 'ARCHIVED') return { ...base, code: 'HERMES_V2_MIGRATION_UNSUPPORTED_STATE', reason: `Legacy state is unsupported or ambiguous: ${legacy.state || 'missing'}.`, sourceState: legacy.state || null }
  if (legacy.state === 'RUNNING') return { ...base, code: 'HERMES_V2_MIGRATION_ACTIVE', reason: 'RUNNING missions cannot be migrated.' }
  const targetDirectory = deps.missionDirectory(missionId)
  if (deps.exists(targetDirectory)) return { ...base, code: 'HERMES_V2_MIGRATION_TARGET_EXISTS', reason: 'A v2 mission directory already exists.', targetDirectory }
  const conflicts = conflictsFor(missionId, deps)
  if (conflicts.length) return { ...base, code: 'HERMES_V2_MIGRATION_CONFLICT', reason: 'Legacy mission has active runtime conflicts.', conflicts }
  const migrated = migrateMissionStateV1ToV2(legacy, deps.now())
  if (migrated.warning) return { ...base, code: 'HERMES_V2_MIGRATION_AMBIGUOUS', reason: migrated.warning }
  const mappedState = migrated.state.state
  if (['COMPLETED', 'FAILED'].includes(mappedState)) {
    for (const checkpoint of ['packet', 'plan', 'approval', 'worker', 'validation', 'review', 'closeout', 'sync', 'commit']) migrated.state.checkpoints[checkpoint] = 'not-required'
    migrated.state.nextAction = null
  } else if (mappedState !== 'BLOCKED') {
    migrated.state.state = 'BLOCKED'
    migrated.state.stage = 'migration'
    migrated.state.blocker = { code: 'HERMES_V2_MIGRATION_EVIDENCE_REQUIRED', reason: `Legacy ${legacy.state} cannot resume in v2 without checkpoint evidence.`, intendedState: mappedState }
    migrated.state.nextAction = 'record blocker resolution and choose an explicit retry checkpoint'
  }
  const sourceSha256 = sha256(JSON.stringify(legacy))
  const targetSha256 = sha256(JSON.stringify(migrated.state))
  return {
    ...base, eligible: true, code: 'HERMES_V2_MIGRATION_ELIGIBLE', reason: null,
    sourceState: legacy.state, targetState: migrated.state.state, sourceSha256, targetSha256,
    sourceReference: `${deps.sourceReference}#missions[mission_id=${missionId}]`, targetDirectory,
    legacy, migratedState: migrated.state, conflicts: [],
  }
}

export function applyMigrationV2({ missionId, confirm }, overrides = {}) {
  const deps = runtimeDependencies(overrides)
  if (confirm !== missionId) return { ok: false, eligible: false, code: 'HERMES_V2_MIGRATION_CONFIRMATION_REQUIRED', reason: 'Apply requires --confirm with the exact mission ID.', missionId, pushAllowed: false, pushPerformed: false }
  const inspection = inspectMigrationV2({ missionId }, deps)
  if (!inspection.eligible) return { ...inspection, ok: false, dryRun: false }
  const sourceBefore = JSON.stringify(deps.getLegacyMission(missionId))
  if (sha256(sourceBefore) !== inspection.sourceSha256) return { ...inspection, ok: false, dryRun: false, code: 'HERMES_V2_MIGRATION_SOURCE_CHANGED', reason: 'Legacy source changed after inspection.' }
  const migrationId = deps.migrationId()
  const migratedAt = deps.now()
  const migrationEventId = `EVT-${migrationId}`
  const state = { ...inspection.migratedState, migratedAt, lastEventId: migrationEventId, migration: { migrationId, sourceSchemaVersion: 1, sourceState: inspection.sourceState, sourceSha256: inspection.sourceSha256, sourceReference: inspection.sourceReference } }
  const targetSha256 = sha256(JSON.stringify(state))
  const manifest = {
    schemaVersion: 1, migrationId, missionId, migratedAt,
    source: { schemaVersion: 1, state: inspection.sourceState, sha256: inspection.sourceSha256, evidenceReference: inspection.sourceReference },
    target: { schemaVersion: 2, state: state.state, sha256: targetSha256, directory: inspection.targetDirectory },
    rollback: { action: 'archive-v2-directory', requiresSourceSha256: inspection.sourceSha256, requiresTargetSha256: targetSha256 },
    pushAllowed: false, pushPerformed: false,
  }
  try {
    deps.saveV2(missionId, state)
    const baseline = join(inspection.targetDirectory, 'baseline')
    deps.writeJson(join(baseline, 'legacy-source.json'), inspection.legacy)
    deps.writeJson(join(baseline, 'migration-manifest.json'), manifest)
    deps.appendEvent(missionId, { eventId: migrationEventId, missionId, attempt: state.currentAttempt, timestamp: migratedAt, actor: 'hermes-migrate-v2', type: 'MISSION_MIGRATED', previousState: inspection.sourceState, newState: state.state, evidence: ['baseline/legacy-source.json', 'baseline/migration-manifest.json'] })
  } catch (error) {
    if (deps.exists(inspection.targetDirectory)) deps.remove(inspection.targetDirectory, { recursive: true, force: true })
    return { ok: false, eligible: true, code: 'HERMES_V2_MIGRATION_APPLY_FAILED', reason: error.message, missionId, sourcePreserved: sha256(JSON.stringify(deps.getLegacyMission(missionId))) === inspection.sourceSha256, pushAllowed: false, pushPerformed: false }
  }
  const sourceAfter = sha256(JSON.stringify(deps.getLegacyMission(missionId)))
  if (sourceAfter !== inspection.sourceSha256) {
    if (deps.exists(inspection.targetDirectory)) deps.remove(inspection.targetDirectory, { recursive: true, force: true })
    return { ok: false, eligible: true, code: 'HERMES_V2_MIGRATION_SOURCE_CHANGED', reason: 'Legacy source changed during migration; the v2 target was removed.', missionId, sourcePreserved: false, pushAllowed: false, pushPerformed: false }
  }
  return { ok: true, eligible: true, dryRun: false, code: 'HERMES_V2_MIGRATION_APPLIED', missionId, migrationId, manifest, sourcePreserved: true, pushAllowed: false, pushPerformed: false }
}

export function rollbackMigrationV2({ missionId, confirm }, overrides = {}) {
  const deps = runtimeDependencies(overrides)
  const base = { ok: false, missionId, pushAllowed: false, pushPerformed: false }
  if (confirm !== missionId) return { ...base, code: 'HERMES_V2_ROLLBACK_CONFIRMATION_REQUIRED', reason: 'Rollback requires --confirm with the exact mission ID.' }
  if (!validId(missionId)) return { ...base, code: 'HERMES_V2_MIGRATION_INVALID_ID', reason: 'Mission ID is invalid.' }
  const directory = deps.missionDirectory(missionId)
  const manifestPath = join(directory, 'baseline', 'migration-manifest.json')
  const missionPath = join(directory, 'mission.json')
  if (!deps.exists(manifestPath) || !deps.exists(missionPath)) return { ...base, code: 'HERMES_V2_ROLLBACK_EVIDENCE_MISSING', reason: 'Migration manifest or v2 mission state is missing.' }
  let manifest
  let target
  try {
    manifest = JSON.parse(deps.readFile(manifestPath, 'utf8'))
    target = JSON.parse(deps.readFile(missionPath, 'utf8'))
  } catch (error) { return { ...base, code: 'HERMES_V2_ROLLBACK_EVIDENCE_INVALID', reason: `Rollback evidence is malformed: ${error.message}` } }
  const source = deps.getLegacyMission(missionId)
  if (!source || sha256(JSON.stringify(source)) !== manifest.rollback?.requiresSourceSha256) return { ...base, code: 'HERMES_V2_ROLLBACK_SOURCE_MISMATCH', reason: 'Legacy source no longer matches migration evidence.' }
  if (sha256(JSON.stringify(target)) !== manifest.rollback?.requiresTargetSha256) return { ...base, code: 'HERMES_V2_ROLLBACK_TARGET_MISMATCH', reason: 'v2 target no longer matches migration evidence.' }
  const archiveRoot = join(dirname(dirname(directory)), 'migration-rollbacks')
  const archive = join(archiveRoot, `${missionId}-${manifest.migrationId}`)
  if (deps.exists(archive)) return { ...base, code: 'HERMES_V2_ROLLBACK_CONFLICT', reason: 'Rollback archive already exists.' }
  mkdirSync(archiveRoot, { recursive: true })
  const rolledBackAt = deps.now()
  deps.writeJson(join(directory, 'baseline', 'rollback-record.json'), { schemaVersion: 1, missionId, migrationId: manifest.migrationId, rolledBackAt, sourceSha256: manifest.source.sha256, targetSha256: manifest.target.sha256, archive, pushAllowed: false, pushPerformed: false })
  deps.rename(directory, archive)
  return { ok: true, code: 'HERMES_V2_ROLLBACK_ARCHIVED', missionId, migrationId: manifest.migrationId, archive, sourcePreserved: true, pushAllowed: false, pushPerformed: false }
}

export function parseMigrationArgs(args) {
  const missionIndex = args.indexOf('--mission')
  const confirmIndex = args.indexOf('--confirm')
  const missionId = missionIndex >= 0 ? args[missionIndex + 1] : null
  const confirm = confirmIndex >= 0 ? args[confirmIndex + 1] : null
  const modes = ['--dry-run', '--apply', '--rollback'].filter(flag => args.includes(flag))
  if (!missionId || modes.length !== 1) throw new Error('Usage: hermes-migrate-v2 --mission <ID> (--dry-run | --apply --confirm <ID> | --rollback --confirm <ID>)')
  return { missionId, confirm, mode: modes[0].slice(2) }
}

function main() {
  const input = parseMigrationArgs(process.argv.slice(2))
  if (input.mode === 'dry-run') return inspectMigrationV2(input)
  if (input.mode === 'apply') return applyMigrationV2(input)
  return rollbackMigrationV2(input)
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  try {
    const result = main()
    console.log(JSON.stringify(result, null, 2))
    if (result.ok === false || result.eligible === false) process.exitCode = 2
  } catch (error) { console.error(`Hermes v2 migration error: ${error.message}`); process.exit(2) }
}
