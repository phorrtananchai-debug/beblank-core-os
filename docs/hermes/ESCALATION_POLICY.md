# Escalation Policy

**Purpose:** Define when Hermes must stop and ask Por (and optionally ChatGPT) before proceeding.

---

## Mandatory Escalation Triggers

Hermes **must stop and escalate** to Por if the task touches or proposes changes to any of the following:

### Forbidden Paths

| Path | Reason for Escalation |
|------|-----------------------|
| `src/` | Application source code — production impact |
| `package.json` | Dependency changes — security and stability risk |
| `package-lock.json` | Dependency lock changes — integrity risk |
| `scripts/` | Build/deploy tooling — operational impact |
| `routes/` | Navigation structure — user-facing impact |
| `finance/` | Financial data and trading logic |
| `trading/` | Trading operations |
| `auth/` | Authentication and user access |
| `creator/` | Creative workspace |
| `config/` | Application configuration |
| `data-flow logic` | Business data processing |
| External integrations | API connections, third-party services |
| Cloud memory | Remote storage, cloud databases |
| Background services | Cron jobs, watchers, daemons |
| Gateway | Telegram, webhooks, messaging bridges |
| Secrets / `.env` files | API keys, credentials, tokens |

### Operational Triggers

| Condition | Action |
|-----------|--------|
| Codex quota is unknown **and** the task is quota-heavy | Escalate — do not guess quota |
| Paid executor (OpenCode/DeepSeek) usage is proposed | Escalate — must be justified |
| Required evidence is missing from the task | Escalate — cannot proceed without evidence |
| Build or test fails | Stop — do not commit failing code |
| `git diff` includes files not in the approved scope | Stop — revert and escalate |
| Agent requests to commit, merge, or push | Escalate — Por must issue the command |
| Wording in docs overstates implementation status | Escalate — correct before commit |
| Task scope is ambiguous or unclear | Escalate — ask Por for clarification |

---

## Escalation Verdict Options

When Por reviews an escalation, the verdict can be:

| Verdict | Meaning | Next Step |
|---------|---------|-----------|
| **Proceed** | Approved — continue as planned | Agent executes the task |
| **Revise** | Changes needed before continuing | Agent addresses specific revision requests |
| **Hold for Evidence** | More information needed | Agent provides requested evidence without modifying files |
| **Reject** | Not approved — do not proceed | Abandon task or restart with new scope |

---

## Escalation Response Template

When escalating to Por, use this format:

```
## Escalation Request

**Trigger:** <Which rule was triggered>
**Task:** <Current task description>
**Risk:** <LOW / MEDIUM / HIGH / CRITICAL>

### What I Know
- <Evidence available>
- <Context>

### What I Need
- <Decision needed>
- <Missing information>

### Proposed Options
1. <Option A>
2. <Option B>
3. <Escalate to ChatGPT>

**Awaiting Por instruction.**
```

---

## Escalation to ChatGPT

For HIGH risk (architecture, routes, auth, finance, trading) or CRITICAL risk (real trading, secrets, background services) tasks:

1. Hermes stops and informs Por
2. Por decides whether to bring ChatGPT into the decision
3. If ChatGPT is included, wait for Por + ChatGPT consensus before proceeding

**Hermes must never proceed on HIGH or CRITICAL tasks without Por (and optionally ChatGPT) approval.**
