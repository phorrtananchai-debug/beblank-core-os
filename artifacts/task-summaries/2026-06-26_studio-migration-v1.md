# Studio Migration v1 — Workspace Foundation

## สิ่งที่ทำ

เริ่มย้าย Studio OS มาใช้ BBH UI Platform — สร้างและใช้ WorkspaceShell, WorkspaceHeader, WorkspaceSection, WorkspaceCard ใน StudioWorkspacePage Overview section

## ไฟล์ใหม่

| ไฟล์ | คำอธิบาย |
|---|---|
| `src/components/shared/workspace/WorkspaceHeader.tsx` | Section header — label + title + children + endSlot |
| `src/components/shared/workspace/WorkspaceSection.tsx` | Section wrapper — variant: card/float/plain |
| `src/components/shared/workspace/WorkspaceCard.tsx` | Card — variant: default/float/compact/tinted + padding sm/md/lg |

## ไฟล์ที่แก้

| ไฟล์ | แก้ไข |
|---|---|
| `src/pages/os/StudioWorkspacePage.tsx` | Overview section 4 ส่วน + Reviews sidebar → ใช้ BBH components |
| `src/design-system/registry/components.ts` | เพิ่ม workspace-section + อัปเดต workspace-header, workspace-card เป็น standalone |

## สิ่งที่ย้าย / เปลี่ยนแทน

| ของเก่า | ของใหม่ |
|---|---|
| `<section className="os-card-primary">` + `panel-header` | `<WorkspaceSection header={<WorkspaceHeader .../>}>` |
| `<div className="panel panel-float">` | `<WorkspaceSection variant="float">` |
| `<div className="rounded-2xl border ... p-3 text-center">` | `<WorkspaceCard variant="compact" padding="sm">` |

## Visual Difference

แทบไม่มี — component ใหม่ใช้ CSS classes เดียวกับของเก่า

## Build Status

```
npm run build   ✅ PASS
npm run lint    ✅ PASS
```

## Commit

`9bf6351` — `Studio Migration v1 — Workspace Foundation`
