# Agent Routing Matrix

**Purpose:** Define which agent to route each task type to, based on risk, cost, quota, repo sensitivity, and required reasoning depth.

---

## Routing by Task Type

| Task Type | Route | Reasoning Level | Risk | Cost | Quota Impact |
|-----------|-------|-----------------|------|------|-------------|
| Docs-only updates | **Hermes Direct** | Low | 🟢 LOW | Free | None |
| Summaries | **Hermes Direct** | Low | 🟢 LOW | Free | None |
| Review gates / closeouts | **Hermes Direct** | Low | 🟢 LOW | Free | None |
| Checklist validation | **Hermes Direct** | Low | 🟢 LOW | Free | None |
| Low-risk governance edits | **Hermes Direct** | Low | 🟢 LOW | Free | None |
| Deep repo inspection | **Codex CLI** | Medium | 🟢 LOW | Free (quota) | Uses quota |
| Architecture review | **Codex CLI** | Medium-High | 🟡 MEDIUM | Free (quota) | Uses quota |
| Refactor planning | **Codex CLI** | Medium-High | 🟡 MEDIUM | Free (quota) | Uses quota |
| Production repo read-only analysis | **Codex CLI** | Medium-High | 🟡 MEDIUM | Free (quota) | Uses quota |
| Dependency/risk/security/data-flow review | **Codex CLI** | High | 🟠 HIGH | Free (quota) | Uses quota |
| Finance/trading/auth read-only review | **Codex CLI** | High | 🔴 CRITICAL | Free (quota) | Uses quota |
| Sandbox execution | **OpenCode / DeepSeek** | Low-Medium | 🟢 LOW | Paid | None |
| Fast implementation drafts | **OpenCode / DeepSeek** | Low-Medium | 🟡 MEDIUM | Paid | None |
| Repetitive edits | **OpenCode / DeepSeek** | Low | 🟢 LOW | Paid | None |
| Docs generation (if cost justified) | **OpenCode / DeepSeek** | Low | 🟢 LOW | Paid | None |
| Production repo write | **Escalate to Por** | — | 🔴 CRITICAL | — | — |

---

## Decision Factors

When routing a task, evaluate these factors in order:

| Factor | What to Check |
|--------|---------------|
| **1. Risk level** | Is this LOW, MEDIUM, HIGH, or CRITICAL per the approval gates? |
| **2. Repo sensitivity** | Does the task touch forbidden paths (src/, finance, trading, auth, etc.)? |
| **3. Cost** | Is there a free/cheaper route (Hermes Direct, Codex) that can handle this? |
| **4. Quota** | Does Codex have quota available? Is this task worth spending quota on? |
| **5. Reasoning depth** | Does the task require Low (doc review), Medium (multi-file implications), or High (production risk / security / finance) reasoning? |
| **6. Forbidden areas** | Does the task touch paths that require Por + ChatGPT escalation? |
| **7. Approval required** | Does the output need Por approval before commit/merge/push? |

---

## Reasoning Level Guide for Codex CLI

| Level | When to Use | Examples |
|-------|-------------|----------|
| **Low** | Simple review, no multi-file implications | Single-file doc review, small diff validation, checklist check |
| **Medium** | Multi-file reasoning, architecture implications | Cross-module dependency review, component impact analysis, refactor scoping |
| **High** | Production risk, security, auth, finance, trading, data-flow | Finance/trading logic review, auth boundary verification, production data-flow audit |

**Rule:** Do not default to High/Deep unless the task actually requires it. Match reasoning level to task complexity to preserve Codex quota.

---

## Route Selection Flowchart

```
Task arrives
  │
  ├─ Docs / summaries / closeout / checklist?
  │     └─▶ Hermes Direct (Low reasoning, free, no quota)
  │
  ├─ Needs repo inspection / architecture / deep review?
  │     ├─ Read-only? ──▶ Codex CLI (Medium-High reasoning, uses quota)
  │     └─ Write needed? ──▶ Escalate to Por
  │
  ├─ Needs fast execution / sandbox / repetitive edits?
  │     ├─ Cost justified? ──▶ OpenCode / DeepSeek (paid)
  │     └─ Not justified? ──▶ Reconsider: can Hermes Direct or Codex handle it?
  │
  └─ Touches forbidden paths or unclear?
        └─▶ Escalate to Por (+ ChatGPT if HIGH/CRITICAL)
```
