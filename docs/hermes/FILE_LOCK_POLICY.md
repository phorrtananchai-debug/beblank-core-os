# Hermes File Lock Policy

**Purpose:** Prevent concurrent Hermes tasks from editing the same files. Locks are local-only, manual, and scoped to a single mission.

---

## Lock File Format

Lock files live in `.hermes/locks/` and are named after the mission:

```
.hermes/locks/MISSION-20260710-001.json
```

```json
{
  "mission_id": "MISSION-20260710-001",
  "agent": "opencode",
  "files": ["src/components/portfolio/PortfolioHomepageCanvas.tsx", "src/index.css"],
  "acquired": "2026-07-10T12:00:00Z",
  "status": "running"
}
```

## Lock Lifecycle

| State | Description |
|-------|-------------|
| **running** | Mission is actively executing. Lock is active. |
| **review** | Mission closeout submitted. Lock still active — file changes are pending review. |
| **released** | Mission closed or rejected. Lock removed. Files are available again. |

## Lock Rules

| Rule | Description |
|------|-------------|
| **One mission per file** | If a file is locked by any active mission, no new mission may modify it. |
| **Read-only is exempt** | Read-only inspection does not require a lock. |
| **Locks are scoped to files** | A lock lists specific file paths, not directories. |
| **Lock by glob** | Use `**` patterns for broad scope: `docs/**` locks all docs. |
| **Manual release** | Locks are released manually when a mission reaches CLOSED. No auto-release. |
| **Stale locks** | If a lock is older than 24 hours with no progress, escalate to Por. |
| **No cross-session locks** | Locks are per-session. Past session locks are archived. |

## Creating a Lock

When a task is assigned, the agent or Hermes should create a lock file:

```bash
cat > .hermes/locks/MISSION-20260710-001.json << 'EOF'
{
  "mission_id": "MISSION-20260710-001",
  "agent": "opencode",
  "files": ["src/components/portfolio/PortfolioHomepageCanvas.tsx"],
  "acquired": "2026-07-10T12:00:00Z",
  "status": "running"
}
EOF
```

## Releasing a Lock

When a mission reaches CLOSED, remove the lock:

```bash
rm .hermes/locks/MISSION-20260710-001.json
```

## Lock Conflict Resolution

| Conflict Type | Resolution |
|---------------|------------|
| Lock file exists for same mission | Replace — same mission updating its scope |
| Lock exists for different mission on overlapping files | WARN — Por decides priority or merges scope |
| Lock exists for protected paths (auth/finance/trading) | BLOCKED — Por + ChatGPT must decide |

## .hermes.example/locks/

The `.hermes.example/locks/` directory contains example lock files for reference. Actual runtime lock files are in `.hermes/locks/` (gitignored).
