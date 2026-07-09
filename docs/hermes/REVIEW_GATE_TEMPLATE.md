# Review Gate Template

**Purpose:** Structured review gate for Por (and optionally ChatGPT) to evaluate a closeout and decide next action. One verdict per review.

---

```yaml
packet_id: <PKT-YYYY-MM-DD-NNN>
phase: <Phase identifier>
mission: <Mission statement>
reviewer: <Por | Por + ChatGPT>
date: <YYYY-MM-DD>
```

## Evidence Reviewed

- [ ] Closeout report
- [ ] `git status` output
- [ ] `git diff` output
- [ ] Build/test output
- [ ] Command evidence log

## Checklist

| # | Check | Pass |
|---|-------|------|
| 1 | Only allowed files were created/modified | ✅ / ❌ |
| 2 | No forbidden paths were touched (`src/`, `package.json`, lock files, routes, finance, trading, auth, creator, config, data-flow, env) | ✅ / ❌ |
| 3 | No production logic was modified | ✅ / ❌ |
| 4 | No package/dependency change was made | ✅ / ❌ |
| 5 | No autonomous git action was performed (commit/merge/push) | ✅ / ❌ |
| 6 | All claims are evidence-first (backed by command output) | ✅ / ❌ |
| 7 | Build/test result is included and passes | ✅ / ❌ / N/A |
| 8 | No secrets, API keys, or credentials were exposed | ✅ / ❌ |
| 9 | Scope deviations (if any) are documented and approved | ✅ / ❌ / N/A |
| 10 | Closeout report is complete and accurate | ✅ / ❌ |
| 11 | Cost/quota routing is documented and justified | ✅ / ❌ / N/A |
| 12 | Codex quota/reset is evidence-based, not guessed | ✅ / ❌ / N/A |
| 13 | Paid executor usage (OpenCode/DeepSeek) is justified | ✅ / ❌ / N/A |

## Verdict

Choose **one** verdict:

---

### ✅ APPROVE FOR COMMIT

The evidence packet demonstrates scope compliance, no forbidden paths touched, build passing, and evidence-first claims.

**Next step:** Por will issue the commit command.

---

### 🔄 REQUEST REVISIONS

The following issues must be resolved before re-review:

1. <Issue 1>
2. <Issue 2>
3. <Issue 3>

**Next step:** Agent addresses each issue, produces updated evidence, and resubmits.

---

### ❌ REJECT

The work does not meet acceptance criteria. Reason:

<Reason>

**Next step:** Abandon or restart with new scope definition.

---

### ⏸️ HOLD FOR MORE EVIDENCE

The current evidence is insufficient to decide. Additional evidence needed:

1. <What evidence is missing>
2. <What commands to run>
3. <What files to show>

**Next step:** Agent provides requested evidence without modifying files.

---

## Review Notes

<Optional: free-form notes from the reviewer>

## Decision

**Verdict:** <APPROVE / REVISE / REJECT / HOLD>

**Approved by:** <Por / Por + ChatGPT>

**Date:** <YYYY-MM-DD>

---

## Example: Filled Review Gate

```yaml
packet_id: PKT-2026-07-09-001
phase: Phase 6B.2
mission: Create Hermes packet schema templates
reviewer: Por
date: 2026-07-09
```

## Checklist

| # | Check | Pass |
|---|-------|------|
| 1 | Only allowed files were created/modified | ✅ |
| 2 | No forbidden paths touched | ✅ |
| 3 | No production logic modified | ✅ |
| 4 | No package/dependency change | ✅ |
| 5 | No autonomous git action | ✅ |
| 6 | Evidence-first claims | ✅ |
| 7 | Build/test result included and passes | ✅ |
| 8 | No secrets exposed | ✅ |
| 9 | Scope deviations documented | N/A |
| 10 | Closeout report complete | ✅ |

## Verdict

### ✅ APPROVE FOR COMMIT
