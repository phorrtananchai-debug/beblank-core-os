import assert from 'node:assert/strict'
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import test from 'node:test'

const root = mkdtempSync(join(tmpdir(), 'hermes-approval-v2-'))
process.env.HERMES_RUNTIME_DIR = join(root, 'runtime')
const store = await import('../hermes-runtime-store.mjs')
const model = await import('../hermes-state-model-v2.mjs')
const life = await import('../hermes-lifecycle-v2.mjs')
const id = 'MISSION-APPROVAL-001'
const create = () => { const state = model.createMissionState({ missionId: id, approvalRequired: true }); state.state = 'PLANNED'; state.stage = 'planned'; state.planScope = ['scripts/hermes/**']; store.saveMissionStateV2(id, state); return state }
const request = overrides => life.requestMissionApproval({ missionId: id, packetHash: 'packet-1', planHash: 'plan-1', risk: 'MEDIUM', requestedScope: ['scripts/hermes/foo.mjs'], executionRequested: true, commitRequested: false, reason: 'test', ...overrides })
test.after(() => rmSync(root, { recursive: true, force: true }))

test('versioned approval request persists, transitions, and is deterministic when repeated', () => {
  create(); const result = request()
  const dir = join(store.getMissionDirectory(id), 'approval')
  assert.equal(result.status, 'pending'); assert.equal(store.loadMissionStateV2(id).state.state, 'AWAITING_APPROVAL')
  assert.ok(existsSync(join(dir, 'request-v001.json'))); assert.equal(request().idempotent, true)
  assert.match(readFileSync(join(store.getMissionDirectory(id), 'events.jsonl'), 'utf8'), /APPROVAL_REQUESTED/)
  for (const invalid of [{ packetHash: '' }, { planHash: '' }, { risk: 'BAD' }, { requestedScope: [] }]) assert.throws(() => request(invalid))
})

test('approval narrows scope, preserves request, queues only execution approval, and validates staleness', () => {
  const approval = life.recordMissionApproval({ missionId: id, approvedScope: ['scripts/hermes/foo.mjs'], executionApproved: true, commitApproved: false, approvedBy: 'operator', note: null })
  assert.equal(approval.queued, true); assert.equal(store.loadMissionStateV2(id).state.state, 'QUEUED')
  assert.ok(existsSync(join(store.getMissionDirectory(id), 'approval', 'approval-v001.json')))
  assert.equal(life.validateMissionApproval({ missionId: id, packetHash: 'packet-1', planHash: 'plan-1', requiredScope: ['scripts/hermes/foo.mjs'], requireExecution: true }).valid, true)
  assert.equal(life.validateMissionApproval({ missionId: id, packetHash: 'packet-2', planHash: 'plan-1', requiredScope: ['scripts/hermes/foo.mjs'] }).code, 'HERMES_APPROVAL_PACKET_HASH_MISMATCH')
  assert.equal(life.validateMissionApproval({ missionId: id, packetHash: 'packet-1', planHash: 'plan-1', requiredScope: ['scripts/hermes/foo.mjs'], requireCommit: true }).code, 'HERMES_APPROVAL_COMMIT_NOT_GRANTED')
  assert.equal(JSON.parse(readFileSync(join(store.getMissionDirectory(id), 'approval', 'request-v001.json'))).status, 'pending')
})

test('approval rejects broadened scope and unrequested commit permission', () => {
  const second = 'MISSION-APPROVAL-002'; const state = model.createMissionState({ missionId: second, approvalRequired: true }); state.state = 'PLANNED'; state.planScope = ['scripts/hermes/**']; store.saveMissionStateV2(second, state)
  life.requestMissionApproval({ missionId: second, packetHash: 'p', planHash: 'q', risk: 'MEDIUM', requestedScope: ['scripts/hermes/a.mjs'], executionRequested: true, commitRequested: false })
  assert.throws(() => life.recordMissionApproval({ missionId: second, approvedScope: ['scripts/hermes/**'], executionApproved: true, commitApproved: false, approvedBy: 'operator' }), /exceeds/)
  assert.throws(() => life.recordMissionApproval({ missionId: second, approvedScope: ['scripts/hermes/a.mjs'], executionApproved: true, commitApproved: true, approvedBy: 'operator' }), /not requested/)
})
