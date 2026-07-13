import assert from 'node:assert/strict'
import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import test from 'node:test'

const root = mkdtempSync(join(tmpdir(), 'hermes-v2-store-'))
process.env.HERMES_RUNTIME_DIR = join(root, 'runtime')
const store = await import('../hermes-runtime-store.mjs')
const model = await import('../hermes-state-model-v2.mjs')
const id = 'MISSION-V2-STORE-001'
const stateFor = (missionId = id) => model.createMissionState({ missionId, now: '2026-01-02T03:04:05.000Z' })
const missionPath = missionId => join(store.getMissionDirectory(missionId), 'mission.json')

test.after(() => rmSync(root, { recursive: true, force: true }))

test('v2 directories are isolated and contain no fabricated evidence files', () => {
  const directory = store.ensureMissionDirectoryV2(id)
  assert.deepEqual(readdirSync(directory).sort(), ['approval', 'attempts', 'baseline', 'packet', 'plan'])
  for (const part of ['packet', 'plan', 'approval', 'baseline', 'attempts']) assert.deepEqual(readdirSync(join(directory, part)), [])
  assert.equal(existsSync(missionPath(id)), false)
})

test('every canonical state round trips and invalid v2 schema fields are rejected', () => {
  for (const [index, stateName] of model.V2_STATES.entries()) {
    const missionId = `MISSION-V2-STATE-${index}`
    const state = stateFor(missionId)
    state.state = stateName
    store.saveMissionStateV2(missionId, state)
    assert.equal(store.loadMissionStateV2(missionId).state.state, stateName)
  }
  const valid = stateFor('MISSION-V2-INVALID-001')
  const cases = [
    [{ ...valid, schemaVersion: undefined }, /schemaVersion/],
    [{ ...valid, schemaVersion: 3 }, /schemaVersion/],
    [{ ...valid, missionId: '' }, /missionId/],
    [{ ...valid, missionId: '../escape' }, /missionId/],
    [{ ...valid, createdAt: '' }, /createdAt/],
    [{ ...valid, updatedAt: '' }, /updatedAt/],
    [{ ...valid, createdAt: 'not-a-date' }, /timestamps/],
    [{ ...valid, checkpoints: null }, /checkpoints/],
    [{ ...valid, checkpoints: { ...valid.checkpoints, review: 'broken' } }, /checkpoint/],
    [{ ...valid, state: 'UNKNOWN' }, /Unknown v2 mission state/],
  ]
  for (const [candidate, error] of cases) assert.throws(() => store.saveMissionStateV2(valid.missionId, candidate), error)
  assert.throws(() => store.saveMissionStateV2('MISSION-V2-OTHER-001', valid), /does not match/)
})

test('v2 reads and writes reject malformed or unsupported records without rewriting evidence', () => {
  const valid = stateFor('MISSION-V2-ATOMIC-001')
  store.saveMissionStateV2(valid.missionId, valid)
  const original = readFileSync(missionPath(valid.missionId), 'utf8')
  assert.throws(() => store.saveMissionStateV2(valid.missionId, { ...valid, state: 'UNKNOWN' }), /Unknown/)
  assert.equal(readFileSync(missionPath(valid.missionId), 'utf8'), original)
  assert.throws(() => store.saveMissionStateV2(valid.missionId, { ...valid, updatedAt: 'bad' }), /timestamps/)
  assert.equal(store.loadMissionStateV2(valid.missionId).state.state, 'INTAKE')

  const malformedId = 'MISSION-V2-MALFORMED-001'
  writeFileSync(join(store.ensureMissionDirectoryV2(malformedId), 'mission.json'), '{broken')
  assert.throws(() => store.loadMissionStateV2(malformedId), error => error.code === 'HERMES_V2_MISSION_PARSE_ERROR')
  assert.equal(readFileSync(missionPath(malformedId), 'utf8'), '{broken')
  const schemaId = 'MISSION-V2-SCHEMA-001'
  const unsupported = '{"schemaVersion":99}'
  writeFileSync(join(store.ensureMissionDirectoryV2(schemaId), 'mission.json'), unsupported)
  assert.throws(() => store.loadMissionStateV2(schemaId), /Unsupported mission schema version/)
  assert.equal(readFileSync(missionPath(schemaId), 'utf8'), unsupported)
  assert.throws(() => store.loadMissionStateV2('MISSION-V2-MISSING-001'), /Mission not found/)
})

test('atomic v2 saves preserve the old destination on write and rename failures', () => {
  const missionId = 'MISSION-V2-FAILURE-001'
  const state = stateFor(missionId)
  store.saveMissionStateV2(missionId, state)
  const before = readFileSync(missionPath(missionId), 'utf8')
  for (const failure of [
    { writeFileSync: () => { throw new Error('write denied') } },
    { writeFileSync: (path, contents, options) => { writeFileSync(path, contents, options); throw new Error('write interrupted') } },
    { renameSync: () => { throw new Error('rename denied') } },
  ]) {
    assert.throws(() => store.saveMissionStateV2(missionId, { ...state, state: 'PLANNED' }, { fileOps: failure }), error => error.code === 'HERMES_V2_ATOMIC_WRITE_FAILED')
    assert.equal(readFileSync(missionPath(missionId), 'utf8'), before)
    assert.equal(store.loadMissionStateV2(missionId).state.state, 'INTAKE')
  }
  assert.equal(readdirSync(store.getMissionDirectory(missionId)).filter(name => name.endsWith('.tmp')).length, 0)
})

test('legacy records remain byte-identical and cannot be overwritten through v2 save', () => {
  const legacyId = 'MISSION-V1-LEGACY-001'
  const bytes = JSON.stringify({ mission_id: legacyId, state: 'WAITING_APPROVAL' })
  writeFileSync(join(store.ensureMissionDirectoryV2(legacyId), 'mission.json'), bytes)
  const loaded = store.loadMissionStateV2(legacyId)
  assert.equal(loaded.schemaVersion, 1)
  assert.equal(loaded.state.state, 'AWAITING_APPROVAL')
  assert.equal(readFileSync(missionPath(legacyId), 'utf8'), bytes)
  assert.throws(() => store.saveMissionStateV2(legacyId, stateFor(legacyId)), /legacy mission evidence/)
  assert.equal(readFileSync(missionPath(legacyId), 'utf8'), bytes)
})

test('events validate before append and preserve valid JSONL order', () => {
  const eventId = 'MISSION-V2-EVENT-001'
  const directory = store.ensureMissionDirectoryV2(eventId)
  const event = eventIdValue => ({ eventId: eventIdValue, missionId: eventId, timestamp: '2026-01-02T03:04:05.000Z', actor: 'runner', type: 'STATE_TRANSITION' })
  store.appendMissionEventV2(eventId, event('EVT-1'))
  store.appendMissionEventV2(eventId, event('EVT-2'))
  const path = join(directory, 'events.jsonl')
  const bytes = readFileSync(path, 'utf8')
  assert.ok(bytes.endsWith('\n'))
  assert.deepEqual(bytes.trim().split('\n').map(JSON.parse).map(item => item.eventId), ['EVT-1', 'EVT-2'])
  const invalid = [
    [{ ...event('EVT-X'), missionId: 'OTHER' }, /missionId/],
    [{ ...event('') }, /requires/],
    [{ ...event('EVT-X'), missionId: undefined }, /missionId/],
    [{ ...event('EVT-X'), timestamp: 'bad' }, /timestamp/],
    [{ ...event('EVT-X'), actor: '' }, /requires/],
    [{ ...event('EVT-X'), type: '' }, /requires/],
  ]
  for (const [candidate, error] of invalid) assert.throws(() => store.appendMissionEventV2(eventId, candidate), error)
  assert.equal(readFileSync(path, 'utf8'), bytes)
  for (let index = 3; index <= 20; index += 1) store.appendMissionEventV2(eventId, event(`EVT-${index}`))
  assert.equal(readFileSync(path, 'utf8').trim().split('\n').length, 20)
})

test('attempt directories are idempotent, complete, and listed numerically', () => {
  const attemptId = 'MISSION-V2-ATTEMPT-001'
  for (const value of [1, 2, 10, 12, 999, 1000]) store.createMissionAttemptDirectory(attemptId, value)
  const first = store.createMissionAttemptDirectory(attemptId, 1)
  for (const name of ['worker', 'validation', 'review', 'closeout', 'sync', 'commit']) assert.ok(existsSync(join(first, name)))
  assert.deepEqual(store.listMissionAttempts(attemptId), [1, 2, 10, 12, 999, 1000])
  for (const value of [0, -1, 1.5, NaN, '1', '']) assert.throws(() => store.createMissionAttemptDirectory(attemptId, value), /positive integer/)
})

test('attempt checkpoint evidence writes atomically and reads without lifecycle mutation', () => {
  const evidenceId = 'MISSION-V2-EVIDENCE-001'
  const state = stateFor(evidenceId)
  store.saveMissionStateV2(evidenceId, state)
  const missionBefore = readFileSync(missionPath(evidenceId), 'utf8')
  const evidence = { ok: true, code: 'HERMES_V2_VALIDATION_SUITE_COMPLETE', result: 'PASS' }
  const path = store.writeMissionAttemptEvidenceV2(evidenceId, 1, 'validation', evidence)
  assert.deepEqual(store.readMissionAttemptEvidenceV2(evidenceId, 1, 'validation'), evidence)
  assert.equal(readFileSync(missionPath(evidenceId), 'utf8'), missionBefore)
  assert.throws(() => store.writeMissionAttemptEvidenceV2(evidenceId, 1, '../bad', evidence), /Unsupported/)
  const before = readFileSync(path, 'utf8')
  assert.throws(() => store.writeMissionAttemptEvidenceV2(evidenceId, 1, 'validation', { ...evidence, result: 'FAIL' }, { fileOps: { renameSync: () => { throw new Error('rename denied') } } }), error => error.code === 'HERMES_V2_EVIDENCE_WRITE_FAILED')
  assert.equal(readFileSync(path, 'utf8'), before)
})

test('v1 runtime-store APIs remain on their documented v1 paths', () => {
  store.initializeRuntime()
  const mission = { mission_id: 'MISSION-V1-COMPAT-001', state: 'PENDING' }
  store.saveMission(mission, { create: true })
  assert.deepEqual(store.getMission(mission.mission_id), mission)
  assert.equal(existsSync(join(root, 'state', 'missions', mission.mission_id, 'mission.json')), false)
  assert.deepEqual(store.readState('mission-store.json').missions.map(item => item.mission_id), [mission.mission_id])
})

test('import/export surface contains both v1 APIs and v2 helpers without canonical writes', () => {
  for (const name of ['initializeRuntime', 'readState', 'saveMission', 'getMission', 'saveMissionStateV2', 'loadMissionStateV2', 'getMissionDirectory', 'ensureMissionDirectoryV2', 'appendMissionEventV2', 'createMissionAttemptDirectory', 'listMissionAttempts', 'detectMissionSchemaVersion', 'writeMissionAttemptEvidenceV2', 'readMissionAttemptEvidenceV2']) assert.equal(typeof store[name], 'function')
  assert.equal(existsSync(join(store.REPO_ROOT, '.hermes', 'state', 'missions', id)), false)
})
