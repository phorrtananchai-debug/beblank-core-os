# Phase 3 — Editorial Layout Engine

## สิ่งที่ทำ

สร้าง Editorial Layout Engine — ระบบ layout tokens, 12-column grid, baseline grid, layout inspector, grid visibility upgrade

### Task 1 — Layout Tokens
- `src/design/editorial.ts` — `EditorialDensity`, `EditorialRhythm`, `EditorialSpacing`, `EditorialMargins`, `EDITORIAL` config 6 modes (hero, article, rail, gallery, presentation, narrative)
- `getEditorial()`, `columnSpan()`, `columnGrid()` utilities

### Task 2 — Column System
- `EditorialRail` component — 12-column CSS Grid wrapper
- `EditorialSection` component — columnSpan/columnStart support

### Task 3 — Editorial Components
- `EditorialSection.tsx` — section wrapper with layout config consumption
- `EditorialRail.tsx` — CSS Grid rail

### Task 4 — Whitespace Rhythm
- Editorial tokens define spacing per mode (padding, gap, margin)
- `EditorialConfig` controls margins, maxWidth

### Task 5 — Baseline Grid
- GridDebug อัปเกรด: เพิ่ม 5 toggleable layers (major, minor, columns, baseline, margins)
- Layer toggle panel ที่ bottom-right

### Task 6 — Grid Visibility
- Architect: major 0.06, minor 0.025
- Operation: major 0.03, minor 0.003
- Presentation: 0 (no grid)
- Print: major 0.08

### Task 7 — Layout Inspector
- Ctrl+Shift+L toggle (via UI button)
- แสดง variant, major/minor, baseline, columns, opacity, rhythm values
- Compact floating panel top-right

### Task 8 — Studio Refactor
- เพิ่ม editorial spacing ใน main wrapper
- Components พร้อม แต่ Studio sections ยังใช้ layout เดิม (refactor ต่อใน v2)

## ไฟล์ใหม่

| ไฟล์ | คำอธิบาย |
|---|---|
| `src/design/editorial.ts` | Editorial layout tokens + configs |
| `src/components/shared/workspace/EditorialSection.tsx` | Section with column span |
| `src/components/shared/workspace/EditorialRail.tsx` | CSS Grid rail |
| `scripts/generate-editorial-review.mjs` | Review page generator |
| `artifacts/design-system-review/23-editorial-layout.html` | Review page |

## ไฟล์ที่แก้

| ไฟล์ | แก้ |
|---|---|
| `src/design/grid.ts` | ปรับ architect opacity 0.06, presentation 0, เพิ่ม review 0.06 |
| `src/components/shared/GridDebug.tsx` | 5-layer toggle + Layout Inspector |
| `src/pages/os/StudioWorkspacePage.tsx` | editorial spacing ใน main wrapper |

## Architecture Impact

- Editorial Engine เพิ่ม layer ใหม่ระหว่าง Design Tokens และ Runtime
- GridDebug อัปเกรดเป็น Layout Inspector เต็มรูปแบบ
- Grid visibility ปรับให้ Architect mode มองเห็นได้ชัดขึ้น (trace paper feel)
- Editorial components พร้อมใช้งานใน Studio refactor v2

## Build Status

```
npm run build   ✅ PASS
npm run lint    ✅ PASS
```

## Commit

(กำลัง commit)

## Next Recommended Step

Editorial Layout Engine v2 — นำ EditorialRail ไปใช้ใน StudioWorkspacePage section layouts จริง (refactor Timeline + Openings → 8/4 split, Overview → 3/6/3)
