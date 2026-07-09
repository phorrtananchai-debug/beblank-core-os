# Hermes Sync Runtime v1

**Purpose:** Convert completed Closeout Packet v3 files into local mission state. Manual, local-first, no background service.

---

## CLI Usage

```bash
node scripts/hermes-sync.mjs <closeout-file>

# Or via npm:
npm run hermes:sync -- <closeout-file>
```

## Input

A Closeout Packet v3 markdown file (see `docs/hermes/CLOSEOUT_PACKET_V3.md`).

Parsed fields:
- Mission Metadata (frontmatter): `mission_id`, `closeout_id`, `session_id`, `agent`, `branch`, `risk`
- Validation section: build and lint results
- Git Confirmation section: commit hash
- Review Recommendation: APPROVE / REVISE / HOLD FOR EVIDENCE / REJECT
- Suggested Next Mission

## Output

`./.hermes/state/current-missions.json`

```json
{
  "mission_id": "MISSION-20260710-001",
  "status": "approval",
  "risk": "LOW",
  "executor": "Codex Direct",
  "branch": "main",
  "commit": "abc1234",
  "build": "PASS",
  "lint": "PASS",
  "review_recommendation": "APPROVE",
  "review_required": true,
  "push_required": true,
  "next_mission": "UI Stabilization v1 polish",
  "updated_at": "2026-07-10T12:00:00.000Z"
}
```

## State Management

- If a mission with the same `mission_id` already exists in the state file, it is **replaced**.
- If no existing mission matches, it is **appended**.
- The state file is a flat JSON array — no indexes, no database.
- The runtime does not modify git or repository files.

## Limitations

- No background watcher — manual execution only.
- No cross-file dependency resolution.
- No diff/delta tracking between state versions.
- No automatic cleanup of stale missions.
- Frontmatter parsing is regex-based — no YAML library.
- Only v3 closeout format is supported.
