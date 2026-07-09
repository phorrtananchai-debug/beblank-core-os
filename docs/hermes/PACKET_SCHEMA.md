# Hermes Packet Schema

**Purpose:** Define the standard packet structure used for handoff, task assignment, and closeout across Hermes, Codex, OpenCode, and DeepSeek agents.

---

## Schema Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `packet_id` | string | ✅ | Unique identifier (e.g., `PKT-2026-07-09-001`) |
| `phase` | string | ✅ | Phase identifier (e.g., `Phase 6B.2`) |
| `mission` | string | ✅ | One-line mission statement |
| `owner` | string | ✅ | Human owner (Por) |
| `agent_role` | string | ✅ | Target agent: `Hermes Direct`, `Codex CLI`, `OpenCode CLI`, `DS/OpenCode` |
| `repo` | string | ✅ | Full repo path |
| `branch` | string | ✅ | Working branch |
| `allowed_files` | array | ✅ | List of files the agent may create/modify |
| `forbidden_files` | array | ✅ | List of files/paths the agent must never touch |
| `forbidden_actions` | array | ✅ | Actions the agent must never perform (e.g., `commit`, `merge`, `push`, `npm install`) |
| `required_checks` | array | ✅ | Checks that must pass before closeout (e.g., `git status`, `npm run build`) |
| `evidence_required` | boolean | ✅ | Whether every claim must be backed by command output |
| `approval_gate` | string | ✅ | Who must approve: `Por`, `Por + ChatGPT` |
| `closeout_required` | boolean | ✅ | Whether a closeout report must be produced |
| `cost_awareness` | boolean | ✅ | Whether agent routing cost/quota was considered |
| `preferred_low_cost_path` | string | ✅ | Cheapest adequate route: `Hermes Direct`, `Codex CLI`, or `Paid Executor` |
| `paid_executor_justification` | string | conditional | Required if route is paid — why Hermes Direct or Codex read-only was insufficient |
| `codex_quota_status` | string | ✅ | Current known Codex quota/reset state. Must be evidence-based, never guessed. |
| `quota_evidence_source` | string | ✅ | Source of quota evidence: `CLI output`, `usage counter`, `screenshot`, `user statement`, or `unknown` |

---

## Example Packet

```yaml
packet_id: PKT-2026-07-09-001
phase: Phase 6B.2
mission: Create Hermes packet schema templates
owner: Por
agent_role: Hermes Direct
repo: C:\Users\UsEr\Documents\BE BLANK OS Production Audit
branch: main
allowed_files:
  - docs/hermes/PACKET_SCHEMA.md
  - docs/hermes/TASK_PACKET_TEMPLATE.md
  - docs/hermes/CLOSEOUT_TEMPLATE.md
  - docs/hermes/REVIEW_GATE_TEMPLATE.md
forbidden_files:
  - src/
  - package.json
  - package-lock.json
  - scripts/
  - routes/
  - finance/
  - trading/
  - auth/
  - creator/
  - config/
  - .env
forbidden_actions:
  - commit
  - merge
  - push
  - npm install
  - npm run build (unless explicitly instructed)
required_checks:
  - git status --short
  - npm run build
evidence_required: true
approval_gate: Por
closeout_required: true
cost_awareness: true
preferred_low_cost_path: Hermes Direct
paid_executor_justification: N/A — docs-only, Hermes Direct sufficient
codex_quota_status: Not applicable (Hermes Direct used)
quota_evidence_source: N/A
```
