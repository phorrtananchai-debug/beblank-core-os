# BBH Operating Pattern Library

Canonical status: permanent BBH CI Book reference  
Scope: operating language for BBH OS, Studio OS, mobile, AI workflows, prototypes, and future implementation work  
Figma source: BBH UI Cookbook v1  
Related docs:

- `docs/design/BBH-Design-Constitution.md`
- `docs/design/BBH-UI-Cookbook.md`
- `docs/design/BBH-Pattern-Library.md`
- `docs/design/BBH-Figma-Workflow.md`

## 00 Introduction

BBH Studio OS is not a dashboard. It is an architectural operating system for project control, site truth, decisions, approvals, evidence, billing gates, and handoff.

Operating patterns exist so BBH can preserve a consistent way of thinking across Figma, prototypes, React pages, mobile screens, AI workflows, and agent instructions. They define how work behaves before they define how work looks.

### Design Principles vs Operating Patterns vs UI Patterns vs Components

| Layer | Role | Example |
|---|---|---|
| Design Principle | A permanent rule that guides product judgment. | Operating Surface, not Dashboard. |
| Operating Pattern | A repeatable model for how work moves through BBH OS. | Approval Queue, Site Evidence Flow, Blocker Escalation Ladder. |
| Workflow | A sequence of operational states or actions. | Sample -> Photo -> Owner Review -> Approval -> Production. |
| UI Pattern | A visual arrangement that supports the workflow. | Timeline strip, action rail, decision register. |
| Component | A reusable React/Figma implementation unit. | `StatusBadge`, `DecisionCard`, `WorkspacePanel`. |

### Why BBH Is Building An Operating System

Dashboard products display information. Operating systems coordinate work.

BBH needs an operating system because construction and studio work are not purely analytical. They are spatial, time-bound, evidence-driven, and approval-sensitive. A project can be blocked by a missing photo, a late drawing revision, a material sample, a site-zone issue, or a billing gate. A KPI grid cannot express that operational reality.

BBH OS must help the user know:

- What needs attention now.
- Where it is happening.
- Who owns it.
- What evidence exists.
- What is blocked.
- What decision is pending.
- What action is allowed next.

## 01 Pattern Hierarchy

Operating patterns sit between high-level principles and interface implementation.

```text
Operating Principle
  ↓
Operating Pattern
  ↓
Workflow
  ↓
UI Pattern
  ↓
React Component
  ↓
Implementation
```

### Example

```text
Operating Principle
Project before metrics

Operating Pattern
Live Site State

Workflow
Collect site update -> mark state -> expose blocker -> request action

UI Pattern
Thin live state bar

React Component
StatusBadge + ReferenceLabel + ActionRail

Implementation
Studio project detail top strip
```

## 02 Canonical Operating Patterns

### 1. Live Site State

**Purpose**  
Expose whether the project is live, stale, blocked, or awaiting approval.

**Problem it solves**  
Users should not infer data freshness from scattered timestamps or hidden source states.

**Operating Principle**  
Every operating surface must answer what needs attention now.

**Desktop Behaviour**  
Show a thin state bar near the top of the project surface with operating date, current state, last update, source, and approval count.

**Mobile Behaviour**  
Show a compact state chip at the top of the field notebook: live, stale, sync pending, or offline.

**Data Required**  
Project status, project health, source status, last updated time, approval count, blocker count.

**Workflow**  
Site update received -> state calculated -> blocker or approval surfaced -> user acts.

**Reusable Components**  
`StatusBadge`, `ReferenceLabel`, `MetricLine`.

**Future AI Opportunities**  
Summarize why state changed and identify stale operating data.

**Future Automation Opportunities**  
Trigger warnings when project data has not updated within a defined site window.

**Related Patterns**  
Activity Feed, Approval Queue, Blocker Escalation Ladder.

**Priority**  
Must.

### 2. Operating Timeline Strip

**Purpose**  
Convert the site day into visible control windows.

**Problem it solves**  
Long task lists hide sequence. A strip makes time, order, and next action obvious.

**Operating Principle**  
Typography and structure create navigation.

**Desktop Behaviour**  
Show a horizontal strip under project context with key events: site walk, submittal deadline, photo capture, inspection, approval cutoff.

**Mobile Behaviour**  
Show a vertical today sequence with current item, next item, and overdue item.

**Data Required**  
Tasks, inspections, milestones, approvals, due dates, scheduled times.

**Workflow**  
Collect dated items -> sort by operating date/time -> mark current and next control point.

**Reusable Components**  
`TimelineRow`, `ReferenceLabel`, `StatusBadge`.

**Future AI Opportunities**  
Predict conflicts between inspections, approvals, and blockers.

**Future Automation Opportunities**  
Create reminders before critical control windows.

**Related Patterns**  
Today Focus, This Week, Inspection Workflow.

**Priority**  
Must.

### 3. Today Focus

**Purpose**  
Show only work that is due now, actionable now, or blocking today.

**Problem it solves**  
Users lose focus when today competes with all project history.

**Operating Principle**  
Whitespace is hierarchy.

**Desktop Behaviour**  
Place Today in the primary reading column with task, owner, trade, blocker, and next move.

**Mobile Behaviour**  
Make Today the default mobile tab.

**Data Required**  
Tasks due today, approvals due today, inspections today, risks due today.

**Workflow**  
Filter by operating date -> rank by blocked/high priority/site check -> show next action.

**Reusable Components**  
`TimelineRow`, `MetricLine`, `StatusBadge`, `WorkspacePanel`.

**Future AI Opportunities**  
Generate a site-day brief from today’s focus.

**Future Automation Opportunities**  
Auto-promote overdue items from This Week into Today.

**Related Patterns**  
Operating Timeline Strip, Action Rail, Mobile Handoff Token.

**Priority**  
Must.

### 4. This Week

**Purpose**  
Show the near-term work horizon without diluting today.

**Problem it solves**  
Project teams need to understand the week while keeping today dominant.

**Operating Principle**  
Project before metrics.

**Desktop Behaviour**  
Show a compact weekly strip or row list below Today.

**Mobile Behaviour**  
Show this as a secondary calendar view, not the first screen.

**Data Required**  
Tasks, inspections, milestones, billing gates, approvals between operating date and week end.

**Workflow**  
Filter week window -> group by date -> surface blockers and gates.

**Reusable Components**  
`TimelineRow`, `ReferenceLabel`.

**Future AI Opportunities**  
Identify likely weekly slippage.

**Future Automation Opportunities**  
Move blocked weekly items into escalation queue.

**Related Patterns**  
Today Focus, Closeout Readiness, Billing Gate Workflow.

**Priority**  
Must.

### 5. Project Context Strip

**Purpose**  
Place the active project in relation to nearby packages, source state, owner, and phase.

**Problem it solves**  
Users need orientation before action.

**Operating Principle**  
Project before metrics.

**Desktop Behaviour**  
Use a thin context strip below the project title. Include selected project, nearby packages, source state, owner, and phase.

**Mobile Behaviour**  
Show as a compact project selector.

**Data Required**  
Project name, slug, phase, owner, package relationships, source status.

**Workflow**  
Select project -> expose package context -> show source state.

**Reusable Components**  
`ProjectCard`, `ReferenceLabel`, `StatusBadge`.

**Future AI Opportunities**  
Suggest related packages affected by a blocker.

**Future Automation Opportunities**  
Sync package context when project data changes.

**Related Patterns**  
Project Switcher, Spatial Context, Presence Strip.

**Priority**  
Must.

### 6. Action Rail

**Purpose**  
Separate reading from acting while keeping actions available.

**Problem it solves**  
Buttons scattered across the page create noise and unclear priority.

**Operating Principle**  
One primary action per surface.

**Desktop Behaviour**  
Use a right rail with approved actions: approve decision, upload site photo, create issue, open mobile notebook, request billing review.

**Mobile Behaviour**  
Expose actions through a bottom quick-add or command sheet.

**Data Required**  
Allowed actions, approval requirements, current blockers, user role.

**Workflow**  
Read state -> choose action -> create action request -> approval flow.

**Reusable Components**  
`CommandPalette`, `ApprovalQueue`, `MobileQuickAdd`.

**Future AI Opportunities**  
Suggest the next best action with evidence.

**Future Automation Opportunities**  
Disable actions until required evidence exists.

**Related Patterns**  
Approval Queue, Site Evidence Flow, Mobile Handoff Token.

**Priority**  
Must.

### 7. Site Evidence Flow

**Purpose**  
Connect photos, notes, inspections, decisions, and billing gates.

**Problem it solves**  
Construction work often stalls because evidence is scattered.

**Operating Principle**  
Data before charts.

**Desktop Behaviour**  
Show evidence status near the work it unlocks: needed, captured, reviewed, approved, linked.

**Mobile Behaviour**  
Make photo capture and note capture fast, tied to task/risk/inspection context.

**Data Required**  
Photo records, notes, inspection links, approval state, billing gate links.

**Workflow**  
Evidence needed -> capture -> attach -> review -> approve -> unlock gate/decision.

**Reusable Components**  
`InspectionPanel`, `ReferenceLabel`, `WorkspacePanel`.

**Future AI Opportunities**  
Summarize site evidence and detect missing evidence types.

**Future Automation Opportunities**  
Auto-link evidence to gates when metadata matches task/project.

**Related Patterns**  
Inspection Workflow, Billing Gate Workflow, Document Health.

**Priority**  
Must.

### 8. Inspection Workflow

**Purpose**  
Prepare, execute, and close site inspections.

**Problem it solves**  
Inspection plans become ineffective when they are disconnected from tasks, risks, and evidence.

**Operating Principle**  
Operating Surface, not Dashboard.

**Desktop Behaviour**  
Show next inspection with checklist, owner, trade, plan, related risks, and evidence needs.

**Mobile Behaviour**  
Use checklist mode with quick photo/note capture.

**Data Required**  
Inspection title, scheduled time, inspector, trade, checklist, notes, plan, status.

**Workflow**  
Schedule -> prepare checklist -> inspect -> capture evidence -> create follow-up -> close.

**Reusable Components**  
`InspectionPanel`, `TimelineRow`, `MobileQuickAdd`.

**Future AI Opportunities**  
Draft inspection summary from notes/photos.

**Future Automation Opportunities**  
Create follow-up issues from failed checklist items.

**Related Patterns**  
Site Evidence Flow, Punch List Workflow, Mobile Handoff Token.

**Priority**  
Must.

### 9. Approval Queue

**Purpose**  
Make pending decisions and writes explicit, auditable, and safe.

**Problem it solves**  
Approval work often hides inside chat, notes, or implicit assumptions.

**Operating Principle**  
Every write action must be approved.

**Desktop Behaviour**  
Show approval rows with request, owner, evidence, due date, state, and allowed action.

**Mobile Behaviour**  
Allow review only when evidence is sufficient and screen space is adequate; otherwise hand off to desktop.

**Data Required**  
Approval records, requested by, owner, due date, status, payload, linked evidence.

**Workflow**  
Create action request -> review -> approve/reject -> log result.

**Reusable Components**  
`ApprovalQueue`, `DecisionCard`, `StatusBadge`.

**Future AI Opportunities**  
Summarize approval impact and missing evidence.

**Future Automation Opportunities**  
Block write execution until approval state is valid.

**Related Patterns**  
Decision Timeline, Billing Gate Workflow, Action Rail.

**Priority**  
Must.

### 10. Decision Timeline

**Purpose**  
Show how a decision evolved over time.

**Problem it solves**  
Final decisions are hard to trust without reason, source, and history.

**Operating Principle**  
Instruments, not Cards.

**Desktop Behaviour**  
Show chronological decision states: raised, evidence attached, reviewed, approved, superseded.

**Mobile Behaviour**  
Show current decision and latest change only.

**Data Required**  
Decision ID, title, reason, owner, dates, linked evidence, status history.

**Workflow**  
Raise decision -> attach evidence -> review -> resolve -> archive.

**Reusable Components**  
`DecisionCard`, `TimelineRow`, `ReferenceLabel`.

**Future AI Opportunities**  
Draft decision rationale from notes and evidence.

**Future Automation Opportunities**  
Escalate decisions nearing due time.

**Related Patterns**  
Decision Log, Approval Queue, Activity Feed.

**Priority**  
Should.

### 11. Decision Log

**Purpose**  
Provide a stable register of project decisions.

**Problem it solves**  
Construction decisions need traceable codes, not ephemeral comments.

**Operating Principle**  
Data before charts.

**Desktop Behaviour**  
Show revision-style rows with code, title, owner, date, state, and impact.

**Mobile Behaviour**  
Show active/pending decisions only.

**Data Required**  
Decision code, title, reason, owner, date, state, linked documents.

**Workflow**  
Create decision -> update state -> link evidence -> close or archive.

**Reusable Components**  
`DecisionCard`, `StatusBadge`, `ReferenceLabel`.

**Future AI Opportunities**  
Detect duplicate or conflicting decisions.

**Future Automation Opportunities**  
Generate revision codes.

**Related Patterns**  
Decision Timeline, Drawing Review Flow, Material Approval Flow.

**Priority**  
Must.

### 12. Critical Risk Board

**Purpose**  
Expose risks that can block time, money, scope, safety, or quality.

**Problem it solves**  
Risks lose urgency when mixed with normal tasks.

**Operating Principle**  
No card unless necessary.

**Desktop Behaviour**  
Show a concise risk board with severity, owner, blocker, due date, and action.

**Mobile Behaviour**  
Show blocked and high-risk items only.

**Data Required**  
Risk title, severity, blocker, owner, trade, process state, due date, action.

**Workflow**  
Identify risk -> assign owner -> define next move -> escalate if overdue.

**Reusable Components**  
`StatusBadge`, `WorkspacePanel`, `ReferenceLabel`.

**Future AI Opportunities**  
Identify hidden risk from task delays and missing evidence.

**Future Automation Opportunities**  
Auto-escalate high risks after due time.

**Related Patterns**  
Blocker Escalation Ladder, Today Focus, Activity Feed.

**Priority**  
Must.

### 13. Blocker Escalation Ladder

**Purpose**  
Make blocked work actionable by defining escalation.

**Problem it solves**  
`BLOCKED` becomes passive when no next move or escalation threshold exists.

**Operating Principle**  
Every page must answer what needs attention now.

**Desktop Behaviour**  
Each blocker shows blocked by, owner, next move, escalation owner, and escalation time.

**Mobile Behaviour**  
Show the next move and one escalation action.

**Data Required**  
Blocker text, owner, trade, due date, action, severity, escalation target.

**Workflow**  
Mark blocked -> define next move -> monitor time -> escalate -> resolve.

**Reusable Components**  
Missing: `BlockerEscalationRow`. Existing: `StatusBadge`, `ReferenceLabel`.

**Future AI Opportunities**  
Suggest escalation owner based on previous blocker resolution.

**Future Automation Opportunities**  
Auto-create escalation action request.

**Related Patterns**  
Critical Risk Board, Approval Queue, Activity Feed.

**Priority**  
Must.

### 14. Billing Gate Workflow

**Purpose**  
Connect work progress, evidence, approval, and payment readiness.

**Problem it solves**  
Billing can become disconnected from site truth.

**Operating Principle**  
Project before metrics.

**Desktop Behaviour**  
Show gate label, percentage, amount, due date, owner, status, blocker, evidence, and payment link.

**Mobile Behaviour**  
Show evidence capture requirements, not full financial review.

**Data Required**  
Gate label, amount, percentage, due date, status, owner, blocker, payment link, evidence links.

**Workflow**  
Gate due -> evidence collected -> approval reviewed -> payment released or held.

**Reusable Components**  
`BillingGateRow`, `ApprovalQueue`, `StatusBadge`.

**Future AI Opportunities**  
Explain why a gate is blocked.

**Future Automation Opportunities**  
Prevent payment request until evidence and approval are complete.

**Related Patterns**  
Site Evidence Flow, Approval Queue, Document Health.

**Priority**  
Must.

### 15. Work Strip

**Purpose**  
Represent work as compact operational records.

**Problem it solves**  
Full cards consume space and make work look equal.

**Operating Principle**  
No card unless necessary.

**Desktop Behaviour**  
Use strip rows for task, time, owner, trade, state, and next move.

**Mobile Behaviour**  
Use vertical strips sized for touch.

**Data Required**  
Task title, owner, trade, time, status, progress, blocker.

**Workflow**  
Create task -> assign owner -> update state -> close or escalate.

**Reusable Components**  
`TimelineRow`; missing: `WorkStrip`.

**Future AI Opportunities**  
Compress verbose task notes into work strip summaries.

**Future Automation Opportunities**  
Move strips between Today, This Week, and archive based on dates.

**Related Patterns**  
Today Focus, Operating Timeline Strip, This Week.

**Priority**  
Should.

### 16. Activity Feed

**Purpose**  
Show recent operational changes.

**Problem it solves**  
Users need confidence that the page reflects recent work.

**Operating Principle**  
Data before charts.

**Desktop Behaviour**  
Show a thin chronological feed of approvals, uploads, issue creation, inspection updates, and gate changes.

**Mobile Behaviour**  
Show latest three events and sync state.

**Data Required**  
Event type, timestamp, actor, target, project, linked object.

**Workflow**  
Action occurs -> event logged -> feed updates.

**Reusable Components**  
Missing: `ActivityFeed`. Existing: `ReferenceLabel`, `StatusBadge`.

**Future AI Opportunities**  
Summarize last 24 hours.

**Future Automation Opportunities**  
Trigger alerts when important event types are missing.

**Related Patterns**  
Live Site State, Decision Timeline, Mobile Handoff Token.

**Priority**  
Should.

### 17. Presence Strip

**Purpose**  
Show who is active, waiting, or responsible.

**Problem it solves**  
Ownership ambiguity creates delays.

**Operating Principle**  
Typography creates navigation.

**Desktop Behaviour**  
Show responsible people near project context: on site, waiting, approval needed.

**Mobile Behaviour**  
Show only current owner and next contact.

**Data Required**  
Owner, inspector, trade lead, approval owner, active user state if available.

**Workflow**  
Assign owner -> update presence/status -> route action.

**Reusable Components**  
`ReferenceLabel`; missing: `PresenceStrip`.

**Future AI Opportunities**  
Recommend who should own an unresolved issue.

**Future Automation Opportunities**  
Notify owner when item enters their lane.

**Related Patterns**  
Project Context Strip, Approval Queue, Blocker Escalation Ladder.

**Priority**  
Should.

### 18. Mobile Handoff Token

**Purpose**  
Create a compact desktop-to-mobile work package.

**Problem it solves**  
Field work fails when desktop context does not transfer into mobile action.

**Operating Principle**  
Workspace, not Widgets.

**Desktop Behaviour**  
Show a token summarizing what mobile should receive: today task, photo list, checklist, sync state.

**Mobile Behaviour**  
Open directly into the handed-off field workflow.

**Data Required**  
Task IDs, inspection IDs, evidence needs, project ID, due time, sync status.

**Workflow**  
Prepare handoff -> open mobile -> capture evidence -> sync back -> update desktop.

**Reusable Components**  
`MobileBottomNav`, `MobileQuickAdd`; missing: `MobileHandoffToken`.

**Future AI Opportunities**  
Generate field handoff brief.

**Future Automation Opportunities**  
Create mobile packet from inspection or risk.

**Related Patterns**  
Inspection Workflow, Site Evidence Flow, Activity Feed.

**Priority**  
Must.

### 19. Document Health

**Purpose**  
Show whether required documents are complete, stale, missing, or blocking.

**Problem it solves**  
Documents are often listed but not operationally evaluated.

**Operating Principle**  
Data before charts.

**Desktop Behaviour**  
Show document categories with health state and linked blocker/gate.

**Mobile Behaviour**  
Show missing or required documents only.

**Data Required**  
Document title, category, status, last update, linked task/risk/gate.

**Workflow**  
Define required docs -> check state -> link to blockers/gates -> resolve.

**Reusable Components**  
`ReferenceLabel`, `StatusBadge`, `WorkspacePanel`.

**Future AI Opportunities**  
Detect missing handover documents.

**Future Automation Opportunities**  
Flag stale documents after source age threshold.

**Related Patterns**  
Handover Package, Billing Gate Workflow, Closeout Readiness.

**Priority**  
Should.

### 20. Project Switcher

**Purpose**  
Move between related projects or packages without losing context.

**Problem it solves**  
Construction work often spans packages that affect each other.

**Operating Principle**  
Project before metrics.

**Desktop Behaviour**  
Show selected project and nearby related packages in the context strip.

**Mobile Behaviour**  
Use a compact project picker.

**Data Required**  
Project list, package relationships, active project ID, health, phase.

**Workflow**  
Select project -> preserve current view -> update context.

**Reusable Components**  
`ProjectCard`, `ReferenceLabel`; missing: `ProjectSwitcher`.

**Future AI Opportunities**  
Suggest related projects impacted by a decision.

**Future Automation Opportunities**  
Auto-link package dependencies.

**Related Patterns**  
Project Context Strip, Spatial Context, Presence Strip.

**Priority**  
Should.

### 21. Spatial Context

**Purpose**  
Navigate architecture projects through physical space.

**Problem it solves**  
Construction projects are spatial, not merely task-based. Work happens in zones: Ground Floor, Lobby, Counter, Kitchen, North Corridor, Back of House, facade, service corridor, landscape edge.

**Operating Principle**  
Architectural Operating System.

**Desktop Behaviour**  
Show location/zone references beside tasks, risks, inspections, drawings, and photos.

**Mobile Behaviour**  
Let site users tag notes/photos by physical zone.

**Data Required**  
Zone, floor, room, area, drawing reference, photo location, package.

**Workflow**  
Select zone -> view related tasks/evidence/drawings -> capture/update -> sync.

**Reusable Components**  
Missing: `SpatialContextMap`, `ZoneLabel`. Existing: `ReferenceLabel`, `TimelineRow`.

**Future AI Opportunities**  
Cluster issues by spatial zone.

**Future Automation Opportunities**  
Auto-suggest zone from photo metadata or checklist context.

**Related Patterns**  
Site Evidence Flow, Drawing Review Flow, Punch List Workflow.

**Priority**  
Should.

### 22. Material Approval Flow

**Purpose**  
Track material/sample approval from concept to verified installation.

**Problem it solves**  
Material approvals often happen across sample boards, photos, owner comments, procurement, and site verification.

**Operating Principle**  
Decision before production.

**Desktop Behaviour**  
Show approval state and evidence chain.

**Mobile Behaviour**  
Capture sample photos and installed-condition verification.

**Data Required**  
Material/sample ID, photo, owner review, approval state, production state, installation state, verification.

**Workflow**  
Sample -> Photo -> Owner Review -> Approval -> Production -> Installed -> Verified.

**Reusable Components**  
`DecisionCard`, `StatusBadge`, `InspectionPanel`; missing: `MaterialApprovalFlow`.

**Future AI Opportunities**  
Compare installed photo against approved sample.

**Future Automation Opportunities**  
Block production state until owner approval exists.

**Related Patterns**  
Decision Log, Site Evidence Flow, Document Health.

**Priority**  
Should.

### 23. Drawing Review Flow

**Purpose**  
Track drawings from issue through site verification.

**Problem it solves**  
Drawings lose authority when revisions, markups, approvals, and site use are disconnected.

**Operating Principle**  
Documents are operational evidence.

**Desktop Behaviour**  
Show drawing revision state, markup status, approval, and site verification.

**Mobile Behaviour**  
Expose current approved drawing and allow site verification note.

**Data Required**  
Drawing ID, issue date, markup, revision, approval state, IFC state, site verification.

**Workflow**  
Issue -> Markup -> Revision -> Approved -> Issued For Construction -> Site Verification.

**Reusable Components**  
`TimelineRow`, `DecisionCard`, `ReferenceLabel`; missing: `DrawingReviewFlow`.

**Future AI Opportunities**  
Summarize drawing deltas between revisions.

**Future Automation Opportunities**  
Prevent old drawings from being used on site.

**Related Patterns**  
Document Health, Spatial Context, Punch List Workflow.

**Priority**  
Should.

### 24. Punch List Workflow

**Purpose**  
Manage closeout issues from discovery to acceptance.

**Problem it solves**  
Punch items can scatter across photos, chats, inspections, and owner notes.

**Operating Principle**  
Data before charts.

**Desktop Behaviour**  
Show punch item, zone, owner, trade, severity, evidence, target date, and acceptance state.

**Mobile Behaviour**  
Capture punch items quickly with photo, zone, and owner.

**Data Required**  
Punch ID, title, zone, owner, trade, status, photo, due date, acceptance.

**Workflow**  
Find -> assign -> fix -> photo -> inspect -> accept -> close.

**Reusable Components**  
`TimelineRow`, `InspectionPanel`, `StatusBadge`; missing: `PunchListRow`.

**Future AI Opportunities**  
Group duplicate punch items by zone/trade.

**Future Automation Opportunities**  
Auto-create punch items from failed inspection checklist.

**Related Patterns**  
Inspection Workflow, Spatial Context, Closeout Readiness.

**Priority**  
Must.

### 25. Handover Package

**Purpose**  
Track the package of documents/evidence required for project handover.

**Problem it solves**  
Handover readiness is often unclear until too late.

**Operating Principle**  
Operating Surface, not Dashboard.

**Desktop Behaviour**  
Show required package sections and health: drawings, warranties, photos, approvals, inspection records, punch closure.

**Mobile Behaviour**  
Show missing evidence capture items.

**Data Required**  
Document checklist, evidence links, approvals, inspection records, punch closure status.

**Workflow**  
Define package -> collect documents/evidence -> review -> approve -> handover.

**Reusable Components**  
`WorkspacePanel`, `ReferenceLabel`, `StatusBadge`; missing: `HandoverPackage`.

**Future AI Opportunities**  
Generate handover readiness summary.

**Future Automation Opportunities**  
Flag missing package sections before handover date.

**Related Patterns**  
Document Health, Closeout Readiness, Billing Gate Workflow.

**Priority**  
Must.

### 26. Closeout Readiness

**Purpose**  
Show whether the project is ready to close.

**Problem it solves**  
Closeout is not a single percentage. It is a chain of unresolved conditions.

**Operating Principle**  
Project before metrics.

**Desktop Behaviour**  
Show readiness across punch list, inspections, evidence, documents, decisions, billing gates, and owner sign-off.

**Mobile Behaviour**  
Show remaining field capture items.

**Data Required**  
Punch closure, inspection state, document health, billing gate state, decision state, approval state.

**Workflow**  
Track readiness categories -> identify blockers -> resolve -> mark ready.

**Reusable Components**  
`MetricLine`, `StatusBadge`, `WorkspacePanel`; missing: `CloseoutReadinessPanel`.

**Future AI Opportunities**  
Explain why closeout is not ready.

**Future Automation Opportunities**  
Auto-build closeout checklist from active project data.

**Related Patterns**  
Handover Package, Billing Gate Workflow, Punch List Workflow.

**Priority**  
Must.

## 03 Desktop vs Mobile

Desktop and mobile do not serve the same role.

| Operating Pattern | Desktop Role | Mobile Role | Synchronization | Offline Behaviour | Evidence Capture | Approval Behaviour |
|---|---|---|---|---|---|---|
| Live Site State | Common operating picture. | Sync/source badge. | Push live/stale state both ways. | Show last synced state. | None. | Expose approval count. |
| Operating Timeline Strip | Full day/week control windows. | Today sequence. | Sync due-time changes. | Preserve cached timeline. | Optional note/photo by event. | Escalate overdue approvals. |
| Today Focus | Primary planning surface. | Default field screen. | Sync task state and notes. | Queue updates locally. | Yes. | Create approval requests only. |
| This Week | Planning horizon. | Calendar view. | Sync date changes. | Cached week list. | Limited. | Desktop preferred. |
| Project Context Strip | Package/project orientation. | Project selector. | Sync selected project. | Use cached projects. | None. | None. |
| Action Rail | Desktop action center. | Bottom quick action. | Sync action request state. | Queue action drafts. | Yes for photo/note. | Always approval-gated. |
| Site Evidence Flow | Evidence-to-gate relationship. | Capture evidence. | Upload and link evidence. | Queue media locally. | Primary. | Review on desktop. |
| Inspection Workflow | Plan and review. | Execute checklist. | Sync checklist and findings. | Offline checklist allowed. | Primary. | Approval after sync. |
| Approval Queue | Review and approve. | Limited review. | Sync status. | Read-only if offline. | Evidence preview only. | Desktop preferred for final approvals. |
| Decision Timeline | Full audit trail. | Current decision only. | Sync latest state. | Cached latest state. | Attach evidence. | Approval-gated. |
| Decision Log | Register. | Active decisions. | Sync state. | Cached active decisions. | Optional evidence. | Approval-gated. |
| Critical Risk Board | Risk control. | High-risk only. | Sync severity/owner. | Cached risks. | Evidence if relevant. | Escalation requests. |
| Blocker Escalation Ladder | Full escalation logic. | Next move. | Sync escalation state. | Queue escalation request. | Optional. | Approval or notification-gated. |
| Billing Gate Workflow | Gate review. | Evidence capture only. | Sync evidence/gate state. | Capture evidence offline. | Primary. | Desktop approval required. |
| Work Strip | Operational task rows. | Touch task strips. | Sync state/progress. | Queue task updates. | Optional. | Approval if write affects source. |
| Activity Feed | Full event log. | Latest events. | Sync events. | Show cached feed. | Event source only. | Logs approvals. |
| Presence Strip | Ownership map. | Current contact/owner. | Sync owner assignments. | Cached owners. | None. | Routes approval owner. |
| Mobile Handoff Token | Prepare field packet. | Execute packet. | Sync completion. | Packet works offline. | Primary. | Approval after sync. |
| Document Health | Document readiness. | Missing docs only. | Sync document state. | Cached docs. | Capture missing evidence. | Desktop approval. |
| Project Switcher | Cross-package navigation. | Compact picker. | Sync project selection. | Cached project list. | None. | None. |
| Spatial Context | Zones and physical navigation. | Zone tagging. | Sync zone tags. | Cache zone list. | Photo/note by zone. | None unless issue created. |
| Material Approval Flow | Review and production gate. | Sample/install photo capture. | Sync evidence/state. | Queue photos. | Primary. | Approval-gated before production. |
| Drawing Review Flow | Drawing authority/audit. | Current drawing + verification. | Sync revision state. | Cache latest approved drawing. | Verification photo/note. | Approval-gated. |
| Punch List Workflow | Full punch register. | Capture/fix/verify. | Sync punch state. | Queue punch items. | Primary. | Approval for closure if required. |
| Handover Package | Package readiness. | Missing evidence capture. | Sync checklist. | Cached checklist. | Primary. | Desktop approval. |
| Closeout Readiness | Final readiness view. | Remaining field work. | Sync readiness categories. | Cached readiness. | Field evidence only. | Desktop approval. |

## 04 Anti-Patterns

BBH must never become the following:

### KPI Dashboard

KPI dashboards summarize. BBH OS operates. Metrics may support decisions, but they cannot replace owner, blocker, evidence, and next action.

### Analytics-First

Construction work is not solved by charts first. Use logs, strips, registers, and evidence before visualization.

### Card Explosion

Too many cards make every item feel equally important. BBH should use whitespace, thin rules, and rows before cards.

### Fancy Charts

Decorative charts create false confidence. Charts are allowed only when they reduce decision time.

### Glassmorphism

Glass effects reduce readability and do not match architectural documentation.

### Heavy Gradients

Gradients push BBH toward marketing surfaces. Use neutral paper, rules, and restrained accent.

### Corporate Admin UI

Generic admin patterns make work feel like forms management. BBH is an operating surface.

### Generic ERP

ERP interfaces optimize breadth and compliance. BBH optimizes clarity, project control, and owner action.

### Kanban Everywhere

Kanban is useful in limited contexts but should not become the default mental model. Construction work is spatial, temporal, evidential, and approval-based.

### Decoration Over Information

Motion, shadows, icons, and color cannot replace data quality. Every visual element must carry operational meaning.

## 05 Mapping To Existing Workspace Components

| Operating Pattern | Existing Workspace Kit | Missing Reusable Components |
|---|---|---|
| Live Site State | `StatusBadge`, `ReferenceLabel`, `MetricLine` | `LiveSiteStateBar` |
| Operating Timeline Strip | `TimelineRow`, `StatusBadge` | `OperatingTimelineStrip` |
| Today Focus | `WorkspacePanel`, `TimelineRow`, `StatusBadge` | `TodayFocusSurface` |
| This Week | `TimelineRow`, `ReferenceLabel` | `WeekStrip` |
| Project Context Strip | `ProjectCard`, `ReferenceLabel`, `StatusBadge` | `ProjectContextStrip` |
| Action Rail | `CommandPalette`, `ApprovalQueue`, `MobileQuickAdd` | `ActionRail` |
| Site Evidence Flow | `InspectionPanel`, `ReferenceLabel` | `SiteEvidenceFlow` |
| Inspection Workflow | `InspectionPanel`, `TimelineRow`, `MobileQuickAdd` | `InspectionChecklist` |
| Approval Queue | `ApprovalQueue`, `DecisionCard`, `StatusBadge` | `ApprovalQueueRow` |
| Decision Timeline | `DecisionCard`, `TimelineRow` | `DecisionTimeline` |
| Decision Log | `DecisionCard`, `ReferenceLabel` | `DecisionRegister` |
| Critical Risk Board | `WorkspacePanel`, `StatusBadge` | `CriticalRiskBoard` |
| Blocker Escalation Ladder | `StatusBadge`, `ReferenceLabel` | `BlockerEscalationRow` |
| Billing Gate Workflow | `BillingGateRow`, `ApprovalQueue` | `BillingGateEvidenceState` |
| Work Strip | `TimelineRow` | `WorkStrip` |
| Activity Feed | `ReferenceLabel`, `StatusBadge` | `ActivityFeed` |
| Presence Strip | `ReferenceLabel` | `PresenceStrip` |
| Mobile Handoff Token | `MobileBottomNav`, `MobileQuickAdd` | `MobileHandoffToken` |
| Document Health | `WorkspacePanel`, `ReferenceLabel` | `DocumentHealthPanel` |
| Project Switcher | `ProjectCard` | `ProjectSwitcher` |
| Spatial Context | `ReferenceLabel` | `SpatialContextMap`, `ZoneLabel` |
| Material Approval Flow | `DecisionCard`, `InspectionPanel` | `MaterialApprovalFlow` |
| Drawing Review Flow | `TimelineRow`, `DecisionCard` | `DrawingReviewFlow` |
| Punch List Workflow | `InspectionPanel`, `TimelineRow` | `PunchListRow` |
| Handover Package | `WorkspacePanel`, `StatusBadge` | `HandoverPackage` |
| Closeout Readiness | `MetricLine`, `WorkspacePanel` | `CloseoutReadinessPanel` |

## 06 Future Studio Modules

### Studio

Uses nearly all patterns. Studio is the primary proving ground for the operating language.

Most important patterns:

- Live Site State
- Today Focus
- Site Evidence Flow
- Approval Queue
- Critical Risk Board
- Billing Gate Workflow
- Punch List Workflow
- Handover Package

### Capital

Capital should reuse approval, evidence, timeline, and document health patterns.

Relevant patterns:

- Approval Queue
- Billing Gate Workflow
- Activity Feed
- Document Health
- Action Rail

### Creator Factory

Creator Factory can reuse production and approval patterns without becoming a content dashboard.

Relevant patterns:

- Operating Timeline Strip
- Approval Queue
- Decision Log
- Activity Feed
- Document Health

### Trading Lab

Trading Lab should adapt operating discipline, not construction visuals.

Relevant patterns:

- Live Site State as market/session state
- Action Rail
- Approval Queue for strategy changes
- Activity Feed
- Decision Timeline

### Family Office

Family Office should adapt operating gates and approval controls.

Relevant patterns:

- Approval Queue
- Billing Gate Workflow as payment/obligation gate
- Document Health
- Activity Feed
- Live Site State as financial state

### My House

My House should reuse spatial and construction patterns directly.

Relevant patterns:

- Spatial Context
- Material Approval Flow
- Drawing Review Flow
- Punch List Workflow
- Handover Package
- Closeout Readiness

## 07 Evolution Log

### v0.1

- Initial canonical operating pattern library.
- Defines 26 operating patterns.
- Establishes desktop/mobile roles.
- Maps patterns to existing workspace components and missing components.

### v0.2

- Reserved.

### v0.3

- Reserved.

### v1.0

- Reserved for first reviewed and implemented Studio OS operating pattern release.

## Completion Summary

### Operating Patterns Created

1. Live Site State
2. Operating Timeline Strip
3. Today Focus
4. This Week
5. Project Context Strip
6. Action Rail
7. Site Evidence Flow
8. Inspection Workflow
9. Approval Queue
10. Decision Timeline
11. Decision Log
12. Critical Risk Board
13. Blocker Escalation Ladder
14. Billing Gate Workflow
15. Work Strip
16. Activity Feed
17. Presence Strip
18. Mobile Handoff Token
19. Document Health
20. Project Switcher
21. Spatial Context
22. Material Approval Flow
23. Drawing Review Flow
24. Punch List Workflow
25. Handover Package
26. Closeout Readiness

### New BBH Inventions

These patterns are BBH-specific inventions or BBH-specific formalizations:

- Spatial Context
- Mobile Handoff Token
- Site Evidence Flow
- Billing Gate Workflow
- Closeout Readiness
- Handover Package
- Material Approval Flow as a BBH operating pattern
- Drawing Review Flow as a BBH operating pattern
- Project Context Strip
- Action Rail as a BBH Studio OS convention

### Adapted From Industry References

These patterns adapt operating logic from construction control, mission control, air traffic control, hospital operations, industrial control systems, GitHub Projects, Linear, Notion, Stripe/Ramp-style approval systems, Apple HIG, Arc Browser, and Nothing OS:

- Live Site State
- Operating Timeline Strip
- Today Focus
- This Week
- Approval Queue
- Decision Timeline
- Decision Log
- Critical Risk Board
- Blocker Escalation Ladder
- Work Strip
- Activity Feed
- Presence Strip
- Project Switcher
- Document Health
- Inspection Workflow
- Punch List Workflow

### Top 10 Patterns To Implement First Inside Studio OS

1. Live Site State
2. Project Context Strip
3. Today Focus
4. Operating Timeline Strip
5. Action Rail
6. Site Evidence Flow
7. Inspection Workflow
8. Approval Queue
9. Critical Risk Board
10. Blocker Escalation Ladder

These should be implemented before broader modules because they turn Studio OS from a static project page into an operating surface.
