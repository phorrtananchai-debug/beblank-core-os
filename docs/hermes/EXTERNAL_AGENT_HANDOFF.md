# External Agent Handoff

**Purpose:** Define how external agent sessions (Codex Direct, OpenCode, DeepSeek, or manual edits performed outside Hermes) must leave evidence-based handoff packets so Hermes can sync work later.

---

## The Problem

Por may sometimes use agents directly—Codex CLI, OpenCode, DeepSeek, or manual edits—without routing through Hermes. Hermes cannot know about work done while it is closed. Without a structured handoff, Hermes would have to guess what changed, why, and whether it was approved.

**Solution:** Every external agent session must leave an evidence-based handoff packet in `docs/hermes/handoffs/`. When Hermes opens later, it reads available handoff packets and syncs them into its operating context.

---

## External Agent Types

| Agent Type | When Used | Handoff Required |
|------------|-----------|-----------------|
| **Codex Direct** | Por runs Codex CLI directly (not through Hermes) | ✅ Required — use `CODEX_DIRECT_CLOSEOUT_TEMPLATE.md` |
| **OpenCode Sandbox** | Por runs OpenCode in sandbox mode directly | ✅ Required — summarize scope and output |
| **DeepSeek/OpenCode Executor** | Por routes work to DS/OpenCode directly | ✅ Required — summarize scope and output |
| **Human manual edits** | Por or a human edits files directly | ✅ Required — describe what changed and why |

---

## Handoff Principles

| Principle | Rule |
|-----------|------|
| **Evidence-first** | Every claim must be backed by command or tool output |
| **No guessing** | Do not infer what happened — only report what was observed |
| **Repo/branch stated** | Always include the repo path and branch name |
| **Scope stated** | List allowed files and forbidden files for the session |
| **Files changed stated** | List every file inspected or changed |
| **Commands run stated** | List every command executed with its output |
| **Commit/push status stated** | Say whether a commit or push was made, and the commit hash |
| **Risk notes included** | Note any risks discovered during the session |
| **Next action requested** | Say what should happen next (review, approve, ignore) |

---

## When No Handoff Exists

- If no handoff packet is found, Hermes must treat the external work as **unknown**.
- Hermes must not assume the working tree state is intentional.
- Hermes must ask Por/ChatGPT before trusting any result without a handoff.

## When Evidence Is Incomplete

- If a handoff exists but is missing required fields, Hermes must ask Por/ChatGPT before proceeding.
- Hermes must not fill in missing evidence by guessing.
- Hermes must not approve or sync work with incomplete evidence.

## Important

**Hermes Sync is a review/import process, not proof of approval.** Even if a handoff passes sync review, Por must still approve commits and merges. Hermes sync does not grant autonomous git permission.
