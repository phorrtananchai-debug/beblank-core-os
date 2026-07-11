#!/usr/bin/env node

import assert from 'node:assert/strict'
import { existsSync, mkdirSync, readFileSync, rmSync, utimesSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)))
const fixtureRoot = join(ROOT, '.hermes', `integrity-fixture-${process.pid}-${Date.now()}`)
process.env.HERMES_RUNTIME_DIR = join(fixtureRoot, 'runtime')

const store = await import('./hermes-runtime-store.mjs')
const { classifyMission, validateDispatchPacket } = await import('./hermes-dispatch.mjs')
const { determineReviewVerdict, normalizeRequiredChecks } = await import('./hermes-review-runtime.mjs')
const { adapterExecute, buildCodexArgs, buildCodexPrompt, CLOSEOUT_V3_HEADINGS, CODEX_MODEL, detectEffectiveSandbox, inspectWorkerCloseout, normalizeCloseoutFilePath, resolveCodexSandbox } = await import('./hermes-worker-codex.mjs')
const { commitEligibility, finalizeAcceptedMission, parseCommitControls, resolveCommitMessage, validateStagedScope } = await import('./hermes-run.mjs')
const { resolveSyncedState, syncCloseout } = await import('./hermes-sync.mjs')

function fingerprintWorkspace(name) {
  const workspace = join(fixtureRoot, `fingerprint-${name}`)
  mkdirSync(workspace, { recursive: true })
  git(workspace, ['init'])
  git(workspace, ['config', 'user.email', 'fingerprint@local.invalid'])
  git(workspace, ['config', 'user.name', 'Fingerprint Fixture'])
  return workspace
}

function closeoutV3({ files = [], verdict = 'APPROVE', omit = [], extra = '' } = {}) {
  return CLOSEOUT_V3_HEADINGS.filter(heading => !omit.includes(heading)).map((heading, index) => {
    if (heading === 'Files Changed') return `## ${index + 1}. ${heading}\n\n${files.length ? files.map(file => `- ${file}`).join('\n') : '- None.'}`
    if (heading === 'Review Recommendation') return `## ${index + 1}. ${heading}\n\n**${verdict}**${extra}`
    return `## ${index + 1}. ${heading}\n\nDocumented evidence.`
  }).join('\n\n')
}

function git(repo, args) {
  const result = spawnSync('git', ['-C', repo, ...args], { encoding: 'utf8', windowsHide: true })
  if (result.status !== 0) throw new Error(`Fixture git failed: ${(result.stderr || result.stdout).trim()}`)
  return result.stdout.trim()
}

async function runCodexWriteSmoke() {
  const missionId = `HERMES-INTEGRITY-WRITE-SMOKE-${process.pid}`
  const workspace = join(ROOT, '.hermes', 'windows-write-smoke')
  const executionDir = join(ROOT, '.hermes', 'executions', missionId)
  mkdirSync(workspace, { recursive: true })
  git(workspace, ['init'])
  git(workspace, ['config', 'user.email', 'hermes-smoke@local.invalid'])
  git(workspace, ['config', 'user.name', 'Hermes Smoke'])
  writeFileSync(join(workspace, 'README.md'), '# Hermes disposable smoke\n', 'utf8')
  git(workspace, ['add', 'README.md'])
  git(workspace, ['commit', '-m', 'fixture baseline'])
  const branch = git(workspace, ['branch', '--show-current'])
  const packetPath = join(fixtureRoot, 'codex-write-smoke.md')
  writeFileSync(packetPath, `---
mission_id: ${missionId}
mission: Create the approved disposable output file
agent_role: Codex CLI
repo: ${workspace}
branch: ${branch}
approval_gate: Por
output_required: true
allowed_files:
  - output.md
forbidden_files:
  - .git/
---
# Disposable Codex Write Smoke
## Mission
Create output.md containing exactly HERMES_WINDOWS_WORKSPACE_WRITE_OK. Do not modify any other file.
## Allowed Files
\`\`\`
output.md
\`\`\`
## Forbidden Files
\`\`\`
.git/
\`\`\`
## Evidence
Verify output.md exists and return a closeout whose Review Recommendation is APPROVE.
## Approval
Authorized disposable Hermes integrity smoke.
## Closeout
End with: ## Review Recommendation followed by **APPROVE**.
`, 'utf8')
  try {
    store.initializeRuntime({ force: true })
    const packet = store.parseTaskPacket(packetPath)
    const mission = store.normalizeMission(packet)
    mission.baseline_status = store.parseGitStatus(git(workspace, ['status', '--short']))
    mission.baseline_head = git(workspace, ['rev-parse', 'HEAD'])
    mission.output_baseline = store.captureOutputFingerprints(workspace, packet.allowed_files)
    store.saveMission(mission, { create: true })
    const runtime = store.readState('runtime.json')
    runtime.active_assignments[missionId] = {
      mission_id: missionId,
      worker_id: 'codex-cli',
      approval_state: 'AUTHORIZED',
      safe_to_run: true,
    }
    store.atomicWrite('runtime.json', runtime)
    store.updateMissionState(missionId, 'RUNNING', { started_at: new Date().toISOString() })
    const execution = adapterExecute(packetPath, { authorizedByDispatch: true })
    const stderr = readFileSync(execution.stderr_log, 'utf8')
    assert.equal(execution.status, 'COMPLETED', JSON.stringify({
      status: execution.status,
      worker_verdict: execution.worker_verdict,
      objective_verified: execution.objective_verified,
      changed_files: execution.changed_files,
      outside_scope: execution.outside_scope,
      quota_block: execution.quota_block,
      sandbox_header: /sandbox:\s*([^\r\n]+)/i.exec(stderr)?.[1] || 'missing',
      issues: execution.execution_issues,
    }))
    assert.equal(execution.objective_verified, true)
    assert.equal(execution.worker_closeout_passing, true)
    assert.equal(execution.requested_sandbox_mode, 'workspace-write')
    assert.equal(execution.effective_sandbox_mode, 'workspace-write')
    assert.equal(readFileSync(join(workspace, 'output.md'), 'utf8').trim(), 'HERMES_WINDOWS_WORKSPACE_WRITE_OK')
    assert.deepEqual(store.parseGitStatus(git(workspace, ['status', '--short'])).map(item => item.path), ['output.md'])
    assert.match(stderr, /sandbox:\s+workspace-write/i)
    return {
      status: 'PASS',
      requested_sandbox_mode: execution.requested_sandbox_mode,
      effective_sandbox_mode: execution.effective_sandbox_mode,
      sandbox_root: execution.sandbox_root,
      output_created: true,
      changed_files: execution.changed_files,
      worker_verdict: execution.worker_verdict,
    }
  } finally {
    if (existsSync(executionDir)) rmSync(executionDir, { recursive: true, force: true })
    if (existsSync(workspace)) rmSync(workspace, { recursive: true, force: true })
  }
}

const results = []
function test(name, fn) {
  try { fn(); results.push({ name, status: 'PASS' }) }
  catch (error) { results.push({ name, status: 'FAIL', error: error.message }); throw error }
}

try {
  mkdirSync(fixtureRoot, { recursive: true })
  const output = join(fixtureRoot, 'guide.md')
  writeFileSync(output, '# fixture\n', 'utf8')
  const writePacket = {
    repo: fixtureRoot,
    output_required: true,
    required_outputs: ['guide.md'],
    allowed_files: ['guide.md'],
    forbidden_files: ['src/'],
    mission_id: 'TEST-WRITE',
    mission: 'Create docs guide',
    text: '## Evidence\nYes\n## Approval\nYes\n## Closeout\nYes',
  }
  test('pre-existing untracked file edited is detected as modified', () => {
    const workspace = fingerprintWorkspace('untracked-modified')
    writeFileSync(join(workspace, 'output.md'), 'before\n')
    const before = store.captureOutputFingerprints(workspace, ['output.md'])
    writeFileSync(join(workspace, 'output.md'), 'after\n')
    const comparison = store.compareOutputFingerprints(before, store.captureOutputFingerprints(workspace, ['output.md']))
    assert.deepEqual(comparison.changes.map(change => [change.path, change.reason]), [['output.md', 'modified']])
  })
  test('pre-existing untracked file unchanged is not detected', () => {
    const workspace = fingerprintWorkspace('untracked-unchanged')
    writeFileSync(join(workspace, 'output.md'), 'same\n')
    const before = store.captureOutputFingerprints(workspace, ['output.md'])
    const comparison = store.compareOutputFingerprints(before, store.captureOutputFingerprints(workspace, ['output.md']))
    assert.equal(comparison.changed, false)
  })
  test('pre-existing untracked file deletion is detected', () => {
    const workspace = fingerprintWorkspace('untracked-deleted')
    writeFileSync(join(workspace, 'output.md'), 'delete\n')
    const before = store.captureOutputFingerprints(workspace, ['output.md'])
    rmSync(join(workspace, 'output.md'))
    const comparison = store.compareOutputFingerprints(before, store.captureOutputFingerprints(workspace, ['output.md']))
    assert.deepEqual(comparison.changes.map(change => change.reason), ['deleted'])
  })
  test('new untracked file creation is detected', () => {
    const workspace = fingerprintWorkspace('untracked-created')
    const before = store.captureOutputFingerprints(workspace, ['output.md'])
    writeFileSync(join(workspace, 'output.md'), 'created\n')
    const comparison = store.compareOutputFingerprints(before, store.captureOutputFingerprints(workspace, ['output.md']))
    assert.deepEqual(comparison.changes.map(change => change.reason), ['created'])
  })
  test('tracked file modification is detected by fingerprint and git delta', () => {
    const workspace = fingerprintWorkspace('tracked-modified')
    writeFileSync(join(workspace, 'output.md'), 'before\n')
    git(workspace, ['add', 'output.md']); git(workspace, ['commit', '-m', 'baseline'])
    const before = store.captureOutputFingerprints(workspace, ['output.md'])
    writeFileSync(join(workspace, 'output.md'), 'after\n')
    const after = store.captureOutputFingerprints(workspace, ['output.md'])
    const detection = store.detectMissionChanges(store.parseGitStatus(git(workspace, ['status', '--short'])), [], before, after)
    assert.ok(detection.changed_files.includes('output.md'))
    assert.ok(detection.change_reasons.find(change => change.path === 'output.md').reasons.includes('modified'))
  })
  test('mtime-only changes are not detected', () => {
    const workspace = fingerprintWorkspace('mtime')
    const file = join(workspace, 'output.md')
    writeFileSync(file, 'same\n')
    const before = store.captureOutputFingerprints(workspace, ['output.md'])
    utimesSync(file, new Date(), new Date(Date.now() + 60_000))
    assert.equal(store.compareOutputFingerprints(before, store.captureOutputFingerprints(workspace, ['output.md'])).changed, false)
  })
  test('file type changes are detected', () => {
    const workspace = fingerprintWorkspace('type')
    const output = join(workspace, 'output')
    writeFileSync(output, 'file\n')
    const before = store.captureOutputFingerprints(workspace, ['output'])
    rmSync(output); mkdirSync(output)
    const comparison = store.compareOutputFingerprints(before, store.captureOutputFingerprints(workspace, ['output']))
    assert.ok(comparison.changes.some(change => change.reason === 'type_changed'))
  })
  test('approved directory additions and modifications are detected', () => {
    const workspace = fingerprintWorkspace('directory')
    const directory = join(workspace, 'docs')
    mkdirSync(directory)
    writeFileSync(join(directory, 'existing.md'), 'before\n')
    const before = store.captureOutputFingerprints(workspace, ['docs/'])
    writeFileSync(join(directory, 'added.md'), 'added\n')
    writeFileSync(join(directory, 'existing.md'), 'after\n')
    const changes = store.compareOutputFingerprints(before, store.captureOutputFingerprints(workspace, ['docs/'])).changes
    assert.deepEqual(changes.map(change => [change.path, change.reason]), [['docs/added.md', 'created'], ['docs/existing.md', 'modified']])
  })
  test('approved directory unchanged and unrelated UI changes remain excluded', () => {
    const workspace = fingerprintWorkspace('directory-unchanged')
    mkdirSync(join(workspace, 'docs'))
    writeFileSync(join(workspace, 'docs', 'guide.md'), 'same\n')
    const before = store.captureOutputFingerprints(workspace, ['docs/'])
    writeFileSync(join(workspace, 'ui.css'), 'unrelated\n')
    const after = store.captureOutputFingerprints(workspace, ['docs/'])
    const detection = store.detectMissionChanges([], [], before, after)
    assert.equal(detection.changed_files.length, 0)
  })
  const acceptedReview = {
    completion_ready: true,
    verdict: 'AUTO_ACCEPT',
    changed_files: ['guide.md'],
    risk: 'LOW',
    protected_paths: [], outside_scope: [], forbidden_touched: [], conflicts: [],
    checks: [
      { command: 'npm run lint', status: 'PASS' },
      { command: 'npm run build', status: 'PASS' },
      { command: 'npm run hermes:runtime -- doctor', status: 'PASS' },
    ],
    closeout: { complete: true },
    worker_closeout: { passing: true },
    objective: { objective_verified: true },
  }
  const reviewScripts = {
    test: 'node test.mjs', lint: 'eslint .', build: 'tsc -b',
    'hermes:test-integrity': 'node scripts/hermes-integrity-test.mjs',
    'hermes:runtime': 'node scripts/hermes-runtime.mjs',
    'custom-test-lint-build': 'node custom.mjs',
  }
  test('required check npm run hermes:test-integrity stays exact', () => {
    assert.deepEqual(normalizeRequiredChecks(['npm run hermes:test-integrity'], reviewScripts), [{ command: 'npm run hermes:test-integrity', args: ['run', 'hermes:test-integrity'] }])
  })
  test('integrity script does not trigger npm test', () => {
    assert.ok(!normalizeRequiredChecks(['npm run hermes:test-integrity'], reviewScripts).some(check => check.command === 'npm test'))
  })
  test('exact npm test remains an explicit test-script request', () => {
    assert.deepEqual(normalizeRequiredChecks(['npm test'], reviewScripts), [{ command: 'npm test', args: ['test'] }])
  })
  test('lint and build commands run only their exact scripts', () => {
    assert.deepEqual(normalizeRequiredChecks(['npm run lint', 'npm run build'], reviewScripts).map(check => check.args), [['run', 'lint'], ['run', 'build']])
  })
  test('script names containing test lint or build do not infer other checks', () => {
    assert.deepEqual(normalizeRequiredChecks(['npm run custom-test-lint-build'], reviewScripts), [{ command: 'npm run custom-test-lint-build', args: ['run', 'custom-test-lint-build'] }])
  })
  test('multiple explicit checks remain independent and exact duplicates deduplicate', () => {
    assert.deepEqual(normalizeRequiredChecks(['npm run lint', 'npm run hermes:runtime -- doctor', 'npm run lint'], reviewScripts).map(check => check.args), [['run', 'lint'], ['run', 'hermes:runtime', '--', 'doctor']])
  })
  test('unknown and malformed required checks fail closed', () => {
    const checks = normalizeRequiredChecks(['npm run absent-script', 'pnpm test', ''], reviewScripts)
    assert.equal(checks.length, 3)
    assert.ok(checks.every(check => check.error))
  })
  const finalCloseout = join(fixtureRoot, 'final-closeout.md')
  writeFileSync(finalCloseout, '# fixture closeout\n', 'utf8')

  test('commit occurs only after final closeout and sync', () => {
    const events = []
    finalizeAcceptedMission({
      mission: { mission_id: 'ORDER-TEST', repo: fixtureRoot }, assignment: {}, execution: { status: 'COMPLETED' }, review: acceptedReview,
      operations: {
        writeCloseout: () => { events.push('closeout'); return finalCloseout },
        syncCloseout: () => { events.push('sync'); return { synced: true, runtime_state: 'COMPLETED' } },
        getMission: () => { events.push('verify'); return { state: 'COMPLETED' } },
        commit: () => { events.push('commit'); return 'abc123' },
      },
    })
    assert.deepEqual(events, ['closeout', 'sync', 'verify', 'commit'])
  })
  test('--no-commit prevents commit after successful completion', () => {
    let committed = false
    const controls = parseCommitControls(['--no-commit'])
    const result = finalizeAcceptedMission({
      mission: { mission_id: 'NO-COMMIT-TEST', repo: fixtureRoot }, assignment: {}, execution: { status: 'COMPLETED' }, review: acceptedReview, ...controls,
      operations: {
        writeCloseout: () => finalCloseout,
        syncCloseout: () => ({ synced: true, runtime_state: 'COMPLETED' }),
        getMission: () => ({ state: 'COMPLETED' }),
        commit: () => { committed = true },
      },
    })
    assert.equal(committed, false)
    assert.equal(result.commit, null)
  })
  test('custom and default commit messages resolve deterministically', () => {
    assert.equal(parseCommitControls(['--commit-message', 'docs: custom']).commitMessage, 'docs: custom')
    assert.equal(resolveCommitMessage('DEFAULT-TEST'), 'chore(hermes): complete DEFAULT-TEST')
    assert.equal(resolveCommitMessage('CUSTOM-TEST', 'docs: custom'), 'docs: custom')
  })
  test('failed, blocked, and missing-closeout missions cannot commit', () => {
    const base = { review: acceptedReview, syncResult: { synced: true, runtime_state: 'COMPLETED' }, closeoutPath: finalCloseout }
    assert.equal(commitEligibility({ ...base, finalState: 'FAILED' }).eligible, false)
    assert.equal(commitEligibility({ ...base, finalState: 'BLOCKED' }).eligible, false)
    assert.equal(commitEligibility({ ...base, finalState: 'COMPLETED', closeoutPath: join(fixtureRoot, 'missing-closeout.md') }).eligible, false)
  })
  test('sync terminal-state precedence preserves completion and veto states', () => {
    assert.equal(resolveSyncedState('COMPLETED', 'APPROVE', { completionReady: true }), 'COMPLETED')
    assert.equal(resolveSyncedState('FAILED', 'APPROVE', { completionReady: true }), 'FAILED')
    assert.equal(resolveSyncedState('BLOCKED', 'APPROVE', { completionReady: true }), 'BLOCKED')
    assert.equal(resolveSyncedState('NEEDS_REWORK', 'APPROVE', { completionReady: true }), 'NEEDS_REWORK')
    assert.equal(resolveSyncedState('COMPLETED', 'FAILED', { completionReady: true }), 'FAILED')
  })
  test('scope validation rejects unrelated staged files and accepts mission files only', () => {
    assert.equal(validateStagedScope(['guide.md'], ['guide.md', 'src/index.css']).valid, false)
    assert.equal(validateStagedScope(['guide.md'], ['guide.md']).valid, true)
  })

  test('write mission required output passes when created', () => {
    const objective = store.inspectMissionObjective(writePacket, ['guide.md'])
    assert.equal(objective.objective_verified, true)
  })
  test('write sandbox narrows to the approved output directory', () => {
    const sandbox = resolveCodexSandbox(writePacket)
    assert.equal(sandbox.mode, 'workspace-write')
    assert.equal(sandbox.root, fixtureRoot)
  })
  test('Windows writing command pins model, supported reasoning, and elevated sandbox backend', () => {
    const args = buildCodexArgs({ availability: { prefix: [] }, selected_model: CODEX_MODEL, sandbox_mode: 'workspace-write', sandbox_root: fixtureRoot, reasoning_effort: 'medium' }, 'closeout.md', 'win32')
    assert.ok(args.includes('--ignore-user-config'))
    assert.deepEqual(args.slice(args.indexOf('-c'), args.indexOf('-c') + 2), ['-c', 'windows.sandbox="elevated"'])
    assert.deepEqual(args.slice(args.indexOf('--model'), args.indexOf('--model') + 2), ['--model', 'gpt-5.5'])
    assert.deepEqual(args.slice(args.indexOf('--sandbox'), args.indexOf('--sandbox') + 2), ['--sandbox', 'workspace-write'])
    assert.ok(args.includes('model_reasoning_effort="medium"'))
  })
  test('Windows read-only command preserves read-only sandbox with safe backend override', () => {
    const args = buildCodexArgs({ availability: { prefix: [] }, selected_model: CODEX_MODEL, sandbox_mode: 'read-only', sandbox_root: fixtureRoot, reasoning_effort: 'low' }, 'closeout.md', 'win32')
    assert.deepEqual(args.slice(args.indexOf('--sandbox'), args.indexOf('--sandbox') + 2), ['--sandbox', 'read-only'])
    assert.ok(args.includes('windows.sandbox="elevated"'))
  })
  test('non-Windows command omits Windows sandbox backend override', () => {
    const args = buildCodexArgs({ availability: { prefix: [] }, selected_model: CODEX_MODEL, sandbox_mode: 'workspace-write', sandbox_root: fixtureRoot, reasoning_effort: 'medium' }, 'closeout.md', 'linux')
    assert.ok(!args.some(value => value.includes('windows.sandbox')))
  })
  test('effective read-only sandbox is detected as a write downgrade', () => {
    const sandbox = detectEffectiveSandbox('sandbox: read-only\n', 'workspace-write')
    assert.equal(sandbox.effective, 'read-only')
    assert.equal(sandbox.downgraded, true)
  })
  test('missing required file plus process exit zero cannot pass', () => {
    const objective = store.inspectMissionObjective({ ...writePacket, required_outputs: ['missing.md'] }, [])
    assert.equal(objective.objective_verified, false)
    assert.ok(objective.missing_outputs.includes('missing.md'))
  })
  test('zero changed files for writing mission cannot pass', () => {
    const objective = store.inspectMissionObjective(writePacket, [])
    assert.equal(objective.objective_verified, false)
    assert.ok(objective.issues.some(issue => issue.includes('zero changed files')))
  })
  test('worker HOLD vetoes AUTO_ACCEPT', () => {
    assert.equal(determineReviewVerdict({ worker_blocking: true }), 'NEEDS_REWORK')
  })
  test('missing closeout vetoes AUTO_ACCEPT', () => {
    assert.equal(determineReviewVerdict({ closeout_missing: true }), 'NEEDS_REWORK')
  })
  test('blocking quota or evidence vetoes AUTO_ACCEPT', () => {
    assert.equal(determineReviewVerdict({ blocking_evidence: true }), 'NEEDS_REWORK')
  })
  test('read-only mission explicitly requiring no output may pass with zero changes', () => {
    const objective = store.inspectMissionObjective({ ...writePacket, output_required: false, required_outputs: [] }, [])
    assert.equal(objective.objective_verified, true)
    assert.equal(determineReviewVerdict({}), 'AUTO_ACCEPT')
    assert.equal(resolveCodexSandbox({ ...writePacket, output_required: false }).mode, 'read-only')
  })
  test('protected paths remain blocked', () => {
    const analysis = classifyMission({ ...writePacket, allowed_files: ['src/core/auth/AuthContext.tsx'] })
    assert.ok(analysis.protected_paths.includes('auth'))
    assert.equal(determineReviewVerdict({ protected_scope: true }), 'HUMAN_REQUIRED')
  })
  test('writes outside approved scope remain rejected', () => {
    assert.equal(determineReviewVerdict({ outside_scope: true }), 'REJECT')
  })
  test('writing packet must declare output scope', () => {
    const validation = validateDispatchPacket({ ...writePacket, allowed_files: [], required_outputs: [] })
    assert.equal(validation.valid, false)
  })

  const holdCloseout = join(fixtureRoot, 'hold.md')
  writeFileSync(holdCloseout, closeoutV3({ verdict: 'HOLD FOR EVIDENCE' }), 'utf8')
  test('worker closeout HOLD parser is blocking', () => {
    const result = inspectWorkerCloseout(holdCloseout)
    assert.equal(result.passing, false)
    assert.equal(result.verdict, 'HOLD_FOR_EVIDENCE')
  })
  const passCloseout = join(fixtureRoot, 'pass.md')
  writeFileSync(passCloseout, closeoutV3({ files: ['guide.md'] }), 'utf8')
  test('worker closeout APPROVE parser passes', () => {
    assert.equal(inspectWorkerCloseout(passCloseout, { changedFiles: ['guide.md'] }).passing, true)
  })
  test('closeout file-list normalization accepts plain, wrapped, quoted, and Windows paths', () => {
    assert.deepEqual(normalizeCloseoutFilePath('docs/hermes/guide.md'), { path: 'docs/hermes/guide.md' })
    assert.deepEqual(normalizeCloseoutFilePath('`docs/hermes/guide.md`'), { path: 'docs/hermes/guide.md' })
    assert.deepEqual(normalizeCloseoutFilePath('- `docs/hermes/guide.md`'), { path: 'docs/hermes/guide.md' })
    assert.deepEqual(normalizeCloseoutFilePath('  "docs\\hermes\\guide.md"  '), { path: 'docs/hermes/guide.md' })
  })
  test('closeout file-list normalization compares balanced Markdown paths exactly', () => {
    const path = join(fixtureRoot, 'balanced-file-path.md')
    writeFileSync(path, closeoutV3({ files: ['`docs/hermes/RUNTIME_V1_OPERATING_GUIDE.md`'] }), 'utf8')
    assert.equal(inspectWorkerCloseout(path, { changedFiles: ['docs/hermes/RUNTIME_V1_OPERATING_GUIDE.md'] }).passing, true)
    assert.equal(inspectWorkerCloseout(path, { changedFiles: ['docs/hermes/other.md'] }).files_match, false)
  })
  test('closeout file-list normalization fails closed for malformed and unsafe entries', () => {
    for (const value of ['`docs/hermes/guide.md', 'docs/`hermes/guide.md', 'docs/*.md', '../guide.md', 'docs/../guide.md', 'this is prose, not a path']) {
      assert.ok(normalizeCloseoutFilePath(value).error, value)
    }
  })
  test('closeout file-list normalization continues rejecting extra, missing, and out-of-scope files', () => {
    const path = join(fixtureRoot, 'wrong-files.md')
    writeFileSync(path, closeoutV3({ files: ['`src/index.css`'] }), 'utf8')
    const result = inspectWorkerCloseout(path, { changedFiles: ['docs/hermes/guide.md'] })
    assert.equal(result.files_match, false)
    assert.equal(result.passing, false)
  })
  test('closeout missing a required heading fails', () => {
    const path = join(fixtureRoot, 'missing-heading.md')
    writeFileSync(path, closeoutV3({ omit: ['Validation'] }), 'utf8')
    assert.equal(inspectWorkerCloseout(path).passing, false)
  })
  test('free-form success prose and UNKNOWN verdict fail', () => {
    const path = join(fixtureRoot, 'free-form.md')
    writeFileSync(path, 'Success: all work is complete and approved.', 'utf8')
    const result = inspectWorkerCloseout(path)
    assert.equal(result.verdict, 'UNKNOWN')
    assert.equal(result.passing, false)
  })
  test('BLOCKED verdict and contradictory APPROVE closeouts fail', () => {
    const blocked = join(fixtureRoot, 'blocked.md')
    const contradictory = join(fixtureRoot, 'contradictory.md')
    writeFileSync(blocked, closeoutV3({ verdict: 'BLOCKED' }), 'utf8')
    writeFileSync(contradictory, closeoutV3({ extra: '\n\nHOLD FOR EVIDENCE' }), 'utf8')
    assert.equal(inspectWorkerCloseout(blocked).passing, false)
    assert.equal(inspectWorkerCloseout(contradictory).contradictory, true)
  })
  test('closeout Files Changed must match verified mission changes', () => {
    assert.equal(inspectWorkerCloseout(passCloseout, { changedFiles: ['different.md'] }).files_match, false)
  })
  test('worker prompt ends with explicit complete closeout response contract', () => {
    const prompt = buildCodexPrompt(writePacket, 'medium')
    assert.ok(prompt.includes('FINAL RESPONSE CONTRACT (REQUIRED)'))
    assert.ok(CLOSEOUT_V3_HEADINGS.every(heading => prompt.includes(heading)))
  })

  store.initializeRuntime({ force: true })
  store.saveMission({ mission_id: 'SYNC-DOCS-TEST', mission: 'Disposable docs fixture', state: 'WAITING_REVIEW' }, { create: true })
  const syncCloseoutPath = join(fixtureRoot, 'sync-docs-closeout.md')
  writeFileSync(syncCloseoutPath, `---
closeout_id: CLOSEOUT-SYNC-DOCS-TEST
mission_id: SYNC-DOCS-TEST
session_id: SESSION-TEST
agent: Codex CLI
branch: fixture
risk: LOW
---
# Fixture Closeout
## Review Recommendation
**AUTO ACCEPT**
`, 'utf8')
  test('successful docs fixture syncs and remains COMPLETED with no commit', () => {
    let committed = false
    const result = finalizeAcceptedMission({
      mission: { mission_id: 'SYNC-DOCS-TEST', repo: fixtureRoot },
      assignment: {}, execution: { status: 'COMPLETED' }, review: acceptedReview, commitEnabled: false,
      operations: {
        writeCloseout: () => syncCloseoutPath,
        syncCloseout: (path, options) => syncCloseout(path, { ...options, legacyStateFile: join(fixtureRoot, 'legacy-state.json') }),
        getMission: () => store.getMission('SYNC-DOCS-TEST'),
        commit: () => { committed = true },
      },
    })
    assert.equal(result.syncResult.runtime_state, 'COMPLETED')
    assert.equal(store.getMission('SYNC-DOCS-TEST').state, 'COMPLETED')
    assert.equal(result.commit, null)
    assert.equal(committed, false)
  })
  store.saveMission({ mission_id: 'FAILED-TEST', state: 'FAILED' }, { create: true })
  test('failed mission cannot transition to COMPLETED', () => {
    assert.throws(() => store.updateMissionState('FAILED-TEST', 'COMPLETED', { completion_evidence: { ready: true } }), /cannot become COMPLETED/)
  })
  store.saveMission({ mission_id: 'BLOCKED-TEST', state: 'BLOCKED' }, { create: true })
  test('blocked mission cannot transition to COMPLETED', () => {
    assert.throws(() => store.updateMissionState('BLOCKED-TEST', 'COMPLETED', { completion_evidence: { ready: true } }), /cannot become COMPLETED/)
  })
  store.saveMission({ mission_id: 'NEEDS-REWORK-TEST', state: 'NEEDS_REWORK' }, { create: true })
  test('needs-rework mission cannot transition to COMPLETED', () => {
    assert.throws(() => store.updateMissionState('NEEDS-REWORK-TEST', 'COMPLETED', { completion_evidence: { ready: true } }), /cannot become COMPLETED/)
  })
  store.saveMission({ mission_id: 'NO-EVIDENCE-TEST', state: 'WAITING_REVIEW' }, { create: true })
  test('completion requires verified evidence', () => {
    assert.throws(() => store.updateMissionState('NO-EVIDENCE-TEST', 'COMPLETED'), /verified completion evidence/)
  })
  store.saveMission({ mission_id: 'READY-TEST', state: 'WAITING_REVIEW' }, { create: true })
  test('verified accepted mission may transition to COMPLETED', () => {
    const mission = store.updateMissionState('READY-TEST', 'COMPLETED', { completion_evidence: { ready: true } })
    assert.equal(mission.state, 'COMPLETED')
  })

  const codex_write_smoke = process.argv.includes('--codex-write-smoke') ? await runCodexWriteSmoke() : 'NOT_REQUESTED'
  console.log(JSON.stringify({ verdict: 'PASS', tests: results, codex_write_smoke }, null, 2))
} finally {
  if (existsSync(fixtureRoot)) rmSync(fixtureRoot, { recursive: true, force: true })
}
