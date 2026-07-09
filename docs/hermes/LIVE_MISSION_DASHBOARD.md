# Hermes Live Mission Dashboard

**Purpose:** Governance dashboard specification for tracking live missions across Hermes and external executors. No runtime, watcher, or background service required — this is a state model that Hermes presents manually during sessions.

---

## Dashboard Sections

### 1. Active Missions

Displays all missions that are in a non-terminal state (Planned, Waiting, Running, Review, Approval, Committed, Blocked).

| Column | Description |
|--------|-------------|
| Mission ID | `MISSION-YYYYMMDD-NNN` |
| Risk | LOW / MEDIUM / HIGH / CRITICAL |
| Agent | Assigned executor |
| State | Current mission lifecycle state |
| Age | Time since mission was accepted |
| Actions | Next action required |

### 2. Waiting Reviews

Displays missions where closeout has been submitted and Hermes review is pending.

| Column | Description |
|--------|-------------|
| Mission ID | — |
| Agent | Who produced the closeout |
| Submitted | Timestamp |
| Evidence | Status of evidence (complete / incomplete) |
| Action | "Review now" |

### 3. Waiting Approval

Displays missions where Hermes review is complete and Por approval is pending.

| Column | Description |
|--------|-------------|
| Mission ID | — |
| Hermes Verdict | APPROVE / REVISE / REJECT / HOLD |
| Files Changed | Count |
| Build Result | PASS / FAIL |
| Action | "Approve" / "Revise" / "Reject" |

### 4. Recent Commits

Displays the last 5 commits from the current session.

| Column | Description |
|--------|-------------|
| Commit | Short hash |
| Message | First line |
| Age | Time since commit |
| Push Status | Pushed / Not pushed |

### 5. Agent Availability

Displays current state of each agent in the registry.

| Agent | State | Current Mission | Notes |
|-------|-------|-----------------|-------|
| Hermes Direct | Idle / Working | — | — |
| Codex CLI | Idle / Working | — | Quota status |
| OpenCode | Available / Paid | — | Cost incurred |
| DeepSeek | Available / Paid | — | Cost incurred |
| ChatGPT | Advisory | — | Planning only |
| Por | Available | — | Final approver |

### 6. Cost / Quota Summary

Displays estimated cost and quota usage for the current session.

| Agent | Cost Type | Used | Remaining | Notes |
|-------|-----------|------|-----------|-------|
| Hermes Direct | Free | — | — | No quota |
| Codex CLI | Free (quota) | N calls | X remaining | Reset time: T |
| OpenCode | Paid | N calls | $Y | — |
| DeepSeek | Paid | N calls | $Y | — |

### 7. Open Risks

Displays risks that have been identified but not yet resolved.

| Risk | Severity | Mission | Status |
|------|----------|---------|--------|
| Description | 🟢 / 🟡 / 🟠 / 🔴 | Related mission | Open / Mitigated / Closed |

---

## Example Dashboard Output

```
┌─────────────────────────────────────────────────────────────┐
│              HERMES LIVE MISSION DASHBOARD                   │
│              Session: SESSION-20260710-001                   │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ACTIVE MISSIONS                                             │
│  ┌─────────────┬──────┬────────┬────────┬──────┬──────────┐ │
│  │ ID          │ Risk │ Agent  │ State  │ Age  │ Action   │ │
│  ├─────────────┼──────┼────────┼────────┼──────┼──────────┤ │
│  │ MISSION-001 │ LOW  │ Hermes│Review  │ 12m  │ Review   │ │
│  │ MISSION-002 │ MED  │ Codex │Running │ 45m  │ Wait     │ │
│  │ MISSION-003 │ LOW  │Hermes │Approval│ 5m   │Por:Approve│ │
│  └─────────────┴──────┴────────┴────────┴──────┴──────────┘ │
│                                                              │
│  WAITING REVIEWS (1)                                         │
│  ┌─────────────┬────────┬───────────┬──────────┬──────────┐ │
│  │ ID          │ Agent  │ Submitted │ Evidence │ Action   │ │
│  ├─────────────┼────────┼───────────┼──────────┼──────────┤ │
│  │ MISSION-001 │ Codex  │ 10:32 AM  │ Complete │ Review   │ │
│  └─────────────┴────────┴───────────┴──────────┴──────────┘ │
│                                                              │
│  WAITING APPROVAL (1)                                        │
│  ┌─────────────┬────────┬────────┬──────┬──────────┬──────┐ │
│  │ ID          │Verdict │ Files  │Build │ Action   │      │ │
│  ├─────────────┼────────┼────────┼──────┼──────────┼──────┤ │
│  │ MISSION-003 │APPROVE │  4     │PASS  │ Por: Go  │      │ │
│  └─────────────┴────────┴────────┴──────┴──────────┴──────┘ │
│                                                              │
│  AGENT AVAILABILITY                                          │
│  ┌──────────────┬─────────┬────────────────┬────────────────┐ │
│  │ Agent        │ State   │ Mission        │ Notes          │ │
│  ├──────────────┼─────────┼────────────────┼────────────────┤ │
│  │ Hermes Direct│ Working │ MISSION-003    │ Review         │ │
│  │ Codex CLI    │ Working │ MISSION-002    │ Quota: 12 left │ │
│  │ OpenCode     │ Idle    │ —              │ —              │ │
│  │ Por          │Pending  │ MISSION-003    │ Awaiting review│ │
│  └──────────────┴─────────┴────────────────┴────────────────┘ │
│                                                              │
│  COST / QUOTA SUMMARY                                        │
│  ┌──────────────┬──────────┬──────┬───────────┬────────────┐ │
│  │ Agent        │ Cost     │ Used │ Remaining │ Notes       │ │
│  ├──────────────┼──────────┼──────┼───────────┼────────────┤ │
│  │ Codex CLI    │ Free     │ 3    │ ~12       │ Resets Wed  │ │
│  │ OpenCode     │ Paid     │ 0    │ —         │ Not used    │ │
│  └──────────────┴──────────┴──────┴───────────┴────────────┘ │
│                                                              │
│  OPEN RISKS (0)                                              │
│  No open risks.                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Dashboard Rules

| Rule | Description |
|------|-------------|
| **Manual only** | This dashboard is presented by Hermes during a session. No background service updates it. |
| **Evidence-based** | Every state shown must be backed by `git status`, `git log`, or session memory. |
| **Session-scoped** | The dashboard reflects the current session only. Past session data is in archives. |
| **No guessing agent state** | If Hermes does not know an agent's state, show "Unknown" — do not guess. |
| **Cost/quota from evidence** | Codex quota status must be evidence-based. If unknown, show "Unknown — evidence required." |
