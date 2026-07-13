# Hermes Runner Loop

> Runtime State Model v2 checkpoint ownership, migration, resume, and compatibility are documented in [RUNTIME_STATE_MODEL_V2.md](./RUNTIME_STATE_MODEL_V2.md). The existing v1 loop remains the default until an operator explicitly selects a supported v2 entry boundary.

The runner processes one mission per explicit invocation. It is not a daemon and performs no background polling.

```bash
npm run hermes:run -- <mission-packet>          # dry-run default
npm run hermes:run -- --dry-run <mission-packet>
npm run hermes:run -- --execute <mission-packet>
npm run hermes:run -- --resume <mission-id> --no-commit
npm run hermes:run -- --resume <mission-id> --commit-message "docs: explicit message"
npm run hermes:run -- --status <mission-id>
```

The completion flow is worker execution → output and scope verification → actual worker closeout → Hermes review → final closeout → mission sync → final-state verification → recorded validation-gate verification → optional policy-gated local commit. A commit cannot run before the final closeout exists, sync succeeds, and the synchronized state is validly `COMPLETED`. Duplicate mission IDs and duplicate active executions are rejected. `--resume` is required for a mission already known to the runtime.

Writing packets default to `output_required: true`; their `required_outputs` default to `allowed_files` unless explicitly listed. Read-only analysis must opt in with `output_required: false`. The runner reviews the worker's actual closeout, not a provisional Hermes-generated closeout, and moves to `COMPLETED` only when the review reports `completion_ready` with verified execution, outputs, objective, closeout, checks, and no blocking evidence. Failed or contradictory work remains `BLOCKED` or `FAILED` and receives an append-only completion-rejection event.

Dry-run creates a resumable mission, assignment preview, and provisional Closeout Packet v3 without worker execution. Execute is a manual authorization for the dispatcher; HIGH/CRITICAL or protected scopes still stop for Por. `--no-commit` always disables commit. `--commit-message` overrides the default `chore(hermes): complete <mission-id>` message. Staging is restricted to the reviewed mission changes and refuses any unrelated pre-staged path. Locks are released after completion or failure. No path in the runner can push or merge.

