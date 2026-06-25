# BBH UI Cookbook

Source of truth: BBH UI Cookbook v1 in Figma  
Figma file: https://www.figma.com/design/ds4we8enwuoRUvnNkDnN86/BBH-UI-Cookbook-v1

This cookbook translates the BBH design direction into reusable interface rules, tokens, layout principles, and component expectations.

## Product Feeling

BBH OS should feel like:

- Architectural operating system
- Technical field notebook
- Project control interface
- Construction coordination platform
- Editorial workspace
- Calm command surface

BBH OS should not feel like:

- SaaS admin dashboard
- ERP software
- Startup KPI board
- Bootstrap template
- Material Design clone
- Dark futuristic control room
- Marketing website

## Foundations

### Color Tokens

| Token | Value | Usage |
|---|---:|---|
| `neutral/000` | `#FFFFFF` | Paper and high-emphasis surfaces |
| `neutral/050` | `#F8F8F6` | Base background |
| `neutral/075` | `#F5F5F2` | Workspace background |
| `neutral/100` | `#F1F1EE` | Instrument surface |
| `neutral/200` | `#E4E1DA` | Subtle rule |
| `neutral/300` | `#D6D1C7` | Default rule |
| `neutral/500` | `#8D877D` | Muted text |
| `neutral/700` | `#3E3A34` | Secondary text |
| `neutral/900` | `#171512` | Primary text |
| `orange/safety` | `#FF6A13` | Active, live, focus, critical attention |
| `green/live` | `#4F8F67` | Live/healthy state |
| `amber/watch` | `#B8842F` | Watch/review state |
| `red/blocked` | `#B84A3A` | Blocked/risk state |
| `blue/info` | `#496F91` | Complete/info state |

### Semantic Color Tokens

| Token | Value | Usage |
|---|---:|---|
| `color/bg/base` | `#F8F8F6` | App background |
| `color/bg/workspace` | `#F5F5F2` | Page working area |
| `color/surface/subtle` | `#FFFFFF` | Primary surface |
| `color/surface/instrument` | `#F1F1EE` | Low-emphasis instrument |
| `color/text/primary` | `#171512` | Main text |
| `color/text/secondary` | `#3E3A34` | Secondary text |
| `color/text/muted` | `#8D877D` | Metadata/helper text |
| `color/rule/default` | `#D6D1C7` | Section rule |
| `color/rule/subtle` | `#E4E1DA` | Internal divider |
| `color/accent/safety` | `#FF6A13` | Primary accent |
| `color/status/live` | `#4F8F67` | LIVE |
| `color/status/watch` | `#B8842F` | WATCH |
| `color/status/blocked` | `#B84A3A` | BLOCKED |
| `color/status/complete` | `#496F91` | COMPLETE |

### Typography

BBH uses a two-layer type system.

Interface layer:

- Preferred: `Space Grotesk`
- Fallback: `Inter`
- Use for navigation, titles, body text, section headings, and editorial hierarchy.

Technical layer:

- Preferred: `Geist Mono`
- Fallback: `IBM Plex Mono` or `Roboto Mono`
- Use for project codes, coordinates, metadata, status labels, timestamps, and source references.

### Type Styles

| Style | Font | Size | Usage |
|---|---|---:|---|
| `BBH/Display/Large` | Space Grotesk Bold | 64 | Manifesto, major surface statements |
| `BBH/Title/Page` | Space Grotesk Medium | 36 | Page title |
| `BBH/Title/Section` | Space Grotesk Medium | 22 | Section title |
| `BBH/Body/Large` | Space Grotesk Regular | 17 | Intro copy |
| `BBH/Body/Default` | Space Grotesk Regular | 14 | Body text |
| `BBH/Body/Small` | Space Grotesk Regular | 12 | Helper text |
| `BBH/Tech/Label` | Geist Mono Medium | 11 | Metadata labels |
| `BBH/Tech/Code` | Geist Mono Regular | 12 | Project refs/source refs |
| `BBH/Tech/Status` | Geist Mono SemiBold | 10 | Status chips |

## Spacing

| Token | Value |
|---|---:|
| `space/01` | 4 |
| `space/02` | 8 |
| `space/03` | 12 |
| `space/04` | 16 |
| `space/05` | 24 |
| `space/06` | 32 |
| `space/07` | 48 |
| `space/08` | 64 |
| `space/09` | 96 |

Spacing should create hierarchy. Avoid compensating for weak hierarchy with borders, shadows, or color.

## Grid

BBH uses a technical grid language inspired by architectural drawings and construction documents.

Use:

- Subtle page coordinates
- Section reference labels
- Thin vertical/horizontal alignment rules
- Consistent gutters
- Wide whitespace around primary objects

Avoid:

- Dense 12-column SaaS grids everywhere
- Decorative grid overlays that compete with content
- Over-boxed layouts

## Border And Rule System

Rules are structural, not decorative.

Use:

- 1px hairline rules for separation
- Thin section dividers
- Square or near-square working surfaces
- Radius only when it improves touch targets or chips

Avoid:

- Heavy borders
- Multiple nested borders
- Shadow-based hierarchy
- Large rounded card stacks

## Component Inventory

Required BBH components:

- `PageHeader`
- `SectionHeader`
- `WorkspaceSurface`
- `WorkspacePanel`
- `ProjectCard`
- `DecisionCard`
- `StatusBadge`
- `ReferenceLabel`
- `MetricLine`
- `TimelineRow`
- `InspectionPanel`
- `BillingGateRow`
- `ApprovalQueue`
- `DataTable`
- `EmptyState`
- `CommandPalette`
- `MobileBottomNav`
- `MobileQuickAdd`

## Component Philosophy

Components should be BBH-original. shadcn/ui, Radix, TanStack Table, and Motion can inform implementation, accessibility, and behavior, but visual language should remain BBH-specific.

Use external libraries for:

- Accessible primitives
- Dialog behavior
- Popovers
- Tables
- Keyboard interactions
- Motion primitives

Do not copy:

- Template layouts
- Default themes
- Generic dashboard cards
- Marketing sections
- Animated spectacle components

## Motion

Motion should be functional and quiet.

Use motion for:

- Revealing hierarchy
- Confirming state changes
- Opening command palettes/drawers
- Mobile quick add
- Approval request feedback

Avoid:

- Decorative entrance animations
- Parallax
- Glow loops
- Motion that delays field work
- Motion that makes the OS feel like a landing page

## Data Visualization

Charts are not default UI. Data tables, ledgers, timelines, and logs are usually more useful.

Use charts only when:

- A trend matters
- A distribution matters
- The chart changes a decision faster than a row would

Avoid charts for:

- Decorative dashboards
- Random status panels
- One-off metrics
- Data that needs owner/date/action context

## Mobile

Mobile Companion should feel like a field notebook.

Primary tabs:

- Home
- Calendar
- Add
- Projects
- More

Mobile priority:

1. Today focus
2. Urgent tasks
3. Next inspection
4. Quick add
5. Project detail
6. Sync/source status

Do not compress the desktop dashboard into mobile.
