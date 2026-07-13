import assert from 'node:assert/strict'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { tmpdir } from 'node:os'
import test from 'node:test'

const root = mkdtempSync(join(tmpdir(), 'hermes-v2-migration-'))
process.env.HERMES_RUNTIME_DIR = join(root, 'runtime')
const store = await import('../hermes-runtime-store.mjs')
const migration = await import('../hermes-migrate-v2.mjs')

test.before(() => store.initializeRuntime())
test.after(() => rmSync(root, { recursive: true, force: true }))

function addLegacy(missionId, state = 'BLOCKED', extra = {}) {
  const mission = { mission_id: missionId, mission: `Legacy ${missionId}`, state, risk: 'LOW', ...extra }
  store.saveMission(mission, { create: true })
  return mission
}

test('D migration dry-run is evidence-rich and writes no v2 files', () => {
  const missionId = 'MISSION-MIGRATE-DRY-001'
  addLegacy(missionId)
  const legacyPath = store.statePath('mission-store.json')
  const before = readFileSync(legacyPath)
  const result = migration.inspectMigrationV2({ missionId })
  assert.equal(result.eligible, true)
  assert.equal(result.dryRun, true)
  assert.equal(result.code, 'HERMES_V2_MIGRATION_ELIGIBLE')
  assert.match(result.sourceSha256, /^[a-f0-9]{64}$/)
  assert.match(result.targetSha256, /^[a-f0-9]{64}$/)
  assert.equal(existsSync(store.getMissionDirectory(missionId)), false)
  assert.deepEqual(readFileSync(legacyPath), before)
  assert.equal(result.pushAllowed, false)
})

test('D migration apply requires exact confirmation and preserves v1 bytes', () => {
  const missionId = 'MISSION-MIGRATE-APPLY-001'
  addLegacy(missionId, 'FAILED')
  const legacyPath = store.statePath('mission-store.json')
  const before = readFileSync(legacyPath)
  assert.equal(migration.applyMigrationV2({ missionId, confirm: 'OTHER' }).code, 'HERMES_V2_MIGRATION_CONFIRMATION_REQUIRED')
  assert.equal(existsSync(store.getMissionDirectory(missionId)), false)
  const result = migration.applyMigrationV2({ missionId, confirm: missionId })
  assert.equal(result.code, 'HERMES_V2_MIGRATION_APPLIED')
  assert.equal(result.sourcePreserved, true)
  assert.deepEqual(readFileSync(legacyPath), before)
  const loaded = store.loadMissionStateV2(missionId)
  assert.equal(loaded.schemaVersion, 2)
  assert.equal(loaded.state.state, 'FAILED')
  assert.ok(['packet', 'plan', 'approval', 'worker', 'validation', 'review', 'closeout', 'sync', 'commit'].every(checkpoint => loaded.state.checkpoints[checkpoint] === 'not-required'))
  const baseline = join(store.getMissionDirectory(missionId), 'baseline')
  assert.deepEqual(readdirSync(baseline).sort(), ['legacy-source.json', 'migration-manifest.json'])
  const manifest = JSON.parse(readFileSync(join(baseline, 'migration-manifest.json'), 'utf8'))
  assert.equal(manifest.source.sha256, result.manifest.source.sha256)
  assert.equal(manifest.pushPerformed, false)
})

test('D migration blocks non-terminal legacy states until checkpoint evidence is resolved', () => {
  const missionId = 'MISSION-MIGRATE-WAITING-001'
  addLegacy(missionId, 'WAITING_REVIEW')
  const inspection = migration.inspectMigrationV2({ missionId })
  assert.equal(inspection.eligible, true)
  assert.equal(inspection.targetState, 'BLOCKED')
  assert.equal(inspection.migratedState.blocker.code, 'HERMES_V2_MIGRATION_EVIDENCE_REQUIRED')
  assert.equal(inspection.migratedState.blocker.intendedState, 'REVIEWING')
})

test('D migration rejects active, ambiguous, conflicting, and existing targets', () => {
  const running = 'MISSION-MIGRATE-RUNNING-001'; addLegacy(running, 'RUNNING')
  assert.equal(migration.inspectMigrationV2({ missionId: running }).code, 'HERMES_V2_MIGRATION_ACTIVE')
  const archived = 'MISSION-MIGRATE-ARCHIVED-001'; addLegacy(archived, 'ARCHIVED')
  assert.equal(migration.inspectMigrationV2({ missionId: archived }).code, 'HERMES_V2_MIGRATION_UNSUPPORTED_STATE')
  const queued = 'MISSION-MIGRATE-QUEUED-001'; addLegacy(queued, 'PENDING')
  const queue = store.readState('queue.json'); queue.items.push({ mission_id: queued }); store.atomicWrite('queue.json', queue)
  assert.equal(migration.inspectMigrationV2({ missionId: queued }).code, 'HERMES_V2_MIGRATION_CONFLICT')
  const existing = 'MISSION-MIGRATE-EXISTS-001'; addLegacy(existing)
  mkdirSync(store.getMissionDirectory(existing), { recursive: true })
  assert.equal(migration.inspectMigrationV2({ missionId: existing }).code, 'HERMES_V2_MIGRATION_TARGET_EXISTS')
  assert.equal(migration.inspectMigrationV2({ missionId: '../escape' }).code, 'HERMES_V2_MIGRATION_INVALID_ID')
  assert.equal(migration.inspectMigrationV2({ missionId: 'MISSION-MISSING' }).code, 'HERMES_V2_MIGRATION_SOURCE_NOT_FOUND')
})

test('D migration apply failure removes only its partial v2 target', () => {
  const missionId = 'MISSION-MIGRATE-FAIL-001'
  addLegacy(missionId)
  const legacyPath = store.statePath('mission-store.json')
  const before = readFileSync(legacyPath)
  const target = store.getMissionDirectory(missionId)
  const result = migration.applyMigrationV2({ missionId, confirm: missionId }, {
    saveV2: () => { mkdirSync(target, { recursive: true }); throw new Error('simulated atomic failure') },
  })
  assert.equal(result.code, 'HERMES_V2_MIGRATION_APPLY_FAILED')
  assert.equal(existsSync(target), false)
  assert.deepEqual(readFileSync(legacyPath), before)
})

test('D rollback validates hashes and archives only the migrated v2 directory', () => {
  const missionId = 'MISSION-MIGRATE-ROLLBACK-001'
  addLegacy(missionId, 'NEEDS_REWORK')
  const legacyPath = store.statePath('mission-store.json')
  const before = readFileSync(legacyPath)
  const applied = migration.applyMigrationV2({ missionId, confirm: missionId })
  assert.equal(applied.ok, true)
  assert.equal(migration.rollbackMigrationV2({ missionId, confirm: 'OTHER' }).code, 'HERMES_V2_ROLLBACK_CONFIRMATION_REQUIRED')
  const rolledBack = migration.rollbackMigrationV2({ missionId, confirm: missionId })
  assert.equal(rolledBack.code, 'HERMES_V2_ROLLBACK_ARCHIVED')
  assert.equal(existsSync(store.getMissionDirectory(missionId)), false)
  assert.equal(existsSync(join(rolledBack.archive, 'baseline', 'rollback-record.json')), true)
  assert.deepEqual(readFileSync(legacyPath), before)
})

test('D rollback fails closed when source evidence no longer matches', () => {
  const missionId = 'MISSION-MIGRATE-MISMATCH-001'
  addLegacy(missionId)
  assert.equal(migration.applyMigrationV2({ missionId, confirm: missionId }).ok, true)
  const mission = store.getMission(missionId)
  store.saveMission({ ...mission, risk: 'HIGH' })
  const result = migration.rollbackMigrationV2({ missionId, confirm: missionId })
  assert.equal(result.code, 'HERMES_V2_ROLLBACK_SOURCE_MISMATCH')
  assert.equal(existsSync(store.getMissionDirectory(missionId)), true)
})

test('D migration CLI parser requires one explicit operation', () => {
  assert.deepEqual(migration.parseMigrationArgs(['--mission', 'M1', '--dry-run']), { missionId: 'M1', confirm: null, mode: 'dry-run' })
  assert.deepEqual(migration.parseMigrationArgs(['--apply', '--confirm', 'M1', '--mission', 'M1']), { missionId: 'M1', confirm: 'M1', mode: 'apply' })
  assert.throws(() => migration.parseMigrationArgs(['--mission', 'M1']), /Usage/)
  assert.throws(() => migration.parseMigrationArgs(['--mission', 'M1', '--dry-run', '--apply']), /Usage/)
})

test('D migration never invokes Git or push operations', () => {
  const source = readFileSync(new URL('../hermes-migrate-v2.mjs', import.meta.url), 'utf8')
  assert.doesNotMatch(source, /spawnSync|execSync|git\s+push|pushPerformed:\s*true|pushAllowed:\s*true/)
  assert.equal(dirname(store.getMissionDirectory('M')), join(root, 'state', 'missions'))
})
