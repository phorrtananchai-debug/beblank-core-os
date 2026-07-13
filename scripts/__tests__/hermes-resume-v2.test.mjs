import assert from 'node:assert/strict'
import { mkdtempSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import test from 'node:test'
const root = mkdtempSync(join(tmpdir(), 'hermes-resume-v2-')); process.env.HERMES_RUNTIME_DIR = join(root, 'runtime')
const store = await import('../hermes-runtime-store.mjs'); const model = await import('../hermes-state-model-v2.mjs'); const life = await import('../hermes-lifecycle-v2.mjs')
const state = value => ({ ...model.createMissionState({ missionId: 'MISSION-RESUME-001' }), state: value })
test.after(() => rmSync(root, { recursive: true, force: true }))

test('resume planning is checkpoint-aware and contradictions fail closed', () => {
  assert.equal(life.planMissionResume({ missionState: state('PLANNED'), evidence: { approvalRequired: true } }).nextState, 'AWAITING_APPROVAL')
  assert.equal(life.planMissionResume({ missionState: state('AWAITING_APPROVAL'), evidence: {} }).resumable, false)
  assert.equal(life.planMissionResume({ missionState: state('RUNNING'), evidence: { workerResultExists: true } }).nextState, 'VALIDATING')
  assert.equal(life.planMissionResume({ missionState: state('RUNNING'), evidence: {} }).nextState, 'BLOCKED')
  assert.match(life.planMissionResume({ missionState: state('VALIDATING'), evidence: { validationStarted: true, workerResultExists: false } }).code, /CONTRADICTION/)
  assert.equal(life.planMissionResume({ missionState: state('COMPLETED'), evidence: {} }).resumable, false)
})

test('blocker resolutions are versioned and do not create new attempts', () => {
  const mission = state('BLOCKED'); mission.blocker = { code: 'NETWORK' }; store.saveMissionStateV2(mission.missionId, mission)
  const first = life.recordBlockerResolution({ missionId: mission.missionId, blockerCode: 'NETWORK', resolvedBy: 'operator', resolution: 'Network restored', resumeCheckpoint: 'validation' })
  const second = life.recordBlockerResolution({ missionId: mission.missionId, blockerCode: 'NETWORK', resolvedBy: 'operator', resolution: 'Verified', resumeCheckpoint: 'validation' })
  assert.equal(first.resolutionVersion, 1); assert.equal(second.resolutionVersion, 2); assert.deepEqual(store.listMissionAttempts(mission.missionId), []); assert.throws(() => life.recordBlockerResolution({ missionId: mission.missionId, blockerCode: 'OTHER', resolvedBy: 'operator', resolution: 'x', resumeCheckpoint: 'validation' }), /does not match/)
})
