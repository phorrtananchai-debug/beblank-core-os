import assert from 'node:assert/strict'
import test from 'node:test'
import {
  dispatchWorkerV2, mapLegacyReviewVerdictToV2, prepareDispatchV2, prepareWorkerInvocationV2,
  runReviewV2, runSyncV2, runValidationCheckV2, runValidationSuiteV2, startWorkerInvocationV2,
  validateCloseoutV2, waitForWorkerResultV2,
} from '../hermes-boundary-v2.mjs'
import { commitMissionFilesV2 } from '../hermes-boundary-v2.mjs'
import { mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { CLOSEOUT_V3_HEADINGS, inspectWorkerCloseout } from '../hermes-worker-codex.mjs'

const input = { missionId: 'MISSION-BOUNDARY-001', attempt: 1 }

test('worker v2 boundaries separate prepare, confirmed start, and result', () => {
  const prepared = prepareWorkerInvocationV2({ ...input, worker: 'codex', request: 'worker prompt', cwd: process.cwd(), env: { TOKEN: 'hidden', SAFE: 'yes' }, adapterOptions: { invocationId: 'INV-1', command: 'fake', args: ['x'] } })
  assert.equal(prepared.ok, true); assert.equal(prepared.started, undefined); assert.equal(prepared.safeEnvironment.TOKEN, undefined)
  let spawnOptions
  const started = startWorkerInvocationV2({ preparedInvocation: prepared, spawn: (_command, _args, options) => { spawnOptions = options; return { status: 0, pid: 123, stdout: 'worker PASS', stderr: '' } } })
  assert.equal(started.started, true); assert.equal(started.invocationId, 'INV-1')
  assert.equal(spawnOptions.input, 'worker prompt')
  const result = waitForWorkerResultV2({ preparedInvocation: prepared, startEvidence: started })
  assert.equal(result.result, 'FINISHED'); assert.equal(result.stdout, 'worker PASS'); assert.equal(result.pushAllowed, false)
  const failed = startWorkerInvocationV2({ preparedInvocation: prepared, spawn: () => ({ error: new Error('no spawn') }) })
  assert.equal(failed.ok, false); assert.equal(failed.details.started, false)
})

test('dispatcher is v2-queued only and waits for actual worker start', () => {
  const dispatch = prepareDispatchV2({ ...input, state: 'QUEUED', worker: 'codex', packetHash: 'p', planHash: 'q', mode: 'v2-checkpoint' })
  const prepared = prepareWorkerInvocationV2({ ...input, worker: 'codex', request: {}, cwd: process.cwd(), adapterOptions: { command: 'fake' } })
  const started = dispatchWorkerV2({ preparedDispatch: dispatch, preparedInvocation: prepared, acquireLock: () => ({ acquired: true, lockIds: ['lock-1'] }), start: ({ preparedInvocation }) => ({ ok: true, started: true, invocationId: preparedInvocation.invocationId, startedAt: '2026-01-01T00:00:00.000Z' }) })
  assert.equal(started.dispatched, true); assert.deepEqual(started.lockEvidence.lockIds, ['lock-1'])
  assert.equal(prepareDispatchV2({ ...input, state: 'RUNNING', worker: 'codex', packetHash: 'p', planHash: 'q', mode: 'v2-checkpoint' }).ok, false)
  assert.equal(prepareDispatchV2({ ...input, state: 'QUEUED', worker: 'codex', packetHash: 'p', planHash: 'q', mode: 'legacy-v1' }).code, 'HERMES_V2_DISPATCH_MODE_MISMATCH')
})

test('review, sync, validation, and closeout adapters preserve evidence and no-push', () => {
  assert.equal(mapLegacyReviewVerdictToV2({ verdict: 'AUTO_ACCEPT' }).verdict, 'ACCEPTED')
  assert.equal(mapLegacyReviewVerdictToV2({ verdict: 'ACCEPT_WITH_WARNINGS', warnings: ['x'] }).verdict, 'HUMAN_REQUIRED')
  assert.equal(mapLegacyReviewVerdictToV2({ verdict: 'NEEDS_REWORK' }).verdict, 'REJECTED')
  const review = runReviewV2({ ...input, validationEvidence: { passed: true }, closeoutEvidence: { valid: true }, reviewer: () => ({ verdict: 'AUTO_ACCEPT' }) })
  assert.equal(review.verdict, 'ACCEPTED')
  assert.equal(runSyncV2({ ...input, inputs: {}, syncOperation: () => ({ success: true, artifacts: ['x'] }) }).ok, true)
  const check = runValidationCheckV2({ ...input, checkId: 'check-1', name: 'lint', command: 'npm run lint', cwd: process.cwd(), execute: () => ({ status: 0, stdout: 'ok', stderr: '' }) })
  assert.equal(check.result, 'PASS'); assert.equal(check.command, 'npm run lint')
  assert.equal(runValidationSuiteV2({ ...input, checks: [{ ...input, checkId: 'one', name: 'one', command: 'one', cwd: process.cwd(), execute: () => ({ status: 0 }) }, { ...input, checkId: 'two', name: 'two', command: 'two', cwd: process.cwd(), execute: () => ({ status: 1 }) }] }).result, 'FAIL')
  const closeout = validateCloseoutV2({ ...input, closeout: {}, observedFiles: ['a.md'], validator: () => ({ valid: true, missionId: input.missionId, attempt: 1, claimedFiles: ['a.md'] }) })
  assert.equal(closeout.valid, true); assert.equal(closeout.pushAllowed, false)
})

test('failure codes are specific and validation preserves timeout, errors, and command evidence', () => {
  const timeout = runValidationCheckV2({ ...input, checkId: 'timeout', name: 'timeout', command: 'harmless', cwd: process.cwd(), execute: () => ({ status: null, error: { code: 'ETIMEDOUT', message: 'timeout' } }) })
  const executionError = runValidationCheckV2({ ...input, checkId: 'error', name: 'error', command: 'harmless', cwd: process.cwd(), execute: () => ({ status: null, error: new Error('spawn error') }) })
  assert.equal(timeout.result, 'TIMED_OUT'); assert.equal(timeout.code, 'HERMES_V2_VALIDATION_TIMEOUT')
  assert.equal(executionError.result, 'EXECUTION_ERROR'); assert.equal(executionError.code, 'HERMES_V2_VALIDATION_EXECUTION_FAILED')
  assert.equal(validateCloseoutV2({ ...input, closeout: {}, observedFiles: ['a'], validator: () => ({ valid: false, errors: ['bad'], claimedFiles: [] }) }).ok, false)
  assert.equal(mapLegacyReviewVerdictToV2({ verdict: 'mystery' }).code, 'HERMES_V2_REVIEW_AMBIGUOUS')
})

test('byte-level mutation sentinel proves every adapter leaves lifecycle evidence unchanged', () => {
  const root = mkdtempSync(join(tmpdir(), 'hermes-boundary-sentinel-')); const files = ['legacy.json', 'mission.json', 'events.jsonl']
  for (const file of files) writeFileSync(join(root, file), `${file}-sentinel\n`)
  const before = files.map(file => readFileSync(join(root, file), 'utf8'))
  prepareWorkerInvocationV2({ ...input, worker: 'codex', request: {}, cwd: root }); prepareDispatchV2({ ...input, state: 'QUEUED', worker: 'codex', packetHash: 'p', planHash: 'q', mode: 'v2-checkpoint' })
  mapLegacyReviewVerdictToV2({ verdict: 'HOLD_FOR_EVIDENCE' }); runSyncV2({ ...input, inputs: {}, syncOperation: () => ({ success: true }) }); runValidationCheckV2({ ...input, checkId: 'x', name: 'x', command: 'x', cwd: root, execute: () => ({ status: 0 }) }); validateCloseoutV2({ ...input, closeout: {}, validator: () => ({ valid: true, claimedFiles: [], warnings: [] }) })
  assert.deepEqual(files.map(file => readFileSync(join(root, file), 'utf8')), before); rmSync(root, { recursive: true, force: true })
})

test('commit adapter selectively commits only allowed files in a disposable repository', async () => {
  const { spawnSync: spawn } = await import('node:child_process'); const root = mkdtempSync(join(tmpdir(), 'hermes-v2-commit-'))
  const git = args => spawn('git', args, { cwd: root }); git(['init']); git(['config', 'user.email', 'test@example.invalid']); git(['config', 'user.name', 'Hermes Test'])
  writeFileSync(join(root, 'allowed.md'), 'allowed\n'); writeFileSync(join(root, 'other.md'), 'other\n'); git(['add', '--', 'allowed.md', 'other.md']); git(['commit', '-m', 'base'])
  writeFileSync(join(root, 'allowed.md'), 'changed\n'); writeFileSync(join(root, 'other.md'), 'changed\n'); git(['add', '--', 'other.md'])
  const blocked = commitMissionFilesV2({ ...input, allowedFiles: ['allowed.md'], commitMessage: 'allowed', cwd: root })
  assert.equal(blocked.code, 'HERMES_V2_COMMIT_INELIGIBLE'); assert.deepEqual(blocked.unexpectedFiles, ['other.md'])
  git(['restore', '--staged', 'other.md'])
  const committed = commitMissionFilesV2({ ...input, allowedFiles: ['allowed.md'], commitMessage: 'allowed', cwd: root })
  assert.equal(committed.code, 'HERMES_V2_COMMIT_OK'); assert.equal(committed.pushPerformed, false); rmSync(root, { recursive: true, force: true })
})

test('worker prepare does not spawn or emit started evidence', () => {
  const prepared = prepareWorkerInvocationV2({ ...input, worker: 'codex', request: {}, cwd: process.cwd(), adapterOptions: { command: 'fake' } })
  assert.equal(prepared.started, undefined); assert.equal(prepared.ok, true)
})
test('worker prepare rejects invalid mission attempt and worker inputs', () => {
  assert.equal(prepareWorkerInvocationV2({ ...input, missionId: '../bad', worker: 'codex', request: {}, cwd: process.cwd() }).ok, false)
  assert.equal(prepareWorkerInvocationV2({ ...input, attempt: 0, worker: 'codex', request: {}, cwd: process.cwd() }).ok, false)
  assert.equal(prepareWorkerInvocationV2({ ...input, worker: '', request: {}, cwd: process.cwd() }).code, 'HERMES_V2_WORKER_PREPARE_FAILED')
})
test('worker result preserves signal stdout stderr exit and timeout truthfully', () => {
  const prepared = prepareWorkerInvocationV2({ ...input, worker: 'codex', request: {}, cwd: process.cwd(), adapterOptions: { invocationId: 'INV-stable', command: 'fake' } })
  const start = { ok: true, started: true, invocationId: 'INV-stable', startedAt: '2026-01-01T00:00:00.000Z', processResult: { status: 7, signal: 'SIGINT', stdout: 'SUCCESS', stderr: 'err' } }
  const result = waitForWorkerResultV2({ preparedInvocation: prepared, startEvidence: start })
  assert.equal(result.invocationId, 'INV-stable'); assert.equal(result.exitCode, 7); assert.equal(result.signal, 'SIGINT'); assert.equal(result.stdout, 'SUCCESS'); assert.equal(result.stderr, 'err'); assert.ok(result.endedAt >= result.startedAt)
  const timeout = waitForWorkerResultV2({ preparedInvocation: prepared, startEvidence: { ...start, processResult: { status: null, signal: 'SIGTERM' } } })
  assert.equal(timeout.code, 'HERMES_V2_WORKER_TIMEOUT')
})
test('dispatcher rejects invalid state mode identifiers and hash mismatches', () => {
  const base = { ...input, state: 'QUEUED', worker: 'codex', packetHash: 'p', planHash: 'q', mode: 'v2-checkpoint' }
  assert.equal(prepareDispatchV2({ ...base, state: 'RUNNING' }).ok, false); assert.equal(prepareDispatchV2({ ...base, mode: 'legacy-v1' }).code, 'HERMES_V2_DISPATCH_MODE_MISMATCH')
  assert.equal(prepareDispatchV2({ ...base, missionId: '../bad' }).ok, false); assert.equal(prepareDispatchV2({ ...base, attempt: 0 }).ok, false)
  assert.match(prepareDispatchV2({ ...base, expectedPacketHash: 'other' }).reason, /Packet hash/); assert.match(prepareDispatchV2({ ...base, expectedPlanHash: 'other' }).reason, /Plan hash/)
})
test('dispatcher lock failure prevents start and failed start releases acquired lock', () => {
  const dispatch = prepareDispatchV2({ ...input, state: 'QUEUED', worker: 'codex', packetHash: 'p', planHash: 'q', mode: 'v2-checkpoint' }); const prepared = prepareWorkerInvocationV2({ ...input, worker: 'codex', request: {}, cwd: process.cwd() })
  let started = false; assert.equal(dispatchWorkerV2({ preparedDispatch: dispatch, preparedInvocation: prepared, acquireLock: () => ({ acquired: false }), start: () => { started = true } }).code, 'HERMES_V2_DISPATCH_LOCK_FAILED'); assert.equal(started, false)
  let released = false; const failed = dispatchWorkerV2({ preparedDispatch: dispatch, preparedInvocation: prepared, acquireLock: () => ({ acquired: true, lockIds: ['l'] }), releaseLock: () => { released = true }, start: () => ({ ok: false, started: false, reason: 'spawn failed' }) })
  assert.equal(failed.ok, false); assert.equal(failed.dispatched, undefined); assert.equal(released, true)
})

test('review maps legacy verdicts conservatively', () => {
  assert.equal(mapLegacyReviewVerdictToV2({ verdict: 'AUTO_ACCEPT' }).verdict, 'ACCEPTED')
  assert.equal(mapLegacyReviewVerdictToV2({ verdict: 'ACCEPT_WITH_WARNINGS' }).verdict, 'HUMAN_REQUIRED')
  assert.equal(mapLegacyReviewVerdictToV2({ verdict: 'HOLD_FOR_EVIDENCE' }).verdict, 'HUMAN_REQUIRED')
  assert.equal(mapLegacyReviewVerdictToV2({ verdict: 'NEEDS_REWORK' }).verdict, 'REJECTED')
})

test('review ambiguity preserves evidence and never accepts malformed output', () => {
  const mapped = mapLegacyReviewVerdictToV2({ verdict: 'MYSTERY', reasons: ['r'], warnings: ['w'], requiredActions: ['a'] })
  assert.equal(mapped.code, 'HERMES_V2_REVIEW_AMBIGUOUS')
  assert.equal(mapped.verdict, 'HUMAN_REQUIRED')
  assert.deepEqual(mapped.reasons, ['r'])
  assert.deepEqual(mapped.warnings, ['w'])
  assert.deepEqual(mapped.requiredActions, ['a'])
  assert.equal(mapLegacyReviewVerdictToV2({ verdict: null }).code, 'HERMES_V2_REVIEW_MALFORMED')
})

test('sync success preserves artifacts warnings timestamps and no-push evidence', () => {
  const result = runSyncV2({ ...input, inputs: { artifact: 'input' }, syncOperation: inputs => ({ success: true, artifacts: [inputs.artifact], warnings: ['warning'], errors: [] }) })
  assert.equal(result.code, 'HERMES_V2_SYNC_OK')
  assert.deepEqual(result.artifacts, ['input'])
  assert.deepEqual(result.warnings, ['warning'])
  assert.deepEqual(result.errors, [])
  assert.ok(result.endedAt >= result.startedAt)
  assert.equal(result.pushAllowed, false)
  assert.equal(result.pushPerformed, false)
})

test('sync failure preserves retryability and normalizes thrown errors', () => {
  const failure = runSyncV2({ ...input, inputs: {}, syncOperation: () => ({ success: false, retryable: false, reason: 'remote unavailable' }) })
  assert.equal(failure.code, 'HERMES_V2_SYNC_FAILED')
  assert.equal(failure.retryable, false)
  const thrown = runSyncV2({ ...input, inputs: {}, syncOperation: () => { throw new Error('operation threw') } })
  assert.equal(thrown.code, 'HERMES_V2_SYNC_FAILED')
  assert.match(thrown.reason, /operation threw/)
  assert.equal(thrown.pushAllowed, false)
  assert.equal(thrown.pushPerformed, false)
})

test('validation preserves command cwd outputs timestamps and actual exit result', () => {
  const cwd = process.cwd()
  const pass = runValidationCheckV2({ ...input, checkId: 'pass', name: 'pass', command: 'echo PASS', cwd, execute: () => ({ status: 0, stdout: 'SUCCESS', stderr: 'warning' }) })
  assert.equal(pass.command, 'echo PASS')
  assert.equal(pass.cwd, cwd)
  assert.equal(pass.result, 'PASS')
  assert.equal(pass.stdout, 'SUCCESS')
  assert.equal(pass.stderr, 'warning')
  assert.ok(pass.endedAt >= pass.startedAt)
  assert.equal(pass.pushAllowed, false)
  const failed = runValidationCheckV2({ ...input, checkId: 'failed', name: 'failed', command: 'echo COMPLETED', cwd, execute: () => ({ status: 9, stdout: 'PASS SUCCESS COMPLETED' }) })
  assert.equal(failed.result, 'FAIL')
  assert.equal(failed.exitCode, 9)
})

test('validation reports timeout execution errors and ordered suite failures exactly', () => {
  const timeout = runValidationCheckV2({ ...input, checkId: 'timeout', name: 'timeout', command: 'echo timeout', cwd: process.cwd(), execute: () => ({ status: null, error: { code: 'ETIMEDOUT', message: 'timeout' } }) })
  assert.equal(timeout.result, 'TIMED_OUT')
  assert.equal(timeout.code, 'HERMES_V2_VALIDATION_TIMEOUT')
  const executionError = runValidationCheckV2({ ...input, checkId: 'error', name: 'error', command: 'echo error', cwd: process.cwd(), execute: () => ({ status: null, error: new Error('spawn failed') }) })
  assert.equal(executionError.result, 'EXECUTION_ERROR')
  assert.equal(executionError.code, 'HERMES_V2_VALIDATION_EXECUTION_FAILED')
  const suite = runValidationSuiteV2({ ...input, checks: [
    { ...input, checkId: 'first', name: 'first', command: 'echo first', cwd: process.cwd(), execute: () => ({ status: 0 }) },
    { ...input, checkId: 'second', name: 'second', command: 'echo second', cwd: process.cwd(), execute: () => ({ status: 2 }) },
  ] })
  assert.equal(suite.result, 'FAIL')
  assert.deepEqual(suite.checks.map(check => check.checkId), ['first', 'second'])
  assert.deepEqual(suite.failedCheckIds, ['second'])
})

function strictCloseoutFile(root, { files = ['docs/example.md'], recommendation = 'APPROVE' } = {}) {
  const path = join(root, 'closeout.md')
  const sections = CLOSEOUT_V3_HEADINGS.map(heading => `## ${heading}\n${heading === 'Files Changed' ? files.map(file => `- ${file}`).join('\n') : heading === 'Review Recommendation' ? recommendation : 'None.'}`).join('\n\n')
  writeFileSync(path, `# Closeout Packet v3\n\n${sections}\n`)
  return path
}
function realCloseoutValidator(file, { observedFiles }) {
  const inspected = inspectWorkerCloseout(file, { changedFiles: observedFiles })
  return { valid: inspected.passing, claimedFiles: inspected.listed_files, errors: inspected.errors, warnings: [], missionId: input.missionId, attempt: input.attempt }
}

test('closeout real strict v3 validator accepts matching observed files', () => {
  const root = mkdtempSync(join(tmpdir(), 'hermes-closeout-v3-')); const path = strictCloseoutFile(root)
  const result = validateCloseoutV2({ ...input, closeout: path, observedFiles: ['docs/example.md'], validator: realCloseoutValidator })
  assert.equal(result.ok, true); assert.equal(result.code, 'HERMES_V2_CLOSEOUT_VALID'); assert.equal(result.validatorVersion, 3)
  rmSync(root, { recursive: true, force: true })
})

test('closeout strict validator rejects prose malformed and observed-file mismatches', () => {
  const root = mkdtempSync(join(tmpdir(), 'hermes-closeout-invalid-')); const prose = join(root, 'prose.md'); writeFileSync(prose, 'Everything completed successfully.')
  const malformed = validateCloseoutV2({ ...input, closeout: prose, observedFiles: [], validator: realCloseoutValidator })
  assert.equal(malformed.ok, false); assert.equal(malformed.code, 'HERMES_V2_CLOSEOUT_INVALID'); assert.ok(malformed.errors.length)
  const path = strictCloseoutFile(root, { files: ['docs/claimed.md'] })
  const mismatch = validateCloseoutV2({ ...input, closeout: path, observedFiles: ['docs/observed.md'], validator: realCloseoutValidator })
  assert.equal(mismatch.ok, false); assert.equal(mismatch.code, 'HERMES_V2_CLOSEOUT_INVALID')
  rmSync(root, { recursive: true, force: true })
})

test('closeout boundary rejects mission and attempt mismatch without mutation', () => {
  const validator = () => ({ valid: true, claimedFiles: [], warnings: ['kept'], errors: ['kept'], missionId: 'OTHER', attempt: 2 })
  assert.equal(validateCloseoutV2({ ...input, closeout: {}, validator }).code, 'HERMES_V2_CLOSEOUT_MISSION_MISMATCH')
  assert.equal(validateCloseoutV2({ ...input, closeout: {}, validator: () => ({ valid: true, claimedFiles: [], missionId: input.missionId, attempt: 2 }) }).code, 'HERMES_V2_CLOSEOUT_ATTEMPT_MISMATCH')
})

function lifecycleSentinel(runAdapter) {
  const root = mkdtempSync(join(tmpdir(), 'hermes-v2-sentinel-')); const files = ['legacy-state.json', 'mission.json', 'events.jsonl']
  for (const file of files) writeFileSync(join(root, file), `${file}\n`, 'utf8')
  const before = files.map(file => readFileSync(join(root, file)))
  runAdapter(root)
  assert.deepEqual(files.map(file => readFileSync(join(root, file))), before)
  assert.deepEqual(readdirSync(root).sort(), files.sort())
  rmSync(root, { recursive: true, force: true })
}

test('worker mutation sentinel preserves all lifecycle bytes', () => lifecycleSentinel(root => prepareWorkerInvocationV2({ ...input, worker: 'codex', request: {}, cwd: root })))
test('dispatcher mutation sentinel preserves all lifecycle bytes', () => lifecycleSentinel(() => prepareDispatchV2({ ...input, state: 'QUEUED', worker: 'codex', packetHash: 'p', planHash: 'q', mode: 'v2-checkpoint' })))
test('review mutation sentinel preserves all lifecycle bytes', () => lifecycleSentinel(() => mapLegacyReviewVerdictToV2({ verdict: 'AUTO_ACCEPT' })))
test('sync mutation sentinel preserves all lifecycle bytes', () => lifecycleSentinel(() => runSyncV2({ ...input, inputs: {}, syncOperation: () => ({ success: true }) })))
test('validation mutation sentinel preserves all lifecycle bytes', () => lifecycleSentinel(root => runValidationCheckV2({ ...input, checkId: 'x', name: 'x', command: 'x', cwd: root, execute: () => ({ status: 0 }) })))
test('closeout mutation sentinel preserves all lifecycle bytes', () => lifecycleSentinel(() => validateCloseoutV2({ ...input, closeout: {}, validator: () => ({ valid: true, claimedFiles: [] }) })))
test('commit mutation sentinel preserves all lifecycle bytes', () => {
  const root = mkdtempSync(join(tmpdir(), 'hermes-v2-commit-sentinel-'))
  const lifecycleFiles = ['legacy-state.json', 'mission.json', 'events.jsonl']
  for (const file of lifecycleFiles) writeFileSync(join(root, file), `${file}\n`, 'utf8')
  const before = lifecycleFiles.map(file => readFileSync(join(root, file)))
  const git = args => spawnSync('git', args, { cwd: root, encoding: 'utf8', windowsHide: true })
  try {
    assert.equal(git(['init']).status, 0)
    assert.equal(git(['config', 'user.email', 'test@example.invalid']).status, 0)
    assert.equal(git(['config', 'user.name', 'Hermes Test']).status, 0)
    writeFileSync(join(root, 'approved.md'), 'before\n', 'utf8')
    assert.equal(git(['add', '--', 'approved.md']).status, 0)
    assert.equal(git(['commit', '-m', 'baseline']).status, 0)
    writeFileSync(join(root, 'approved.md'), 'after\n', 'utf8')
    const result = commitMissionFilesV2({ ...input, allowedFiles: ['approved.md'], commitMessage: 'sentinel', cwd: root })
    assert.equal(result.code, 'HERMES_V2_COMMIT_OK')
    assert.deepEqual(lifecycleFiles.map(file => readFileSync(join(root, file))), before)
    assert.equal(readdirSync(root).filter(name => !['.git', 'approved.md'].includes(name)).length, lifecycleFiles.length)
  } finally { rmSync(root, { recursive: true, force: true }) }
})

test('commit adapter rejects invalid inputs before invoking git', () => {
  let calls = 0; const git = () => { calls += 1; return { status: 0, stdout: '' } }
  for (const options of [
    { missionId: '../bad' }, { attempt: 0 }, { allowedFiles: [] }, { commitMessage: '' }, { allowedFiles: ['/absolute.md'] }, { allowedFiles: ['../escape.md'] }, { allowedFiles: ['*.md'] }, { allowedFiles: ['a.md', './a.md'] },
  ]) assert.equal(commitMissionFilesV2({ ...input, allowedFiles: ['a.md'], commitMessage: 'x', cwd: process.cwd(), git, ...options }).code, 'HERMES_V2_COMMIT_INELIGIBLE')
  assert.equal(calls, 0)
})

test('commit adapter normalizes staging and commit failures without push', () => {
  const staging = commitMissionFilesV2({ ...input, allowedFiles: ['a.md'], commitMessage: 'x', cwd: process.cwd(), git: args => args[0] === 'diff' ? { status: 0, stdout: '' } : { status: 1, stderr: 'stage failed' } })
  assert.equal(staging.code, 'HERMES_V2_COMMIT_FAILED'); assert.equal(staging.pushPerformed, false)
  let step = 0; const commit = commitMissionFilesV2({ ...input, allowedFiles: ['a.md'], commitMessage: 'x', cwd: process.cwd(), git: args => { step += 1; if (args[0] === 'diff') return { status: 0, stdout: 'a.md\n' }; if (args[0] === 'add') return { status: 0, stdout: '' }; return { status: 1, stderr: 'commit failed' } } })
  assert.equal(commit.code, 'HERMES_V2_COMMIT_FAILED'); assert.equal(commit.pushAllowed, false); assert.ok(step > 0)
})
