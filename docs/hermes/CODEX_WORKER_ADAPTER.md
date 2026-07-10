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

Execution requires a `RUNNING` mission and a safe, authorized `codex-cli` assignment created by the dispatcher. The adapter re-verifies the repository root and branch, selects low/medium/high reasoning effort, sends the packet through stdin, and uses a workspace-write sandbox. It never pushes or merges.

## CLI compatibility and precedence

The worker pins `gpt-5.5`, which is present in the bundled model catalog shipped with the locally supported Codex CLI `0.133.0`. It invokes `codex exec` with `--ignore-user-config --model gpt-5.5`, so the worker model does not inherit a newer or incompatible model from `~/.codex/config.toml`. Authentication still comes from the normal Codex home.

Model precedence for Hermes execution is therefore: adapter `--model gpt-5.5` → Codex bundled metadata. User config and profiles are ignored for the worker invocation. Reasoning precedence is: a valid mission value (`low`, `medium`, or `high`) → Hermes task heuristic → the adapter's `--config model_reasoning_effort=...` CLI override. Codex CLI `0.133.0` also lists `xhigh`, but Hermes intentionally recommends only low/medium/high.

Logs and the last Codex response are stored under `.hermes/executions/<mission-id>/`. Runtime metadata is stored in `.hermes/runtime/runtime.json`. Known secret-like values are redacted before logs are written.

`cancel` reports `NOT_SUPPORTED` because this initial adapter uses a synchronous CLI process and cannot prove that cross-process cancellation is safe. Quota is never inferred; without evidence the adapter reports: **Codex quota status: unknown — evidence required.**

