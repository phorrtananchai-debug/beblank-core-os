# Agents — BeBlank Core OS

This repo uses a multi-agent orchestration workflow. Each agent has a defined role, scope, and routing rules.

---

## Agent Roles

| Agent | Role | Scope |
|-------|------|-------|
| **Por** | Product Owner, Design Director, Chief Architect, final approver | Full — only human who can approve commits, merges, and pushes |
| **ChatGPT** | Mission architect, safety planner, decision framing | Produces plans and risk analyses. Does NOT access repos or code. |
| **Hermes** | Front door, memory, QA, closeout reviewer, CLI delegation router | Read-only for repos. Routes to Codex CLI and OpenCode CLI. |
| **DS / OpenCode** | Fast executor | Docs, UI scaffold, small safe changes, verification in branches. |
| **Codex** | Architecture, difficult refactor, deep review, tech debt | Used for deep reasoning via Hermes routing. Read-only for production repos. |

---

## Hermes/Codex/OpenCode Routing

| Route | When to Use |
|-------|-------------|
| **Hermes Direct** | Memory, QA, closeout, docs/reports, state updates, low-risk planning |
| **Codex CLI** (read-only) | Repo inspection, architecture review, technical debt scan, deep code review |
| **Codex CLI** (workspace-write) | Only after explicit Por approval with branch + scope + DoD + build/evidence + rollback |
| **OpenCode CLI** | Sandbox fast-worker tasks only — not approved for production repos yet |

---

## Local-First Orchestration (Jarvis B)

Jarvis B is the local coordination layer. See [`JARVIS.md`](JARVIS.md) for the full orchestration manual and packet lifecycle.

Core folders:

- `.jarvis/state/` — current operating context and constraints
- `.jarvis/agents/` — agent instruction files
- `.jarvis/tasks/` — task packet pipeline (inbox → running → done/failed)
- `.jarvis/reports/` — review and verification reports
- `.jarvis/logs/` — execution logs and trace notes

---

## Key Documents

| File | Purpose |
|------|---------|
| [`docs/AGENT_ONBOARDING.md`](docs/AGENT_ONBOARDING.md) | Start here: setup, safety rules, workflow, closeout checklist |
| [`docs/HERMES_HANDOFF_PROTOCOL.md`](docs/HERMES_HANDOFF_PROTOCOL.md) | Cross-agent handoff packets, rules of engagement |
| [`docs/CURRENT_AI_WORKFLOW_STATE.md`](docs/CURRENT_AI_WORKFLOW_STATE.md) | Current state snapshot: latest commit, branches, open questions |
| [`JARVIS.md`](JARVIS.md) | Jarvis B orchestration manual |
| [`docs/agents/JARVIS_DASHBOARD.md`](docs/agents/JARVIS_DASHBOARD.md) | Jarvis Dashboard v0.1 — monitoring surface docs |
