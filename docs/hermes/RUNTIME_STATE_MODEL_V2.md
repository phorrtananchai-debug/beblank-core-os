# Hermes Runtime State Model v2

## Status and boundary

Runtime State Model v2 is an opt-in orchestration foundation. It adds versioned mission state, approval/cancellation/resume primitives, state-neutral execution adapters, runner-owned checkpoints, and an explicit v1 migration command.

The existing v1 runner remains the default. Natural-language intake and the Single Front Door are not implemented by Phase 7.4 and must not be inferred from this document. The v2 checkpoint runner is exposed programmatically through `executeCheckpointMissionV2`; CLI intake for new v2 missions remains deferred.

No Hermes v2 component permits push.

## Canonical mission states

Schema v2 recognizes:

```text
INTAKE
NEEDS_CLARIFICATION
PLANNED
AWAITING_APPROVAL
QUEUED
RUNNING
VALIDATING
REVIEWING
COMPLETED
BLOCKED
FAILED
CANCELLED
```

`COMPLETED`, `FAILED`, and `CANCELLED` are terminal. A terminal mission cannot execute, resume, retry, or transition to another state.

Normal execution follows:

```text
INTAKE → PLANNED → AWAITING_APPROVAL (when required) → QUEUED
QUEUED → RUNNING → VALIDATING → REVIEWING → COMPLETED
```

Failures may move a non-terminal mission to `BLOCKED`, `FAILED`, or `CANCELLED`. `COMPLETED` requires accepted review, valid closeout, and completed sync evidence. Optional commit is evaluated only after sync and before the final completion transition.

## Persisted layout

V2 records live beside, not inside, the legacy runtime store:

```text
.hermes/state/missions/<MISSION_ID>/
  mission.json
  events.jsonl
  packet/
  plan/
  approval/
  baseline/
  attempts/
    001/
      worker-start/
      worker/
      validation/
      review/
      closeout/
      sync/
      commit/
```

Mission state and attempt evidence use temporary-file plus rename writes. Events are append-only JSONL. Each event is attributed to the runner or migration command, and `mission.json.lastEventId` identifies the latest recorded lifecycle event.

V1 records remain in the existing centralized runtime files. Loading a v1 record may produce a conservative in-memory v2 view, but reading never writes or migrates it.

## Lifecycle primitives

Phase 7.4B provides reusable primitives for:

- versioned approval requests and approvals;
- packet, plan, scope, risk, execution, and commit approval validation;
- stale approval detection;
- non-destructive cancellation and mission-owned lock release;
- blocker-resolution evidence;
- checkpoint-aware resume planning;
- queue, dispatch, resume, and commit eligibility.

Approval does not bypass protected paths, validation, review, closeout, sync, or selective-commit checks.

## Evidence-first execution adapters

Phase 7.4C0 provides state-neutral boundaries for:

- worker preparation, confirmed start, and result capture;
- dispatch preparation, lock acquisition, and confirmed worker start;
- runner-owned exact validation commands;
- legacy review verdict normalization;
- strict Closeout Packet v3 validation;
- evidence-only sync;
- selective commit.

These adapters return structured evidence and never write `mission.json`, append lifecycle events, create legacy shadow missions, or authorize push. Worker output is evidence, not the authority for mission success.

## Runner checkpoints

Phase 7.4C1 makes the runner the lifecycle owner:

1. Dispatch preparation verifies `QUEUED`, lifecycle mode, packet hash, plan hash, and lock evidence.
2. Confirmed worker-start evidence is persisted before `QUEUED → RUNNING`.
3. Worker-result evidence must report a finished process before the worker checkpoint completes.
4. The runner persists exact validation evidence before `RUNNING → VALIDATING → REVIEWING` can advance.
5. Strict Closeout Packet v3 validation compares claimed files with observed files.
6. Structured review must map to `ACCEPTED`.
7. Sync evidence must succeed.
8. An optional selective commit may run only after sync. A failed commit vetoes completion.
9. The runner transitions `REVIEWING → COMPLETED` only after every required checkpoint is persisted.

Evidence-write failure stops execution before the following state transition. Validation, closeout, review, and sync failure record an exact blocker checkpoint. An uncertain `RUNNING` worker is never overlapped.

## Resume and retry

Resume continues from the first incomplete persisted checkpoint. A completed worker checkpoint is not rerun.

A `RUNNING` mission without completed worker evidence is treated as uncertain and requires explicit retry rather than launching a second worker. Retry from `BLOCKED` requires matching blocker-resolution evidence and an explicit checkpoint. A retry creates a new numbered attempt and retains earlier attempts unchanged.

Terminal missions cannot resume or retry.

## Explicit v1 migration

Migration is never implicit. Use the script directly; no package script is installed in Phase 7.4D.

Inspect without writing:

```powershell
node scripts/hermes-migrate-v2.mjs --mission <MISSION_ID> --dry-run
```

Apply after reviewing the dry-run result:

```powershell
node scripts/hermes-migrate-v2.mjs --mission <MISSION_ID> --apply --confirm <MISSION_ID>
```

The exact confirmation prevents accidental migration of a different mission.

### Eligibility and conflicts

Migration fails closed when:

- the mission ID is invalid or missing;
- the v1 source does not exist;
- the legacy state is unknown, ambiguous, `ARCHIVED`, or `RUNNING`;
- the mission is queued;
- an active assignment or running execution exists;
- an unreleased mission lock exists;
- a v2 target directory already exists;
- the source changes between inspection and apply.

Migration does not dispatch, queue, resume, review, sync, stage, commit, or push.

Historical `COMPLETED` and `FAILED` sources remain terminal and mark v2 execution checkpoints `not-required`, because migration does not fabricate v2 execution evidence. Other non-terminal legacy states are imported conservatively as `BLOCKED` with their intended mapped state recorded in the migration blocker. An operator must supply blocker-resolution evidence and select an explicit retry checkpoint before execution can continue.

### Migration evidence

Successful migration preserves the original v1 record byte-for-byte and writes:

```text
baseline/legacy-source.json
baseline/migration-manifest.json
events.jsonl              (MISSION_MIGRATED)
mission.json              (schemaVersion 2)
```

The manifest records the migration ID, source reference, source state and SHA-256, target state and SHA-256, target directory, rollback preconditions, timestamp, and no-push flags.

An apply failure removes only the newly created partial v2 directory. It never rewrites the v1 source.

## Rollback and operator recovery

Rollback is explicit:

```powershell
node scripts/hermes-migrate-v2.mjs --mission <MISSION_ID> --rollback --confirm <MISSION_ID>
```

Rollback verifies that both the current v1 source hash and v2 target hash match the migration manifest. A mismatch stops without moving either record.

When verification passes, rollback archives the v2 directory under:

```text
.hermes/state/migration-rollbacks/<MISSION_ID>-<MIGRATION_ID>/
```

The archive retains the migrated state, migration manifest, source snapshot, events, and `baseline/rollback-record.json`. The v1 source remains authoritative and unchanged.

For a blocked runtime mission, inspect `mission.json`, `events.jsonl`, the current attempt evidence, and blocker code. Record blocker-resolution evidence before retrying the exact checkpoint. Never delete earlier attempts or rewrite historical evidence.

## Compatibility and limitations

- `legacy-v1` remains the default runner lifecycle mode.
- V1 APIs and state files remain supported and are not silently redirected to v2.
- V2 adapters do not call v1 mutation paths.
- Migration creates a v2 copy while preserving v1 evidence; it does not automatically change which runtime an operator invokes.
- CLI intake for `v2-checkpoint` is intentionally unavailable until Single Front Door work.
- No migration, runner, adapter, approval, or prompt may grant push permission.
- Phase 7.4 does not reconcile historical v1 mission evidence or infer missing evidence.

## Validation

Focused tests live under `scripts/__tests__/` and use disposable runtime roots and Git repositories. The combined suite covers state transitions, store atomicity, approvals, cancellation, resume, eligibility, state-neutral boundaries, strict closeout, runner checkpoints, migration, rollback, and v1 compatibility.
