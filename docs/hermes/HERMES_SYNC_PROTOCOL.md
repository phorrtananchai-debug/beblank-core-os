# Hermes Sync Protocol

**Purpose:** Define how Hermes syncs work performed externally (Codex Direct, OpenCode, DeepSeek, or manual edits) into its operating context after reading handoff packets.

---

## Sync Process

When Hermes opens and finds new external handoff packets in `docs/hermes/handoffs/`, it should follow these steps:

```
1. Identify handoff packets
   └─ Scan docs/hermes/handoffs/ for new .md handoff files

2. Verify repo and branch
   └─ git branch --show-current
   └─ Confirm repo path matches

3. Verify working tree status
   └─ git status --short

4. Compare claimed vs actual
   └─ git log -1 --oneline (check commit hash matches)
   └─ git diff --name-only (check claimed file changes)
   └─ Verify no unapproved files were touched

5. Check forbidden paths
   └─ Scan files changed against forbidden paths list
   └─ Escalate if any forbidden path was touched

6. Check commit/push status
   └─ Is the working tree clean?
   └─ Was a commit made? Does the hash match?
   └─ Was a push made?

7. Review risk notes
   └─ Evaluate risks documented in the handoff
   └─ Check if any require immediate action

8. Sync into operating context
   └─ Only after all evidence checks pass
   └─ Record: what changed, why, risk level, approval status

9. Escalate if uncertain
   └─ If evidence is incomplete or contradictory
   └─ If forbidden paths were touched
   └─ If commit was made without Por approval
```

---

## Sync Verdicts

| Verdict | Meaning | Next Step |
|---------|---------|-----------|
| **SYNC ACCEPTED** | Handoff evidence is complete and consistent with repo state. No forbidden paths touched. | Update Hermes operating context. Ready for Por review if commit approval is needed. |
| **SYNC ACCEPTED WITH WARNINGS** | Evidence is acceptable but has minor gaps or non-critical risks. | Update context with warnings noted. Escalate specific concerns to Por. |
| **HOLD FOR EVIDENCE** | Handoff is missing required fields or evidence is incomplete. | Ask Por for clarification. Do not sync until resolved. |
| **REJECT HANDOFF** | Handoff claims contradict repo state, or evidence is fabricated/unsupported. | Escalate to Por immediately. Do not sync. |
| **ESCALATE TO POR/CHATGPT** | Task touches HIGH/CRITICAL risk paths, or commit was made without approval. | Stop. Inform Por. Do not sync until Por instructs. |

---

## Required Sync Evidence

Before accepting a handoff, Hermes must verify:

| Evidence | Command | Purpose |
|----------|---------|---------|
| Current branch | `git branch --show-current` | Confirm the session worked on the correct branch |
| Working tree | `git status --short` | Check for uncommitted or unexpected changes |
| Latest commit | `git log -1 --oneline` | Verify claimed commit hash |
| Changed files | `git diff --name-only` (if uncommitted changes) | Confirm only expected files changed |
| Handoff content | Read the handoff file | Verify claims are complete and consistent |
| Command output | If commands are referenced | Verify outputs match what was claimed |

---

## Limitations

| Limitation | Implication |
|------------|-------------|
| **Hermes cannot know about external sessions while closed.** | Hermes only discovers handoffs when it opens. It must not assume it has a complete history. |
| **Hermes must not assume memory is current.** | External work may have happened after the last memory update. Treat memory as potentially stale. |
| **Hermes must not approve its own sync.** | Sync is a review/import process. Por must still approve commits and merges. |
| **Sync does not equal commit approval.** | Even if a handoff passes sync review, Por must still approve any commit or push. |
| **Incomplete handoffs cannot be trusted.** | If evidence is missing, Hermes must ask before proceeding. |

---

## Cost / Quota Note for External Sessions

- **Codex** has no direct per-task cost for us but is quota/limit constrained.
- **Codex quota/reset must never be guessed.**
- If Codex quota status is unknown, write:
  > **Codex quota status:** unknown — evidence required.
- If evidence is available, include:
  > **Codex quota remaining:** `<number>`  
  > **Reset time:** `<time>`  
  > **Evidence source:** `<CLI output / usage counter / screenshot / user statement>`
- **OpenCode / DeepSeek** are paid or cost-incurring executors. Their usage in external sessions must be documented and justified.
- **Hermes Direct** remains preferred for simple docs/review/closeout tasks — lowest cost, no quota impact.
