import assert from 'node:assert/strict'
import test from 'node:test'
import { existsSync, mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { executeCheckpointMissionV2, parseCommitControls, parseLifecycleMode, RUNNER_LIFECYCLE_MODES } from '../hermes-run.mjs'
import { createMissionState } from '../hermes-state-model-v2.mjs'

test('C1 runner keeps legacy-v1 as the default lifecycle mode', () => {
  const parsed = parseLifecycleMode(['--execute', 'packet.md'])
  assert.equal(parsed.mode, 'legacy-v1')
  assert.deepEqual(parsed.args, ['--execute', 'packet.md'])
  assert.deepEqual(parseCommitControls(parsed.args), { commitEnabled: true, commitMessage: null })
})

test('C1 runner exposes v2-checkpoint only through an explicit mode boundary', () => {
  const parsed = parseLifecycleMode(['--lifecycle-mode', 'v2-checkpoint', '--no-commit', '--resume', 'MISSION-C1'])
  assert.equal(parsed.mode, 'v2-checkpoint')
  assert.deepEqual(parsed.args, ['--no-commit', '--resume', 'MISSION-C1'])
  assert.deepEqual(parseCommitControls(parsed.args), { commitEnabled: false, commitMessage: null })
  assert.equal(typeof executeCheckpointMissionV2, 'function')
  assert.deepEqual(RUNNER_LIFECYCLE_MODES, ['legacy-v1', 'v2-checkpoint'])
})

test('C1 runner rejects missing or unknown lifecycle modes without falling back to v1', () => {
  assert.throws(() => parseLifecycleMode(['--lifecycle-mode']), /Unsupported lifecycle mode/)
  assert.throws(() => parseLifecycleMode(['--lifecycle-mode', 'v3']), /Unsupported lifecycle mode/)
})

test('C1 explicit v2 CLI boundary does not initialize a legacy shadow runtime', () => {
  const root = mkdtempSync(join(tmpdir(), 'hermes-c1-cli-'))
  const runtime = join(root, 'legacy-runtime')
  try {
    const script = fileURLToPath(new URL('../hermes-run.mjs', import.meta.url))
    const result = spawnSync(process.execPath, [script, '--lifecycle-mode', 'v2-checkpoint'], { encoding: 'utf8', env: { ...process.env, HERMES_RUNTIME_DIR: runtime } })
    assert.equal(result.status, 2)
    assert.match(result.stderr, /Single Front Door/)
    assert.equal(existsSync(runtime), false)
  } finally { rmSync(root, { recursive: true, force: true }) }
})

test('C1 hermes-run wrapper delegates to checkpoint runner without mutating terminal state', () => {
  const mission = createMissionState({ missionId: 'MISSION-C1-COMPAT' })
  mission.state = 'COMPLETED'; mission.stage = 'completed'
  let saves = 0
  const result = executeCheckpointMissionV2({ missionId: mission.missionId, resume: true }, { store: { load: () => structuredClone(mission), save: () => { saves += 1 } } })
  assert.equal(result.code, 'HERMES_V2_RESUME_TERMINAL')
  assert.equal(result.mission.state, 'COMPLETED')
  assert.equal(saves, 0)
})
