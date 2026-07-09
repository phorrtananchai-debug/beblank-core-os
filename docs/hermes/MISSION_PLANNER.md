# Hermes Mission Planner

**Purpose:** Define the planning model Hermes follows before generating any task packet. Every mission must be classified, scoped, and planned before an executor is assigned.

---

## Mission Classification

Every mission must be classified before work begins:

| Field | Required | Description |
|-------|----------|-------------|
| **Mission ID** | ✅ | Unique identifier: `MISSION-YYYYMMDD-NNN` (e.g., `MISSION-20260710-001`) |
| **Session ID** | ✅ | Runtime session identifier: `SESSION-YYYYMMDD-NNN` |
| **Risk** | ✅ | LOW / MEDIUM / HIGH / CRITICAL |
| **Estimated scope** | ✅ | Brief description of what needs to be done |
| **Estimated files touched** | ✅ | Approximate count of files affected |
| **Expected deliverables** | ✅ | What will be produced (files, routes, tests, etc.) |
| **Capabilities required** | ✅ | Capability names from the Capability Registry (e.g., UI Implementation, Architecture Review) |
| **Evidence requirements** | ✅ | What commands/outputs must be captured |
| **Build requirements** | ✅ | Whether `npm run build` must pass |
| **QA requirements** | ✅ | What QA checks are needed |
| **Review requirements** | ✅ | Who must review: Hermes, Por, ChatGPT |
| **Commit approval required** | ✅ | Yes / No |
| **Push approval required** | ✅ | Yes — push always requires Por approval |

---

## Risk Levels

| Level | Definition | Examples | Approval Required |
|-------|------------|----------|-------------------|
| 🟢 **LOW** | Docs, reports, read-only inspection, governance edits | README update, template creation, wiki changes | Por before commit |
| 🟡 **MEDIUM** | UI scaffold, component changes, mock data, config-adjacent | New page, layout change, route addition, screenshot updates | Por before write |
| 🟠 **HIGH** | Production code, architecture changes, routes, auth, finance, trading | Dependency changes, auth logic, data flow, security-related | Por + ChatGPT before write |
| 🔴 **CRITICAL** | Real trading, secrets, external integrations, cloud services, background daemons | Live API calls, broker execution, cloud storage, cron jobs | Stop and ask Por + ChatGPT |

---

## Cost / Quota Estimation

The planner must estimate the cheapest adequate route:

| Factor | Check |
|--------|-------|
| **Can Hermes Direct handle this?** | If yes — preferred (free, no quota) |
| **Can Codex CLI handle this read-only?** | If yes — uses quota, preserve for deep work |
| **Is paid executor justified?** | OpenCode/DeepSeek only if Hermes or Codex cannot handle the task |
| **Codex quota status** | Must be evidence-based, never guessed |

---

## Planner Output Example

```
Mission Accepted

Mission ID:       MISSION-20260710-001
Risk:             MEDIUM
Capabilities:     UI Implementation, Architecture Review
Recommended:      Codex CLI (read-only for review, then Codex workspace-write)
Reason:           Architecture review + UI stabilization
Estimated Files:  24
Hermes Review:    Required
Estimated Cost:   Codex quota only

Approval Required:
  Commit: YES
  Push:   YES
```
