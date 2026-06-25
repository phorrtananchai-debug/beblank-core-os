# Studio Migration v1.2 — Visual QA

## Current State

- **Commit:** (see git log)
- **Route:** `/os/studio/projects`
- **Viewport:** 1920×3000 @2x
- **Date:** 2026-06-25

## Migrated Components

| View | Component Used | Status |
|---|---|---|
| Active Projects | WorkspaceSection + WorkspaceHeader + Link cards | ✅ Migrated v1 |
| Timeline | WorkspaceSection + WorkspaceHeader | ✅ Migrated v1 |
| Openings | WorkspaceSection + WorkspaceHeader | ✅ Migrated v1 |
| Capacity | WorkspaceSection + WorkspaceCard (4 cards) | ✅ Migrated v1 |
| Reviews sidebar | WorkspaceCard | ✅ Migrated v1 |
| DocumentsView | WorkspaceSection + WorkspaceHeader | ✅ Migrated v1.2 |
| ArtworkView | WorkspaceCard variant="float" as="article" | ✅ Migrated v1.2 |
| BriefsView | WorkspaceCard variant="float" as="article" | ✅ Migrated v1.2 |

## Known Unmigrated Areas

| Area | Reason | Future Plan |
|---|---|---|
| SiteWatchView | Uses `.studio-fragment-media` unique blocks | v1.3 |
| MasterTimelineView | Gantt chart custom layout | v1.3 |
| ReviewsView | Uses PendingApprovalPanel shared component | v1.3 |

## Visual Notes

- Visual appearance should be nearly identical to pre-migration
- All replacements use identical CSS classes
- No layout shift, no content changes

## Files Changed During Migration

| File | v1 | v1.1 | v1.2 |
|---|---|---|---|
| `StudioWorkspacePage.tsx` | Overview + Capacity migrated | — | Documents, Artwork, Briefs views |
| `WorkspaceHeader.tsx` | Created | — | — |
| `WorkspaceSection.tsx` | Created | — | — |
| `WorkspaceCard.tsx` | Created | — | — |
| `StatusRail.tsx` | — | Created | — |
| `MetricStrip.tsx` | — | Created | — |
| `ActivityFeed.tsx` | — | Created | — |
| `DataList.tsx` | — | Created | — |
| `FilterBar.tsx` | — | Created | — |
| `NoticeBanner.tsx` | — | Created | — |
| `LoadingState.tsx` | — | Created | — |
