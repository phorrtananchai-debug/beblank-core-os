# Studio OS — Migration Status

## Overview

Studio OS has been migrated from ad-hoc UI to the BBH UI Platform incrementally across v1 → v1.2 → v2.

## Migrated Views (85%)

| View | Component Used | Phase | Status |
|---|---|---|---|
| Overview | WorkspaceSection + WorkspaceHeader | v1 | ✅ |
| Active Projects | WorkspaceSection + WorkspaceHeader | v1 | ✅ |
| Timeline | WorkspaceSection + WorkspaceHeader | v1 | ✅ |
| Openings | WorkspaceSection + WorkspaceHeader | v1 | ✅ |
| Capacity | WorkspaceCard (4 cards) | v1 | ✅ |
| Reviews sidebar | WorkspaceCard | v1 | ✅ |
| DocumentsView | WorkspaceSection + WorkspaceHeader | v1.2 | ✅ |
| ArtworkView | WorkspaceCard variant="float" as="article" | v1.2 | ✅ |
| BriefsView | WorkspaceCard variant="float" as="article" | v1.2 | ✅ |
| SiteWatchView | WorkspaceCard variant="float" as="article" | v2 | ✅ |
| ReviewsView | WorkspaceSection + WorkspaceHeader | v2 | ✅ |
| ReviewCard | WorkspaceCard variant="float" padding="md" | v2 | ✅ |
| PreviewBlock | WorkspaceCard variant="tinted" padding="sm" | v2 | ✅ |

## Remaining Hardcoded Areas

| Area | Line Range | Reason | Plan |
|---|---|---|---|
| MasterTimelineView | ~680-830 | Custom Gantt chart with phase bars, milestone diamonds, overlap detection | Keep as-is — too specialized |
| Project cards (link) | ~375-420 | Custom at-risk coloring, hover animation | Keep as Link wrapper |

## Registry Coverage

| Component | Used In Studio | Registry usedIn Updated |
|---|---|---|
| WorkspaceShell | No (OSLayout only) | — |
| WorkspaceHeader | Yes | ✅ |
| WorkspaceSection | Yes | ✅ |
| WorkspaceCard | Yes | ✅ |
| StatusRail | Not yet | — |
| MetricStrip | Not yet | — |
| ActivityFeed | Not yet | — |
| DataList | Not yet | — |
| FilterBar | Not yet | — |
| NoticeBanner | Not yet | — |
| LoadingState | Not yet | — |

**4 of 11 workspace components actively used in Studio (36%)**

## Risks

- Low — all replacements use identical CSS classes
- MasterTimelineView is the only complex hardcoded area
- No layout shift, no content changes — verified via v1.2 QA screenshots

## Next Candidate

MasterTimelineView — requires evaluation before migration:
- Currently uses custom Gantt rendering with phase bars, milestone diamonds, overlap detection
- No existing workspace component covers this
- Would require either: a new specialized Gantt component, or keeping as-is
- Recommendation: keep as-is for now; migrate only when a reusable Gantt component is needed elsewhere
