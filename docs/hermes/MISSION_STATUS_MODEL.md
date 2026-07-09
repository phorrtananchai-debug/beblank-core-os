# Hermes Mission Status Model

**Purpose:** Define all possible mission states, transitions, and the rules governing each transition.

---

## Mission States

| State | Definition | Terminal? | Can Be Assigned? |
|-------|------------|-----------|-------------------|
| **Planned** | Mission has been classified and scoped but not yet accepted | No | No |
| **Waiting** | Mission accepted and queued — waiting for executor availability | No | Yes |
| **Running** | Executor is actively working on the mission | No | Yes (current) |
| **Review** | Closeout submitted — Hermes is reviewing evidence | No | No |
| **Approval** | Hermes review complete — waiting for Por decision | No | No |
| **Committed** | Por approved — commit has been made | No | No |
| **Closed** | Mission complete — memory updated, archived | Yes | No |
| **Blocked** | Mission cannot proceed — waiting for external input | No | No |

---

## State Transition Diagram

```
                  ┌──────────────┐
                  │   PLANNED    │
                  └──────┬───────┘
                         │ Accepted
                  ┌──────▼───────┐
            ┌─────│   WAITING    │◄────────────┐
            │     └──────┬───────┘              │
            │            │ Assigned             │
            │     ┌──────▼───────┐              │
            │     │   RUNNING    │              │
            │     └──────┬───────┘              │
            │            │ Closeout submitted   │
            │     ┌──────▼───────┐              │
            │     │   REVIEW     │              │
            │     └──────┬───────┘              │
            │            │ Hermes verdict       │
            │     ┌──────▼───────┐              │
            │     │  APPROVAL    │              │
            │     └──────┬───────┘              │
            │            │ Por approves         │
            │     ┌──────▼───────┐              │
            │     │  COMMITTED   │              │
            │     └──────┬───────┘              │
            │            │ Archived             │
            │     ┌──────▼───────┐              │
            │     │   CLOSED     │              │
            │     └──────────────┘              │
            │                                   │
            └──────── Failure Paths ────────────┘
                         │
                  ┌──────▼───────┐
                  │   BLOCKED    │
                  └──────┬───────┘
                         │ Unblocked → WAITING
```

---

## State Transition Rules

| From | To | Condition | Who Approves |
|------|----|-----------|--------------|
| Planned | Waiting | Mission accepted, risk classified, capabilities identified | Hermes |
| Waiting | Running | Executor assigned, task packet delivered | Hermes |
| Running | Review | Closeout submitted with evidence | Executor |
| Running | Blocked | Missing evidence, scope violation, or external dependency | Hermes |
| Review | Approval | Hermes review passed all checks | Hermes |
| Review | Blocked | Evidence incomplete or contradictory | Hermes |
| Review | Waiting | Needs rework — executor must revise | Hermes |
| Approval | Committed | Por approves commit | Por |
| Approval | Waiting | Por requests revisions | Por |
| Approval | Blocked | Por holds for more evidence | Por |
| Approval | Planned | Por rejects — mission needs redesign | Por |
| Committed | Closed | Memory updated, archived | Hermes |
| Blocked | Waiting | Blocking issue resolved | Por / Hermes |

---

## State Evidence Requirements

| State | Required Evidence |
|-------|-------------------|
| Planned | Mission ID, risk classification, capability list |
| Waiting | Task packet (scope, allowed/forbidden files, evidence requirements) |
| Running | Agent confirmed working, task packet delivered |
| Review | Closeout report, `git status`, `git diff`, build result, evidence log |
| Approval | Hermes review verdict, checklist results, cost/quota note |
| Committed | `git log -1 --oneline`, commit hash |
| Closed | Memory update confirmed |
| Blocked | Reason for block, what is needed to unblock |

---

## State Duration Rules

| State | Max Duration | Notes |
|-------|-------------|-------|
| Planned | No limit | Stays planned until Por accepts or rejects |
| Waiting | 24 hours | If no executor assigned within 24h, escalate to Por |
| Running | Per mission | Depends on scope — estimated in mission plan |
| Review | 1 hour | Hermes should complete review promptly |
| Approval | 24 hours | If Por does not respond in 24h, remind |
| Committed | 1 hour | Should be closed or pushed within 1 hour |
| Closed | — | Terminal state |
| Blocked | 48 hours | If blocked >48h without progress, escalate to Por |
