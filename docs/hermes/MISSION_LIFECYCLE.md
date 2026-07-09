# Hermes Mission Lifecycle

**Purpose:** Define the complete lifecycle of a mission from creation to closure, including success and failure paths.

---

## Standard Lifecycle

```
MISSION CREATED
    │
    ▼
MISSION ACCEPTED
    │  (Mission ID assigned, risk classified, capabilities identified)
    ▼
TASK PACKET GENERATED
    │  (Allowed/forbidden files defined, evidence requirements set)
    ▼
EXECUTOR ASSIGNED
    │  (Agent selected by capability, not by name)
    ▼
EXECUTION
    │  (Agent runs task packet, produces evidence)
    ▼
CLOSEOUT
    │  (Agent returns closeout report with evidence)
    ▼
HERMES REVIEW
    │  (Hermes verifies evidence, checks scope, runs review gate)
    ▼
POR APPROVAL
    │  (Por reviews Hermes findings, decides next action)
    ▼
COMMIT
    │  (Por issues commit command)
    ▼
CLOSED
    (Memory updated, mission archived)
```

---

## Failure Paths

A mission may exit the standard lifecycle at any gate:

### REJECTED

Applicable at: MISSION CREATED, POR APPROVAL

The mission is not approved to proceed. Reasons include:
- Scope is unclear or too broad
- Risk level is too high without ChatGPT review
- Required capabilities are not available
- Por decides the mission is not a priority

**Next step:** Abandon or redesign with narrower scope.

### NEEDS EVIDENCE

Applicable at: HERMES REVIEW, POR APPROVAL

The closeout evidence is insufficient to approve. Reasons include:
- Missing command outputs
- `git status` or `git diff` not provided
- Build/test results missing
- Claims not backed by evidence

**Next step:** Agent provides requested evidence without modifying files. Hermes re-reviews.

### NEEDS REWORK

Applicable at: HERMES REVIEW, POR APPROVAL

The work meets evidence requirements but has quality or scope issues. Reasons include:
- Scope drift — files changed beyond allowed list
- Forbidden paths touched
- Build or lint errors
- Code quality issues
- Missing or incomplete implementation

**Next step:** Agent addresses specific revision requests, produces updated closeout. Hermes re-reviews.

### ESCALATED

Applicable at: any gate

Hermes determines the mission requires Por + ChatGPT decision before proceeding. Reasons include:
- HIGH or CRITICAL risk detected
- Forbidden paths were touched
- Commit was made without approval
- Codex quota is unknown and task is quota-heavy
- Paid executor usage is proposed without justification
- Scope is ambiguous and cannot be safely classified

**Next step:** Por (and optionally ChatGPT) reviews. Decides: Proceed / Revise / Reject / Hold.

---

## Lifecycle State Diagram

```
                  ┌──────────────────────────────────────┐
                  │          MISSION CREATED              │
                  └──────────┬───────────────────────────┘
                             │
                  ┌──────────▼───────────────────────────┐
                  │          MISSION ACCEPTED             │
                  │  (Mission ID, Risk, Capabilities)     │
                  └──────────┬───────────────────────────┘
                             │
                  ┌──────────▼───────────────────────────┐
        ┌────────┤       TASK PACKET GENERATED           ├────────┐
        │        │  (Scope, Evidence, Approvals)          │        │
        │        └──────────┬───────────────────────────┘        │
        │                   │                                     │
        │        ┌──────────▼───────────────────────────┐        │
        │        │        EXECUTOR ASSIGNED              │        │
        │        │  (Agent selected by capability)       │        │
        │        └──────────┬───────────────────────────┘        │
        │                   │                                     │
        │        ┌──────────▼───────────────────────────┐        │
        │        │           EXECUTION                   │        │
        │        │  (Agent runs task, produces output)   │        │
        │        └──────────┬───────────────────────────┘        │
        │                   │                                     │
        │        ┌──────────▼───────────────────────────┐        │
        │        │           CLOSEOUT                    │        │
        │        │  (Evidence returned)                  │        │
        │        └──────────┬───────────────────────────┘        │
        │                   │                                     │
        │        ┌──────────▼───────────────────────────┐        │
        │        │         HERMES REVIEW                 │        │
        │        │  (Verify evidence, run gates)         │        │
        │        └──────────┬───────────────────────────┘        │
        │                   │                                     │
        │        ┌──────────▼───────────────────────────┐        │
        │        │         POR APPROVAL                  │        │
        │        │  (Review, decide verdict)             │        │
        │        └──────────┬───────────────────────────┘        │
        │                   │                                     │
        │        ┌──────────▼───────────────────────────┐        │
        │        │            COMMIT                     │        │
        │        │  (Por issues commit)                  │        │
        │        └──────────┬───────────────────────────┘        │
        │                   │                                     │
        │        ┌──────────▼───────────────────────────┐        │
        │        │            CLOSED                     │        │
        │        │  (Memory updated, archived)           │        │
        │        └──────────────────────────────────────┘        │
        │                                                         │
        └────────────────── Failure Paths ───────────────────────┘
                     │           │           │
                     ▼           ▼           ▼
               REJECTED   NEEDS        NEEDS
                          EVIDENCE     REWORK
                     │
                     ▼
               ESCALATED
               (→ Por + ChatGPT)
```

---

## Lifecycle Rules

| Rule | Description |
|------|-------------|
| **One mission, many packets** | A single mission may produce multiple task packets for different agents |
| **One approval, one commit** | Each commit requires its own approval — approval cannot be reused |
| **Commit ≠ Push** | Commit approval is separate from push approval |
| **Evidence at every gate** | Every gate transition requires verified evidence |
| **No skipping gates** | Every mission must pass through all gates in order |
| **Failure paths are valid** | Rejected, Needs Evidence, Needs Rework, and Escalated are all valid lifecycle states |
