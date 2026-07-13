import assert from 'node:assert/strict'
import test from 'node:test'
import {
  LEGACY_STATE_MAP,
  TERMINAL_STATES,
  V2_STATES,
  createMissionState,
  isTerminal,
  migrateMissionStateV1ToV2,
} from '../hermes-state-model-v2.mjs'

const id = 'MISSION-V2-STATE-001'

test('v2 model exposes the complete canonical state set and terminal boundary', () => {
  assert.deepEqual(V2_STATES, ['INTAKE', 'NEEDS_CLARIFICATION', 'PLANNED', 'AWAITING_APPROVAL', 'QUEUED', 'RUNNING', 'VALIDATING', 'REVIEWING', 'COMPLETED', 'BLOCKED', 'FAILED', 'CANCELLED'])
  assert.deepEqual(TERMINAL_STATES, ['COMPLETED', 'FAILED', 'CANCELLED'])
  for (const state of TERMINAL_STATES) assert.equal(isTerminal(state), true)
  for (const state of V2_STATES.filter(state => !TERMINAL_STATES.includes(state))) assert.equal(isTerminal(state), false)
  assert.equal(isTerminal('UNKNOWN'), false)
})

test('v2 mission creation produces a valid conservative initial state', () => {
  const state = createMissionState({ missionId: id, approvalRequired: true, now: '2026-01-02T03:04:05.000Z' })
  assert.equal(state.schemaVersion, 2)
  assert.equal(state.missionId, id)
  assert.equal(state.state, 'INTAKE')
  assert.equal(state.approval.status, 'pending')
  assert.equal(state.checkpoints.intake, 'complete')
  assert.equal(state.createdAt, state.updatedAt)
})

test('legacy mappings are explicit and unknown legacy records fail conservatively', () => {
  for (const [legacyState, expected] of Object.entries({ PENDING: 'QUEUED', WAITING_APPROVAL: 'AWAITING_APPROVAL', WAITING_REVIEW: 'REVIEWING', NEEDS_REWORK: 'BLOCKED', PAUSED: 'BLOCKED', COMPLETED: 'COMPLETED' })) {
    assert.equal(LEGACY_STATE_MAP[legacyState], expected)
    const legacy = { mission_id: id, state: legacyState }
    const migrated = migrateMissionStateV1ToV2(legacy, '2026-01-02T03:04:05.000Z')
    assert.equal(migrated.state.state, expected)
    assert.deepEqual(legacy, { mission_id: id, state: legacyState })
  }
  const unknown = migrateMissionStateV1ToV2({ mission_id: id, state: 'UNRECOGNIZED' })
  assert.equal(unknown.state.state, 'BLOCKED')
  assert.match(unknown.warning, /Ambiguous legacy state/)
  assert.equal(isTerminal(migrateMissionStateV1ToV2({ mission_id: id, state: 'COMPLETED' }).state.state), true)
})
