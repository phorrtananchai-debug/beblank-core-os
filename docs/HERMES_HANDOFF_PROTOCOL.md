# Hermes Handoff Protocol

**Purpose:** Define how work moves between Por, ChatGPT, DeepSeek/OpenCode, Codex, and Hermes so every agent knows its role, what to pass, and what to expect.

---

## Roles

### Por (Product Owner, Design Director, Chief Architect)
- Defines missions
- Approves plans before coding
- Approves merges after review
- Updates Hermes memory
- Ultimate decision maker

### ChatGPT (Architect, Mission Designer, Safety Reviewer)
- Designs missions with Por
- Reviews plans for safety
- Analyzes risks
- Frames decisions with options
- Does NOT execute code or access repos

### DeepSeek / OpenCode (Fast Implementer)
- Executes approved low/medium-risk missions
- Works in branches, never on main
- Documents every change with evidence
- Produces closeout reports
- Stays within strict scope

### Codex (Deep Architecture, Refactor, Code Review)
- Handles complex architecture work
- Performs deep code review
- Addresses technical debt
- Reviews DS output for correctness
- Used when DS complexity exceeds safe range

### Hermes (Memory, QA, Orchestration, Closeout Reviewer)
- Stores project memory (mission outcomes, risks, decisions)
- Verifies closeout reports against evidence
- Checks Definition of Done
- Routes work between agents
- Flags risks and scope drift
- Never modifies production code
- Never commits, merges, or pushes

---

## When Hermes Knows About Work

Hermes should be informed at these points:

| Event | What Hermes receives | Purpose |
|---|---|---|
| Mission defined | Mission brief (scope, files, DoD, agent) | Hermes records intent and can verify later |
| Branch created | Branch name | Hermes knows where work happens |
| Plan approved | Approved plan | Baseline for verification |
| **Closeout submitted** | **Closeout report + evidence** | **Hermes verifies before Por approves** |
| Merge approved | Merge confirmation | Hermes records completion |
| Memory update triggered | Memory entry from Por | Hermes stores for future reference |

**Key rule:** Hermes does NOT need to be involved in every git operation — only at closeout and memory update.

---

## How to Create a Handoff Packet

A handoff packet is a structured message (could be a chat message, a file, or a prompt) that transfers a mission between agents. The packet contains enough information for the receiving agent to understand context and act safely.

### Creating a Handoff Packet (Por → Executing Agent)

```markdown
## Handoff Packet

### Mission
[One-line description]

### Target Repo
[Full path]

### Branch
[name]

### Scope
- Create: [list of files to create]
- Modify: [list of files to modify]
- Do NOT touch: [list of forbidden paths]

### Risk Level
[LOW / MEDIUM / HIGH / CRITICAL]

### Definition of Done
- [ ] All planned files created/modified
- [ ] Build passes
- [ ] Evidence log complete
- [ ] No forbidden files touched

### Approved By
Por / ChatGPT (date)
```

---

## How DS/Codex Closeouts Should Be Reviewed by Hermes

Hermes uses the closeout-review-template.md from the onboarding pack. The review checks:

1. **Branch verification** — is the branch name correct and clean?
2. **Changed files** — only expected files? Any scope drift?
3. **Production file safety** — no src/, package.json, env, routes, finance, trading, creator, auth touched?
4. **Build/test** — does it compile? Do tests pass?
5. **Evidence quality** — every claim backed by command output?
6. **Security** — any secrets exposed?
7. **Hallucination check** — any fabricated claims or evidence?
8. **Definition of Done** — all criteria met?
9. **Final recommendation** — approve / revise / escalate / reject

---

## Approval Gates

| Gate | Required By | What's Needed |
|---|---|---|
| **Mission design** | Por + ChatGPT | Scope, risk level, DoD |
| **Plan approval** | Por | Step-by-step plan (for MEDIUM+ risk) |
| **Branch creation** | Por or DS | Clean base, proper naming |
| **Closeout review** | Hermes → Por | Hermes verifies, Por decides |
| **Merge** | Por only | Por types git commands |

---

## Memory Update Rules

After a mission completes and is approved:

1. Por tells Hermes: "Remember: [what happened, what was learned, what risks remain]"
2. Hermes records the entry in context for future sessions
3. If a project registry entry needs updating, Por notes it
4. Memory entries should be:
   - Concise (1-3 sentences)
   - Actionable (would help future decisions)
   - Risk-aware (what went wrong or could go wrong)

---

## Things Hermes Must Never Assume

- Do not assume any repo structure — verify with commands
- Do not assume any agent's output is correct — check evidence
- Do not assume Por has approved anything — explicit approval required
- Do not assume a mission is complete — verify DoD
- Do not assume Hermes can modify files — read-only for repos
- Do not assume cloud services exist — prefer local-first
- Do not assume a file change is safe — check the diff
- Do not assume a build pass means clean code — check for warnings
- Do not assume an agent followed scope — verify changed files

---

## Example Handoff Packet

```markdown
## Handoff Packet

### Mission
Create a docs-only handoff protocol for Hermes agent workflow

### Target Repo
C:\Users\UsEr\Documents\BE BLANK OS Production Audit

### Branch
docs/hermes-handoff-protocol

### Scope
- Create: docs/HERMES_HANDOFF_PROTOCOL.md
- Do NOT touch: src/, package.json, lock files, env, routes, finance, trading, creator, auth

### Risk Level
LOW

### Definition of Done
- [x] All planned files created
- [x] Build passes
- [x] Evidence log complete
- [ ] No forbidden files touched

### Approved By
Por (2026-07-09)
```

---

## Example Closeout Review Request

```markdown
## Closeout Review Request

Hermes, please verify the closeout for:
- Mission: [name]
- Agent: DS/OpenCode
- Branch: [name]
- Repo: [path]
- Closeout report: [path]

Use the closeout-review-template.md to check:
1. Branch name correct?
2. Only expected files changed?
3. No production files touched?
4. Build passes?
5. Evidence complete?
6. No secrets exposed?
7. DoD met?
8. Your recommendation?

Report your findings.
```
