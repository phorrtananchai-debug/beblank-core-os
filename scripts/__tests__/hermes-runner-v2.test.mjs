import assert from 'node:assert/strict'
import test from 'node:test'
import { createMissionState } from '../hermes-state-model-v2.mjs'
import { planCheckpointResumeV2, runMissionCheckpointsV2 } from '../hermes-runner-v2.mjs'

function queuedMission(id = 'MISSION-C1-001') {
  const mission = createMissionState({ missionId: id })
  mission.state = 'QUEUED'
  mission.stage = 'queued'
  mission.checkpoints.packet = 'complete'
  mission.checkpoints.plan = 'complete'
  return mission
}

function memoryStore(initial) {
  let state = structuredClone(initial)
  const evidence = new Map()
  const events = []
  const attempts = []
  const key = (attempt, stage) => `${attempt}:${stage}`
  return {
    load: () => structuredClone(state),
    save: (_missionId, value) => { state = structuredClone(value) },
    appendEvent: (_missionId, event) => { events.push(structuredClone(event)) },
    ensureAttempt: (_missionId, attempt) => { attempts.push(attempt) },
    writeEvidence: (_missionId, attempt, stage, value) => { evidence.set(key(attempt, stage), structuredClone(value)) },
    readEvidence: (_missionId, attempt, stage) => structuredClone(evidence.get(key(attempt, stage)) || null),
    inspect: () => ({ state: structuredClone(state), evidence, events: structuredClone(events), attempts: [...attempts] }),
  }
}

function passingInput(missionId = 'MISSION-C1-001') {
  return {
    missionId, packetHash: 'packet-hash', planHash: 'plan-hash', expectedPacketHash: 'packet-hash', expectedPlanHash: 'plan-hash',
    worker: { id: 'codex', request: 'scoped prompt', cwd: process.cwd(), adapterOptions: { invocationId: 'INV-C1', command: 'codex' } },
    validationChecks: [{ missionId, attempt: 1, checkId: 'lint', name: 'lint', command: 'npm run lint', cwd: process.cwd(), execute: () => ({ status: 0, stdout: 'ok', stderr: '' }) }],
    closeout: { packet: 'v3' }, observedFiles: ['docs/guide.md'], allowedFiles: ['docs/guide.md'], commitRequested: false,
  }
}

function passingDependencies(store, overrides = {}) {
  return {
    store,
    acquireLock: () => ({ acquired: true, lockIds: ['LOCK-C1'] }),
    releaseLock: () => {},
    startWorker: ({ preparedInvocation }) => ({ ok: true, code: 'HERMES_V2_WORKER_STARTED', missionId: preparedInvocation.missionId, attempt: preparedInvocation.attempt, started: true, invocationId: preparedInvocation.invocationId, startedAt: '2026-07-13T00:00:00.000Z', processResult: { status: 0, stdout: 'worker complete', stderr: '' }, pushAllowed: false, pushPerformed: false }),
    closeoutValidator: (_closeout, { observedFiles }) => ({ valid: true, missionId: 'MISSION-C1-001', attempt: 1, claimedFiles: observedFiles, warnings: [], errors: [] }),
    reviewer: () => ({ verdict: 'AUTO_ACCEPT', warnings: [], requiredActions: [], reasons: [] }),
    syncOperation: () => ({ success: true, artifacts: ['sync.json'], warnings: [] }),
    ...overrides,
  }
}

test('C1 happy path records evidence before runner-owned state transitions', () => {
  const store = memoryStore(queuedMission())
  const result = runMissionCheckpointsV2(passingInput(), passingDependencies(store))
  assert.equal(result.code, 'HERMES_V2_RUNNER_COMPLETED')
  assert.equal(result.mission.state, 'COMPLETED')
  assert.deepEqual(result.mission.checkpoints, { intake: 'complete', packet: 'complete', plan: 'complete', approval: 'not-required', worker: 'complete', validation: 'complete', review: 'accepted', closeout: 'complete', sync: 'complete', commit: 'not-required' })
  const audit = store.inspect()
  assert.deepEqual(audit.events.filter(event => event.type === 'STATE_TRANSITION').map(event => `${event.previousState}->${event.newState}`), ['QUEUED->RUNNING', 'RUNNING->VALIDATING', 'VALIDATING->REVIEWING', 'REVIEWING->COMPLETED'])
  assert.ok(audit.events.every(event => event.actor === 'hermes-runner-v2'))
  assert.equal(result.pushPerformed, false)
})

test('C1 validation failure persists evidence and blocks before review sync or commit', () => {
  const store = memoryStore(queuedMission())
  const input = passingInput()
  input.validationChecks[0].execute = () => ({ status: 2, stdout: 'PASS text is not authority', stderr: 'failed' })
  let reviewed = 0; let synced = 0
  const result = runMissionCheckpointsV2(input, passingDependencies(store, { reviewer: () => { reviewed += 1 }, syncOperation: () => { synced += 1 } }))
  assert.equal(result.mission.state, 'BLOCKED')
  assert.equal(result.checkpoint, 'validation')
  assert.equal(reviewed, 0)
  assert.equal(synced, 0)
  assert.equal(store.inspect().evidence.get('1:validation').result, 'FAIL')
})

test('C1 invalid closeout and rejected review fail closed at their exact checkpoints', () => {
  const closeoutStore = memoryStore(queuedMission())
  const invalid = runMissionCheckpointsV2(passingInput(), passingDependencies(closeoutStore, { closeoutValidator: () => ({ valid: false, claimedFiles: [], errors: ['malformed'] }) }))
  assert.equal(invalid.checkpoint, 'closeout')
  assert.equal(invalid.mission.state, 'BLOCKED')

  const reviewStore = memoryStore(queuedMission())
  const rejected = runMissionCheckpointsV2(passingInput(), passingDependencies(reviewStore, { reviewer: () => ({ verdict: 'NEEDS_REWORK', reasons: ['change required'] }) }))
  assert.equal(rejected.checkpoint, 'review')
  assert.equal(rejected.mission.state, 'BLOCKED')
  assert.equal(reviewStore.inspect().state.checkpoints.review, 'pending')
})

test('C1 sync failure vetoes completion and commit', () => {
  const store = memoryStore(queuedMission())
  let gitCalls = 0
  const input = { ...passingInput(), commitRequested: true, commitMessage: 'test commit' }
  const result = runMissionCheckpointsV2(input, passingDependencies(store, { syncOperation: () => ({ success: false, reason: 'sync unavailable' }), git: () => { gitCalls += 1; return { status: 0, stdout: '' } } }))
  assert.equal(result.checkpoint, 'sync')
  assert.equal(result.mission.state, 'BLOCKED')
  assert.equal(gitCalls, 0)
})

test('C1 optional selective commit runs only after sync and before completion', () => {
  const store = memoryStore(queuedMission())
  const input = { ...passingInput(), commitRequested: true, commitMessage: 'docs: complete fixture' }
  let synced = false
  const gitCalls = []
  const git = args => {
    assert.equal(synced, true)
    gitCalls.push([...args])
    if (args[0] === 'diff') return { status: 0, stdout: gitCalls.filter(call => call[0] === 'diff').length === 1 ? '' : 'docs/guide.md\n', stderr: '' }
    if (args[0] === 'rev-parse') return { status: 0, stdout: 'abc123\n', stderr: '' }
    return { status: 0, stdout: '', stderr: '' }
  }
  const result = runMissionCheckpointsV2(input, passingDependencies(store, { syncOperation: () => { synced = true; return { success: true } }, git }))
  assert.equal(result.mission.state, 'COMPLETED')
  assert.equal(result.mission.checkpoints.commit, 'complete')
  assert.equal(result.commit.commitHash, 'abc123')
  assert.deepEqual(gitCalls.map(args => args[0]), ['diff', 'add', 'diff', 'commit', 'rev-parse'])
})

test('C1 evidence persistence failure prevents the next lifecycle transition', () => {
  const store = memoryStore(queuedMission())
  const originalWrite = store.writeEvidence
  store.writeEvidence = (missionId, attempt, stage, value) => {
    if (stage === 'validation') throw new Error('evidence disk unavailable')
    return originalWrite(missionId, attempt, stage, value)
  }
  assert.throws(() => runMissionCheckpointsV2(passingInput(), passingDependencies(store)), /evidence disk unavailable/)
  const state = store.inspect().state
  assert.equal(state.state, 'VALIDATING')
  assert.equal(state.checkpoints.validation, 'pending')
  assert.notEqual(state.state, 'COMPLETED')
})

test('C1 resume skips completed worker checkpoint and continues validation', () => {
  const mission = queuedMission()
  mission.state = 'RUNNING'; mission.stage = 'running'; mission.checkpoints.worker = 'complete'
  const store = memoryStore(mission)
  store.writeEvidence(mission.missionId, 1, 'worker', { ok: true, result: 'FINISHED' })
  let starts = 0
  const result = runMissionCheckpointsV2({ ...passingInput(), resume: true }, passingDependencies(store, { startWorker: () => { starts += 1 } }))
  assert.equal(result.mission.state, 'COMPLETED')
  assert.equal(starts, 0)
})

test('C1 uncertain running worker refuses overlap and requires retry', () => {
  const mission = queuedMission(); mission.state = 'RUNNING'; mission.stage = 'running'
  const plan = planCheckpointResumeV2(mission, { resume: true })
  assert.equal(plan.code, 'HERMES_V2_RESUME_WORKER_UNCERTAIN')
  const store = memoryStore(mission)
  const result = runMissionCheckpointsV2({ ...passingInput(), resume: true }, passingDependencies(store))
  assert.equal(result.mission.state, 'BLOCKED')
  assert.equal(result.code, 'HERMES_V2_RESUME_WORKER_UNCERTAIN')
})

test('C1 retry requires matching blocker resolution and creates a new attempt', () => {
  const mission = queuedMission(); mission.state = 'BLOCKED'; mission.stage = 'validation'; mission.checkpoints.worker = 'complete'; mission.blocker = { code: 'VALIDATION_FAILED', checkpoint: 'validation' }
  const store = memoryStore(mission)
  store.writeEvidence(mission.missionId, 1, 'worker', { ok: true, result: 'FINISHED' })
  const denied = planCheckpointResumeV2(mission, { retry: true, resumeCheckpoint: 'validation', blockerResolution: { blockerCode: 'OTHER' } })
  assert.equal(denied.code, 'HERMES_V2_RESUME_BLOCKER_RESOLUTION_REQUIRED')
  const input = { ...passingInput(), retry: true, resumeCheckpoint: 'validation', blockerResolution: { blockerCode: 'VALIDATION_FAILED', resolution: 'dependency restored' } }
  input.validationChecks[0].attempt = 2
  const result = runMissionCheckpointsV2(input, passingDependencies(store, { closeoutValidator: (_closeout, { observedFiles }) => ({ valid: true, missionId: mission.missionId, attempt: 2, claimedFiles: observedFiles }) }))
  assert.equal(result.mission.currentAttempt, 2)
  assert.equal(result.mission.state, 'COMPLETED')
  assert.ok(store.inspect().events.some(event => event.type === 'MISSION_RETRY_STARTED'))
})

test('C1 terminal missions cannot resume and v2 runner never permits push', () => {
  const mission = queuedMission(); mission.state = 'COMPLETED'
  assert.equal(planCheckpointResumeV2(mission, { resume: true }).code, 'HERMES_V2_RESUME_TERMINAL')
  const store = memoryStore(queuedMission())
  const result = runMissionCheckpointsV2(passingInput(), passingDependencies(store))
  assert.equal(result.pushAllowed, false)
  assert.equal(result.pushPerformed, false)
})
