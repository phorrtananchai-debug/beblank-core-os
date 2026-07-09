# Closeout Report Template

**Purpose:** Structured closeout report produced after every mission. Sent to Por for review before commit/merge approval.

---

```yaml
packet_id: <PKT-YYYY-MM-DD-NNN>
phase: <Phase identifier>
mission: <Mission statement>
agent: <Agent name>
date: <YYYY-MM-DD>
```

## Summary

<Brief description of what was accomplished>

## Files Changed

| File | Action | Lines |
|------|--------|-------|
| `<path>` | Created / Modified / Deleted | `<N> additions, <N> deletions` |
| `<path>` | Created / Modified / Deleted | `<N> additions, <N> deletions` |

## Commands Run

```bash
<command 1> → <output summary or ✅/❌>
<command 2> → <output summary or ✅/❌>
<command 3> → <output summary or ✅/❌>
```

## Build/Test Result

| Check | Result |
|-------|--------|
| `npm run build` | ✅ PASS / ❌ FAIL |
| `npm run lint` | ✅ PASS / ❌ FAIL (if applicable) |

## Evidence

- `<evidence item 1>` — backed by command output
- `<evidence item 2>` — backed by command output
- All claims in this report are backed by captured command output.

## Risks

| Risk | Severity | Mitigation |
|------|----------|------------|
| <Risk description> | 🟢 Low / 🟡 Medium / 🟠 High / 🔴 Critical | <Mitigation or note> |

## Deviations from Scope

| Deviation | Reason | Approved? |
|-----------|--------|-----------|
| <If scope changed, describe> | <Why> | Yes / No / N/A |

## Commit Request Status

- [ ] Commit requested
- [ ] Commit not requested
- [ ] Waiting for Por decision

## Agent Budget / Quota Note

| Field | Value |
|-------|-------|
| **Agent used** | `<Hermes Direct / Codex CLI / OpenCode CLI / DS/OpenCode>` |
| **Why selected** | `<Rationale for route choice>` |
| **Cheaper path considered** | `<Yes / No — if yes, why not taken>` |
| **Paid executor used?** | `<Yes / No>` |
| **Paid executor justification** | `<Required if Yes — why Hermes Direct or Codex read-only was insufficient>` |
| **Codex quota status** | `<Active / Exhausted / Unknown / Not applicable>` |
| **Quota evidence source** | `<CLI output / usage counter / screenshot / user statement / unknown>` |

## Next Recommended Action

- <Action 1>
- <Action 2>
- Awaiting Por instruction

---

## Example: Filled Closeout

```yaml
packet_id: PKT-2026-07-09-001
phase: Phase 6B.2
mission: Create Hermes packet schema templates
agent: Hermes Direct
date: 2026-07-09
```

## Summary

Created 4 template files under `docs/hermes/` defining the packet schema, task packet template, closeout template, and review gate template.

## Files Changed

| File | Action | Lines |
|------|--------|-------|
| `docs/hermes/PACKET_SCHEMA.md` | Created | 100 lines |
| `docs/hermes/TASK_PACKET_TEMPLATE.md` | Created | 120 lines |
| `docs/hermes/CLOSEOUT_TEMPLATE.md` | Created | 95 lines |
| `docs/hermes/REVIEW_GATE_TEMPLATE.md` | Created | 80 lines |

## Build/Test Result

| Check | Result |
|-------|--------|
| `npm run build` | ✅ PASS |

## Risks

| Risk | Severity | Mitigation |
|------|----------|------------|
| Templates may diverge from actual workflow as it evolves | 🟢 Low | Update templates when workflow changes |

## Deviations from Scope

None.

## Next Recommended Action

Awaiting Por commit approval.
