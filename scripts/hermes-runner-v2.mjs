import { randomUUID } from 'node:crypto'
import {
  appendMissionEventV2,
  createMissionAttemptDirectory,
  loadMissionStateV2,
  readMissionAttemptEvidenceV2,
  saveMissionStateV2,
  writeMissionAttemptEvidenceV2,
} from './hermes-runtime-store.mjs'
import { canTransition } from './hermes-state-model-v2.mjs'
import {
  commitMissionFilesV2,
  dispatchWorkerV2,
  prepareDispatchV2,
  prepareWorkerInvocationV2,
  runReviewV2,
  runSyncV2,
  runValidationSuiteV2,
  validateCloseoutV2,
  waitForWorkerResultV2,
} from './hermes-boundary-v2.mjs'

const CHECKPOINT_ORDER = ['worker', 'validation', 'closeout', 'review', 'sync', 'commit']
const STATE_FOR_CHECKPOINT = Object.freeze({ worker: 'QUEUED', validation: 'RUNNING', closeout: 'REVIEWING', review: 'VALIDATING', sync: 'REVIEWING', commit: 'REVIEWING' })

function clone(value) { return structuredClone(value) }
function timestamp() { return new Date().toISOString() }
function eventId() { return `EVT-${randomUUID()}` }
function evidencePath(attempt, checkpoint) { return `attempts/${String(attempt).padStart(3, '0')}/${checkpoint}/evidence.json` }

export function createRunnerCheckpointStore(overrides = {}) {
  return {
    load(missionId) {
      const loaded = loadMissionStateV2(missionId)
      if (loaded.schemaVersion !== 2) throw new Error('v2-checkpoint mode requires a persisted schema v2 mission')
      return loaded.state
    },
    save: saveMissionStateV2,
    appendEvent: appendMissionEventV2,
    ensureAttempt: createMissionAttemptDirectory,
    writeEvidence: writeMissionAttemptEvidenceV2,
    readEvidence: readMissionAttemptEvidenceV2,
    ...overrides,
  }
}

function runnerEvent(store, mission, type, details = {}) {
  const event = {
    eventId: eventId(), missionId: mission.missionId, attempt: mission.currentAttempt,
    timestamp: timestamp(), actor: 'hermes-runner-v2', type,
    previousState: details.previousState ?? null, newState: details.newState ?? mission.state,
    reason: details.reason ?? null, evidence: details.evidence ?? [], metadata: details.metadata ?? {},
  }
  store.appendEvent(mission.missionId, event)
  mission.lastEventId = event.eventId
  mission.updatedAt = event.timestamp
  store.save(mission.missionId, mission)
  return event
}

function persistMission(store, mission) {
  mission.updatedAt = timestamp()
  store.save(mission.missionId, mission)
  return mission
}

function transition(store, mission, target, { reason, evidence = [], blockerResolution = false } = {}) {
  const guard = canTransition(mission, target, { blockerResolution })
  if (!guard.ok) throw new Error(`Transition refused: ${guard.reason}`)
  const previousState = mission.state
  mission.state = target
  mission.stage = target.toLowerCase()
  mission.nextAction = null
  persistMission(store, mission)
  runnerEvent(store, mission, 'STATE_TRANSITION', { previousState, newState: target, reason, evidence })
  return mission
}

function persistCheckpoint(store, mission, checkpoint, evidence, status = 'complete') {
  const reference = evidencePath(mission.currentAttempt, checkpoint)
  store.writeEvidence(mission.missionId, mission.currentAttempt, checkpoint, evidence)
  if (Object.hasOwn(mission.checkpoints, checkpoint)) mission.checkpoints[checkpoint] = status
  persistMission(store, mission)
  runnerEvent(store, mission, 'CHECKPOINT_RECORDED', { evidence: [reference], metadata: { checkpoint, status, code: evidence?.code || null } })
  return reference
}

function blockMission(store, mission, checkpoint, evidence, reason = evidence?.reason || `${checkpoint} failed`) {
  if (evidence) {
    try { store.writeEvidence(mission.missionId, mission.currentAttempt, checkpoint, evidence) } catch (error) { reason = `${reason}; evidence persistence failed: ${error.message}` }
  }
  const previousState = mission.state
  mission.state = 'BLOCKED'
  mission.stage = checkpoint
  mission.blocker = { code: evidence?.code || 'HERMES_V2_RUNNER_BLOCKED', checkpoint, reason, attempt: mission.currentAttempt, recordedAt: timestamp() }
  mission.nextAction = `resolve blocker and resume from ${checkpoint}`
  persistMission(store, mission)
  runnerEvent(store, mission, 'MISSION_BLOCKED', { previousState, newState: 'BLOCKED', reason, evidence: evidence ? [evidencePath(mission.currentAttempt, checkpoint)] : [] })
  return { ok: false, code: mission.blocker.code, mission: clone(mission), checkpoint, evidence, pushAllowed: false, pushPerformed: false }
}

function resetForRetry(mission, checkpoint) {
  const start = CHECKPOINT_ORDER.indexOf(checkpoint)
  if (start < 0) throw new Error(`Unsupported retry checkpoint: ${checkpoint}`)
  mission.currentAttempt += 1
  for (const name of CHECKPOINT_ORDER.slice(start)) mission.checkpoints[name] = name === 'commit' && mission.checkpoints.commit === 'not-required' ? 'not-required' : 'pending'
  mission.state = STATE_FOR_CHECKPOINT[checkpoint]
  mission.stage = checkpoint
  mission.blocker = null
  mission.nextAction = checkpoint
  return mission
}

export function planCheckpointResumeV2(mission, { retry = false, resumeCheckpoint = null, blockerResolution = null } = {}) {
  if (['COMPLETED', 'FAILED', 'CANCELLED'].includes(mission.state)) return { ok: false, code: 'HERMES_V2_RESUME_TERMINAL', reason: 'Terminal mission cannot resume.' }
  if (mission.state === 'BLOCKED') {
    if (!retry || !resumeCheckpoint || !blockerResolution || blockerResolution.blockerCode !== mission.blocker?.code) return { ok: false, code: 'HERMES_V2_RESUME_BLOCKER_RESOLUTION_REQUIRED', reason: 'Matching blocker resolution and retry checkpoint are required.' }
    return { ok: true, code: 'HERMES_V2_RETRY_ALLOWED', checkpoint: resumeCheckpoint, newAttempt: true }
  }
  if (mission.state === 'RUNNING' && mission.checkpoints.worker !== 'complete') return { ok: false, code: 'HERMES_V2_RESUME_WORKER_UNCERTAIN', reason: 'RUNNING mission lacks completed worker evidence; retry is required to avoid overlapping an unknown worker.' }
  const checkpoint = CHECKPOINT_ORDER.find(name => !['complete', 'accepted', 'not-required'].includes(mission.checkpoints[name])) || 'complete'
  return { ok: true, code: 'HERMES_V2_RESUME_ALLOWED', checkpoint, newAttempt: false }
}

export function runMissionCheckpointsV2(input, dependencies = {}) {
  const store = dependencies.store || createRunnerCheckpointStore()
  let mission = clone(store.load(input.missionId))
  if (mission.schemaVersion !== 2) throw new Error('v2-checkpoint runner accepts schema v2 only')
  if (['COMPLETED', 'FAILED', 'CANCELLED'].includes(mission.state)) return { ok: false, code: 'HERMES_V2_RESUME_TERMINAL', reason: 'Terminal mission cannot execute or resume.', mission: clone(mission), pushAllowed: false, pushPerformed: false }
  if (input.resume || input.retry) {
    const resume = planCheckpointResumeV2(mission, input)
    if (!resume.ok) return blockMission(store, mission, 'resume', resume, resume.reason)
    if (resume.newAttempt) {
      const previousAttempt = mission.currentAttempt
      mission = resetForRetry(mission, resume.checkpoint)
      store.ensureAttempt(mission.missionId, mission.currentAttempt)
      persistMission(store, mission)
      runnerEvent(store, mission, 'MISSION_RETRY_STARTED', { reason: input.blockerResolution.resolution, metadata: { previousAttempt, checkpoint: resume.checkpoint } })
    }
  }
  store.ensureAttempt(mission.missionId, mission.currentAttempt)

  if (mission.state === 'QUEUED' && mission.checkpoints.worker !== 'complete') {
    const preparedDispatch = prepareDispatchV2({ missionId: mission.missionId, attempt: mission.currentAttempt, state: mission.state, worker: input.worker?.id || 'codex', packetHash: input.packetHash, planHash: input.planHash, expectedPacketHash: input.expectedPacketHash, expectedPlanHash: input.expectedPlanHash, lockRequest: input.lockRequest || {}, mode: 'v2-checkpoint' })
    if (!preparedDispatch.ok) return blockMission(store, mission, 'worker', preparedDispatch)
    const preparedInvocation = prepareWorkerInvocationV2({ missionId: mission.missionId, attempt: mission.currentAttempt, worker: input.worker?.id || 'codex', request: input.worker?.request, cwd: input.worker?.cwd, env: input.worker?.env, adapterOptions: input.worker?.adapterOptions })
    if (!preparedInvocation.ok) return blockMission(store, mission, 'worker', preparedInvocation)
    const dispatched = dispatchWorkerV2({ preparedDispatch, preparedInvocation, acquireLock: dependencies.acquireLock, releaseLock: dependencies.releaseLock, start: dependencies.startWorker })
    if (!dispatched.ok) return blockMission(store, mission, 'worker', dispatched)
    const startRef = persistCheckpoint(store, mission, 'worker-start', dispatched)
    transition(store, mission, 'RUNNING', { reason: 'worker start confirmed', evidence: [startRef] })
    const workerResult = waitForWorkerResultV2({ preparedInvocation, startEvidence: dispatched.startEvidence })
    if (!workerResult.ok || workerResult.result !== 'FINISHED') return blockMission(store, mission, 'worker', workerResult)
    persistCheckpoint(store, mission, 'worker', workerResult)
  }

  if (mission.checkpoints.worker !== 'complete') return blockMission(store, mission, 'worker', { code: 'HERMES_V2_WORKER_EVIDENCE_MISSING', reason: 'Completed worker evidence is required.' })
  if (mission.state === 'RUNNING') transition(store, mission, 'VALIDATING', { reason: 'worker evidence complete', evidence: [evidencePath(mission.currentAttempt, 'worker')] })

  if (mission.checkpoints.validation !== 'complete') {
    const validation = runValidationSuiteV2({ missionId: mission.missionId, attempt: mission.currentAttempt, checks: input.validationChecks || [] })
    if (!validation.ok || validation.result !== 'PASS') return blockMission(store, mission, 'validation', validation)
    persistCheckpoint(store, mission, 'validation', validation)
  }
  if (mission.state === 'VALIDATING') transition(store, mission, 'REVIEWING', { reason: 'validation passed', evidence: [evidencePath(mission.currentAttempt, 'validation')] })

  let closeout = store.readEvidence(mission.missionId, mission.currentAttempt, 'closeout')
  if (mission.checkpoints.closeout !== 'complete') {
    closeout = validateCloseoutV2({ missionId: mission.missionId, attempt: mission.currentAttempt, closeout: input.closeout, observedFiles: input.observedFiles || [], validator: dependencies.closeoutValidator })
    if (!closeout.ok || !closeout.valid) return blockMission(store, mission, 'closeout', closeout)
    persistCheckpoint(store, mission, 'closeout', closeout)
  }

  let review = store.readEvidence(mission.missionId, mission.currentAttempt, 'review')
  if (mission.checkpoints.review !== 'accepted') {
    const validation = store.readEvidence(mission.missionId, mission.currentAttempt, 'validation')
    review = runReviewV2({ missionId: mission.missionId, attempt: mission.currentAttempt, validationEvidence: { passed: validation?.result === 'PASS' }, closeoutEvidence: { valid: closeout?.valid === true }, reviewerInput: input.reviewerInput || {}, reviewer: dependencies.reviewer })
    if (!review.ok || review.verdict !== 'ACCEPTED') return blockMission(store, mission, 'review', review)
    persistCheckpoint(store, mission, 'review', review, 'accepted')
  }

  if (mission.checkpoints.sync !== 'complete') {
    const sync = runSyncV2({ missionId: mission.missionId, attempt: mission.currentAttempt, inputs: input.syncInputs || { closeout: input.closeout }, syncOperation: dependencies.syncOperation })
    if (!sync.ok || !sync.success) return blockMission(store, mission, 'sync', sync)
    persistCheckpoint(store, mission, 'sync', sync)
  }

  let commit = null
  if (input.commitRequested) {
    commit = commitMissionFilesV2({ missionId: mission.missionId, attempt: mission.currentAttempt, allowedFiles: input.allowedFiles || [], commitMessage: input.commitMessage, cwd: input.worker?.cwd, git: dependencies.git })
    if (!commit.ok) return blockMission(store, mission, 'commit', commit)
    persistCheckpoint(store, mission, 'commit', commit)
  } else if (mission.checkpoints.commit !== 'not-required') {
    persistCheckpoint(store, mission, 'commit', { ok: true, code: 'HERMES_V2_COMMIT_NOT_REQUESTED', committed: false, pushAllowed: false, pushPerformed: false }, 'not-required')
  }

  transition(store, mission, 'COMPLETED', { reason: 'review, closeout, sync, and optional commit gates passed', evidence: CHECKPOINT_ORDER.map(name => evidencePath(mission.currentAttempt, name)) })
  return { ok: true, code: 'HERMES_V2_RUNNER_COMPLETED', mission: clone(mission), review, closeout, commit, pushAllowed: false, pushPerformed: false }
}
