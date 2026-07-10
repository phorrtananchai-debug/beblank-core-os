# Hermes Review Runtime

`scripts/hermes-review-runtime.mjs` compares the mission packet, execution record, actual Git status, baseline working tree, centralized lock, required checks, risk, protected paths, and Closeout Packet v3.

```bash
npm run hermes:review -- <mission-id> [closeout-path]
```

Verdicts are `AUTO_ACCEPT`, `ACCEPT_WITH_WARNINGS`, `HOLD_FOR_EVIDENCE`, `NEEDS_REWORK`, `HUMAN_REQUIRED`, and `REJECT`. Scope violations are rejected. Protected/high-risk paths, conflicts, and failed checks require Por. Missing execution or closeout evidence is held. Review reports are written to `.hermes/reviews/`.

Review applies deterministic vetoes before acceptance. A missing required output, zero changes for a writing mission, non-passing worker closeout, incomplete closeout, failed objective, non-successful execution, or blocking quota/evidence record produces `NEEDS_REWORK` (or the stricter existing scope/risk verdict). `AUTO_ACCEPT` is possible only when `completion_ready` is true. Read-only packets must explicitly declare `output_required: false`; any file change then fails their objective.

Local auto-commit is eligible only for LOW/MEDIUM risk, complete evidence, passing required checks, no protected paths, no conflicts, and an exact match between reviewed and staged files. Push and merge are never performed.

