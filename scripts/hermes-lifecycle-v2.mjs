import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import {
  appendMissionEventV2,
  atomicWrite,
  ensureMissionDirectoryV2,
  getMissionDirectory,
  loadMissionStateV2,
  readState,
  saveMissionStateV2,
} from './hermes-runtime-store.mjs'
import { TERMINAL_STATES, V2_STATES } from './hermes-state-model-v2.mjs'

const RISKS = new Set(['LOW', 'MEDIUM', 'HIGH'])
const CHECKPOINTS = new Set(['intake', 'clarification', 'packet', 'plan', 'approval', 'queue', 'worker', 'validation', 'review', 'closeout', 'sync', 'commit'])
const fail = (code, reason, extra = {}) => ({ eligible: false, valid: false, resumable: false, pushAllowed: false, code, reason, ...extra })
const ok = (extra = {}) => ({ eligible: true, valid: true, pushAllowed: false, code: 'HERMES_OK', reason: null, ...extra })
const validId = value => typeof value === 'string' && /^[A-Za-z0-9._-]+$/.test(value)
const validTimestamp = value => typeof value === 'string' && !Number.isNaN(Date.parse(value))

function scopeValid(scope) {
  return Array.isArray(scope) && scope.length > 0 && scope.every(item => typeof item === 'string' && item.trim() && !item.includes('..') && !item.startsWith('/') && !item.includes('\\'))
}
function scopeCovers(approved, required) {
  if (!scopeValid(approved) || !scopeValid(required)) return false
  return required.every(path => approved.some(pattern => pattern === path || pattern.endsWith('/**') && (path === pattern.slice(0, -3) || path.startsWith(pattern.slice(0, -2)))))
}
function loadV2(missionId) {
  if (!validId(missionId)) throw new Error('Invalid mission ID')
  const loaded = loadMissionStateV2(missionId)
  if (loaded.schemaVersion !== 2) throw new Error('Phase 7.4B requires a persisted v2 mission')
  return loaded.state
}
function approvalDir(missionId) { return join(ensureMissionDirectoryV2(missionId), 'approval') }
function readJson(path) { return JSON.parse(readFileSync(path, 'utf8')) }
function versionedPath(dir, stem, version) { return join(dir, `${stem}-v${String(version).padStart(3, '0')}.json`) }
function latestVersion(dir, stem) {
  let version = 0
  if (!existsSync(dir)) return version
  for (const name of readdirSync(dir)) { const match = new RegExp(`^${stem}-v(\\d+)\\.json$`).exec(name); if (match) version = Math.max(version, Number(match[1])) }
  return version
}

function currentRequest(missionId) {
  const path = join(approvalDir(missionId), 'current-request.json')
  return existsSync(path) ? readJson(path) : null
}
function setState(mission, state, actor, type, reason = null) {
  const previousState = mission.state
  mission.state = state
  mission.stage = state.toLowerCase()
  mission.updatedAt = new Date().toISOString()
  appendMissionEventV2(mission.missionId, { eventId: `EVT-${Date.now()}-${type}`, missionId: mission.missionId, timestamp: mission.updatedAt, actor, type, previousState, newState: state, reason })
  saveMissionStateV2(mission.missionId, mission)
  return mission
}

export function requestMissionApproval({ missionId, packetHash, planHash, risk, requestedScope, executionRequested, commitRequested, reason, planScope }) {
  const mission = loadV2(missionId)
  if (TERMINAL_STATES.includes(mission.state)) throw new Error('Terminal mission cannot request approval')
  if (!packetHash || !planHash) throw new Error('Approval request requires packetHash and planHash')
  if (!RISKS.has(risk)) throw new Error('Approval request has invalid risk')
  if (!scopeValid(requestedScope)) throw new Error('Approval request has malformed scope')
  const existing = currentRequest(missionId)
  if (existing?.status === 'pending' && existing.packetHash === packetHash && existing.planHash === planHash) return { ...existing, idempotent: true, pushAllowed: false }
  if (mission.state !== 'PLANNED') throw new Error('Approval request requires PLANNED state')
  const persistedPlanScope = planScope || mission.planScope
  if (!scopeValid(persistedPlanScope) || !scopeCovers(persistedPlanScope, requestedScope)) throw new Error('Approval request scope exceeds persisted plan scope')
  const dir = approvalDir(missionId); mkdirSync(dir, { recursive: true })
  if (existing?.status === 'pending') writeFileSync(join(dir, 'current-request.json'), JSON.stringify({ ...existing, status: 'superseded', supersededAt: new Date().toISOString() }, null, 2))
  const request = { schemaVersion: 1, missionId, requestVersion: latestVersion(dir, 'request') + 1, packetHash, planHash, risk, requestedScope, executionRequested: Boolean(executionRequested), commitRequested: Boolean(commitRequested), reason: reason || null, requestedAt: new Date().toISOString(), status: 'pending' }
  writeFileSync(versionedPath(dir, 'request', request.requestVersion), JSON.stringify(request, null, 2))
  writeFileSync(join(dir, 'current-request.json'), JSON.stringify(request, null, 2))
  mission.planScope = persistedPlanScope
  mission.approval = { required: true, status: 'pending', requestVersion: request.requestVersion }
  mission.checkpoints.approval = 'pending'
  setState(mission, 'AWAITING_APPROVAL', 'operator', 'APPROVAL_REQUESTED', request.reason)
  return { ...request, pushAllowed: false }
}

export function loadMissionApproval(missionId) {
  const path = join(approvalDir(missionId), 'current-approval.json')
  if (!existsSync(path)) return { found: false, approval: null, request: currentRequest(missionId), pushAllowed: false }
  try { return { found: true, approval: readJson(path), request: currentRequest(missionId), pushAllowed: false } }
  catch (error) { return { found: false, approval: null, malformed: true, code: 'HERMES_APPROVAL_MALFORMED', reason: error.message, pushAllowed: false } }
}

export function isApprovalStale({ approval, currentPacketHash, currentPlanHash, currentScope, currentCommitRequested, currentRisk, request }) {
  if (!approval || !validTimestamp(approval.approvedAt)) return { stale: true, code: 'HERMES_APPROVAL_STALE', reason: 'Approval is malformed.' }
  if (request?.status === 'superseded' || approval.requestStatus === 'superseded' || request?.requestVersion !== approval.requestVersion) return { stale: true, code: 'HERMES_APPROVAL_STALE', reason: 'Approval request was superseded.' }
  if (approval.packetHash !== currentPacketHash) return { stale: true, code: 'HERMES_APPROVAL_PACKET_HASH_MISMATCH', reason: 'Approval packet hash does not match current packet.' }
  if (approval.planHash !== currentPlanHash) return { stale: true, code: 'HERMES_APPROVAL_PLAN_HASH_MISMATCH', reason: 'Approval plan hash does not match current plan.' }
  if (currentScope && !scopeCovers(approval.approvedScope, currentScope)) return { stale: true, code: 'HERMES_APPROVAL_SCOPE_EXCEEDED', reason: 'Current scope exceeds approved scope.' }
  if (currentCommitRequested && !approval.commitApproved) return { stale: true, code: 'HERMES_APPROVAL_COMMIT_NOT_GRANTED', reason: 'Commit intent was added after approval.' }
  if (currentRisk && RISKS.has(currentRisk) && RISKS.has(approval.risk) && ['LOW', 'MEDIUM', 'HIGH'].indexOf(currentRisk) > ['LOW', 'MEDIUM', 'HIGH'].indexOf(approval.risk)) return { stale: true, code: 'HERMES_APPROVAL_STALE', reason: 'Risk increased after approval.' }
  return { stale: false, code: 'HERMES_APPROVAL_VALID', reason: null }
}

export function validateMissionApproval({ missionId, packetHash, planHash, requiredScope, requireExecution = false, requireCommit = false, currentRisk }) {
  const loaded = loadMissionApproval(missionId)
  if (loaded.malformed) return { valid: false, code: loaded.code, reason: loaded.reason, approval: null, pushAllowed: false }
  if (!loaded.found) return { valid: false, code: 'HERMES_APPROVAL_NOT_FOUND', reason: 'No approval record exists.', approval: null, pushAllowed: false }
  const approval = loaded.approval
  if (!approval || approval.schemaVersion !== 1 || !validId(approval.missionId) || !approval.packetHash || !approval.planHash || !scopeValid(approval.approvedScope) || !validTimestamp(approval.approvedAt)) return { valid: false, code: 'HERMES_APPROVAL_MALFORMED', reason: 'Approval record is malformed.', approval: null, pushAllowed: false }
  if (approval.status !== 'approved') return { valid: false, code: 'HERMES_APPROVAL_NOT_APPROVED', reason: 'Approval is not approved.', approval, pushAllowed: false }
  if (approval.missionId !== missionId) return { valid: false, code: 'HERMES_APPROVAL_MISSION_MISMATCH', reason: 'Approval mission does not match.', approval, pushAllowed: false }
  const stale = isApprovalStale({ approval, currentPacketHash: packetHash, currentPlanHash: planHash, currentScope: requiredScope, currentCommitRequested: requireCommit, currentRisk, request: loaded.request })
  if (stale.stale) return { valid: false, code: stale.code, reason: stale.reason, approval, pushAllowed: false }
  if (requireExecution && !approval.executionApproved) return { valid: false, code: 'HERMES_APPROVAL_EXECUTION_NOT_GRANTED', reason: 'Execution permission is not granted.', approval, pushAllowed: false }
  if (requireCommit && !approval.commitApproved) return { valid: false, code: 'HERMES_APPROVAL_COMMIT_NOT_GRANTED', reason: 'Commit permission is not granted.', approval, pushAllowed: false }
  return { valid: true, code: 'HERMES_APPROVAL_VALID', reason: null, approval, pushAllowed: false }
}

export function recordMissionApproval({ missionId, approvedScope, executionApproved, commitApproved, approvedBy, note }) {
  const mission = loadV2(missionId)
  if (TERMINAL_STATES.includes(mission.state)) throw new Error('Terminal mission cannot be approved')
  if (mission.state !== 'AWAITING_APPROVAL') throw new Error('Mission is not awaiting approval')
  const request = currentRequest(missionId)
  if (!request || request.status !== 'pending') throw new Error('No pending approval request exists')
  if (!scopeValid(approvedScope) || !scopeCovers(request.requestedScope, approvedScope)) throw new Error('Approved scope exceeds requested scope')
  if (commitApproved && !request.commitRequested) throw new Error('Commit approval was not requested')
  if (!approvedBy || !validTimestamp(request.requestedAt)) throw new Error('Approval is malformed')
  const dir = approvalDir(missionId)
  const approval = { schemaVersion: 1, missionId, approvalVersion: latestVersion(dir, 'approval') + 1, requestVersion: request.requestVersion, packetHash: request.packetHash, planHash: request.planHash, risk: request.risk, approvedScope, executionApproved: Boolean(executionApproved), commitApproved: Boolean(commitApproved), approvedBy, approvedAt: new Date().toISOString(), note: note || null, status: 'approved' }
  writeFileSync(versionedPath(dir, 'approval', approval.approvalVersion), JSON.stringify(approval, null, 2))
  writeFileSync(join(dir, 'current-approval.json'), JSON.stringify(approval, null, 2))
  writeFileSync(join(dir, 'current-request.json'), JSON.stringify({ ...request, status: 'approved', approvedAt: approval.approvedAt }, null, 2))
  mission.approval = { required: true, status: 'approved', requestVersion: request.requestVersion, approvalVersion: approval.approvalVersion }
  mission.checkpoints.approval = 'complete'
  appendMissionEventV2(missionId, { eventId: `EVT-${Date.now()}-APPROVAL_RECORDED`, missionId, timestamp: approval.approvedAt, actor: approvedBy, type: 'APPROVAL_RECORDED' })
  saveMissionStateV2(missionId, mission)
  const validation = validateMissionApproval({ missionId, packetHash: request.packetHash, planHash: request.planHash, requiredScope: request.requestedScope, requireExecution: true })
  if (validation.valid) setState(mission, 'QUEUED', approvedBy, 'MISSION_QUEUED', 'Approval granted')
  return { ...approval, queued: validation.valid, pushAllowed: false }
}

export function releaseMissionOwnedLocks(missionId) {
  try {
    const locks = readState('locks.json')
    if (!Array.isArray(locks.locks)) return { released: [], preserved: [], code: 'HERMES_LOCK_STORE_MALFORMED', pushAllowed: false }
    const released = []; const preserved = []
    for (const lock of locks.locks) {
      if (!lock || typeof lock !== 'object' || !lock.lock_id || typeof lock.owner !== 'string') return { released: [], preserved: [], code: 'HERMES_LOCK_STORE_MALFORMED', pushAllowed: false }
      if (lock.owner === missionId) released.push(lock.lock_id); else preserved.push(lock.lock_id)
    }
    if (released.length) atomicWrite('locks.json', { ...locks, locks: locks.locks.filter(lock => lock.owner !== missionId) })
    return { released, preserved, code: 'HERMES_LOCK_RELEASED', pushAllowed: false }
  } catch (error) { return { released: [], preserved: [], code: 'HERMES_LOCK_STORE_MALFORMED', reason: error.message, pushAllowed: false } }
}

export function canCancelMission(mission) {
  return TERMINAL_STATES.includes(mission?.state) ? fail('HERMES_CANCEL_TERMINAL', 'Terminal missions cannot be cancelled.') : ok({ code: 'HERMES_CANCEL_ALLOWED' })
}

export function cancelMission({ missionId, actor = 'operator', reason = null, workerActive = false, missionChangesMayRemain = true }) {
  const mission = loadV2(missionId)
  const eligibility = canCancelMission(mission)
  if (!eligibility.eligible) throw new Error(eligibility.reason)
  const locks = releaseMissionOwnedLocks(missionId)
  if (locks.code === 'HERMES_LOCK_STORE_MALFORMED') throw new Error('Mission-owned lock store is malformed; cancellation did not proceed')
  mission.cancelledAt = new Date().toISOString(); mission.cancelledBy = actor; mission.cancelReason = reason || null
  setState(mission, 'CANCELLED', actor, 'CANCELLED', reason)
  return { missionId, state: 'CANCELLED', workerWasActive: Boolean(workerActive), missionChangesMayRemain: Boolean(missionChangesMayRemain), releasedLocks: locks.released, preservedLocks: locks.preserved, preservedEvidence: true, nextAction: workerActive ? 'Worker cancellation unsupported; future lifecycle stages stopped.' : 'Inspect working tree manually', pushAllowed: false }
}

function contradiction(evidence) {
  if (evidence.reviewAccepted && !evidence.validationComplete) return 'HERMES_RESUME_CONTRADICTION_REVIEW_WITHOUT_VALIDATION'
  if (evidence.commitComplete && !evidence.syncComplete) return 'HERMES_RESUME_CONTRADICTION_COMMIT_WITHOUT_SYNC'
  if (evidence.validationStarted && !evidence.workerResultExists) return 'HERMES_RESUME_CONTRADICTION_VALIDATION_WITHOUT_WORKER'
  return null
}
export function planMissionResume({ missionState, approval, evidence = {}, blockerResolution = null }) {
  const base = { resumable: false, nextState: 'BLOCKED', nextCheckpoint: null, createNewAttempt: false, requiredEvidence: [], pushAllowed: false }
  if (!missionState || !V2_STATES.includes(missionState.state)) return { ...base, code: 'HERMES_RESUME_MALFORMED', reason: 'Mission state is malformed.' }
  if (TERMINAL_STATES.includes(missionState.state)) return { ...base, code: 'HERMES_RESUME_TERMINAL', reason: 'Terminal mission cannot resume.' }
  const contradictionCode = contradiction(evidence)
  if (contradictionCode) return { ...base, code: contradictionCode, reason: 'Evidence is contradictory.' }
  const allow = (nextState, nextCheckpoint, reason, createNewAttempt = false) => ({ ...base, resumable: true, nextState, nextCheckpoint, createNewAttempt, code: 'HERMES_RESUME_READY', reason })
  switch (missionState.state) {
    case 'INTAKE': return evidence.packetValid && evidence.planValid ? allow(evidence.approvalRequired ? 'AWAITING_APPROVAL' : 'QUEUED', evidence.approvalRequired ? 'approval' : 'queue', 'Packet and plan are available.') : allow('INTAKE', 'intake', 'Intake evidence is incomplete.')
    case 'NEEDS_CLARIFICATION': return evidence.clarificationRecorded ? allow('PLANNED', 'plan', 'Clarification is recorded.') : { ...base, code: 'HERMES_RESUME_CLARIFICATION_REQUIRED', reason: 'Persisted clarification is required.' }
    case 'PLANNED': return allow(evidence.approvalRequired ? 'AWAITING_APPROVAL' : 'QUEUED', evidence.approvalRequired ? 'approval' : 'queue', 'Planned mission is ready for its next gate.')
    case 'AWAITING_APPROVAL': return evidence.approvalValid || approval?.valid ? allow('QUEUED', 'queue', 'Valid approval exists.') : { ...base, code: 'HERMES_RESUME_APPROVAL_REQUIRED', reason: 'Valid approval is required.' }
    case 'QUEUED': return allow('QUEUED', 'dispatch', 'Mission is dispatch eligible.')
    case 'RUNNING': if (evidence.workerActive) return allow('RUNNING', 'worker', 'Worker remains active.'); if (evidence.workerResultExists) return allow('VALIDATING', 'validation', 'Worker result exists.'); return { ...base, code: 'HERMES_RESUME_WORKER_RESULT_MISSING', reason: 'Worker is inactive and no result exists.' }
    case 'VALIDATING': return evidence.validationComplete && evidence.validationPassed ? allow('REVIEWING', 'review', 'Validation is complete.') : allow('VALIDATING', 'validation', 'Only incomplete validation work may continue.')
    case 'REVIEWING': return evidence.validationComplete && evidence.validationPassed ? allow('REVIEWING', evidence.reviewComplete && evidence.closeoutValid ? 'sync' : 'review', 'Continue only incomplete review or closeout work.') : { ...base, code: 'HERMES_RESUME_VALIDATION_REQUIRED', reason: 'Validation must pass before review resumes.' }
    case 'BLOCKED': return blockerResolution && blockerResolution.blockerCode === missionState.blocker?.code && CHECKPOINTS.has(blockerResolution.resumeCheckpoint) ? allow('BLOCKED', blockerResolution.resumeCheckpoint, 'Blocker resolution is recorded.', true) : { ...base, code: 'HERMES_RESUME_BLOCKER_RESOLUTION_REQUIRED', reason: 'Matching blocker resolution is required.' }
    default: return { ...base, code: 'HERMES_RESUME_UNSUPPORTED_STATE', reason: 'State is not resumable.' }
  }
}

export function recordBlockerResolution({ missionId, blockerCode, resolvedBy, resolution, resumeCheckpoint, note }) {
  const mission = loadV2(missionId)
  if (!mission.blocker?.code) throw new Error('Current blocker does not exist')
  if (mission.blocker.code !== blockerCode) throw new Error('Blocker code does not match current blocker')
  if (!resolution || !resolvedBy || !CHECKPOINTS.has(resumeCheckpoint)) throw new Error('Blocker resolution is malformed')
  const attempt = mission.currentAttempt || 1
  const dir = join(ensureMissionDirectoryV2(missionId), 'blockers'); mkdirSync(dir, { recursive: true })
  const version = latestVersion(dir, 'resolution') + 1
  const record = { schemaVersion: 1, missionId, attempt, resolutionVersion: version, blockerCode, resolvedBy, resolution, resumeCheckpoint, note: note || null, resolvedAt: new Date().toISOString(), originalBlocker: mission.blocker }
  writeFileSync(versionedPath(dir, 'resolution', version), JSON.stringify(record, null, 2))
  appendMissionEventV2(missionId, { eventId: `EVT-${Date.now()}-BLOCKER_RESOLVED`, missionId, timestamp: record.resolvedAt, actor: resolvedBy, type: 'BLOCKER_RESOLVED' })
  return { ...record, pushAllowed: false }
}

export function canQueueMission({ missionState, packetValid, planValid, approval }) {
  if (!missionState || TERMINAL_STATES.includes(missionState.state) || missionState.state === 'CANCELLED') return fail('HERMES_QUEUE_TERMINAL', 'Mission is terminal or cancelled.')
  if (!['PLANNED', 'AWAITING_APPROVAL'].includes(missionState.state)) return fail('HERMES_QUEUE_STATE', 'Mission is not planned or awaiting approval.')
  if (!packetValid || !planValid) return fail('HERMES_QUEUE_EVIDENCE', 'Valid packet and plan are required.')
  if (missionState.approval?.required && !approval?.valid) return fail('HERMES_QUEUE_APPROVAL', 'Valid approval is required.')
  return ok({ code: 'HERMES_QUEUE_ALLOWED' })
}
export function canDispatchMission({ missionState, queueValid, approval }) {
  if (!missionState || missionState.state !== 'QUEUED') return fail('HERMES_DISPATCH_STATE', 'Mission is not queued.')
  if (!queueValid) return fail('HERMES_DISPATCH_QUEUE_EVIDENCE', 'Valid queue evidence is required.')
  if (missionState.approval?.required && !approval?.valid) return fail('HERMES_DISPATCH_APPROVAL', 'Valid approval is required.')
  if (missionState.blocker) return fail('HERMES_DISPATCH_BLOCKED', 'Mission has a blocker.')
  return ok({ code: 'HERMES_DISPATCH_ALLOWED' })
}
export function canResumeMission(input) { const plan = planMissionResume(input); return plan.resumable ? ok({ code: 'HERMES_RESUME_ALLOWED', plan }) : fail(plan.code, plan.reason, { plan }) }
export function canCommitMission({ missionState, evidence, approval }) {
  if (!evidence?.commitRequired) return fail('HERMES_COMMIT_NOT_REQUESTED', 'Commit was not requested.')
  if (missionState?.approval?.required && !approval?.valid) return fail('HERMES_COMMIT_APPROVAL', 'Valid approval is required.')
  if (!(evidence.validationComplete && evidence.validationPassed && evidence.reviewAccepted && evidence.closeoutValid && evidence.syncComplete)) return fail('HERMES_COMMIT_GATES', 'Validation, review, closeout, and sync must pass.')
  if (missionState?.state === 'CANCELLED') return fail('HERMES_COMMIT_CANCELLED', 'Cancelled missions cannot commit.')
  return ok({ code: 'HERMES_COMMIT_ALLOWED' })
}
