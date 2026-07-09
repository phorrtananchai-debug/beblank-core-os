# Codex Direct Closeout Template

**Purpose:** Template for Codex sessions started directly by Por (not routed through Hermes). When Por runs Codex CLI directly, Codex should produce a closeout using this template so Hermes can sync the work later.

---

```yaml
session_date: <YYYY-MM-DD>
session_time: <HH:MM UTC>
initiated_by: Por
agent: Codex CLI
reason_hermes_bypassed: <Why Hermes was not used — e.g., "quick inspection", "Hermes not open", "performance">
```

## Session Details

| Field | Value |
|-------|-------|
| **Repo path** | `<Full repo path>` |
| **Branch** | `<branch name>` |
| **Codex mode** | `<exec / review / interactive>` |
| **Restricted commands?** | `<Yes / No — if yes, list restricted commands used>` |
| **Sandbox mode** | `<read-only / workspace-write / none>` |
| **Reasoning level used** | `<Low / Medium / High>` |
| **Quota status before** | `<If known — include source>` |
| **Quota status after** | `<If known — include source>` |
| **Quota evidence source** | `<CLI output / usage counter / screenshot / user statement / unknown>` |

## Warning

**Codex direct output is not automatically approved.** Codex sessions run directly by Por bypass Hermes routing, review gates, and budget checks. Work produced during a Codex Direct session still requires Hermes/Por review before commit, especially for production-sensitive or HIGH/CRITICAL risk paths.

---

## Task Summary

<Brief description of what was done>

## Files Inspected

```
<file path 1>
<file path 2>
```

## Files Changed

| File | Action | Lines |
|------|--------|-------|
| `<path>` | Created / Modified / Deleted | `<N> additions, <N> deletions` |

## Commands Run

```bash
<command 1> → <output or ✅/❌>
<command 2> → <output or ✅/❌>
```

## Outputs / Evidence

- `<Evidence item 1>`
- `<Evidence item 2>`

## Risks Found

| Risk | Severity | Notes |
|------|----------|-------|
| <Risk description> | 🟢 Low / 🟡 Medium / 🟠 High / 🔴 Critical | <Notes> |

## Recommendations

- <Recommendation 1>
- <Recommendation 2>

## Commit/Push Status

| Action | Status |
|--------|--------|
| **Commit made?** | `<Yes / No>` |
| **Commit hash** | `<hash or N/A>` |
| **Push made?** | `<Yes / No>` |

## Review Requirements

| Requirement | Value |
|-------------|-------|
| **Hermes review required?** | `<Yes / No — if Yes, Hermes must verify before Por approves>` |
| **Por approval required?** | `<Yes / No>` |
| **ChatGPT review required?** | `<Yes / No>` |
| **Production-sensitive?** | `<Yes / No — if Yes, standard review gates apply>` |

## Next Suggested Action

- <Action 1>
- <Action 2>
- Awaiting Por instruction.
