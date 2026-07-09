# Hermes Capability Registry

**Purpose:** Route work by **capability**, not by agent name. Each capability maps to one or more preferred agents based on their strengths, cost, and quota impact.

---

## Capability Model

| Capability | Description | Preferred Agent | Why This Agent | Fallback Agent | Cost |
|------------|-------------|-----------------|----------------|----------------|------|
| **Documentation** | Writing and updating markdown docs, reports, templates | Hermes Direct | Fastest for text work, no cost, no quota | Codex CLI (if deep research needed) | Free |
| **Read-only Inspection** | Reading files, checking structure, verifying state | Hermes Direct | Instant, no CLI overhead, no quota | Codex CLI (if large-scale scan needed) | Free |
| **Build Verification** | Running `npm run build`, checking output | Hermes Direct | Direct terminal access, no delegation overhead | — | Free |
| **Lint Verification** | Running `npm run lint`, checking for errors | Hermes Direct | Direct terminal access | — | Free |
| **QA Review** | Running review checklist, verifying evidence, checking scope compliance | Hermes Direct | Built-in review gates, memory access | — | Free |
| **Checklist Validation** | Verifying DoD items, checking allowed/forbidden files | Hermes Direct | Direct git/terminal access | — | Free |
| **Closeout Review** | Producing closeout summaries, verifying evidence | Hermes Direct | Memory access, knows workflow history | — | Free |
| **Memory Update** | Recording durable facts to persistent memory | Hermes Direct | Only agent with memory write access | — | Free |
| **Architecture Review** | Analyzing cross-module dependencies, production risk, security boundaries | Codex CLI | Deep reasoning, multi-file analysis, high-complexity | ChatGPT (planning only) | Free (quota) |
| **Deep Reasoning** | Complex multi-file reasoning, refactor planning, risk assessment | Codex CLI | Best reasoning depth for complex tasks | ChatGPT (strategy only) | Free (quota) |
| **Repo Inspection** | Large-scale repo scanning, file structure analysis, dependency mapping | Codex CLI | Fast recursive scan, structured output | Hermes Direct (small scope) | Free (quota) |
| **Code Review** | Reviewing diffs, checking for regressions, security issues | Codex CLI | Deep code analysis capability | Hermes Direct (simple diff review) | Free (quota) |
| **Technical Debt Scan** | Identifying dead code, anti-patterns, optimization opportunities | Codex CLI | Pattern recognition at scale | — | Free (quota) |
| **UI Implementation** | Building React components, pages, layouts, styling | OpenCode / DeepSeek | Fast implementation, iterative edits | Codex CLI (write mode, if approved) | Paid |
| **Fast Draft** | Quick first-pass implementation, repetitive edits | OpenCode / DeepSeek | Speed over depth | Hermes Direct (simple drafts) | Paid |
| **Mock/UI Work** | Creating mock data, UI stubs, prototype components | OpenCode / DeepSeek | Fast iteration, no production impact | Codex CLI (if architecture needed) | Paid |
| **Sandbox Execution** | Running code in isolation, testing ideas | OpenCode / DeepSeek | Isolated environment | Hermes Direct (terminal) | Paid |
| **Mission Design** | Planning missions, defining scope, risk assessment | ChatGPT | Strategic thinking, safety analysis, option framing | Por (final decision) | Free |
| **Decision Approval** | Final sign-off on commits, merges, pushes | Por | Only human with approval authority | ChatGPT (advisory) | Free |
| **Emergency Bypass** | Direct agent use without Hermes routing | Human (Por) | When speed is critical or Hermes is unavailable | — | Varies |

---

## Routing Logic

When a mission arrives, Hermes should:

```
1. Identify required capabilities from the mission description
2. For each capability, look up the preferred agent
3. If multiple capabilities are needed:
   - Route simple capabilities (docs, review, QA) to Hermes Direct
   - Route deep capabilities (architecture, reasoning) to Codex CLI
   - Route implementation capabilities (UI, drafts) to OpenCode/DeepSeek
4. Estimate total cost and quota impact
5. If cost or quota is a concern, suggest reducing scope or using cheaper routes
```

## Agent-Capability Mapping Summary

| Agent | Best At | Not Suitable For |
|-------|---------|------------------|
| **Hermes Direct** | Documentation, QA, review, inspection, memory, build check, checklist | Deep architecture, large-scale code changes, complex refactoring |
| **Codex CLI** | Architecture, deep reasoning, code review, repo inspection, tech debt | Simple docs, repetitive UI work, high-frequency small edits |
| **OpenCode / DeepSeek** | UI implementation, fast drafts, sandbox execution, mock work | Architecture review, production write (not yet approved), security review |
| **ChatGPT** | Mission design, safety planning, strategy, risk analysis | Code execution, repo access, implementation |
| **Por** | Final approval, decision making, emergency bypass | Repetitive tasks, routine QA |

**Rule:** If a capability is not listed, ask Por where it should route before proceeding.
