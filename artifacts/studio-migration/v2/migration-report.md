# Studio Migration v2 — Migration Report

## Visual Differences

Compared to pre-migration baseline: **Nearly zero.** All replacements use identical CSS classes:
- `WorkspaceCard variant="float"` → `panel panel-float`
- `WorkspaceSection` → `panel`
- `WorkspaceHeader` → `panel-header`
- `WorkspaceCard variant="tinted"` → `rounded-2xl border border-black/[0.04] bg-[#faf9f8] p-3`

## Components Migrated

| View | Status | Component Used | Migration Phase |
|---|---|---|---|
| Overview | ✅ | WorkspaceSection + WorkspaceHeader + WorkspaceCard | v1 |
| Timeline | ✅ | WorkspaceSection + WorkspaceHeader | v1 |
| Openings | ✅ | WorkspaceSection + WorkspaceHeader | v1 |
| Capacity | ✅ | WorkspaceCard (4 cards) | v1 |
| Reviews Sidebar | ✅ | WorkspaceCard | v1 |
| DocumentsView | ✅ | WorkspaceSection + WorkspaceHeader | v1.2 |
| ArtworkView | ✅ | WorkspaceCard variant="float" as="article" | v1.2 |
| BriefsView | ✅ | WorkspaceCard variant="float" as="article" | v1.2 |
| SiteWatchView | ✅ | WorkspaceCard variant="float" as="article" | v2 |
| ReviewsView | ✅ | WorkspaceSection + WorkspaceHeader | v2 |
| ReviewCard | ✅ | WorkspaceCard variant="float" padding="md" | v2 |
| PreviewBlock | ✅ | WorkspaceCard variant="tinted" padding="sm" | v2 |

## Remaining Hardcoded Areas

| Area | Reason | Plan |
|---|---|---|
| MasterTimelineView | Custom Gantt chart — no workspace component maps to this | Keep as-is |
| Project cards | Custom styling with at-risk coloring | Keep as-is (Link wrapper) |

## Registry Coverage

- Total workspace components in registry: **11**
- Used in Studio: **4** (WorkspaceSection, WorkspaceHeader, WorkspaceCard, WorkspaceShell)
- Studio migration coverage: **85%** of views migrated
- Registry usage across Studio: **36%** of all registered components

## Commit

`(see git log)`
