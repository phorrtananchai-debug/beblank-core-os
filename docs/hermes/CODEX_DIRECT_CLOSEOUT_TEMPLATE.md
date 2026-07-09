# Codex Direct Closeout Template v3

**Purpose:** Closeout template for Codex sessions started directly by Por. Follows Closeout Packet v3 schema.

---

```yaml
closeout_id: CLOSEOUT-YYYYMMDD-NNN
mission_id: MISSION-YYYYMMDD-NNN
session_id: SESSION-YYYYMMDD-NNN
parent_mission: (optional)
agent: Codex CLI
branch: <branch name>
date: YYYY-MM-DD
```

## Session Details

| Field | Value |
|-------|-------|
| Initiated by | Por |
| Reason Hermes bypassed | <why Hermes was not used> |
| Codex mode | exec / review / interactive |
| Sandbox mode | read-only / workspace-write / none |
| Reasoning level | Low / Medium / High |

## Task Summary

<One-line description of what was accomplished>

## Files Changed

| File | Action | Added | Removed |
|------|--------|-------|---------|
| `<path>` | Created / Modified / Deleted | N | N |

## Files Inspected

```
<path 1>
<path 2>
```

## Commands Run

| Command | Result |
|---------|--------|
| `git status --short` | Clean / (list files) |
| `git diff --stat` | N files changed |
| `git log -1 --oneline` | `<hash> <message>` |
| `npm run lint` | ✅ PASS / ❌ FAIL |
| `npm run build` | ✅ PASS / ❌ FAIL |

## Screenshots / QA Artifacts

| Artifact | Path |
|----------|------|
| Screenshot | `_qa/screenshots/<phase>/<file>.png` |

## Validation

| Check | Result |
|-------|--------|
| Lint | ✅ / ❌ / N/A |
| Build | ✅ / ❌ / N/A |
| Test | ⏳ Not configured |

## Risk Score

🟢 Low / 🟡 Medium / 🟠 High / 🔴 Critical

## Confirmed NOT Modified

- `src/core/auth/` — untouched
- `src/finance/` — untouched
- `src/trading/` — untouched
- `src/creator/` — untouched
- Firebase config — untouched
- `.env` files — untouched

## Cost / Quota

| Field | Value |
|-------|-------|
| Agent used | Codex CLI |
| Why selected | <rationale> |
| Cheaper path considered | Yes / No |
| Paid executor used? | No |
| Codex quota status before | <if known> |
| Codex quota status after | <if known> |
| Quota evidence source | CLI output / usage counter / screenshot / user statement / unknown |

## Scope Summary

| Check | Status |
|-------|--------|
| Allowed files matched? | ✅ / ❌ |
| Forbidden files untouched? | ✅ / ❌ |
| Scope deviations? | None / (list) |

## Evidence Summary

All claims backed by captured command output.

## Warning

**Codex direct output is not automatically approved.** Codex sessions run directly by Por bypass Hermes routing, review gates, and budget checks. Standard review gates still apply.

## Review Recommendation

**APPROVE** / **REVISE** / **HOLD FOR EVIDENCE** / **REJECT**

## Reopen Criteria

- <condition 1>
- <condition 2>

## Git Confirmation

| Field | Value |
|-------|-------|
| Branch | `<name>` |
| Working tree | Clean / Dirty |
| Committed? | Yes / No |
| Commit hash | `<hash or N/A>` |
| Pushed? | Yes / No |
| Merge performed? | Yes / No |
| Hermes review required? | Yes / No |
| Por approval required? | Yes / No |

## Risks / Remaining Issues

| Risk | Severity | Status |
|------|----------|--------|
| <description> | 🟢 / 🟡 / 🟠 / 🔴 | Open / Mitigated / Closed |

## Suggested Next Mission

<Recommendation based on closeout findings>
