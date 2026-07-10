# Hermes Review Runtime

`scripts/hermes-review-runtime.mjs` compares the mission packet, execution record, actual Git status, baseline working tree, centralized lock, required checks, risk, protected paths, and Closeout Packet v3.

```bash
npm run hermes:review -- <mission-id> [closeout-path]
```

Verdicts are `AUTO_ACCEPT`, `ACCEPT_WITH_WARNINGS`, `HOLD_FOR_EVIDENCE`, `NEEDS_REWORK`, `HUMAN_REQUIRED`, and `REJECT`. Scope violations are rejected. Protected/high-risk paths, conflicts, and failed checks require Por. Missing execution or closeout evidence is held. Review reports are written to `.hermes/reviews/`.

Local auto-commit is eligible only for LOW/MEDIUM risk, complete evidence, passing required checks, no protected paths, no conflicts, and an exact match between reviewed and staged files. Push and merge are never performed.

