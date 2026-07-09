# Task Packet Template

**Purpose:** Reusable template for giving work to Hermes, Codex, OpenCode, or DeepSeek.

---

```yaml
packet_id: <PKT-YYYY-MM-DD-NNN>
phase: <Phase identifier>
owner: <Name>
agent_role: <Hermes Direct | Codex CLI | OpenCode CLI | DS/OpenCode>
```

## Mission

<One-line description of what needs to be done>

## Scope

- Create: <list of files to create>
- Modify: <list of files to modify>
- Read only: <list of files to inspect>
- Do NOT touch: <list of forbidden files/paths>

## Constraints

- <Constraint 1 — e.g., "Do not install packages">
- <Constraint 2 — e.g., "Do not modify src/">
- <Constraint 3 — e.g., "Do not modify package.json">

## Allowed Files

```
<file path 1>
<file path 2>
```

## Forbidden Files

```
<path 1>
<path 2>
```

## Required Commands

```bash
# Verification commands that must be run before closeout
git status --short
git diff --stat
npm run build  # if applicable
```

## Expected Output

- <Output 1 — e.g., "New markdown file at docs/hermes/TASK_PACKET_TEMPLATE.md">
- <Output 2 — e.g., "git diff output showing only expected changes">
- <Output 3 — e.g., "Build pass confirmation">

## Stop Conditions

Stop and ask Por if:

- A forbidden file would need to be touched
- A command fails unexpectedly
- The scope is unclear or ambiguous
- External dependencies would be required
- Cloud/gateway/background services would be needed

## Approval Requirements

| Gate | Required By | What's Needed |
|------|-------------|---------------|
| Plan approval | Por | Step-by-step plan |
| Write | Por | Approval to begin writing |
| Commit | Por | Full evidence packet |
| Merge/Push | Por | Explicit command |

## Cost & Quota Notes

- **Hermes Direct** for simple docs/review/closeout work — lowest cost, preferred default.
- **Codex CLI** for deep review, architecture analysis, and read-only repo inspection when the task justifies it. Codex has no direct per-task cost but is quota/limit constrained.
- **Codex reasoning level** must match task complexity. Do not use maximum reasoning for trivial lookups.
- **OpenCode / DeepSeek** are paid or cost-incurring executors. Their usage must be explicitly justified in the closeout.
- **Avoid paid executor calls** when Hermes Direct or Codex read-only is sufficient for the task.

---

## Example: Filled Template

```yaml
packet_id: PKT-2026-07-09-001
phase: Phase 6B.2
owner: Por
agent_role: Hermes Direct
```

## Mission

Create Hermes packet schema and template docs in `docs/hermes/`

## Scope

- Create: docs/hermes/PACKET_SCHEMA.md
- Create: docs/hermes/TASK_PACKET_TEMPLATE.md
- Create: docs/hermes/CLOSEOUT_TEMPLATE.md
- Create: docs/hermes/REVIEW_GATE_TEMPLATE.md
- Do NOT touch: src/, package.json, scripts/, routes/, finance/, trading/, auth/, config/, .env

## Constraints

- Do not implement any runner or automation logic
- Do not add cloud memory, gateway, API, or external dependency
- Do not claim Jarvis is fully implemented
- No autonomous commit/merge/push

## Expected Output

- 4 markdown template files under docs/hermes/
- `git status` shows 4 untracked files
- `npm run build` passes
- No files outside `docs/hermes/` changed
