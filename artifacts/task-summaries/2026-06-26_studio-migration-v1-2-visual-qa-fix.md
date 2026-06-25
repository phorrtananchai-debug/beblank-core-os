# Studio Migration v1.2 Visual QA Fix

## สิ่งที่ทำ

แก้ไข screenshot capture ให้ทำงานถูกต้อง — authenticate ก่อน, ตรวจสอบ elements ก่อน capture

## Root Cause

Script ก่อนหน้านี้เปิด URL `/os/studio/projects` โดยตรงโดยไม่ผ่าน login → SPA redirect ไป `/login` → screenshot ที่ได้คือหน้า Login ไม่ใช่ Studio

## Fix

- เพิ่มขั้นตอน: ไป `/login` → คลิก "Continue to Core OS" → รอ redirect → แล้วค่อยไป `/os/studio/projects`
- เพิ่ม verification 5 จุดก่อน capture (sidebar, project cards, Karun Central, Studio header)
- ถ้า element ไหนหาย → FAIL script ทันที
- สร้าง annotated version พร้อม labels

## ไฟล์ใหม่

| ไฟล์ | คำอธิบาย |
|---|---|
| `artifacts/studio-migration/v1.2/studio-current-annotated.png` | Screenshot พร้อม annotation: WorkspaceShell, Header, Section, Card, Route, Grid mode |

## ไฟล์ที่แก้

| ไฟล์ | แก้ |
|---|---|
| `scripts/capture-studio-screenshot.mjs` | เพิ่ม auth flow, element verification, annotated output |

## Validation

```
✅ OS Sidebar (1)
✅ Project cards (6)
✅ Karun Central Khon Kaen (6)
✅ Studio Control Room header (8)
```

## Screenshot Output

- `artifacts/studio-migration/v1.2/studio-current.png` — clean screenshot
- `artifacts/studio-migration/v1.2/studio-current-annotated.png` — with component labels

## Build Status

```
npm run build   ✅ PASS
npm run lint    ✅ PASS
```

## Commit

`(จะ commit พร้อมไฟล์)`

## Next Recommended Step

Studio Migration v1.3 — SiteWatchView, MasterTimelineView, ReviewsView หรือ StudioProjectDetailPage
