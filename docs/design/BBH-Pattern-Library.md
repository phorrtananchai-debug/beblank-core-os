# BBH Pattern Library

Source of truth: BBH UI Cookbook v1 in Figma  
Figma file: https://www.figma.com/design/ds4we8enwuoRUvnNkDnN86/BBH-UI-Cookbook-v1

Patterns define how BBH components combine into useful operating surfaces.

## Pattern Principles

- Start with the user's operational question.
- Lead with the primary object.
- Use rows, logs, decisions, and timelines before charts.
- Keep each surface focused on one dominant action.
- Use technical metadata to create trust.
- Use safety orange sparingly.
- Avoid equal-weight card grids.

## Project Workspace

### Purpose

Enter and operate a project.

### Layout Anatomy

- Page header with project context
- Project browser or project identity strip
- Command surface for attention signals
- Detail area for supporting work
- Document/reference rail

### Allowed Components

- `PageHeader`
- `WorkspaceSurface`
- `WorkspacePanel`
- `ProjectCard`
- `StatusBadge`
- `ReferenceLabel`
- `TimelineRow`
- `DecisionCard`
- `InspectionPanel`
- `BillingGateRow`

### Use When

- The user needs to enter a project.
- A project has active work, risks, inspections, billing gates, or decisions.
- Studio OS needs to show current operational state.

### Do Not Use When

- Showing a portfolio summary only.
- Presenting static marketing case studies.
- The page is primarily financial ledger work.

## Decision Workspace

### Purpose

Resolve choices that block work.

### Layout Anatomy

- Revision code
- Decision title
- Reason
- Owner
- Date
- Impacted work
- Approval action
- Linked documents or site notes

### Allowed Components

- `DecisionCard`
- `ApprovalQueue`
- `StatusBadge`
- `ReferenceLabel`
- `WorkspacePanel`

### Use When

- A site blocker needs a formal decision.
- A revision needs traceability.
- A user must approve or reject a proposed change.

### Do Not Use When

- The content is casual comments.
- The decision has no owner.
- The item does not affect work, cost, timeline, or scope.

## Timeline Workspace

### Purpose

Sequence work over time.

### Layout Anatomy

- Date rail
- Phase
- Trade
- Owner
- Process state
- Blocker
- Start date
- End date
- Progress

### Allowed Components

- `TimelineRow`
- `DataTable`
- `StatusBadge`
- `MetricLine`
- `ReferenceLabel`

### Use When

- Showing construction phases.
- Tracking closeout work.
- Coordinating owners/trades.
- Explaining current and next work.

### Do Not Use When

- A decorative Gantt chart would hide ownership.
- The timeline has no actionable next step.
- Items are purely archival.

## Inspection Workspace

### Purpose

Prepare and record site truth.

### Layout Anatomy

- Inspection date/time
- Site check objective
- Checklist
- Findings
- Owner follow-up
- Photos/documents
- Next inspection

### Allowed Components

- `InspectionPanel`
- `TimelineRow`
- `MobileQuickAdd`
- `ReferenceLabel`
- `StatusBadge`
- `DecisionCard`

### Use When

- Site work must be checked.
- Defects or progress notes must be captured.
- A field user needs a quick mobile workflow.

### Do Not Use When

- The content is only a photo gallery.
- No follow-up owner exists.
- The page is primarily a document archive.

## Financial Workspace

### Purpose

Expose money gates, obligations, approvals, and readiness.

### Layout Anatomy

- Billing gate
- Gate criteria
- Payment link
- Approval state
- Risk/hold reason
- Due date
- Supporting document

### Allowed Components

- `BillingGateRow`
- `DataTable`
- `ApprovalQueue`
- `StatusBadge`
- `ReferenceLabel`
- `MetricLine`

### Use When

- Tracking progress billing.
- Reviewing capital calls.
- Checking payment readiness.
- Connecting operational completion to money movement.

### Do Not Use When

- A KPI card grid would obscure gate criteria.
- The page has no approval state.
- The financial item is not actionable.

## AI Review Workspace

### Purpose

Review AI output before any action is taken.

### Layout Anatomy

- Source reference
- AI-generated recommendation
- Confidence or caveat
- Human approval state
- Audit trail
- Primary action

### Allowed Components

- `WorkspacePanel`
- `DecisionCard`
- `ApprovalQueue`
- `CommandPalette`
- `ReferenceLabel`
- `StatusBadge`

### Use When

- AI generates a summary, next action, draft decision, or proposed write.
- A user must review before data changes.
- Source traceability is required.

### Do Not Use When

- AI is decorative.
- The system would write without approval.
- Source data cannot be referenced.

## Mobile Field Notebook

### Purpose

Capture and review site state quickly from the field.

### Layout Anatomy

- Today focus
- Urgent tasks
- Next inspection
- Quick add
- Project tabs
- Sync/source status

### Allowed Components

- `MobileBottomNav`
- `MobileQuickAdd`
- `InspectionPanel`
- `StatusBadge`
- `TimelineRow`
- `ReferenceLabel`

### Use When

- The user is checking site progress.
- The user needs to add a task, issue, or inspection note.
- A project must be understood while moving.

### Do Not Use When

- The desktop workspace is simply being squeezed into a phone.
- Dense tables are required.
- Multi-step financial review is required.

## Studio OS Pattern Priority

Project detail pages must prioritize:

1. Today
2. This Week
3. Next Inspection
4. Critical Risks
5. Pending Decisions
6. Decision Log
7. Billing Gates
8. Documents

Supporting information should come after attention signals.

## Studio Project Detail Target

Target route:

`/os/studio/projects/karun-central-khon-kaen`

This route should become an architectural project operating surface, not a dashboard.

Primary structure:

- Project identity and operating date
- Attention surface
- Today and This Week work
- Next inspection plan
- Critical risk register
- Pending decisions
- Decision log
- Billing gates
- Documents/source references

## Anti-Patterns

Avoid:

- KPI dashboard overload
- Generic SaaS admin layout
- Too many rounded cards
- Random charts
- Dark futuristic UI
- Colorful status noise
- Marketing hero layout
- Excessive shadows
- Decorative motion
- Equal card weights
- AI suggestions as hero content
- Source sync status as primary content
