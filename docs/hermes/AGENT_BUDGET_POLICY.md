# Agent Budget Policy

**Purpose:** Define cost and quota rules for agent routing, ensuring efficient use of free (Hermes Direct, Codex) and paid (OpenCode/DeepSeek) executors.

---

## Route Cost Classification

| Route | Direct Cost | Quota/Limit | Best For |
|-------|-------------|-------------|----------|
| **Hermes Direct** | Free | None | Simple docs, summaries, review gates, closeouts, checklist validation |
| **Codex CLI** | Free (no per-task charge) | Quota/limit constrained | Deep inspection, architecture review, refactor planning, production read-only |
| **OpenCode / DeepSeek** | Paid / cost-incurring | Per-call charges | Sandbox execution, fast drafts, repetitive edits (must be justified) |

---

## Routing Priority

When task arrives, evaluate routes in this order:

```
1. Can Hermes Direct handle this?
   └─ Yes → Use Hermes Direct (free, no quota impact)

2. If not, can Codex CLI handle this read-only?
   ├─ Yes, quota available → Use Codex CLI (free, uses quota)
   ├─ Yes, quota unknown → Escalate (never guess quota)
   └─ No → Continue to step 3

3. Is the task worth paid executor cost?
   └─ Yes → Use OpenCode/DeepSeek (justify in closeout)
   └─ No → Reconsider: can the scope be reduced to fit Hermes or Codex?
```

---

## Codex Quota Rules

### Do Not Guess

Codex remaining limit or reset timing must **never** be guessed. It can only come from:

| Source | Example |
|--------|---------|
| **Codex CLI output** | `codex exec` session logs showing rate limit or quota warnings |
| **Usage counter** | Terminal output from a quota-check command |
| **Screenshot from Por** | Visual evidence of quota/usage UI |
| **Explicit user evidence** | Por states the current limit verbally or in chat |

### When Quota Is Unknown

If no evidence is available, the closeout must state:

> **Codex quota status:** unknown — evidence required.

### When Quota Evidence Is Available

Include in the closeout:

> **Codex quota remaining:** `<number>`  
> **Reset time:** `<time>`  
> **Evidence source:** `<CLI output / usage counter / screenshot / user statement>`

---

## Paid Executor Rules (OpenCode / DeepSeek)

- **OpenCode / DeepSeek** are treated as paid or cost-incurring executors.
- Their usage must be **explicitly justified** in every closeout.
- **Avoid paid executor calls** when Hermes Direct or Codex read-only is sufficient.
- Never call a paid executor just to check something Hermes or Codex can inspect safely.
- Production repo write via OpenCode/DeepSeek is **not approved** — escalate to Por if proposed.

---

## Closeout Agent Budget / Quota Note

Every closeout report **must** include an Agent Budget / Quota Note with these fields:

| Field | Required | Description |
|-------|----------|-------------|
| **Agent used** | ✅ | Hermes Direct / Codex CLI / OpenCode CLI / DS/OpenCode |
| **Why selected** | ✅ | Rationale for route choice |
| **Cheaper path considered** | ✅ | Yes/No — if yes, why not taken |
| **Paid executor used?** | ✅ | Yes/No |
| **Paid executor justification** | conditional | Required if Yes — why Hermes Direct or Codex read-only was insufficient |
| **Codex quota status** | ✅ | Active / Exhausted / Unknown / Not applicable |
| **Quota evidence source** | ✅ | CLI output / usage counter / screenshot / user statement / unknown |
| **Codex quota preserved?** | ✅ | Yes/No/N/A — whether a cheaper route could have saved quota |

---

## Summary

1. **Hermes Direct** preferred for simple docs/review/closeout tasks — lowest cost, no quota.
2. **Codex CLI** for deep review / architecture / read-only inspection — no direct cost, but quota-limited. Match reasoning level to task complexity.
3. **OpenCode/DeepSeek** are paid executors — usage must be justified. Do not use when Hermes or Codex can handle the task.
4. **Codex quota** must be evidence-based, never guessed.
5. **Every closeout** must include an Agent Budget / Quota Note.
6. **When uncertain**, ask Por before routing to a costly or quota-heavy agent.
