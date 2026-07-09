# Closeout Report Template v3

**Purpose:** Structured closeout report produced after every mission. Follows Closeout Packet v3 schema.

---

```yaml
closeout_id: CLOSEOUT-YYYYMMDD-NNN
mission_id: MISSION-YYYYMMDD-NNN
session_id: SESSION-YYYYMMDD-NNN
parent_mission: (optional)
agent: <Hermes Direct / Codex CLI / OpenCode / DeepSeek>
branch: <branch name>
date: YYYY-MM-DD
```

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
| Agent used | `<agent>` |
| Why selected | `<rationale>` |
| Cheaper path considered | Yes / No |
| Paid executor used? | Yes / No |
| Paid executor justification | `<if Yes>` |
| Codex quota status | Active / Exhausted / Unknown / N/A |
| Quota evidence source | `<source>` |

## Scope Summary

| Check | Status |
|-------|--------|
| Allowed files matched? | ✅ / ❌ |
| Forbidden files untouched? | ✅ / ❌ |
| Scope deviations? | None / (list) |

## Evidence Summary

All claims backed by captured command output. Key evidence:

- `<evidence 1>`
- `<evidence 2>`

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

## Risks / Remaining Issues

| Risk | Severity | Status |
|------|----------|--------|
| <description> | 🟢 / 🟡 / 🟠 / 🔴 | Open / Mitigated / Closed |

## Suggested Next Mission

<Recommendation based on closeout findings>
