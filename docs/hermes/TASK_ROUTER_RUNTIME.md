# Hermes Task Router Runtime

**Purpose:** How the task router CLI works, what it reads, what it outputs, and how to interpret the routing plan.

---

## CLI Usage

```bash
node scripts/hermes-route-task.mjs <task-packet.md>
```

## Input

A task packet markdown file with sections:
- `## Mission` — task description
- `## Allowed Files` — files the agent may touch
- `## Forbidden Files` — files the agent must not touch

The router also reads the agent registry from:
- `.hermes/state/agent-registry.json` (runtime, gitignored) or
- `.hermes.example/state/agent-registry.example.json` (example, version-controlled)

## Output

### Human-readable summary

```
╔════════════════════════════════════════════════╗
║        HERMES TASK ROUTER — ROUTING PLAN       ║
╚════════════════════════════════════════════════╝

  Mission ID:    MISSION-20260710-001
  Risk Level:    MEDIUM
  Capabilities:  ui-implementation, build-verification

  Recommended:   OpenCode (paid)
  Alternatives:  DeepSeek (paid)

  ⚠ Protected paths detected:
    - auth
```

### JSON output (after `--- JSON ---`)

```json
{
  "mission_id": "MISSION-20260710-001",
  "risk": "MEDIUM",
  "capabilities": ["ui-implementation"],
  "requires_human": false,
  "recommended": { "id": "opencode", "name": "OpenCode", "cost": "paid" },
  "forbidden_paths_detected": []
}
```

## Routing Logic

### Step 1: Infer capabilities

The router scans the task packet for keywords:

| Keyword | Capability | Risk |
|---------|-----------|------|
| docs, documentation, report | documentation | LOW |
| inspect, audit, scan | repo-inspection | LOW |
| review, qa | qa-review | LOW |
| architecture, refactor, plan | architecture-review | MEDIUM |
| ui, component, page, layout, css | ui-implementation | MEDIUM |
| auth, login, permission | code-review | HIGH |
| finance, trading, investment | code-review | HIGH |
| firebase, deploy, production | code-review | CRITICAL |

### Step 2: Classify risk

Risk is the highest risk among all matched capabilities.

### Step 3: Check forbidden paths

If the task mentions auth, finance, trading, creator, firebase, .env, or package.json, it is marked HUMAN REQUIRED.

### Step 4: Find best agent

Agents are filtered by matching capabilities and risk limit, then sorted by cost (free → free-quota → paid → human). The cheapest adequate agent is recommended.

## Limitations

- Keyword matching is heuristic — may miss capabilities for unusual task descriptions.
- No auto execution — routing plan is advisory only.
- No learning from past routing decisions.
- Registry must be manually updated when agents change.
