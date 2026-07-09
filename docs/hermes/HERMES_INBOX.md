# Hermes Inbox — Manual Sync Workflow

**Purpose:** Define how incoming handoff and task packets reach Hermes via the local `.hermes/inbox/` folder, and how Hermes processes them.

---

## Manual Workflow

```
1. External agent creates handoff packet
   └─ Codex Direct, OpenCode, or manual edits produce a handoff
   └─ Packet follows template from docs/hermes/CODEX_DIRECT_CLOSEOUT_TEMPLATE.md
   └─ Packet is evidence-based, with git status, diff, commands run

2. Por places packet into .hermes/inbox/
   └─ Por or the external agent copies the handoff into .hermes/inbox/
   └─ File named per convention: YYYY-MM-DD_phase_agent_short-title.md

3. Hermes reads it manually when opened
   └─ Hermes scans .hermes/inbox/ for new packets
   └─ Processes them one at a time

4. Hermes validates evidence
   └─ git branch --show-current
   └─ git status --short
   └─ git log -1 --oneline
   └─ git diff --name-only (if uncommitted changes)
   └─ Compare handoff claims against actual repo state

5. Hermes creates review item or closeout
   └─ If valid: create review queue item or closeout report
   └─ If invalid or incomplete: hold for evidence

6. Por approves next action
   └─ Por reviews Hermes's findings
   └─ Approves, revises, rejects, or holds
```

---

## Packet Naming Convention

Recommended format:

```
YYYY-MM-DD_phase_agent_short-title.md
```

Examples:

| File Name | Content |
|-----------|---------|
| `2026-07-09_6C0_codex-direct-routing-review.md` | Codex Direct session review from Phase 6C.0 |
| `2026-07-09_7-1_hermes-inbox-closeout.md` | Closeout for Phase 7.1 inbox scaffold |
| `2026-07-10_7-2_codex-readonly-inspection.md` | Codex read-only inspection session |

---

## Limitations

| Limitation | Implication |
|------------|-------------|
| **Hermes cannot detect work while closed.** | Packets must be placed manually in `.hermes/inbox/`. Hermes only processes them when opened. |
| **Inbox sync is manual/local.** | There is no background watcher, cron job, or polling service. The inbox is a file folder, not a message queue. |
| **Inbox does not equal approval.** | A packet in the inbox means a handoff was received, not that the work is approved. Por must still approve commits and merges. |
| **No background watcher exists.** | No runner, daemon, or service monitors the inbox. This is a manual governance folder only. |

---

## Processing Rules

- Process packets in order of date (oldest first).
- If a packet has incomplete evidence, move it to `hold` status and ask Por for clarification.
- If a packet references a commit that doesn't exist, escalate to Por.
- If a packet touches forbidden paths, escalate immediately.
- After processing, move the packet to `.hermes/closeouts/` with a processed timestamp note.
