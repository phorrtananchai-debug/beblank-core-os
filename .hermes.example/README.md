# .hermes.example — Hermes Local Runtime Folder

**Purpose:** Example scaffold for Hermes packet-based coordination folders. Demonstrates the expected structure for the real (gitignored) `.hermes/` runtime folder.

---

## Folder Structure

| Folder | Purpose |
|--------|---------|
| `inbox/` | Incoming task/handoff packets from external agents (Codex Direct, OpenCode, etc.) |
| `outbox/` | Packets Hermes prepares for other agents or Por |
| `closeouts/` | Completed session closeout reports |
| `review-queue/` | Items waiting for Por/ChatGPT review |
| `state/` | Local derived state snapshots — not source of truth |

---

## Important Notes

- **This is an example folder only.** The real runtime folder should be `.hermes/` and must stay gitignored.
- **No secrets, API keys, env values, or private logs should be committed** to this or any folder.
- **Packets must be evidence-based.** Every claim should be backed by command or tool output.
- The `.hermes.example/` folder is version-controlled to show the expected structure. Copy it to `.hermes/` for actual use.
- `.hermes/` is excluded from git via `.gitignore` — runtime state is local only.
