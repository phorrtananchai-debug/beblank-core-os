# Hermes Runtime Architecture

**Purpose:** Map all Hermes runtime components — where they live, how they connect, what is manual today, and what will be automated in future phases.

---

## Runtime Component Map

> **Phase 8.0 update:** The original component map below documents the pre-7.7 layout. The working local-first orchestration path now uses `.hermes/runtime/` as its authoritative six-file state store and the one-shot runner described later in this document.

```
┌─────────────────────────────────────────────────────────────┐
│                    .hermes/ (local, gitignored)              │
│                                                             │
│  inbox/  ──▶  Packet Validator  ──▶  review-queue/          │
│                (7.2)                                        │
│                                                             │
│  outbox/  ◀──  Agent Bridge  ◀──  Review Engine             │
│                (7.5)               (7.4)                    │
│                                                             │
│  closeouts/  ◀──  Hermes Sync CLI  ◀──  (external agents)  │
│                     (7.3)                                   │
│                                                             │
│  state/  ◀──  (derived snapshots from all engines)          │
└─────────────────────────────────────────────────────────────┘
```

---

## Component Breakdown

### 0. Kernel, Queue, Dispatcher, Worker, and Runner (Phases 7.7–8.0)

**Locations:** `scripts/hermes-runtime-store.mjs`, `hermes-queue.mjs`, `hermes-runtime.mjs`, `hermes-dispatch.mjs`, `hermes-worker-codex.mjs`, `hermes-run.mjs`, and `hermes-review-runtime.mjs`.

The kernel owns `mission-store.json`, `queue.json`, `runtime.json`, `agents.json`, `locks.json`, and `history.json` under `.hermes/runtime/`. Writes are atomic, previous valid versions are backed up, and malformed primary state can be restored from backup. The dispatcher creates evidence-bearing assignments without executing paid/advisory workers. The Codex adapter is dry-run by default. The runner handles one explicitly invoked mission and never runs as a watcher, daemon, or service.

Execution remains policy-gated: protected/high-risk scope stops for Por, Codex quota is never guessed, and push/merge are not implemented. Real Codex execution still depends on local CLI authentication, quota, and network availability.

### 1. Packet Validator (Phase 7.2)

**Location:** `scripts/hermes-validate-packet.mjs`

**Purpose:** Validate inbound handoff/task packets against the schema defined in `docs/hermes/PACKET_SCHEMA.md`.

**What it does:**
- Reads a packet from `.hermes/inbox/`
- Validates YAML frontmatter against required schema fields
- Checks that `allowed_files`, `forbidden_files`, `required_checks`, and `approval_gate` are present
- Outputs: PASS / FAIL / MISSING FIELDS

**Current state:** Manual — run explicitly by Hermes or Por.
**Future state:** Could be called automatically when a packet arrives in inbox.

**Depends on:**
- `docs/hermes/PACKET_SCHEMA.md` — schema definition
- `docs/hermes/TASK_PACKET_TEMPLATE.md` — packet format

---

### 2. Hermes Sync CLI (Phase 7.3)

**Location:** `scripts/hermes-sync.mjs`

**Purpose:** Read an external handoff packet (e.g., from Codex Direct) and compare its claims against actual repo state.

**What it does:**
- Reads a handoff packet from `.hermes/inbox/`
- Runs `git branch --show-current` and compares to claimed branch
- Runs `git status --short` and compares to claimed tree state
- Runs `git log -1 --oneline` and compares to claimed commit
- Reports: SYNC ACCEPTED / SYNC ACCEPTED WITH WARNINGS / HOLD FOR EVIDENCE / REJECT HANDOFF

**Current state:** Manual — run explicitly by Hermes or Por.
**Future state:** Could be triggered when Hermes opens and finds new packets.

**Depends on:**
- `docs/hermes/HERMES_SYNC_PROTOCOL.md` — sync rules
- `docs/hermes/CODEX_DIRECT_CLOSEOUT_TEMPLATE.md` — handoff format

---

### 3. Review Engine (Phase 7.4)

**Location:** `scripts/hermes-review.mjs`

**Purpose:** Process review-queue items and produce structured review gate output for Por/ChatGPT.

**What it does:**
- Reads a review item from `.hermes/review-queue/`
- Runs the review checklist from `docs/hermes/REVIEW_GATE_TEMPLATE.md`
- Checks: allowed files only, no forbidden paths, build passes, evidence complete, no autonomous git
- Outputs: APPROVE FOR COMMIT / REQUEST REVISIONS / REJECT / HOLD FOR MORE EVIDENCE

**Current state:** Manual — run explicitly by Hermes.
**Future state:** Could be integrated with CLI for automated checklist checking.

**Depends on:**
- `docs/hermes/REVIEW_GATE_TEMPLATE.md` — review checklist
- `docs/hermes/CLOSEOUT_TEMPLATE.md` — closeout format
- `docs/hermes/AGENT_BUDGET_POLICY.md` — cost/quota review rules

---

### 4. Agent Bridge (Phase 7.5)

**Location:** `scripts/hermes-bridge.mjs`

**Purpose:** Route tasks to Codex CLI or OpenCode CLI with safety wrappers.

**What it does:**
- Reads a task packet from `.hermes/outbox/`
- Routes to appropriate CLI based on `agent_role` field
- For Codex: wraps with `-s read-only --ephemeral --skip-git-repo-check -o <output>`
- For OpenCode: wraps with `--dir <sandbox>` and sandbox-only enforcement
- Captures output and evidence
- Writes result to `.hermes/closeouts/`

**Current state:** Manual — Hermes currently routes directly via terminal commands.
**Future state:** A wrapper script that enforces safety flags automatically.

**Depends on:**
- `docs/hermes/AGENT_ROUTING_MATRIX.md` — routing rules
- `docs/hermes/AGENT_BUDGET_POLICY.md` — cost/quota rules
- `docs/hermes/ESCALATION_POLICY.md` — when to stop and ask

---

## Current vs Future State

| Component | Today (Manual) | Future (Automated) |
|-----------|---------------|--------------------|
| **Packet validation** | Hermes reads packets manually, checks fields by eye | CLI validates schema automatically |
| **External sync** | Hermes compares handoff claims against git state manually | CLI runs git checks and produces structured verdict |
| **Review gate** | Hermes runs checklist by hand in chat | CLI runs checklist and produces structured verdict |
| **Agent routing** | Hermes types terminal commands directly | CLI wraps with safety flags, captures evidence |
| **Inbox monitoring** | None — Por places packets manually | Could watch inbox for new files (future) |
| **Background watcher** | None — no daemon or cron | Not planned — local-first means no background services |

---

## Key Design Principles

| Principle | Rule |
|-----------|------|
| **Local-first** | All runtime components run from the local repo. No cloud, no backend, no database. |
| **Single-file scripts** | Each CLI is a single `.mjs` script under `scripts/` — no framework, no dependencies. |
| **Evidence-based** | Every CLI output must include the commands and output it used to reach its verdict. |
| **Manual by default** | No background watchers, no cron jobs, no daemons. Each tool is invoked explicitly. |
| **Gitignored runtime** | All runtime state lives under `.hermes/` which is gitignored. Only `.hermes.example/` is version-controlled. |
| **Governance first** | Each CLI follows the policies in `docs/hermes/` — routing matrix, escalation policy, budget policy, handoff protocol. |

---

## Dependency Graph

```
docs/hermes/PACKET_SCHEMA.md
  └─▶ Packet Validator (7.2)
        └─▶ .hermes/review-queue/

docs/hermes/CODEX_DIRECT_CLOSEOUT_TEMPLATE.md
docs/hermes/HERMES_SYNC_PROTOCOL.md
  └─▶ Hermes Sync CLI (7.3)
        └─▶ .hermes/closeouts/

docs/hermes/REVIEW_GATE_TEMPLATE.md
docs/hermes/CLOSEOUT_TEMPLATE.md
docs/hermes/AGENT_BUDGET_POLICY.md
  └─▶ Review Engine (7.4)
        └─▶ .hermes/closeouts/

docs/hermes/AGENT_ROUTING_MATRIX.md
docs/hermes/AGENT_BUDGET_POLICY.md
docs/hermes/ESCALATION_POLICY.md
  └─▶ Agent Bridge (7.5)
        └─▶ .hermes/closeouts/
```

---

## Folder Structure

```
.hermes/                          (gitignored — real runtime)
├── inbox/                        Incoming handoff/task packets
├── outbox/                       Packets for other agents
├── closeouts/                    Completed session closeouts
├── review-queue/                 Items waiting for Por/ChatGPT review
└── state/                        Derived snapshots (not source of truth)

.hermes.example/                  (version-controlled — example scaffold)
├── README.md                     Folder purpose and usage
├── inbox/.gitkeep
├── outbox/.gitkeep
├── closeouts/.gitkeep
├── review-queue/.gitkeep
└── state/.gitkeep

docs/hermes/                      Governance and architecture docs
├── RUNTIME_ARCHITECTURE.md       This file — runtime map
├── PACKET_SCHEMA.md              Packet structure and fields
├── TASK_PACKET_TEMPLATE.md       Task assignment template
├── CLOSEOUT_TEMPLATE.md          Closeout report template
├── REVIEW_GATE_TEMPLATE.md       Review gate verdicts
├── AGENT_ROUTING_MATRIX.md       Route by task type
├── ESCALATION_POLICY.md          When to stop and ask
├── AGENT_BUDGET_POLICY.md        Cost and quota rules
├── EXTERNAL_AGENT_HANDOFF.md     External agent handoff rules
├── CODEX_DIRECT_CLOSEOUT_TEMPLATE.md
├── HERMES_SYNC_PROTOCOL.md       Sync external work
├── HERMES_INBOX.md               Manual sync workflow
└── reports/                      Cycle audit reports
    ├── HERMES_CYCLE3_AUDIT.md
    ├── HERMES_REAL_REPO_SMOKE_TEST.md
    └── HERMES_REAL_REPO_SMOKE_TEST_DEEPSEEK.md
```
