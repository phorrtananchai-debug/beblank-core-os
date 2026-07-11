# Hermes Runtime v1 Operating Guide

**Purpose:** Document the Hermes Runtime v1 behavior implemented in this repository. This guide describes the current scripts and state model; it does not describe planned or unimplemented behavior.

## Runtime Purpose

Hermes Runtime v1 is the local-first mission orchestration layer for BeBlank Core OS. It turns validated task packets into tracked missions, assigns safe workers, records runtime state, runs Codex CLI when authorized, reviews completion evidence, syncs closeouts into local mission state, and optionally creates a local commit after completion gates pass.

The runtime is implemented as Node scripts under `scripts/` and JSON state under `.hermes/runtime/`. It does not run as a service, watcher, daemon, cloud gateway, or background scheduler. Commands are operator-driven through npm scripts.

## Architecture

### Packet

Task packets are markdown files parsed by `scripts/hermes-runtime-store.mjs`. A packet may use YAML-like frontmatter and required markdown sections. Runtime parsing extracts:

- `mission_id`, `mission`, `agent_role`, `repo`, `branch`, and `approval_gate`.
- `allowed_files`, `forbidden_files`, `required_checks`, `output_required`, and `required_outputs`.
- Required section content from `Mission`, `Allowed Files`, `Forbidden Files`, `Evidence`, `Approval`, and `Closeout`.

Writing missions must declare allowed files and required outputs. A writing mission is not treated as complete unless required outputs exist and were created or modified relative to the mission baseline.

### Planner and Dispatch

`scripts/hermes-dispatch.mjs` validates the packet, classifies risk, detects protected path categories, chooses a worker, checks central locks, and records an assignment in `.hermes/runtime/runtime.json`.

Dispatch states:

- If the packet is valid, locks are safe, a worker is ready, and Por authorization is provided when required, the mission becomes `RUNNING`.
- If approval is required and `--authorize` is not supplied, the mission becomes `WAITING_APPROVAL`.
- If validation fails, protected/high-risk scope requires a human, or locks block the scope, the mission becomes `BLOCKED`.
- OpenCode and DeepSeek requests are classified as `ADVISORY_ONLY`; execution is not implemented for them.

### Capability Registry

`scripts/hermes-agent-registry.mjs` reads `.hermes/state/agent-registry.json`, or copies `.hermes.example/state/agent-registry.example.json` into `.hermes/state/` if needed. It supports:

- `list`
- `capabilities`
- `agent <id>`
- `route <capability>`

The dispatcher also seeds `.hermes/runtime/agents.json` from the same registry source during runtime initialization.

### Queue

`scripts/hermes-queue.mjs` manages `.hermes/runtime/mission-store.json` and `.hermes/runtime/queue.json`. It supports `init`, `list`, `enqueue`, `next`, `start`, `block`, `pause`, `resume`, `review`, `approval`, `complete`, `fail`, `archive`, and `status`.

The queue is local JSON state, not a background worker. `next` returns the first queued mission whose state is `PENDING`.

### Dispatcher

The dispatcher assigns work but does not itself execute Codex. It records:

- Selected worker and worker status.
- Risk and capabilities.
- File scope and protected path categories.
- Lock verdict.
- Cost/quota note.
- Approval state.
- Safe-to-run status.
- Command preview.

When a mission is safe and authorized, it acquires a runtime lock for the packet's allowed files.

### Worker Adapter

`scripts/hermes-worker-codex.mjs` implements the Codex CLI adapter. It supports:

- `dry-run <packet>`
- `execute <packet> --authorized-by-dispatch`
- `status <mission-id>`
- `cancel <mission-id>`

`cancel` returns `NOT_SUPPORTED`; safe cancellation is not implemented for synchronous Codex CLI execution.

The adapter verifies the repository path and branch, detects Codex CLI availability, builds the Codex prompt, runs Codex synchronously when authorized, saves redacted stdout/stderr logs, records execution metadata, checks changed files against the mission baseline, detects outside-scope changes, inspects the worker closeout, checks objective completion, and records execution status.

### Runner

`scripts/hermes-run.mjs` is the end-to-end mission runner. It can:

- Enqueue a mission and record baseline git status and baseline `HEAD`.
- Dispatch the mission.
- Run Codex CLI for authorized Codex assignments.
- Review the mission.
- Write a final closeout under `.hermes/closeouts/`.
- Sync the closeout.
- Release locks and remove completed missions from the queue.
- Optionally create a local commit after all completion and commit gates pass.

The runner only implements executable worker flow for Codex CLI. It refuses duplicate mission execution unless `--resume` is used where supported.

### Runner-Owned Validation

For Codex writing missions, the worker is responsible for producing the approved mission outputs and a complete Closeout Packet v3. The worker is not the authority for final validation. After worker execution, the trusted Hermes runner and review layer perform the packet's exact declared `required_checks`, record validation evidence in runtime/review state and the final closeout, and decide whether the mission may complete.

This separation lets worker execution stay limited to mission output scope while runner-owned validation occurs afterward under runtime control. Runtime-approved writes are limited to the packet's allowed outputs plus Hermes runtime, closeout, log, lock, queue, history, and temporary files needed to capture evidence, release locks, sync state, and optionally stage a reviewed local commit. Product files outside the packet's approved scope are not accepted as validation side effects.

### Approved Output Fingerprints

For writing missions, the runner captures a content-aware output baseline for the packet's approved `allowed_files` scopes before execution. The baseline is stored on the mission as `output_baseline`; the Codex adapter and review layer capture fresh output fingerprints after execution and compare them with the baseline.

Each fingerprint records the approved scope, capture time, capture errors, and a deterministic entry list for the scoped output root. Entries record:

- Relative path.
- Existence.
- Diagnostic tracked/untracked status from `git ls-files`.
- File type: missing, regular file, symlink, or directory.
- Size for regular files.
- SHA-256 content hash for regular files.
- SHA-256 link-target hash for symlinks.

Directory scopes are captured as deterministic recursive manifests: the directory entry is recorded, child names are sorted, and every child entry is fingerprinted recursively. Runtime accepts explicit paths, trailing-slash directory scopes, and `/**` directory scopes for output fingerprinting. Unsupported wildcard output scopes and scopes that escape the repository are capture errors.

Fingerprint comparison detects approved-output creation, deletion, type changes, regular-file content changes, and symlink target changes. This is content-aware, so edits to pre-existing untracked output files are detected by hash even when Git status alone cannot describe the content delta. Mtime-only changes are not accepted as output changes because mtimes are not part of the fingerprint.

Git status deltas remain part of mission change and scope detection. Runtime unions Git status changes with approved-output fingerprint changes, then checks the combined changed-file set against allowed and forbidden scopes. Only approved `allowed_files` scopes are fingerprinted; unrelated files outside those scopes are still evaluated through Git status when they appear there, but they are not included in output fingerprint manifests.

Fingerprint capture fails closed. Baseline capture errors stop runner enqueue. Post-execution or review capture errors become output fingerprint failures, block objective completion, and produce `NEEDS_REWORK` or blocked execution evidence rather than accepting the mission.

### Review

`scripts/hermes-review-runtime.mjs` reviews runtime evidence for a mission. It checks:

- Packet validity.
- Changed files since mission baseline.
- Outside-scope and forbidden file changes.
- Git conflicts.
- Whether `HEAD` changed before review.
- Worker closeout completeness.
- Worker closeout recommendation.
- Required output creation/modification.
- Required checks for completed executions.
- Protected/high-risk scope.
- Codex quota block evidence.

Review verdicts are `AUTO_ACCEPT`, `ACCEPT_WITH_WARNINGS`, `HOLD_FOR_EVIDENCE`, `NEEDS_REWORK`, `HUMAN_REQUIRED`, and `REJECT`.

For completed executions, review runs the packet's declared `required_checks` after normalizing each entry. The implemented normalization is exact:

- `npm test` runs only when the packet explicitly declares `npm test`, and it fails closed if `package.json` has no `test` script.
- `npm run <script>` runs only that exact configured npm script. Script names that contain words such as `test`, `lint`, or `build` do not imply any additional checks.
- Trailing arguments on `npm run <script>` are preserved, such as `npm run hermes:runtime -- doctor`.
- Duplicate exact command strings are deduplicated.
- Malformed commands, empty entries, non-npm commands, and unknown npm scripts become failing required-check results.

### Closeout

Closeouts follow `docs/hermes/CLOSEOUT_PACKET_V3.md`. Runtime-generated closeouts include mission metadata, changed files, inspected files, commands, validation, risk, scope, evidence, recommendation, git confirmation, remaining risks, and next mission.

The Codex worker prompt also requires the worker's final response to include one complete Closeout Packet v3, not free-form success prose. The worker closeout contract requires all 17 schema headings: Mission Metadata, Task Summary, Files Changed, Files Inspected, Commands Run, Screenshots / QA Artifacts, Validation, Risk Score, Confirmed NOT Modified, Cost / Quota, Scope Summary, Evidence Summary, Review Recommendation, Reopen Criteria, Git Confirmation, Risks / Remaining Issues, and Suggested Next Mission.

The implemented worker closeout parser tolerates harmless heading-level and whitespace variation, but it fails closed when required headings are missing, the review recommendation is missing or unsupported, the closeout claims `APPROVE` while also containing blocking verdict text, or the Files Changed section disagrees with the verified mission changed-file set. Files Changed entries may contain one leading verified file path followed by an optional human-readable annotation introduced by whitespace plus `-`, an em dash, or `:`; review extracts the canonical path and compares only that path against the verified mission changed-file set. Files Changed comparison is exact after path normalization: list bullets, leading `./`, Windows separators, and one balanced pair of inline-code backticks, single quotes, or double quotes around a path are normalized before comparison. Malformed or embedded formatting, whitespace inside a path, traversal segments, wildcards, prose, missing paths, and scope mismatches are rejected instead of being guessed. Supported worker closeout recommendations are `APPROVE`, `REVISE`, `HOLD FOR EVIDENCE`, and `REJECT`; `HOLD FOR EVIDENCE`, `BLOCKED`, `FAILED`, `NEEDS REWORK`, `REJECT`, `UNKNOWN`, contradictory, malformed, incomplete, or missing worker closeouts are non-passing. Runtime v1 does not run a closeout-only repair pass, so malformed worker closeouts remain blocking evidence for the mission.

The review layer blocks completion if the worker closeout is missing, incomplete, non-passing, or has a blocking recommendation.

Review interpretation is section-aware. The structured Closeout Packet v3 sections for recommendation, validation, blockers, evidence gaps, risk exceptions, changed files, and git confirmation are the authoritative worker claims evaluated by runtime review. Narrative diagnostic prose can explain those claims, but it does not override a structured non-passing recommendation, failed validation evidence, blocker, evidence gap, risk exception, missing required output, or verified scope mismatch.

### Sync

`scripts/hermes-sync.mjs` reads a Closeout Packet v3 and writes legacy mission state to `.hermes/state/current-missions.json`. It also updates centralized runtime state in `.hermes/runtime/mission-store.json` and appends `CLOSEOUT_SYNCED` history.

Completion-safe sync rules are implemented:

- Failed, blocked, and needs-rework states keep precedence over later approval text.
- `COMPLETED` requires explicit completion evidence when transitioning from a non-completed state.
- An approved closeout without completion evidence syncs to `WAITING_APPROVAL`, not `COMPLETED`.

## Runtime State Files

Runtime state lives in `.hermes/runtime/` unless `HERMES_RUNTIME_DIR` points elsewhere.

| File | Purpose |
|---|---|
| `mission-store.json` | Mission records and states |
| `queue.json` | Queued mission IDs |
| `runtime.json` | Active assignments and execution records |
| `agents.json` | Runtime agent registry snapshot |
| `locks.json` | Active and released mission locks |
| `history.json` | Runtime events |

All state files are versioned with `version: 1`. Writes use an atomic temp-file and rename flow with `.bak` backup support.

## Lifecycle and State Transitions

Implemented mission states:

- `PENDING`
- `RUNNING`
- `WAITING_REVIEW`
- `WAITING_APPROVAL`
- `BLOCKED`
- `NEEDS_REWORK`
- `COMPLETED`
- `FAILED`
- `PAUSED`
- `ARCHIVED`

The queue command enforces these manual transitions:

| From | To |
|---|---|
| `PENDING` | `RUNNING`, `BLOCKED`, `PAUSED`, `FAILED` |
| `RUNNING` | `WAITING_REVIEW`, `WAITING_APPROVAL`, `BLOCKED`, `NEEDS_REWORK`, `PAUSED`, `COMPLETED`, `FAILED` |
| `WAITING_REVIEW` | `WAITING_APPROVAL`, `RUNNING`, `BLOCKED`, `NEEDS_REWORK`, `COMPLETED`, `FAILED` |
| `WAITING_APPROVAL` | `RUNNING`, `BLOCKED`, `COMPLETED`, `FAILED` |
| `BLOCKED` | `PENDING`, `RUNNING`, `PAUSED`, `FAILED` |
| `NEEDS_REWORK` | `PENDING`, `RUNNING`, `PAUSED`, `FAILED` |
| `PAUSED` | `PENDING`, `RUNNING`, `FAILED` |
| `COMPLETED` | `ARCHIVED` |
| `FAILED` | `PENDING`, `ARCHIVED` |
| `ARCHIVED` | none |

`updateMissionState()` adds an extra completion invariant: missions in `FAILED`, `BLOCKED`, or `NEEDS_REWORK` cannot become `COMPLETED`, and any transition to `COMPLETED` requires `completion_evidence.ready === true`.

## Supported Workers

### Hermes Direct

Hermes Direct is selected by dispatch for documentation-only, low-risk work that does not require UI implementation or architecture review. Runtime records the assignment as `Hermes Direct (in-process, no external command)`. End-to-end runner execution is not implemented for Hermes Direct; the runner's executable path expects Codex CLI.

### Codex CLI

Codex CLI is the implemented external worker adapter.

Codex CLI is selected when:

- `agent_role` requests Codex.
- The mission needs architecture review or non-trivial implementation and is not protected/high-risk enough to require human-only handling.

The adapter requires a safe dispatcher assignment before execution. It uses `--ignore-user-config`, `--ephemeral`, `--color never`, `--output-last-message <closeout-path>`, and stdin prompt delivery.

### OpenCode and DeepSeek

OpenCode and DeepSeek are advisory-only in Runtime v1. If requested through `agent_role`, dispatch marks the worker status `ADVISORY_ONLY` and does not execute the mission. The runner does not implement OpenCode or DeepSeek execution.

## Codex Model, Reasoning, and Sandbox

The Codex adapter pins:

- Model: `gpt-5.5`
- Reasoning effort: `low`, `medium`, or `high`

Reasoning effort is resolved from mission state when present. Otherwise:

- `high` for auth, finance, trading, security, core data, or database terms.
- `medium` for architecture, refactor, multi-file, UI, component, or scripts work.
- `low` for other missions.

Sandbox selection:

- Read-only missions use `--sandbox read-only`.
- Writing missions use `--sandbox workspace-write`.
- The writable root is narrowed to the common directory containing the allowed output scopes.
- Scopes that escape the repository are rejected.

On Windows, Codex args include:

```text
-c windows.sandbox="elevated"
```

This is the implemented Windows backend override for both read-only and workspace-write Codex runs. `danger-full-access` is not used by the Runtime v1 adapter.

The adapter detects the effective sandbox from Codex stderr. For writing missions, an effective sandbox downgrade from `workspace-write` blocks completion.

## Commands

All Hermes npm commands currently declared in `package.json`:

| Command | Implementation | Purpose |
|---|---|---|
| `npm run hermes:validate -- <packet>` | `scripts/hermes-validate-packet.mjs` | Validate packet headings and basic packet completeness |
| `npm run hermes:sync -- <closeout.md>` | `scripts/hermes-sync.mjs` | Sync Closeout Packet v3 into local mission state |
| `npm run hermes:agents -- <command>` | `scripts/hermes-agent-registry.mjs` | Query agent registry |
| `npm run hermes:route -- <packet>` | `scripts/hermes-route-task.mjs` | Infer capabilities and risk from a packet, detect protected path categories, and recommend an agent from the registry |
| `npm run hermes:lock -- <packet>` | `scripts/hermes-lock-check.mjs` | Check packet scope against protected paths and active locks |
| `npm run hermes:queue -- <command>` | `scripts/hermes-queue.mjs` | Manage local mission queue and state transitions |
| `npm run hermes:runtime -- <command>` | `scripts/hermes-runtime.mjs` | Initialize, summarize, inspect, and doctor runtime state |
| `npm run hermes:dispatch -- [--authorize] [mission-id]` | `scripts/hermes-dispatch.mjs` | Assign an eligible mission to a worker |
| `npm run hermes:codex -- <mode> <packet-or-id>` | `scripts/hermes-worker-codex.mjs` | Codex dry-run, execute, status, or unsupported cancel |
| `npm run hermes:run -- [--execute] [--no-commit] [--commit-message <message>] <packet>` | `scripts/hermes-run.mjs` | End-to-end mission runner |
| `npm run hermes:review -- <mission-id> [closeout-path]` | `scripts/hermes-review-runtime.mjs` | Review runtime evidence for a mission |
| `npm run hermes:test-integrity` | `scripts/hermes-integrity-test.mjs` | Runtime integrity tests |

Other repository scripts remain available but are not Hermes runtime commands: `dev`, `build`, `lint`, `preview`, `design:review`, `design:screenshots`, and `design:export`.

## Safety and Protected Paths

Runtime protected path classification is implemented in `scripts/hermes-dispatch.mjs` and blocks or escalates:

- `auth` and `src/core/auth`
- `finance`
- `trading`
- `creator`
- `os/brain` and `brain`
- `firebase` and `firestore`
- `.env`, secrets, tokens, and similar secret markers

The legacy lock checker also treats these as protected:

- `src/core/auth`
- `src/finance`
- `src/trading`
- `src/creator`
- Firebase config paths
- `.env`

Protected or high-risk scope requires human handling and prevents automatic completion. Runtime review also rejects or escalates forbidden file changes, outside-scope changes, conflicts, unexpected `HEAD` changes, failed checks, quota blocks, missing closeouts, and missing required outputs.

## Locks and Conflicts

Central locks live in `.hermes/runtime/locks.json`. Dispatch checks active locks before assigning a mission. If a different active lock overlaps a packet allowed file, dispatch reports `BLOCKED`.

When dispatch safely starts a mission, it writes a running lock with:

- `mission_id`
- `worker`
- `files`
- `acquired`
- `status`

The runner releases locks after completion, blocked review, needs-rework review, or failure. Runtime doctor warns about stale unreleased locks older than 24 hours and reports completed missions that still have unreleased locks as issues.

Review checks git conflict status codes such as unmerged paths and blocks completion when conflicts are present.

## Zero Interrupt Policy

Runtime v1 avoids interrupting active or completed work:

- Duplicate mission IDs are refused on enqueue.
- Already-running missions require `--resume` where resume is supported.
- Terminal `COMPLETED` and `ARCHIVED` missions cannot be resumed by the runner.
- Existing completed executions are not rerun unless the runner is explicitly resuming and can reuse evidence.
- The Codex adapter does not implement safe cancellation; `cancel` reports `NOT_SUPPORTED`.

## Auto-Commit, Push, and Merge

Runtime v1 can create a local commit, but only after final closeout, sync, review, scope, check, and completion gates pass.

Commit eligibility requires:

- Final mission state is `COMPLETED`.
- Sync preserved `COMPLETED`.
- Final closeout exists.
- Review accepted verified completion with `AUTO_ACCEPT` or `ACCEPT_WITH_WARNINGS`.
- Approved changed files exist.
- Risk is `LOW` or `MEDIUM`.
- No protected paths, outside-scope files, forbidden files, or conflicts.
- All required validation checks passed.
- Worker closeout passed.
- Objective verification passed.

Commit controls:

- Default behavior: commit is enabled after successful runner completion.
- `--no-commit`: disables the local commit even after successful completion.
- `--commit-message <message>`: supplies a custom local commit message.
- Default commit message: `chore(hermes): complete <mission-id>`.

Before committing, the runner stages only reviewed changed files and verifies the staged scope exactly matches approved changed files.

Runtime v1 never pushes and never merges. Runner results set `pushed: false` and `merged: false`. Push and merge remain Por-controlled outside the runtime.

## Por Workflow

Por is the approval gate for mission authorization and all pushes/merges.

Implemented flow for a Codex writing mission:

1. Por provides a validated packet with branch, scope, forbidden paths, required outputs, checks, evidence, approval, and closeout requirements.
2. `hermes:run --execute` enqueues the mission and records baseline status and `HEAD`.
3. Dispatch requires authorization for approval-gated missions and records the worker assignment.
4. Codex CLI executes only after safe authorized dispatch.
5. Review verifies changed files, outputs, closeout, checks, locks, conflicts, protected paths, quota evidence, and completion evidence.
6. Sync updates local mission state.
7. Optional local commit occurs only if gates pass and commit is enabled.
8. Push and merge require explicit Por action outside Runtime v1.

For approval-gated missions run through dispatch without authorization, the mission waits in `WAITING_APPROVAL`.

## Doctor and Troubleshooting

Use:

```text
npm run hermes:runtime -- doctor
```

Doctor checks that all runtime state files exist, parse as JSON, match version `1`, and satisfy basic schema rules. It also checks for:

- Orphan queue entries.
- Terminal missions still queued.
- Pending missions missing from queue.
- Invalid mission states.
- Running missions without active assignments.
- Completed missions with unreleased locks.
- Orphan locks.
- Stale locks older than 24 hours.

Exit behavior:

- `0`: healthy, no issues or warnings.
- `1`: warnings present.
- `2`: issues present or command error.

Other useful diagnostics:

- `npm run hermes:runtime -- summary`
- `npm run hermes:runtime -- mission <mission-id>`
- `npm run hermes:runtime -- history [mission-id]`
- `npm run hermes:queue -- status <mission-id>`
- `npm run hermes:codex -- status <mission-id>`
- `npm run hermes:review -- <mission-id> [closeout-path]`

Common blockers:

- Missing or malformed runtime JSON: run `hermes:runtime -- init` only if creating or repairing local runtime state is intended.
- `WAITING_APPROVAL`: rerun dispatch/runner only with explicit Por authorization.
- `BLOCKED`: inspect packet validation, locks, protected paths, and review issues.
- `NEEDS_REWORK`: worker output or evidence exists but does not satisfy objective or closeout gates.
- Sandbox downgrade: writing mission did not get effective `workspace-write`.
- Quota block: Codex stderr matched quota, rate-limit, or usage-limit patterns.
- Required output missing or unchanged: writing mission cannot complete.

## Completion Integrity

Runtime v1 includes integrity tests in `scripts/hermes-integrity-test.mjs`, exposed through:

```text
npm run hermes:test-integrity
```

The integrity suite verifies implemented invariants including:

- Commit happens only after final closeout and sync.
- `--no-commit` prevents commit.
- Custom and default commit messages resolve correctly.
- Failed, blocked, and missing-closeout missions cannot commit.
- Terminal sync precedence preserves veto states.
- Staged scope validation rejects unrelated files.
- Required outputs are enforced for writing missions.
- Codex command generation pins `gpt-5.5`, supported reasoning effort, sandbox mode, and Windows `windows.sandbox="elevated"`.
- Effective read-only sandbox is detected as a workspace-write downgrade.
- Worker HOLD, missing closeout, malformed closeout prose, unknown or contradictory verdicts, Files Changed mismatches, and blocking evidence veto automatic acceptance.
- Read-only missions that explicitly require no output may pass with zero changes.
- Protected paths remain blocked.
- Completion requires verified evidence.

An optional disposable Codex write smoke exists behind the `--codex-write-smoke` argument to the integrity script; it is not run by the package script by default.

## Limits of Runtime v1

- No daemon, watcher, scheduler, or live cancellation.
- No automatic push or merge.
- No executable OpenCode or DeepSeek adapter.
- Hermes Direct can be selected by dispatch but is not executed by the end-to-end runner.
- Runtime state is local JSON, not a database.
- Closeout parsing is markdown-structure based and expects Closeout Packet v3 headings.
- Review runs only the packet's exact normalized required checks for completed executions; it does not infer lint, build, doctor, or test checks unless the packet declares them.
