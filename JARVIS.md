# Jarvis B Orchestrator Manual

Jarvis B is the local coordination layer for BeBlank Core OS.

## Intent

This scaffold gives future automation a simple file-based control plane:

- State files explain what matters now
- Agent files explain who should do what
- Task packets carry work
- Reports capture decisions
- Logs capture execution history

## Local-First Rule

Nothing here depends on a backend. The orchestrator operates from the repository files alone.

## Source of Truth

The most important files are:

- `.jarvis/state/current-focus.md`
- `.jarvis/state/constraints.md`
- `.jarvis/state/repo-map.md`
- `.jarvis/config.example.json`

## Recommended Reading Order

1. [`JARVIS.md`](JARVIS.md) — this file
2. [`AGENTS.md`](AGENTS.md) — agent roles and routing
3. [`docs/AGENT_ONBOARDING.md`](docs/AGENT_ONBOARDING.md) — setup, safety rules, workflow
4. `.jarvis/state/current-focus.md`
5. `.jarvis/state/constraints.md`
6. The task packet in `.jarvis/tasks/inbox/`
7. The relevant agent file in `.jarvis/agents/`

## Task Packet Lifecycle

1. A request is written into `.jarvis/tasks/inbox/`.
2. A runner claims it and copies or moves it to `.jarvis/tasks/running/`.
3. An agent produces implementation, review, or test output.
4. The runner writes a report to `.jarvis/reports/`.
5. The packet is archived in `.jarvis/tasks/done/` or `.jarvis/tasks/failed/`.

## Packet Rules

- Keep one packet focused on one outcome.
- Record the scope, acceptance criteria, and constraints before work starts.
- Prefer small packets that can be handed between agents.
- If a packet changes scope, update the packet in place and note the reason.

## Output Rules

- Keep outputs in markdown or JSON.
- Keep logs append-only where possible.
- Use reports for durable conclusions, not scratch notes.

## Core Folders

| Folder | Purpose |
|--------|---------|
| `.jarvis/state/` | Current operating context and constraints |
| `.jarvis/agents/` | Agent instruction files (Codex, OpenCode, tester, handoff) |
| `.jarvis/tasks/inbox/` | New task packets waiting to be claimed |
| `.jarvis/tasks/running/` | Packets currently in progress |
| `.jarvis/tasks/done/` | Completed packets with reports |
| `.jarvis/tasks/failed/` | Failed packets with notes |
| `.jarvis/reports/` | Review and verification reports |
| `.jarvis/logs/` | Run logs and trace notes |

## Working Rules

- Keep everything local-first.
- Do not add external dependencies.
- Do not modify application logic unless a task packet explicitly calls for it.
- Do not touch auth, Firebase, finance, trading, config, or deployment config unless a task packet explicitly calls for it.
- Prefer markdown and JSON for all orchestration artifacts.

## Future Runner Contract

A future runner should:

1. Read `.jarvis/state/current-focus.md` before taking new work.
2. Pull the next packet from `.jarvis/tasks/inbox/`.
3. Move the packet to `.jarvis/tasks/running/` while processing.
4. Write progress notes to `.jarvis/logs/`.
5. Write verification or review results to `.jarvis/reports/`.
6. Move the packet to `.jarvis/tasks/done/` or `.jarvis/tasks/failed/` when complete.
