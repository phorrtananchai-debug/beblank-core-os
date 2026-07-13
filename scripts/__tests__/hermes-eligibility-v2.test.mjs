import assert from 'node:assert/strict'
import test from 'node:test'
import { createMissionState } from '../hermes-state-model-v2.mjs'
import { canCancelMission, canCommitMission, canDispatchMission, canQueueMission, canResumeMission } from '../hermes-lifecycle-v2.mjs'

const mission = state => ({ ...createMissionState({ missionId: 'MISSION-ELIGIBILITY-001', approvalRequired: true }), state })
const approval = { valid: true }

test('eligibility helpers allow only evidence-backed lifecycle entry points and never allow push', () => {
  assert.equal(canQueueMission({ missionState: mission('PLANNED'), packetValid: true, planValid: true, approval }).eligible, true)
  assert.equal(canQueueMission({ missionState: mission('CANCELLED'), packetValid: true, planValid: true, approval }).eligible, false)
  assert.equal(canDispatchMission({ missionState: mission('QUEUED'), queueValid: true, approval }).eligible, true)
  assert.equal(canDispatchMission({ missionState: mission('QUEUED'), queueValid: false, approval }).eligible, false)
  assert.equal(canResumeMission({ missionState: mission('RUNNING'), evidence: { workerResultExists: true } }).eligible, true)
  assert.equal(canCancelMission(mission('COMPLETED')).eligible, false)
  assert.equal(canCommitMission({ missionState: mission('REVIEWING'), approval, evidence: { commitRequired: true, validationComplete: true, validationPassed: true, reviewAccepted: true, closeoutValid: true, syncComplete: true } }).eligible, true)
  assert.equal(canCommitMission({ missionState: mission('CANCELLED'), approval, evidence: { commitRequired: true, validationComplete: true, validationPassed: true, reviewAccepted: true, closeoutValid: true, syncComplete: true } }).eligible, false)
  for (const result of [canQueueMission({ missionState: mission('PLANNED'), packetValid: false, planValid: false }), canDispatchMission({ missionState: mission('QUEUED'), queueValid: false }), canCancelMission(mission('COMPLETED'))]) assert.equal(result.pushAllowed, false)
})
