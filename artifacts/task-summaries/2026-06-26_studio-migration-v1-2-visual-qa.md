# Studio Migration v1.2 Visual QA Pack

## สิ่งที่ทำ

สร้าง Visual QA evidence สำหรับ Studio หลัง migration v1.2 — screenshot หน้า `/os/studio/projects` พร้อม README อธิบายสถานะ migration

## ไฟล์ใหม่

| ไฟล์ | คำอธิบาย |
|---|---|
| `artifacts/studio-migration/v1.2/studio-current.png` | Screenshot ปัจจุบันของ Studio OS (1920×3000 @2x) |
| `artifacts/studio-migration/v1.2/README.md` | สถานะ migration, components ที่ย้ายแล้ว, unmigrated areas |
| `scripts/capture-studio-screenshot.mjs` | Helper script สำหรับ capture ในอนาคต |

## ไฟล์ที่แก้

ไม่มี

## Screenshot Output

- **ไฟล์:** `artifacts/studio-migration/v1.2/studio-current.png`
- **ขนาด:** 1920×3000 @2x, full page
- **Route:** `/os/studio/projects`

## Visual Notes

- หลัง migration v1 → v1.2 ไม่มีการเปลี่ยนแปลง visual
- Components ที่ย้ายแล้วทั้งหมดใช้ CSS classes เดิม
- Unmigrated areas: SiteWatchView (unique media blocks), MasterTimelineView (Gantt), ReviewsView (shared component)

## Build Status

```
npm run build   ✅ PASS
npm run lint    ✅ PASS
```

## Commit

`6f5a72e` — (จะ commit พร้อมไฟล์ใหม่)

## Next Recommended Step

Studio Migration v1.3 — SiteWatchView, MasterTimelineView, ReviewsView migration หรือเริ่ม StudioProjectDetailPage migration
