import assert from 'node:assert/strict'
import { mkdtempSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import test from 'node:test'

const root = mkdtempSync(join(tmpdir(), 'hermes-cancel-v2-'))
process.env.HERMES_RUNTIME_DIR = join(root, 'runtime')
const store = await import('../hermes-runtime-store.mjs'); const model = await import('../hermes-state-model-v2.mjs'); const life = await import('../hermes-lifecycle-v2.mjs')
const add = (id, state = 'RUNNING') => { const mission = model.createMissionState({ missionId: id }); mission.state = state; store.saveMissionStateV2(id, mission); return mission }
test.after(() => rmSync(root, { recursive: true, force: true }))

test('cancellation is non-destructive and releases only owned locks', () => {
  add('MISSION-CANCEL-001'); store.initializeRuntime(); store.atomicWrite('locks.json', { version: 1, locks: [{ lock_id: 'own', owner: 'MISSION-CANCEL-001' }, { lock_id: 'other', owner: 'OTHER' }] })
  const result = life.cancelMission({ missionId: 'MISSION-CANCEL-001', actor: 'operator', workerActive: true })
  assert.equal(result.state, 'CANCELLED'); assert.deepEqual(result.releasedLocks, ['own']); assert.deepEqual(store.readState('locks.json').locks.map(lock => lock.lock_id), ['other']); assert.equal(result.pushAllowed, false)
  assert.match(result.nextAction, /unsupported/); assert.throws(() => life.cancelMission({ missionId: 'MISSION-CANCEL-001' }), /Terminal/)
})

test('all terminal states reject cancellation and lock release safely handles no locks', () => {
  for (const state of model.TERMINAL_STATES) { const id = `MISSION-${state}`; add(id, state); assert.equal(life.canCancelMission(store.loadMissionStateV2(id).state).eligible, false) }
  assert.deepEqual(life.releaseMissionOwnedLocks('MISSING').released, [])
})
