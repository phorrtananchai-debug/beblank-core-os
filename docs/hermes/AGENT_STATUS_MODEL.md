# Hermes Agent Status Model

**Purpose:** Define all possible agent states and the rules for tracking agent availability, assignments, and cost status.

---

## Agent States

| State | Definition | Available For Work? | Notes |
|-------|------------|---------------------|-------|
| **Idle** | Agent is ready and waiting for assignment | Yes | Default state |
| **Assigned** | Agent has been assigned a task but has not yet started | No | Waiting for executor to begin |
| **Working** | Agent is actively executing a task | No | Estimated completion time recorded |
| **Waiting for evidence** | Agent completed work but evidence is incomplete | No | Agent must provide missing evidence |
| **Waiting for review** | Agent returned closeout — Hermes is reviewing | No | Hermes review in progress |
| **Waiting for Por** | Agent work is complete — Por decision required | No | Por must approve, revise, or reject |
| **Complete** | Agent task is finished and closed | Yes | Agent can accept new work |
| **Blocked** | Agent cannot proceed — external dependency missing | No | Reason recorded |

---

## State Transition Diagram

```
      IDLE
       │
       │ Assigned
       ▼
    ASSIGNED
       │
       │ Starts work
       ▼
    WORKING
       │
       ├─────────────────────────────────────┐
       │                                     │
       ▼                                     ▼
  WAITING FOR EVIDENCE                  SUBMITS CLOSEOUT
       │                                     │
       │ Evidence provided                   ▼
       └──────────────┐              WAITING FOR REVIEW
                      │                     │
                      │              ┌──────┴──────┐
                      │              │             │
                      │              ▼             ▼
                      │         NEEDS REWORD   APPROVED
                      │              │             │
                      └──────────────┘             ▼
                                              WAITING FOR POR
                                                     │
                                              ┌──────┴──────┐
                                              │             │
                                              ▼             ▼
                                         COMPLETE      NEEDS REWORK
                                              │             │
                                              │             └──► WORKING
                                              ▼
                                          IDLE
                                                      
                                         BLOCKED
                                            │
                                            │ Unblocked
                                            ▼
                                         IDLE (or WORKING if resumed)
```

---

## Agent Status Tracking

When tracking an agent's status, Hermes should record:

| Field | Required | Description |
|-------|----------|-------------|
| **Agent name** | ✅ | Hermes Direct / Codex CLI / OpenCode / DeepSeek / ChatGPT / Por |
| **Current state** | ✅ | One of the states above |
| **Current mission** | conditional | Mission ID if assigned |
| **Assigned at** | conditional | Timestamp when assigned |
| **Estimated completion** | conditional | When the agent is expected to finish |
| **Last known status** | ✅ | Most recent evidence of activity |
| **Cost/quota impact** | ✅ | Cost incurred this session for this agent |
| **Notes** | optional | Free-text notes |

---

## Agent Availability Rules

| Rule | Description |
|------|-------------|
| **One task at a time** | An agent can only be assigned one mission at a time. A new mission cannot be assigned until the current one reaches Complete or Idle. |
| **Hermes Direct is always available** | Hermes Direct can handle parallel tasks (docs, review, QA, memory) because they are low-cost and non-blocking. |
| **Codex CLI is single-threaded** | Only one Codex task at a time. Queue additional Codex work. |
| **OpenCode/DeepSeek are sequential** | Assign one task at a time. Do not parallelize paid executors. |
| **Por is async** | Por may have multiple items waiting for approval. Track separately. |
| **ChatGPT is not tracked in runtime** | ChatGPT is a planning/advisory agent only. No runtime status. |

---

## Cost / Quota Status Per Agent

| Agent | Cost Model | Tracked Fields |
|-------|------------|----------------|
| **Hermes Direct** | Free | None — no cost tracking needed |
| **Codex CLI** | Free (quota-limited) | Remaining quota, reset time, evidence source |
| **OpenCode** | Paid | Calls made, estimated cost, justification |
| **DeepSeek** | Paid | Calls made, estimated cost, justification |

---

## Agent Status Example

```
Agent Availability — Session SESSION-20260710-001

┌──────────────┬────────────┬────────────────┬──────────────┐
│ Agent        │ State      │ Mission        │ Notes        │
├──────────────┼────────────┼────────────────┼──────────────┤
│ Hermes Direct│ Working    │ MISSION-001    │ Review       │
│ Codex CLI    │ Working    │ MISSION-002    │ Quota: 12/30 │
│ OpenCode     │ Idle       │ —              │ Not used     │
│ DeepSeek     │ Idle       │ —              │ Not used     │
│ ChatGPT      │ Advisory   │ —              │ Not in session│
│ Por          │ Pending    │ MISSION-003    │ Needs review │
└──────────────┴────────────┴────────────────┴──────────────┘
```

---

## Agent Status Evidence Rules

| State | Evidence Required |
|-------|-------------------|
| Idle | No active mission |
| Assigned | Task packet delivered to agent |
| Working | Hermes initiated the task or agent confirmed start |
| Waiting for evidence | Closeout submitted but evidence is incomplete |
| Waiting for review | Closeout submitted with evidence |
| Waiting for Por | Hermes review complete, Por pinged |
| Complete | Mission closed, agent freed |
| Blocked | Reason for block documented |
