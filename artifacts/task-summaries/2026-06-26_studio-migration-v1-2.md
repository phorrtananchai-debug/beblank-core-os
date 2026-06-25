# Studio Migration v1.2 Apply Extracted Components

## สิ่งที่ทำ

นำ workspace components (WorkspaceSection, WorkspaceHeader, WorkspaceCard) ที่สร้างไว้ใน v1.1 ไปใช้ใน StudioWorkspacePage จริง แทนที่ ad-hoc markup 3 จุด:

- **DocumentsView** — `panel` + `panel-header` → `WorkspaceSection` + `WorkspaceHeader`
- **ArtworkView** — `panel panel-float` articles → `WorkspaceCard variant="float" as="article"`
- **BriefsView** — `panel panel-float` articles → `WorkspaceCard variant="float" as="article"`

## ไฟล์ใหม่

ไม่มี

## ไฟล์ที่แก้

| ไฟล์ | แก้ไข |
|---|---|
| `src/pages/os/StudioWorkspacePage.tsx` | 3 views — 8 insertions, 10 deletions |

## สิ่งที่ย้าย / เปลี่ยนแทน

| ของเก่า | ของใหม่ |
|---|---|
| `<section className="panel">` + `<div className="panel-header">` | `<WorkspaceSection header={<WorkspaceHeader .../>}>` |
| `<article className="panel panel-float">` | `<WorkspaceCard variant="float" as="article">` |

## สิ่งที่ยังไม่แตะ

- SiteWatchView — มี `.studio-fragment-media` unique block
- MasterTimelineView — Gantt chart layout ซับซ้อน
- ReviewsView — ใช้ `PendingApprovalPanel` อยู่แล้ว

## Visual Difference

แทบไม่มี — component ใหม่ใช้ CSS classes เดียวกับของเก่า:
- `WorkspaceCard variant="float"` → `panel panel-float`
- `WorkspaceSection` → `panel`
- `WorkspaceHeader` → `panel-header`

## Build Status

```
npm run build   ✅ PASS
npm run lint    ✅ PASS
```

## Commit

`bbac1a0` — `Studio Migration v1.2 Apply Extracted Components`

## Next Recommended Step

Begin migration of StudioProjectDetailPage 7 section views (Overview, Tasks, Timeline, Site, Documents, Reviews, AI Context) to use workspace components.
