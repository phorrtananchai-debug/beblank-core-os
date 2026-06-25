# BBH Figma Workflow

Source of truth: BBH UI Cookbook v1 in Figma  
Figma file: https://www.figma.com/design/ds4we8enwuoRUvnNkDnN86/BBH-UI-Cookbook-v1

This workflow defines how Figma, documentation, and code should interact.

## Source Of Truth Order

For BBH OS design work, use this order:

1. Figma BBH UI Cookbook v1
2. `docs/design/BBH-Design-Constitution.md`
3. `docs/design/BBH-UI-Cookbook.md`
4. `docs/design/BBH-Pattern-Library.md`
5. Existing React implementation

When Figma and code disagree, do not silently choose one. Identify the difference and either:

- Update code to match Figma, if the task is implementation.
- Update Figma/docs first, if the design decision is unresolved.

## Figma Pages And Boards

The Figma file may be constrained by the Starter plan page limit. If more top-level pages are not available, create named boards as frames inside existing pages.

Current board model:

- `00 — Manifesto`
- `01 — Foundations`
- `02 — Layout System`
- `03 — Components`
- `04 — Studio OS`
- `04 — Mobile Studio`
- `05 — Future Sections`

Planned authority boards:

- `09 — BBH Design Constitution`
- `10 — Pattern Library`
- `11 — Anti-patterns`
- `Studio OS Implementation Map`
- `Studio OS Redesign Target`

## Figma-To-Code Component Map

| Figma | React | Direction |
|---|---|---|
| `PageHeader` | `PageHeader` | Already implemented; refine against Figma |
| `WorkspacePanel` | `WorkspacePanel` | Already implemented; reduce card density |
| `ProjectCard` | `ProjectCard` | Already implemented; keep project-first |
| `DecisionCard` | `DecisionCard` | Already implemented; make first-class |
| `StatusBadge` | `StatusBadge` | Already implemented; enforce standard vocabulary |
| `TimelineRow` | `TimelineRow` | Needs refinement; improve owner/date/blocker clarity |
| `InspectionPanel` | `InspectionPanel` | Needs refinement; emphasize next site check |
| `BillingGateRow` | `BillingGateRow` | Needs refinement; connect gate criteria to approval |
| `MobileBottomNav` | `MobileBottomNav` | Needs refinement; match field notebook pattern |
| `MobileQuickAdd` | `MobileQuickAdd` | Needs refinement; keep approval flow for writes |

All listed components should remain BBH-original. External UI libraries may support implementation but should not define visual identity.

## Implementation Workflow

Before editing UI code:

1. Review the relevant Figma board.
2. Review this docs folder.
3. Identify the target pattern.
4. Identify the React component(s) affected.
5. Confirm the change does not modify unrelated divisions.
6. Confirm the page still answers: what needs attention now?
7. Preserve the approval workflow for writes.
8. Run build/lint when code changes.

## Codex Rules Before Editing UI

Codex must not begin visual implementation until it can answer:

- Which Figma board is the source?
- Which BBH pattern applies?
- Which component inventory item is being changed?
- Which route is affected?
- Is this Studio-only or shared design-system work?
- Does this introduce a new card, chart, status, color, or action?
- Does the change preserve project-first hierarchy?

If the answer is unclear, Codex should stop and clarify before editing UI.

## Allowed Implementation References

Use as implementation references:

- shadcn/ui for local component composition
- Radix UI for accessible primitives
- TanStack Table for data tables
- Motion for restrained interaction
- cmdk for command palette behavior
- Lucide for icons only if needed and visually restrained

Do not use these libraries as visual templates. BBH visual language must remain original.

## Studio OS First Rule

Studio OS is the pilot. Do not redesign Command Center, Capital, Investments, Trading Lab, or AI Workspace unless explicitly asked.

Studio implementation should focus on:

- Project workspace
- Project detail command surface
- Decision log
- Inspection plan
- Timeline rows
- Billing gates
- Documents/reference rail
- Mobile field notebook

## Approval Flow Rule

All write actions must remain behind `createActionRequest`.

This applies to:

- Creating tasks
- Updating status
- Adding issues
- Adding inspection notes
- Changing billing gates
- Resolving decisions
- Sync/write-back operations

Designs may show write actions, but implementation must route them through approval.

## Review Checklist

Before shipping a BBH OS UI change:

- The page is light, calm, and architectural.
- The primary object appears before metrics.
- The page has one dominant primary action.
- Attention signals are obvious.
- Status vocabulary is standardized.
- Safety orange is not overused.
- Cards are minimized.
- Charts are justified.
- Mobile patterns are field-first.
- Figma/docs/code remain aligned.

## Handling Figma MCP Limits

If Figma MCP write access is blocked by plan or tool-call limits:

1. Do not invent a completed Figma update.
2. Document the intended change in this folder.
3. Resume Figma work when access is available.
4. Do not implement visual changes until the design authority is reviewed.
