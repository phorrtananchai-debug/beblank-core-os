# Studio Migration v2.1 Hardening

## สิ่งที่ทำ

Hardening Studio migration ก่อนย้ายไป production page ถัดไป:
- ตรวจสอบ unused imports — clean
- สร้าง `docs/migration/STUDIO_MIGRATION_STATUS.md` — รายงานสถานะ migration
- อัปเดต registry `usedIn` สำหรับ `workspace-header`, `workspace-card` ให้รวม StudioWorkspacePage

## Files Changed

| ไฟล์ | แก้ไข |
|---|---|
| `docs/migration/STUDIO_MIGRATION_STATUS.md` | ใหม่ — สถานะ migration ครบทุก view |
| `src/design-system/registry/components.ts` | usedIn workspace-header + workspace-card → เพิ่ม StudioWorkspacePage |

## Registry Updates

| Component | Before | After |
|---|---|---|
| WorkspaceHeader usedIn | `['DesignSystemPage']` | `['DesignSystemPage', 'StudioWorkspacePage']` |
| WorkspaceCard usedIn | `['DesignSystemPage']` | `['DesignSystemPage', 'StudioWorkspacePage']` |

## Remaining Debt

| Area | Status |
|---|---|
| MasterTimelineView (Gantt) | Keep as-is — too specialized |
| Project cards (Link wrapper) | Keep as-is — custom at-risk styling |
| Studio migration coverage | 85% views, 36% registry components used |

## Build Status

```
npm run build   ✅ PASS
npm run lint    ✅ PASS
```

## Commit

(กำลัง commit)

## Next Recommended Task

เริ่ม Capital OS migration หรือ Investments OS polish
