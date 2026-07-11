# Codex Worker Adapter

`scripts/hermes-worker-codex.mjs` converts a validated Hermes mission packet into a guarded Codex CLI invocation. It targets Codex CLI only and does not depend on Codex Desktop.

## Commands

```bash
npm run hermes:codex -- <packet>                 # dry-run (default)
npm run hermes:codex -- dry-run <packet>
npm run hermes:codex -- execute <packet> --authorized-by-dispatch
npm run hermes:codex -- status <mission-id>
npm run hermes:codex -- cancel <mission-id>
```

Execution requires a `RUNNING` mission and a safe, authorized `codex-cli` assignment created by the dispatcher. The adapter re-verifies the repository root and branch, selects low/medium/high reasoning effort, sends the packet through stdin, and requests the narrowest sandbox appropriate to the packet. It never pushes or merges.

## CLI compatibility and precedence

The worker pins `gpt-5.5` and invokes `codex exec` with `--ignore-user-config --model gpt-5.5`, so the worker model does not inherit a newer or incompatible model from `~/.codex/config.toml`. Authentication still comes from the normal Codex home.

Model precedence for Hermes execution is therefore: adapter `--model gpt-5.5` → Codex bundled metadata. User config and profiles are ignored for the worker invocation. Reasoning precedence is: a valid mission value (`low`, `medium`, or `high`) → Hermes task heuristic → the adapter's `--config model_reasoning_effort=...` CLI override. Hermes intentionally permits only low/medium/high.

For a writing mission, the adapter requests the CLI-supported `--sandbox workspace-write --cd <approved-root>` combination. Because `--ignore-user-config` also ignores the user-level Windows sandbox backend, native Windows invocations additionally pass `-c windows.sandbox="elevated"`. Explicitly read-only missions retain `--sandbox read-only`; the backend selection does not broaden that mission policy. Non-Windows invocations do not receive the Windows override.

A host can still impose a stricter effective sandbox. The adapter records both requested and effective modes and blocks a writing mission when the effective mode is not `workspace-write`. It never escalates to `danger-full-access`.

This is platform-specific, fail-closed compatibility handling, not a claim that every host grants workspace writes. Network remains governed by the existing environment and sandbox policy. The prompt and post-execution checks continue to enforce the packet allowlist, protected-path checks, and centralized locks.

A process exit code of zero is only transport success. The adapter also requires a passing worker closeout, every declared output to exist and be changed, no out-of-scope writes, no blocking quota evidence, and an effective write-capable sandbox for writing missions. A non-passing closeout, failed objective, or sandbox downgrade records the execution as `BLOCKED`; a process or scope failure records it as `FAILED`.

For every writing mission, the final Codex response is a required Closeout Packet v3 contract, not optional prose. The prompt enumerates every schema heading, requires an explicit supported review verdict, requires Files Changed to match the actual verified changes, and requires truthful validation/blocker evidence. The parser accepts one leading plain, inline-code, or quoted path, with an optional annotation introduced by whitespace plus `-` or an em dash, or by `:`. It normalizes safe wrappers before exact comparison, while rejecting unmatched or embedded formatting, multiple paths, invalid suffixes, traversal, wildcards, prose, missing headings, unsupported verdicts, and file-list mismatches. Approval contradictions are interpreted from structured Closeout sections only: Review Recommendation, Validation, and optional Blockers, Evidence Gaps, and Risk / Exceptions. Diagnostic prose elsewhere cannot veto an explicit recommendation. Runtime v1 does not perform a second closeout-only worker pass; malformed closeouts fail closed.

Required validation is not delegated to the worker. After worker scope/output verification, the trusted Hermes runner executes the packet's exact checks and records the evidence. On Windows it invokes `npm.cmd`; temporary validation writes are limited to `.hermes/`, `node_modules/.tmp/`, and `dist/`, while source, docs outputs, protected paths, and package files remain outside the validation allowlist.

Logs and the last Codex response are stored under `.hermes/executions/<mission-id>/`. Runtime metadata is stored in `.hermes/runtime/runtime.json`. Known secret-like values are redacted before logs are written.

`cancel` reports `NOT_SUPPORTED` because this initial adapter uses a synchronous CLI process and cannot prove that cross-process cancellation is safe. Quota is never inferred; without evidence the adapter reports: **Codex quota status: unknown — evidence required.**

