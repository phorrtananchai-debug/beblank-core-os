# Closeout Packet v3 Schema

**Purpose:** Standard schema for all Hermes, Codex, OpenCode, and DeepSeek closeouts.

---

## v3 Blocks

### 1. Mission Metadata

| Field | Required | Example |
|-------|----------|---------|
| `closeout_id` | ✅ | `CLOSEOUT-20260710-001` |
| `mission_id` | ✅ | `MISSION-20260710-001` |
| `session_id` | ✅ | `SESSION-20260710-001` |
| `parent_mission` | conditional | If this closeout is part of a larger mission |
| `agent` | ✅ | Hermes Direct / Codex CLI / OpenCode / DeepSeek |
| `branch` | ✅ | `main` |
| `date` | ✅ | `2026-07-10` |

### 2. Task Summary

One-line description of what was accomplished. Must match the mission scope.

### 3. Files Changed

| File | Action | Lines Added | Lines Removed |
|------|--------|-------------|---------------|
| `path/to/file` | Created / Modified / Deleted | N | N |

### 4. Files Inspected

List of files that were read but not modified. Important for read-only inspection closeouts.

### 5. Commands Run

| Command | Output Summary |
|---------|---------------|
| `git status --short` | (clean / files listed) |
| `npm run build` | PASS / FAIL |
| `npm run lint` | PASS / FAIL |

### 6. Screenshots / QA Artifacts

| Artifact | Path | Purpose |
|----------|------|---------|
| Screenshot | `_qa/screenshots/phase-name/01-route.png` | Visual verification |
| QA Report | `_qa/screenshots/phase-name/QA_REPORT.md` | QA evidence |

### 7. Validation

| Check | Result |
|-------|--------|
| `npm run lint` | ✅ PASS / ❌ FAIL / N/A |
| `npm run build` | ✅ PASS / ❌ FAIL / N/A |
| Test suite | ✅ PASS / ❌ FAIL / ⏳ Not configured |

### 8. Risk Score

| Score | Meaning |
|-------|---------|
| 🟢 Low | Docs-only, read-only, no production impact |
| 🟡 Medium | UI changes, config-adjacent, new components |
| 🟠 High | Production code, routing, auth, data flow |
| 🔴 Critical | Real trading, secrets, external integrations, Firebase production |

### 9. Confirmed NOT Modified

List of protected paths that were explicitly verified as untouched:

- `src/core/auth/`
- `src/finance/`
- `src/trading/`
- `src/creator/`
- Firebase config
- `.env` files

### 10. Cost / Quota

| Field | Value |
|-------|-------|
| Agent used | Hermes Direct / Codex CLI / OpenCode / DeepSeek |
| Why selected | Rationale for route choice |
| Cheaper path considered | Yes / No |
| Paid executor used? | Yes / No |
| Paid executor justification | (if Yes) |
| Codex quota status | Active / Exhausted / Unknown / N/A |
| Quota evidence source | CLI output / usage counter / screenshot / user statement / unknown |

### 11. Scope Summary

| Field | Value |
|-------|-------|
| Allowed files matched? | ✅ Yes / ❌ No |
| Forbidden files untouched? | ✅ Yes / ❌ No |
| Scope deviations? | None / (list deviations) |

### 12. Evidence Summary

Every claim in this closeout is backed by captured command output. Key evidence:

- `git status --short` → Clean
- `git diff --stat` → N files changed
- `npm run build` → PASS
- (other evidence)

### 13. Review Recommendation

| Verdict | Meaning |
|---------|---------|
| **APPROVE** | Evidence complete, scope compliant, build passes |
| **REVISE** | Minor issues found — specific revisions listed |
| **HOLD FOR EVIDENCE** | Missing or incomplete evidence — specific gaps listed |
| **REJECT** | Scope violation or evidence cannot be verified |

### 14. Reopen Criteria

Conditions under which this closeout should be reopened:

- New evidence contradicts a finding
- A regression is found after commit
- Por requests additional work in the same scope

### 15. Git Confirmation

| Field | Value |
|-------|-------|
| Branch | `main` |
| Working tree | Clean / Dirty |
| Committed? | Yes / No |
| Commit hash | `abc123` (or N/A) |
| Pushed? | Yes / No |
| Merge performed? | Yes / No |

### 16. Risks / Remaining Issues

| Risk | Severity | Status |
|------|----------|--------|
| Description | 🟢 / 🟡 / 🟠 / 🔴 | Open / Mitigated / Closed |

### 17. Suggested Next Mission

What should be worked on next, based on findings in this closeout.

---

## Evidence-First Rule

Every claim in a v3 closeout must be backed by a command output or tool result. If a claim cannot be evidenced, it must be marked as:

> **Unverified:** <reason>

---

## Commit/Push/Merge Status

Every v3 closeout must explicitly state:

| Field | Value |
|-------|-------|
| **Commit made?** | Yes / No |
| **Push performed?** | Yes / No |
| **Merge performed?** | Yes / No |
| **Push approval required?** | Yes — always requires explicit Por approval |

---

## HOLD FOR EVIDENCE

If any required evidence is missing or incomplete, Hermes must classify the closeout as **HOLD FOR EVIDENCE** and list the specific gaps. The closeout cannot proceed to approval until evidence is provided.
