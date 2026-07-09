# Current AI Workflow State — BeBlank Core OS

**Last updated:** 2026-07-09 (updated Phase 5.10 — Cycle #3 + CLI delegation)
**Source:** Git history + Phase 5.6 cycle closeout + Phase 5.5 onboarding pack
**Note to readers:** This document is a snapshot. Hermes does NOT automatically see ChatGPT, DS, or Codex chats. It only learns about cross-chat work when given a handoff packet, repo diff, report, or state document update.

---

## 1. Purpose

This document provides a shared current-state reference so that ChatGPT planning chats, DS/OpenCode implementation, Codex review, and Hermes QA/memory can stay aligned **across separate chat sessions and tools**. Each agent reads this document at the start of its session to understand what has already been done, what is being worked on, and what rules apply.

Without this document, each agent starts with zero context about what happened in other chats.

---

## 2. Current Workflow Model

```
Por + ChatGPT ──design──→ Por ──assign──→ DS or Codex ──execute──→ branch ──closeout──→ Hermes QA ──verdict──→ Por ──approve/revise──→ merge/push ──memory update──→ Hermes
```

**Key properties:**
- **Human-in-the-loop at every gate.** No agent commits, merges, or pushes without Por.
- **Evidence-first.** Every closeout claim must be backed by a command output.
- **Handoff packets bridge chat sessions.** Hermes does not see other chats automatically.
- **Hermes is read-only.** It verifies, flags risks, and records memory — never modifies code.

---

## 3. Current Verified Repo State

| Property | Value |
|---|---|
| **Repo** | `github.com/phorrtananchai-debug/beblank-core-os` |
| **Branch** | `main` |
| **Latest commit** | `999e540` — `docs: archive Hermes smoke-test reports` |
| **Commits ahead of remote** | 0 (in sync with origin) |
| **Framework** | React 19 + Vite 8 + TypeScript 6 + TailwindCSS 3 |
| **Routing** | react-router-dom v7 |
| **Build** | ✅ PASS (0 errors) |
| **Lint** | ✅ PASS (0 errors) |
| **Test framework** | ❌ Not configured |
| **Deployment** | Vercel (`vercel.json` present) |
| **Auth** | Custom AuthContext + ProtectedRoute (local Firebase config) |

### Merged docs in `docs/`
- `HERMES_HANDOFF_PROTOCOL.md` — cross-agent handoff rules (Phase 5.6)
- `CURRENT_AI_WORKFLOW_STATE.md` — this document
- `BEBLANK_OS_V2_MASTER_SPEC.md` — master spec document
- `BEBLANK_OS_DESIGN_SYSTEM.md` — design system documentation
- Other design, migration, and setup docs

### Hermes reports under `docs/hermes/reports/`
- `HERMES_CYCLE3_AUDIT.md` — Cycle #3 audit (archived smoke-test reports) — committed `999e540`
- `HERMES_REAL_REPO_SMOKE_TEST.md` — Phase 5 Lite smoke test report (archived)
- `HERMES_REAL_REPO_SMOKE_TEST_DEEPSEEK.md` — Phase 5.1 smoke test report (archived)

---

## 4. Latest Successful Cycles

### Cycle #3 — Hermes Front Door Low-Risk Test + CLI Delegation Validation

| Field | Value |
|---|---|
| **Date** | 2026-07-09 |
| **Mission** | Archive prior smoke-test reports under `docs/hermes/reports/`; validate Hermes → Codex CLI read-only routing |
| **Agent** | Hermes (direct) + Codex CLI |
| **Branch** | `main` (docs-only commit) |
| **Commit** | `999e540` |
| **QA by Hermes** | N/A (Hermes was the executing agent) |
| **Build** | ✅ PASS (1.94s, 174 modules, 0 errors) |
| **Production files** | ❌ None touched |
| **Pushed by** | Por (approved via chat) |
| **Memory** | Recorded by Hermes |

### Phase 5.6 — Hermes Handoff Protocol

| Field | Value |
|---|---|
| **Date** | 2026-07-09 |
| **Mission** | Create Hermes Handoff Protocol (docs-only) |
| **Agent** | DS/OpenCode |
| **Branch** | `docs/hermes-handoff-protocol` |
| **Commit** | `53d995a` |
| **QA by Hermes** | REVISE (3 findings) → APPROVE (after fix) |
| **Build** | ✅ PASS (0 errors) |
| **Production files** | ❌ None touched |
| **Merged by** | Por (cherry-pick onto remote main) |
| **Pushed by** | Por |
| **Memory** | Recorded by Hermes |

---

## 5. Active Agent Roles

| Agent | Role | Access |
|---|---|---|
| **Por** | Product Owner, Design Director, Chief Architect | Full — only human who can approve merges and pushes |
| **ChatGPT** | Architect, mission designer, safety reviewer | Does NOT access repos or code. Produces plans and risk analyses. |
| **DeepSeek / OpenCode** | Fast implementer, docs, UI, small changes | Executes in branches. Produces evidence-backed closeouts. |
| **Codex** | Deep architecture, refactor, code review, repo inspection | Validated for read-only production repo inspection via Hermes routing. Used for deep review. |
| **Hermes** | Memory, QA, orchestration, closeout reviewer, CLI delegation router | Read-only for repos. Verifies closeouts, records memory, flags risks. Routes to Codex CLI and OpenCode CLI. |

---

## 5a. CLI Delegation Routing Status

Hermes can now route work to external CLIs as delegated workers. This was validated during Phase 5.9 (Cycle #3).

| Route | Status | Validated Command | Use Case |
|---|---|---|---|
| **Hermes → Codex CLI** | ✅ Read-only production repo inspection validated | `codex exec --cd <path> -s read-only --ephemeral --skip-git-repo-check -o <output> "<task>"` | Architecture review, repo inspection, technical debt scan, deep code review |
| **Hermes → OpenCode CLI** | ✅ Sandbox-only delegation validated | `opencode run --dir <sandbox-path> "<task>"` | Sandboxed fast worker tasks (no production repos) |

### Routing Rules
- **Codex CLI** may be used for read-only production repo inspection. Default to `-s read-only`, `--ephemeral`, `--skip-git-repo-check`. Use `workspace-write` only after explicit Por approval with a dedicated branch, allowed-file scope, build/test evidence, and Hermes closeout review.
- **OpenCode CLI** remains sandbox-only until Por explicitly approves production routing with a safety wrapper or branch plan. No explicit read-only/sandbox flag was verified in OpenCode's tooling.
- **Never use danger bypass modes** on either CLI.
- **Always use Windows-native paths** (`C:\...`, `D:\...`) — MSYS paths (`/d/...`) are rejected by both CLIs.

---

## 6. How Hermes Learns About Work from Another Chat

**Important:** Hermes does NOT have access to ChatGPT, DS, or Codex chat histories. Hermes cannot see what was discussed in another session unless explicitly told.

Hermes learns about cross-chat work through these mechanisms:

| Method | How It Works | Example |
|---|---|---|
| **Handoff packet** | A structured message (in chat or file) describing the mission | Por sends Hermes: "Mission: inspect routes. Scope: docs/ only." |
| **Repo diff** | Hermes reads `git diff` or `git log` to see what changed | Hermes sees `docs/HERMES_HANDOFF_PROTOCOL.md` was added |
| **Closeout report** | DS or Codex writes a structured closeout with evidence | DS submits closeout → Hermes verifies claims |
| **State document update** | This document (`CURRENT_AI_WORKFLOW_STATE.md`) is updated after each cycle | Por or DS updates the snapshot after each completed cycle |

**Cross-chat continuity relies on handoff packets + this state document.** Without them, each agent starts with zero context.

---

## 7. Handoff Packet Rules

A handoff packet is required whenever work moves between agents or chat sessions.

### Required Fields

```markdown
## Handoff Packet

### Mission
[One-line description]

### Target Repo
[Full path]

### Branch
[name]

### Scope
- Create: [list of files]
- Modify: [list of files]
- Do NOT touch: [list]

### Risk Level
[LOW / MEDIUM / HIGH / CRITICAL]

### Definition of Done
- [ ] All planned files created/modified
- [ ] Build passes
- [ ] Evidence log complete
- [ ] No forbidden files touched

### Approved By
[Por / ChatGPT (date)]
```

### Rules
- Handoff packets are the **only reliable bridge** between separate chat sessions
- Hermes will not act on work it has not received a handoff packet for
- If a packet is missing critical fields, Hermes will ask for clarification

---

## 8. Current Risk Rules

| Risk Level | Definition | Examples | Approval Required |
|---|---|---|---|
| **LOW** | Docs, reports, non-code changes | README update, report creation, branch creation | Por |
| **MEDIUM** | Safe code changes, non-production paths | New component in sandbox, test files, config cleanup | Por + ChatGPT |
| **HIGH** | Production code changes, route modifications | New page, layout change, dependency update | Por + ChatGPT + Hermes |
| **CRITICAL** | Finance, trading, auth, data, security logic | Trading logic, auth system, API keys, database | Por only |

---

## 9. What Must Not Be Touched Without Approval

| Path | Reason |
|---|---|
| `src/finance/` | Financial data and trading logic |
| `src/trading/` | Trading operations (needs verification — exact scope unknown) |
| `src/creator/` | Creative workspace (needs verification — exact scope unknown) |
| `src/core/auth/` | Authentication and user access |
| `src/core/firebase/` | Firebase configuration and credentials |
| `.env` files | API keys and secrets |
| `package.json` / lock files | Dependency safety |
| Firebase/config files | Production infrastructure |

**Any agent that touches these paths without explicit Por approval should be stopped and escalated.**

---

## 10. Current Known Branches / Docs

| Branch | Purpose | Status |
|---|---|---|
| `main` | Production branch | ✅ Active — latest: `999e540` |
| `docs/hermes-handoff-protocol` | Hermes handoff protocol | ✅ Merged |
| `docs/current-ai-workflow-state` | Current state snapshot (this document) | 🔄 In progress |
| `chore/hermes-smoke-test` | Phase 5.1 smoke test | 🗑️ Stale |
| `chore/hermes-smoke-test-deepseek` | Phase 5.1 DeepSeek smoke test | 🗑️ Stale |
| `backup/pre-hermes-smoke-jarvis-scaffold` | Jarvis scaffold backup | 🗄️ Preserved |

### Key docs currently in `docs/`
- `HERMES_HANDOFF_PROTOCOL.md` — cross-agent handoff rules
- `CURRENT_AI_WORKFLOW_STATE.md` — this document
- `BEBLANK_OS_V2_MASTER_SPEC.md` — master specification
- `docs/hermes/reports/HERMES_CYCLE3_AUDIT.md` — Cycle #3 audit summary
- `docs/hermes/reports/HERMES_REAL_REPO_SMOKE_TEST*.md` — prior smoke test reports (archived)
- Other design, migration, and setup documentation

---

## 11. Next Recommended Actions

| Priority | Action | Risk | Agent |
|---|---|---|---|
| **1** | Review this snapshot and confirm accuracy | LOW | Por + ChatGPT |
| **2** | Plan the next MEDIUM-risk mission (e.g., inspect a specific non-production directory and report) | MEDIUM | ChatGPT → Por |
| **3** | Execute approved MEDIUM-risk mission | MEDIUM | DS, Codex, or Hermes |
| **4** | QA review and memory update | LOW | Hermes |
| **5** | Evaluate whether OpenCode CLI should be approved for production routing (sandbox-only today) | MEDIUM | Por |

---

## 12. Open Questions

| Question | Status |
|---|---|
| What exactly is in `src/trading/`? | Needs verification |
| What exactly is in `src/creator/`? | Needs verification |
| Should old smoke-test branches be deleted? | Needs Por decision |
| Should `backup/pre-hermes-smoke-jarvis-scaffold` be pushed to remote? | Needs Por decision |
| Should OpenCode CLI be approved for production repo routing? | Needs Por decision — currently sandbox-only |
| Should this state document be updated after every cycle? | Suggested — needs Por approval |

---

## 13. Memory Update Rules

After each completed cycle:
1. Por tells Hermes what to remember (via chat or handoff)
2. Hermes records the entry for future sessions
3. This state document should be updated with the new cycle

Memory entries should be:
- **Concise:** 1-3 sentences
- **Actionable:** Would help future decisions
- **Risk-aware:** What went wrong or could go wrong

Current Hermes memory (as of 2026-07-09):
- Cycle #3: Hermes Front Door + CLI delegation validated
- Codex CLI read-only real repo inspection confirmed working
- OpenCode CLI sandbox delegation confirmed working
- Smoke-test reports archived under `docs/hermes/reports/`
- Phase 5.6: First successful DS → Hermes QA → Por push cycle completed
- Docs-only handoff protocol created, reviewed, merged, pushed
- Cherry-pick strategy works for diverged remotes
- Hermes caught workflow discipline issues (commits, pre-existing files, closeout completeness)
- Build always passes before merge

---

## 14. Example Update from a ChatGPT Planning Chat

If Por and ChatGPT have a planning session that produces a mission design, Por should update this document (or send a handoff packet to Hermes) like this:

```markdown
## Memory Update Request

### Source
ChatGPT planning chat — 2026-07-09

### Mission Design
[Brief description of what was decided]

### Risk Level
[MEDIUM]

### Recommended Agent
[DS or Codex]

### Scope
[List files to create/modify]
[List forbidden paths]

### Definition of Done
[List criteria]

### Notes from ChatGPT
[Any architecture decisions, risks, or recommendations]
```

This ensures Hermes has the context it needs when the closeout arrives, even though Hermes was not in the ChatGPT planning chat.
