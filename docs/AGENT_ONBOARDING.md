# Agent Onboarding — BeBlank Core OS

**Purpose:** One-page start-here guide for any AI agent (Hermes, Codex, OpenCode, DeepSeek, ChatGPT) joining the BeBlank Core OS workflow.

---

## 1. Reading Order

Read these three files **in order** before doing any work:

1. **`docs/HERMES_HANDOFF_PROTOCOL.md`** — Agent roles, handoff packets, rules of engagement.
2. **`docs/CURRENT_AI_WORKFLOW_STATE.md`** — Current state snapshot: latest commit, active branches, open questions, memory.
3. **This file** (`docs/AGENT_ONBOARDING.md`) — Setup, safety rules, routing, closeout procedure.

---

## 2. Repo Setup

```bash
git clone https://github.com/phorrtananchai-debug/beblank-core-os.git
cd beblank-core-os
npm install
npm run dev    # dev server
npm run build  # production build (tsc -b && vite build)
```

**Requirements:** Node.js 20+ (npm).

**Environment:** Copy `.env.example` to `.env` for local config. No secrets are committed.

**Branch naming convention:**
- `docs/<description>` — documentation changes
- `chore/<description>` — cleanup, tooling, config
- `fix/<description>` — bug fixes
- `feat/<description>` — new features (requires Por + ChatGPT approval first)

---

## 3. Safety Rules (Do Not Violate)

### Forbidden Paths (no modification without explicit Por approval)

| Path | Reason |
|------|--------|
| `src/` | All application source code |
| `package.json` / `package-lock.json` | Dependency safety |
| `.env` / `.env.*` | Secrets and credentials |
| `src/finance/` | Financial data and trading logic |
| `src/trading/` | Trading operations |
| `src/creator/` | Creative workspace |
| `src/core/auth/` | Authentication and user access |
| `src/core/firebase/` | Firebase configuration |
| Firebase/config files | Production infrastructure |

### Universal Rules

- **No autonomous commit, merge, or push.** Por must approve every git write operation.
- **Evidence-first.** Every claim must be backed by command or tool output.
- **Local-first.** No cloud memory, gateways, or background services unless approved.
- **Windows-native paths only.** Use `C:\...` or `D:\...`, never MSYS paths like `/d/...`.
- **Never print secrets.** API keys, tokens, credentials must never appear in output.
- **Run `git status` and `git diff` after every file change.**
- **Run `npm run build` after every change that could affect the build.**
- **Always produce a closeout with a verdict:** `APPROVE` / `REVISE` / `REJECT` / `ESCALATE`.

---

## 4. Team Routing

| Route | When to Use |
|-------|-------------|
| **Hermes Direct** | Memory, QA, closeout review, docs/reports, state updates, low-risk planning |
| **Codex CLI** (`read-only`) | Repo inspection, architecture review, technical debt, deep code review, DS output validation |
| **Codex CLI** (`workspace-write`) | **Only after explicit Por approval** with branch, allowed scope, DoD, build/test/rollback plan |
| **OpenCode CLI** | Sandbox fast-worker tasks only — **not approved for production repos yet** |

### Codex CLI Command Pattern (Read-Only)
```
codex exec --cd "C:\<repo-path>" -s read-only --ephemeral --skip-git-repo-check -o "D:\<sandbox-output>" "<task>"
```

### OpenCode CLI Command Pattern (Sandbox Only)
```
opencode run "<task>" --dir "D:\<sandbox-path>"
```

---

## 5. Workflow

```
Mission → Risk Classify → Choose Route → Plan → Ask Approval → Execute → Verify → Closeout → Memory
```

| Risk Level | Definition | Approval Required |
|------------|------------|-------------------|
| 🟢 **LOW** | Docs, reports, read-only inspection | Por (before commit) |
| 🟡 **MEDIUM** | UI scaffold, non-sensitive src changes | Por (before writing) |
| 🟠 **HIGH** | Architecture, routes, auth, finance, trading | Por + ChatGPT |
| 🔴 **CRITICAL** | Real trading, secrets, background services | Stop and ask Por |

---

## 6. Closeout Checklist

After every mission, verify:

- [ ] Only expected files were created/modified
- [ ] No forbidden paths were touched
- [ ] Build passes (`npm run build`)
- [ ] `git diff` shows expected changes only
- [ ] `git status` shows clean working tree
- [ ] Every claim backed by command output
- [ ] No secrets printed or exposed
- [ ] Commit message follows convention
- [ ] Memory update recorded (if applicable)

---

## 7. Quick Reference

| Question | Answer |
|----------|--------|
| Repo URL | `github.com/phorrtananchai-debug/beblank-core-os` |
| Framework | React 19 + Vite 8 + TypeScript 6 + TailwindCSS 3 |
| Package manager | npm |
| Dev command | `npm run dev` |
| Build command | `npm run build` (tsc -b && vite build) |
| Lint command | `npm run lint` |
| Current branch | `main` |
| Latest commit | See `docs/CURRENT_AI_WORKFLOW_STATE.md` |
| Who approves merges | Por only |
| Who plans missions | Por + ChatGPT |
| Who executes | DS/OpenCode, Codex, or Hermes (per routing table) |
| Who reviews closeouts | Hermes → Por |
