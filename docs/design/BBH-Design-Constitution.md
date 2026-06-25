# BBH Design Constitution

Source of truth: BBH UI Cookbook v1 in Figma  
Figma file: https://www.figma.com/design/ds4we8enwuoRUvnNkDnN86/BBH-UI-Cookbook-v1

This constitution defines non-negotiable rules for future BBH OS interface work. It exists to protect the product from drifting into generic dashboards, SaaS admin patterns, or decorative UI systems.

## Core Philosophy

BBH OS is an operating system for projects, capital, investments, trading, AI work, and field operations. It should feel like an architectural control surface: calm, precise, editorial, technical, and useful under pressure.

BBH OS is not a dashboard product. It is not an ERP. It is not a KPI board. It is a working surface where the user can see what matters, understand ownership, make decisions, and approve action.

## Constitutional Rules

### 1. Operating Surface, Not Dashboard

Pages are places to operate from, not places to admire metrics.

Every screen must help the user answer:

- What needs attention now?
- Who owns it?
- What is blocked?
- What decision is pending?
- What is the next approved action?

### 2. Workspace, Not Widgets

Avoid disconnected widget grids. Sections should feel like one continuous working surface with clear regions, rules, and hierarchy.

Use panels only when they create operational meaning:

- Project command surface
- Decision register
- Inspection plan
- Billing gate
- Approval queue
- Document rail
- Risk register

### 3. Instruments, Not Cards

A BBH component should behave like an instrument. It should expose state, context, ownership, and action.

Do not create a card just because a layout needs spacing. Use whitespace, type, and thin rules first.

### 4. Whitespace Is Hierarchy

Spacing is the primary hierarchy tool. More important regions should have more breathing room, not more decoration.

Use whitespace to separate:

- Current attention from reference data
- Project identity from project signals
- Primary action from secondary actions
- Work surfaces from archive/reference material

### 5. Typography Creates Navigation

Typography is structural. Large editorial titles, mono references, section labels, and thin rules should guide the user through the surface.

Use typography before icons, color, charts, shadows, or boxes.

### 6. Project Before Metrics

In Studio OS, the primary object is the project. Users should enter Studio and immediately understand which project needs attention.

Metrics are supporting information. They must not lead the page unless they directly explain a project state.

### 7. Data Before Charts

BBH OS should prioritize operational data over abstract visualization.

Prefer:

- Logs
- Registers
- Rows
- Timelines
- Notes
- Decisions
- Owners
- Dates
- Gates
- Source references

Use charts only when they clarify a trend or allocation better than text.

### 8. No Card Unless Necessary

Use open surfaces, thin rules, and grouped rows before adding a card.

A card is allowed only when it provides one of these:

- Boundary for an actionable object
- State grouping
- Selection target
- Mobile touch target
- Approval/decision container

### 9. One Primary Action Per Surface

Each surface should have one obvious primary action. Secondary actions must be quieter.

Examples:

- Project detail: `Request approval`
- Inspection: `Add site note`
- Decision log: `Resolve decision`
- Billing gate: `Open gate review`
- Mobile field notebook: `Quick add`

### 10. Every Page Answers Attention Now

Before any BBH OS UI change ships, the page must clearly answer:

> What needs attention now?

If this answer is unclear, the interface is not ready.

## Visual Commitments

### Background

Use light neutral surfaces:

- `#F8F8F6`
- `#F5F5F2`
- `#F1F1EE`
- `#FFFFFF`

Avoid dark futuristic backgrounds, pure black interfaces, and high-contrast dashboard themes.

### Accent

Safety Orange is the primary accent:

- `#FF6A13`

Use it for:

- Active states
- Live states
- Focused actions
- Critical attention
- Technical references

Do not use it as general decoration.

### Status Vocabulary

Allowed status words:

- `LIVE`
- `ACTIVE`
- `WATCH`
- `BLOCKED`
- `COMPLETE`
- `ARCHIVED`

Avoid inventing status labels per feature. If a new state seems necessary, first map it to the standard vocabulary.

## Anti-Patterns

BBH OS must avoid:

- KPI dashboard overload
- Generic SaaS admin layouts
- Equal-weight card grids
- Too many rounded cards
- Random charts
- Dark futuristic UI
- Colorful status noise
- Marketing hero layouts
- Excessive shadows
- Decorative motion
- UI library templates copied directly
- AI-generated visual spectacle

## Rules Codex Must Follow Before Editing UI

Before changing any BBH OS UI, Codex must:

1. Check the Figma file and these design docs first.
2. Identify the surface type: project, decision, inspection, financial, AI review, mobile field, or reference.
3. State which design rule the change supports.
4. Preserve the approved status vocabulary.
5. Preserve the light architectural surface.
6. Use existing BBH components before creating new ones.
7. Avoid introducing new card-heavy dashboard patterns.
8. Keep write actions behind the approval flow.
9. Avoid modifying unrelated divisions unless explicitly requested.
10. Confirm the page still answers: what needs attention now?

## Scope Control

Studio OS is the pilot implementation for the BBH design language. Command Center, Capital, Investments, Trading Lab, and AI Workspace should not be redesigned until the Studio patterns have been reviewed and proven.
