# Hermes Orchestrator Core v1

**Purpose:** Describe how Hermes chooses agents, routes tasks, manages file locks, and detects conflict risk — all without background daemons or auto execution.

---

## How Hermes Chooses Agents

1. **Infer required capabilities** from the task packet (mission description, allowed/forbidden files, keywords).
2. **Look up the agent registry** (`.hermes/state/agent-registry.json`) for agents matching those capabilities.
3. **Sort by cost** (free → free-quota → paid → human) to prefer the cheapest adequate route.
4. **Check risk limit** — if the task risk exceeds an agent's `risk_limit`, that agent is excluded.
5. **Check for forbidden paths** — if the task touches auth/finance/trading/creator/env/firebase, the router marks it HUMAN REQUIRED.
6. **Produce routing plan** with recommended agent, alternatives, and reasoning.

## How File Locks Work

When a task is accepted, a lock file is created in `.hermes/locks/`:

```json
{
  "mission_id": "MISSION-20260710-001",
  "agent": "opencode",
  "files": ["src/components/portfolio/PortfolioHomepageCanvas.tsx", "src/index.css"],
  "acquired": "2026-07-10T12:00:00Z"
}
```

Before assigning a new task, the lock checker (`hermes-lock-check.mjs`) reads all active locks and compares them against the proposed task's allowed files. If any file is already locked by another mission, a WARN or BLOCKED verdict is returned.

## How Conflict Risk Is Detected

The lock checker evaluates:

| Verdict | Meaning |
|---------|---------|
| **SAFE** | No lock conflicts. No protected paths touched. |
| **WARN** | Proposed files overlap with an active lock from another mission. Review before assigning. |
| **BLOCKED** | Proposed files touch protected paths (auth, finance, trading, creator, firebase, env). Await Por/ChatGPT. |

## How This Prevents Concurrent File Edits

1. Every mission creates a lock file on assignment.
2. Every new task runs through `hermes-lock-check.mjs` first.
3. If overlapping files are detected, the router refuses to assign until the conflict is resolved.
4. Locks are released when a mission reaches CLOSED state.

## What Still Requires Por Interruption

| Condition | Action |
|-----------|--------|
| Lock check returns BLOCKED | Interrupt Por |
| Protected paths detected (auth/finance/trading/creator/env/firebase) | Interrupt Por |
| Risk level HIGH or CRITICAL | Interrupt Por |
| No suitable agent found | Interrupt Por |
| Build or lint fails | Interrupt Por |

## Execution Status After Phase 8.0

The orchestrator now supports one-shot, manually invoked execution through `hermes:run`. It is not autonomous production infrastructure: dry-run is the default, execution requires explicit invocation and an authorized safe dispatcher assignment, and HIGH/CRITICAL or protected scope stops for Por. OpenCode and DeepSeek remain advisory-only.

The runner records evidence, reviews scope and checks, releases centralized locks, and may create a local commit only when the Zero Interrupt conditions are met. It never pushes or merges, and it provides no watcher, daemon, polling loop, cloud service, or production Firebase integration.
