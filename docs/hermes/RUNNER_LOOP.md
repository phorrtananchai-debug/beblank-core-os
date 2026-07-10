# Hermes Runner Loop

The runner processes one mission per explicit invocation. It is not a daemon and performs no background polling.

```bash
npm run hermes:run -- <mission-packet>          # dry-run default
npm run hermes:run -- --dry-run <mission-packet>
npm run hermes:run -- --execute <mission-packet>
npm run hermes:run -- --resume <mission-id>
npm run hermes:run -- --status <mission-id>
```

The flow is packet validation → queue → risk/route → lock → dispatch → Codex CLI → closeout → evidence review → state update → policy-gated local commit. Duplicate mission IDs and duplicate active executions are rejected. `--resume` is required for a mission already known to the runtime.

Writing packets default to `output_required: true`; their `required_outputs` default to `allowed_files` unless explicitly listed. Read-only analysis must opt in with `output_required: false`. The runner reviews the worker's actual closeout, not a provisional Hermes-generated closeout, and moves to `COMPLETED` only when the review reports `completion_ready` with verified execution, outputs, objective, closeout, checks, and no blocking evidence. Failed or contradictory work remains `BLOCKED` or `FAILED` and receives an append-only completion-rejection event.

Dry-run creates a resumable mission, assignment preview, and provisional Closeout Packet v3 without worker execution. Execute is a manual authorization for the dispatcher; HIGH/CRITICAL or protected scopes still stop for Por. Locks are released after completion or failure. No path in the runner can push or merge.

