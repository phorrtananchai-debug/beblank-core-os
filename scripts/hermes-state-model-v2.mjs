import { createHash, randomBytes } from 'node:crypto'
import { appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

export const V2_STATES = Object.freeze(['INTAKE', 'NEEDS_CLARIFICATION', 'PLANNED', 'AWAITING_APPROVAL', 'QUEUED', 'RUNNING', 'VALIDATING', 'REVIEWING', 'COMPLETED', 'BLOCKED', 'FAILED', 'CANCELLED'])
export const TERMINAL_STATES = Object.freeze(['COMPLETED', 'FAILED', 'CANCELLED'])
export const LEGACY_STATE_MAP = Object.freeze({ PENDING: 'QUEUED', RUNNING: 'RUNNING', WAITING_REVIEW: 'REVIEWING', WAITING_APPROVAL: 'AWAITING_APPROVAL', BLOCKED: 'BLOCKED', NEEDS_REWORK: 'BLOCKED', COMPLETED: 'COMPLETED', FAILED: 'FAILED', PAUSED: 'BLOCKED', ARCHIVED: 'BLOCKED' })
const NEXT = Object.freeze({ INTAKE: ['NEEDS_CLARIFICATION', 'PLANNED'], NEEDS_CLARIFICATION: ['PLANNED'], PLANNED: ['AWAITING_APPROVAL', 'QUEUED'], AWAITING_APPROVAL: ['QUEUED'], QUEUED: ['RUNNING'], RUNNING: ['VALIDATING'], VALIDATING: ['REVIEWING'], REVIEWING: ['COMPLETED'], BLOCKED: [], FAILED: [], CANCELLED: [], COMPLETED: [] })

export const hash = value => createHash('sha256').update(typeof value === 'string' ? value : JSON.stringify(value)).digest('hex')
export const missionRoot = (runtimeRoot, missionId) => join(runtimeRoot, 'state', 'missions', missionId)
export const isTerminal = state => TERMINAL_STATES.includes(state)
export function createMissionState({ missionId, risk = 'LOW', approvalRequired = false, now = new Date().toISOString() }) {
  return { schemaVersion: 2, missionId, state: 'INTAKE', stage: 'intake', risk, currentAttempt: 1, approval: { required: approvalRequired, status: approvalRequired ? 'pending' : 'not-required' }, checkpoints: { intake: 'complete', packet: 'pending', plan: 'pending', approval: approvalRequired ? 'pending' : 'not-required', worker: 'pending', validation: 'pending', review: 'pending', closeout: 'pending', sync: 'pending', commit: 'pending' }, blocker: null, nextAction: 'record packet', createdAt: now, updatedAt: now, lastEventId: null, legacy: null }
}
export function migrateMissionStateV1ToV2(legacy, now = new Date().toISOString()) {
  const mapped = LEGACY_STATE_MAP[legacy.state] || 'BLOCKED'
  const warning = legacy.state === 'ARCHIVED' || !LEGACY_STATE_MAP[legacy.state] ? `Ambiguous legacy state: ${legacy.state || 'missing'}` : null
  const result = createMissionState({ missionId: legacy.mission_id, risk: legacy.risk || 'LOW', approvalRequired: legacy.state === 'WAITING_APPROVAL', now })
  result.state = warning ? 'BLOCKED' : mapped
  result.stage = result.state.toLowerCase()
  result.legacy = { originalState: legacy.state || null, warning, original: legacy }
  result.blocker = warning
  result.nextAction = warning ? 'operator review required' : null
  return { state: result, warning }
}
export function canTransition(mission, target, evidence = {}) {
  if (!V2_STATES.includes(target) || !V2_STATES.includes(mission.state)) return { ok: false, reason: 'unknown state' }
  if (isTerminal(mission.state)) return { ok: false, reason: 'terminal mission' }
  if (['BLOCKED', 'FAILED', 'CANCELLED'].includes(target)) return { ok: true }
  if (mission.state === 'BLOCKED') return { ok: evidence.blockerResolution === true }
  if (!NEXT[mission.state].includes(target)) return { ok: false, reason: `${mission.state} -> ${target} is invalid` }
  if (target === 'QUEUED' && mission.approval.required && mission.approval.status !== 'approved') return { ok: false, reason: 'approval required' }
  if (target === 'VALIDATING' && mission.checkpoints.worker !== 'complete') return { ok: false, reason: 'worker evidence required' }
  if (target === 'REVIEWING' && mission.checkpoints.validation !== 'complete') return { ok: false, reason: 'validation evidence required' }
  if (target === 'COMPLETED' && !(mission.checkpoints.review === 'accepted' && mission.checkpoints.closeout === 'complete' && mission.checkpoints.sync === 'complete')) return { ok: false, reason: 'accepted review, closeout, and sync required' }
  return { ok: true }
}
export function getNextCheckpoint(mission) {
  const checkpoints = mission.checkpoints
  if (mission.state === 'AWAITING_APPROVAL') return mission.approval.status === 'approved' ? 'queue' : 'approval'
  if (mission.state === 'RUNNING' && checkpoints.worker === 'complete') return 'validation'
  if (mission.state === 'VALIDATING' && checkpoints.validation === 'complete') return 'review'
  if (mission.state === 'REVIEWING' && checkpoints.review === 'accepted' && checkpoints.closeout !== 'complete') return 'closeout'
  if (mission.state === 'REVIEWING' && checkpoints.closeout === 'complete' && checkpoints.sync !== 'complete') return 'sync'
  return mission.stage
}
export function appendEvent(root, mission, type, metadata = {}) {
  mkdirSync(root, { recursive: true }); const event = { eventId: `EVT-${randomBytes(4).toString('hex').toUpperCase()}`, missionId: mission.missionId, attempt: mission.currentAttempt, timestamp: new Date().toISOString(), actor: 'runner', type, previousState: metadata.previousState || null, newState: metadata.newState || mission.state, stage: mission.stage, reason: metadata.reason || null, evidence: metadata.evidence || [], metadata: metadata.metadata || {} }
  appendFileSync(join(root, 'events.jsonl'), `${JSON.stringify(event)}\n`); mission.lastEventId = event.eventId; return event
}
export function saveMissionState(root, mission) { mkdirSync(root, { recursive: true }); writeFileSync(join(root, 'mission.json'), JSON.stringify(mission, null, 2)); }
export function loadMissionStateV2(root) { const value = JSON.parse(readFileSync(join(root, 'mission.json'), 'utf8')); if (value.schemaVersion !== 2) throw new Error('mission state is not schema v2'); return value }
export function transitionMission(root, mission, target, evidence = {}) { const guard = canTransition(mission, target, evidence); if (!guard.ok) throw new Error(`Transition refused: ${guard.reason}`); const previousState = mission.state; mission.state = target; mission.stage = target.toLowerCase(); mission.updatedAt = new Date().toISOString(); appendEvent(root, mission, 'STATE_TRANSITION', { previousState, newState: target, reason: evidence.reason, evidence: evidence.paths || [] }); saveMissionState(root, mission); return mission }
export function recordApproval(root, mission, approval) { if (mission.state !== 'AWAITING_APPROVAL') throw new Error('approval requires AWAITING_APPROVAL'); if (approval.packetHash !== approval.currentPacketHash || approval.planHash !== approval.currentPlanHash) throw new Error('stale approval'); const record = { schemaVersion: 1, missionId: mission.missionId, packetHash: approval.packetHash, planHash: approval.planHash, approvedScope: approval.approvedScope || [], executionApproved: true, commitApproved: Boolean(approval.commitApproved), approvedAt: new Date().toISOString(), approvedBy: 'operator', note: approval.note || null }; const dir = join(root, 'approval'); mkdirSync(dir, { recursive: true }); writeFileSync(join(dir, 'approval.json'), JSON.stringify(record, null, 2)); mission.approval = { required: true, status: 'approved', ...record }; mission.checkpoints.approval = 'complete'; appendEvent(root, mission, 'APPROVAL_RECORDED'); saveMissionState(root, mission); return record }
export function cancelMission(root, mission, reason = null) { if (isTerminal(mission.state)) throw new Error('terminal mission cannot cancel'); return transitionMission(root, mission, 'CANCELLED', { reason: reason || 'operator cancelled' }) }
export function createAttempt(root, mission) { mission.currentAttempt += 1; const dir = join(root, 'attempts', String(mission.currentAttempt).padStart(3, '0')); for (const name of ['worker', 'validation', 'review', 'closeout', 'sync', 'commit']) mkdirSync(join(dir, name), { recursive: true }); appendEvent(root, mission, 'RESUMED', { reason: 'new attempt' }); saveMissionState(root, mission); return dir }
