import { randomUUID } from 'node:crypto'
import { spawnSync } from 'node:child_process'
import { existsSync, statSync } from 'node:fs'

const idOk = value => typeof value === 'string' && /^[A-Za-z0-9._-]+$/.test(value)
const attemptOk = value => Number.isInteger(value) && value > 0
const now = () => new Date().toISOString()
const base = (missionId, attempt, extra = {}) => ({ missionId, attempt, warnings: [], pushAllowed: false, pushPerformed: false, ...extra })
const failure = (missionId, attempt, code, reason, details = {}) => ({ ok: false, code, reason, details, ...base(missionId, attempt) })
const valid = (missionId, attempt, code, extra = {}) => ({ ok: true, code, ...base(missionId, attempt, extra) })
function inputs(missionId, attempt, required = []) { if (!idOk(missionId) || !attemptOk(attempt)) return 'Invalid missionId or attempt.'; return required.some(value => !value) ? 'Required input is missing.' : null }
function safeEnv(env = {}) { return Object.fromEntries(Object.entries(env).filter(([key]) => !/(token|secret|password|api[_-]?key)/i.test(key))) }

export function prepareWorkerInvocationV2({ missionId, attempt, worker, request, cwd, env = {}, adapterOptions = {} }) {
  const error = inputs(missionId, attempt, [worker, request, cwd])
  if (error || worker !== 'codex') return failure(missionId, attempt, 'HERMES_V2_WORKER_PREPARE_FAILED', error || 'Unsupported worker.')
  const preparedAt = now()
  return valid(missionId, attempt, 'HERMES_V2_WORKER_PREPARED', { worker, adapter: 'codex', invocationId: adapterOptions.invocationId || `INV-${randomUUID()}`, command: adapterOptions.command || 'codex', args: Array.isArray(adapterOptions.args) ? adapterOptions.args : [], cwd, requestPath: adapterOptions.requestPath || null, preparedAt, safeEnvironment: safeEnv(env), request })
}

export function startWorkerInvocationV2({ preparedInvocation, onStarted = null, spawn = spawnSync }) {
  const prepared = preparedInvocation
  if (!prepared?.ok || !idOk(prepared.missionId) || !attemptOk(prepared.attempt) || !prepared.invocationId) return failure(prepared?.missionId, prepared?.attempt, 'HERMES_V2_WORKER_START_FAILED', 'Prepared invocation is invalid.')
  const startedAt = now()
  try {
    const result = spawn(prepared.command, prepared.args, { cwd: prepared.cwd, env: { ...process.env, ...prepared.safeEnvironment }, windowsHide: true, encoding: 'utf8', input: typeof prepared.request === 'string' ? prepared.request : undefined })
    if (result?.error || result?.status === null && !result?.pid) return failure(prepared.missionId, prepared.attempt, 'HERMES_V2_WORKER_START_FAILED', result?.error?.message || 'Process spawn failed.', { started: false, invocationId: prepared.invocationId })
    const evidence = valid(prepared.missionId, prepared.attempt, 'HERMES_V2_WORKER_STARTED', { worker: prepared.worker, invocationId: prepared.invocationId, started: true, startedAt, pid: result?.pid || null, processHandleAvailable: false, processResult: result })
    if (typeof onStarted === 'function') onStarted(evidence)
    return evidence
  } catch (error) { return failure(prepared.missionId, prepared.attempt, 'HERMES_V2_WORKER_START_FAILED', error.message, { started: false, invocationId: prepared.invocationId }) }
}

export function waitForWorkerResultV2({ preparedInvocation, startEvidence }) {
  const prepared = preparedInvocation; const start = startEvidence
  if (!start?.ok || !start.started || start.invocationId !== prepared?.invocationId) return failure(prepared?.missionId, prepared?.attempt, 'HERMES_V2_WORKER_RESULT_FAILED', 'Confirmed start evidence is required.')
  const result = start.processResult || {}; const endedAt = now(); const timedOut = result.signal === 'SIGTERM' && result.status === null
  const status = timedOut ? 'TIMED_OUT' : result.status === 0 ? 'FINISHED' : 'FAILED'
  return valid(prepared.missionId, prepared.attempt, timedOut ? 'HERMES_V2_WORKER_TIMEOUT' : 'HERMES_V2_WORKER_FINISHED', { worker: prepared.worker, invocationId: prepared.invocationId, started: true, finished: true, startedAt: start.startedAt, endedAt, exitCode: result.status ?? null, signal: result.signal || null, result: status, stdout: result.stdout || '', stderr: result.stderr || '', stdoutPath: null, stderrPath: null, claimedFiles: [], closeoutPath: null })
}

export function prepareDispatchV2({ missionId, attempt, state, worker, packetHash, planHash, expectedPacketHash = packetHash, expectedPlanHash = planHash, lockRequest = {}, mode }) {
  const error = inputs(missionId, attempt, [worker, packetHash, planHash])
  if (error) return failure(missionId, attempt, 'HERMES_V2_DISPATCH_INELIGIBLE', error)
  if (mode !== 'v2-checkpoint') return failure(missionId, attempt, 'HERMES_V2_DISPATCH_MODE_MISMATCH', 'Adapter mode must be v2-checkpoint.')
  if (state !== 'QUEUED') return failure(missionId, attempt, 'HERMES_V2_DISPATCH_INELIGIBLE', 'State must be QUEUED.')
  if (packetHash !== expectedPacketHash) return failure(missionId, attempt, 'HERMES_V2_DISPATCH_INELIGIBLE', 'Packet hash does not match expected packet hash.')
  if (planHash !== expectedPlanHash) return failure(missionId, attempt, 'HERMES_V2_DISPATCH_INELIGIBLE', 'Plan hash does not match expected plan hash.')
  return valid(missionId, attempt, 'HERMES_V2_DISPATCH_PREPARED', { mode, eligible: true, worker, preparedAt: now(), packetHash, planHash, lockRequest })
}

export function dispatchWorkerV2({ preparedDispatch, preparedInvocation, acquireLock = () => ({ acquired: true, lockIds: [] }), releaseLock = () => {}, start = startWorkerInvocationV2 }) {
  if (!preparedDispatch?.ok || !preparedInvocation?.ok || preparedDispatch.missionId !== preparedInvocation.missionId || preparedDispatch.attempt !== preparedInvocation.attempt) return failure(preparedDispatch?.missionId, preparedDispatch?.attempt, 'HERMES_V2_DISPATCH_INELIGIBLE', 'Prepared dispatch and invocation do not match.')
  let lock
  try { lock = acquireLock(preparedDispatch.lockRequest) } catch (error) { return failure(preparedDispatch.missionId, preparedDispatch.attempt, 'HERMES_V2_DISPATCH_LOCK_FAILED', error.message) }
  if (!lock?.acquired) return failure(preparedDispatch.missionId, preparedDispatch.attempt, 'HERMES_V2_DISPATCH_LOCK_FAILED', lock?.reason || 'Lock acquisition failed.')
  const started = start({ preparedInvocation })
  if (!started.ok || !started.started) { releaseLock(lock); return failure(preparedDispatch.missionId, preparedDispatch.attempt, 'HERMES_V2_WORKER_START_FAILED', started.reason || 'Worker did not start.', { lockEvidence: lock }) }
  return valid(preparedDispatch.missionId, preparedDispatch.attempt, 'HERMES_V2_DISPATCH_STARTED', { mode: 'v2-checkpoint', eligible: true, dispatched: true, worker: preparedDispatch.worker, invocationId: started.invocationId, preparedAt: preparedDispatch.preparedAt, startedAt: started.startedAt, lockEvidence: lock, startEvidence: started })
}

export function mapLegacyReviewVerdictToV2({ verdict, warnings = [], requiredActions = [], reasons = [], validationPassed = false, closeoutValid = false }) {
  if (typeof verdict !== 'string') return { ok: false, code: 'HERMES_V2_REVIEW_MALFORMED', reason: 'Review verdict is malformed.', warnings, requiredActions, reasons, pushAllowed: false }
  const normalized = verdict.trim().toUpperCase(); let mapped = 'HUMAN_REQUIRED'; let ambiguous = false
  if (normalized === 'AUTO_ACCEPT') mapped = 'ACCEPTED'
  else if (normalized === 'ACCEPT_WITH_WARNINGS') mapped = warnings.length === 0 && requiredActions.length === 0 && validationPassed && closeoutValid ? 'ACCEPTED' : 'HUMAN_REQUIRED'
  else if (normalized === 'NEEDS_REWORK') mapped = 'REJECTED'
  else if (!['HOLD_FOR_EVIDENCE', 'HUMAN_REQUIRED'].includes(normalized)) ambiguous = true
  return { ok: true, code: ambiguous ? 'HERMES_V2_REVIEW_AMBIGUOUS' : 'HERMES_V2_REVIEW_MAPPED', rawVerdict: normalized, verdict: mapped, reasons, requiredActions, warnings, ambiguous, pushAllowed: false }
}

export function runReviewV2({ missionId, attempt, validationEvidence, closeoutEvidence, reviewerInput = {}, reviewer }) {
  const error = inputs(missionId, attempt, [validationEvidence, closeoutEvidence, reviewer])
  if (error) return failure(missionId, attempt, 'HERMES_V2_REVIEW_MALFORMED', error)
  try { const raw = reviewer(reviewerInput); const mapped = mapLegacyReviewVerdictToV2({ verdict: raw?.verdict, warnings: raw?.warnings || [], requiredActions: raw?.requiredActions || [], reasons: raw?.reasons || [], validationPassed: validationEvidence.passed === true, closeoutValid: closeoutEvidence.valid === true }); return { ...mapped, schemaVersion: 1, missionId, attempt, reviewedAt: now() } } catch (error) { return failure(missionId, attempt, 'HERMES_V2_REVIEW_MALFORMED', error.message) }
}

export function runSyncV2({ missionId, attempt, inputs: syncInputs, syncOperation }) {
  const error = inputs(missionId, attempt, [syncInputs, syncOperation]); const startedAt = now()
  if (error) return failure(missionId, attempt, 'HERMES_V2_SYNC_FAILED', error)
  try { const result = syncOperation(syncInputs); if (!result?.success) return { ...failure(missionId, attempt, 'HERMES_V2_SYNC_FAILED', result?.reason || 'Sync failed.'), schemaVersion: 1, retryable: result?.retryable !== false, startedAt, endedAt: now() }; return valid(missionId, attempt, 'HERMES_V2_SYNC_OK', { schemaVersion: 1, startedAt, endedAt: now(), success: true, artifacts: result.artifacts || [], warnings: result.warnings || [], errors: [], pushPerformed: false }) } catch (error) { return { ...failure(missionId, attempt, 'HERMES_V2_SYNC_FAILED', error.message), schemaVersion: 1, retryable: true, startedAt, endedAt: now() } }
}

export function runValidationCheckV2({ missionId, attempt, checkId, name, command, cwd, env = {}, timeoutMs, execute = spawnSync }) {
  const error = inputs(missionId, attempt, [checkId, name, command, cwd]); const startedAt = now()
  if (error) return failure(missionId, attempt, 'HERMES_V2_VALIDATION_EXECUTION_FAILED', error)
  try { const result = execute(command, [], { cwd, env: { ...process.env, ...safeEnv(env) }, timeout: timeoutMs, encoding: 'utf8', shell: true }); const timedOut = result?.error?.code === 'ETIMEDOUT'; const executionError = Boolean(result?.error) && !timedOut; const status = timedOut ? 'TIMED_OUT' : executionError ? 'EXECUTION_ERROR' : result?.status === 0 ? 'PASS' : 'FAIL'; return valid(missionId, attempt, timedOut ? 'HERMES_V2_VALIDATION_TIMEOUT' : executionError ? 'HERMES_V2_VALIDATION_EXECUTION_FAILED' : 'HERMES_V2_VALIDATION_CHECK_COMPLETE', { schemaVersion: 1, checkId, name, command, cwd, startedAt, endedAt: now(), exitCode: result?.status ?? null, result: status, stdout: result?.stdout || '', stderr: result?.stderr || '', failureReason: status === 'PASS' ? null : result?.error?.message || `Exit code ${result?.status}` }) } catch (error) { return { ...failure(missionId, attempt, 'HERMES_V2_VALIDATION_EXECUTION_FAILED', error.message), result: 'EXECUTION_ERROR', startedAt, endedAt: now() } }
}

export function runValidationSuiteV2({ missionId, attempt, checks }) { if (!Array.isArray(checks)) return failure(missionId, attempt, 'HERMES_V2_VALIDATION_EXECUTION_FAILED', 'Checks must be an array.'); const results = checks.map(runValidationCheckV2); const failedCheckIds = results.filter(check => !check.ok || check.result !== 'PASS').map(check => check.checkId); return valid(missionId, attempt, 'HERMES_V2_VALIDATION_SUITE_COMPLETE', { schemaVersion: 1, result: failedCheckIds.length ? 'FAIL' : 'PASS', checks: results, failedCheckIds, pushDetected: false }) }

export function validateCloseoutV2({ missionId, attempt, closeout, observedFiles = [], validator }) {
  const error = inputs(missionId, attempt, [closeout, validator]); if (error) return failure(missionId, attempt, 'HERMES_V2_CLOSEOUT_INVALID', error)
  try { const result = validator(closeout, { observedFiles }); if (result?.missionId && result.missionId !== missionId) return failure(missionId, attempt, 'HERMES_V2_CLOSEOUT_MISSION_MISMATCH', 'Closeout mission does not match.'); if (result?.attempt && result.attempt !== attempt) return failure(missionId, attempt, 'HERMES_V2_CLOSEOUT_ATTEMPT_MISMATCH', 'Closeout attempt does not match.'); const claimedFiles = result?.claimedFiles || []; const validFiles = JSON.stringify([...claimedFiles].sort()) === JSON.stringify([...observedFiles].sort()); if (!result?.valid || !validFiles) return { ...failure(missionId, attempt, 'HERMES_V2_CLOSEOUT_INVALID', 'Closeout validation failed.'), schemaVersion: 1, valid: false, errors: [...(result?.errors || []), ...(validFiles ? [] : ['Claimed files do not match observed files.'])], warnings: result?.warnings || [], claimedFiles, observedFiles }; return valid(missionId, attempt, 'HERMES_V2_CLOSEOUT_VALID', { schemaVersion: 1, validatorVersion: 3, valid: true, errors: [], warnings: result.warnings || [], claimedFiles, observedFiles }) } catch (error) { return failure(missionId, attempt, 'HERMES_V2_CLOSEOUT_INVALID', error.message) }
}

function normalizeAllowedFiles(files) {
  if (!Array.isArray(files) || !files.length) return null
  const normalized = files.map(file => typeof file === 'string' ? file.replaceAll('\\', '/').replace(/^\.\//, '') : '')
  if (normalized.some(file => !file || file.startsWith('/') || /^[A-Za-z]:\//.test(file) || file.includes('..') || file.includes('*')) || new Set(normalized).size !== normalized.length) return null
  return normalized
}
function gitResult(git, cwd, args) { return git(args, { cwd, encoding: 'utf8', windowsHide: true }) }
export function commitMissionFilesV2({ missionId, attempt, allowedFiles, commitMessage, cwd, git = (args, options) => spawnSync('git', args, options) }) {
  const files = normalizeAllowedFiles(allowedFiles)
  const error = inputs(missionId, attempt, [commitMessage, cwd, files])
  const common = { schemaVersion: 1, eligible: false, committed: false, stagedFiles: [], unexpectedFiles: [], warnings: [], pushAllowed: false, pushPerformed: false }
  if (error || !existsSync(cwd) || !statSync(cwd).isDirectory()) return { ...failure(missionId, attempt, 'HERMES_V2_COMMIT_INELIGIBLE', error || 'Repository cwd is invalid.'), ...common }
  try {
    const existing = gitResult(git, cwd, ['diff', '--cached', '--name-only'])
    if (existing.status !== 0) return { ...failure(missionId, attempt, 'HERMES_V2_COMMIT_INELIGIBLE', (existing.stderr || existing.stdout || 'Cannot inspect staged files').trim()), ...common }
    const preStaged = (existing.stdout || '').split(/\r?\n/).filter(Boolean)
    const unexpected = preStaged.filter(file => !files.includes(file.replaceAll('\\', '/')))
    if (unexpected.length) return { ...failure(missionId, attempt, 'HERMES_V2_COMMIT_INELIGIBLE', 'Unexpected staged files are present.'), ...common, stagedFiles: preStaged, unexpectedFiles: unexpected }
    for (const file of files) { const add = gitResult(git, cwd, ['add', '--', file]); if (add.status !== 0) return { ...failure(missionId, attempt, 'HERMES_V2_COMMIT_FAILED', (add.stderr || add.stdout || 'Selective staging failed').trim()), ...common, eligible: true, stagedFiles: preStaged } }
    const stagedResult = gitResult(git, cwd, ['diff', '--cached', '--name-only'])
    const stagedFiles = (stagedResult.stdout || '').split(/\r?\n/).filter(Boolean)
    const stagedUnexpected = stagedFiles.filter(file => !files.includes(file.replaceAll('\\', '/')))
    if (stagedResult.status !== 0 || stagedUnexpected.length) return { ...failure(missionId, attempt, 'HERMES_V2_COMMIT_INELIGIBLE', stagedUnexpected.length ? 'Unexpected staged files are present.' : 'Cannot inspect staged files.'), ...common, stagedFiles, unexpectedFiles: stagedUnexpected }
    const commit = gitResult(git, cwd, ['commit', '-m', commitMessage])
    if (commit.status !== 0) return { ...failure(missionId, attempt, 'HERMES_V2_COMMIT_FAILED', (commit.stderr || commit.stdout || 'Commit failed').trim()), ...common, eligible: true, stagedFiles }
    const head = gitResult(git, cwd, ['rev-parse', 'HEAD'])
    if (head.status !== 0) return { ...failure(missionId, attempt, 'HERMES_V2_COMMIT_FAILED', 'Commit hash could not be read.'), ...common, eligible: true, stagedFiles }
    return valid(missionId, attempt, 'HERMES_V2_COMMIT_OK', { schemaVersion: 1, eligible: true, committed: true, commitHash: head.stdout.trim(), stagedFiles, unexpectedFiles: [], warnings: [], pushAllowed: false, pushPerformed: false })
  } catch (error) { return { ...failure(missionId, attempt, 'HERMES_V2_COMMIT_FAILED', error.message), ...common, eligible: true } }
}
