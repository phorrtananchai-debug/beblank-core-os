# Changelog

## [2.1.0] — 2026-06-25

### Added
- Spatial Grid Language (SGL): grid tokens, overlay component, canvas wrapper
- Grid config system with 4 variants (architect, operation, presentation, print)
- CSS grid variables (`--bb-grid-major`, `--bb-grid-minor`, `--bb-grid-opacity`, etc.)
- `GridOverlay` component with variant/opacity/fade control
- `GridCanvas` wrapper component
- `src/design/grid.ts` — grid token constants + config lookup
- `docs/SPATIAL_GRID_LANGUAGE.md` — full documentation
- Registry entries for GridOverlay and GridCanvas
- Review page 21-spatial-grid.html + screenshot

### Infrastructure
- `src/design/grid.ts` — grid token module
- `src/components/shared/GridOverlay.tsx` — CSS-based grid overlay
- `src/components/shared/GridCanvas.tsx` — content wrapper

## [2.0.0] — 2026-06-25
- Registry versioning system (registryVersion, componentVersion, tokenVersion)
- JSON export script — `npm run design:export` generates 10 JSON files
- Version compatibility utility (`isCompatible`)
- Component metadata: `introduced`, `deprecated`, `breaking`, `compatibleWith` fields

### Changed
- ComponentMeta, TemplateDef, PatternDef interfaces extended with optional version fields
- Central export updated to include version module

### Infrastructure
- `artifacts/design-system/json/` — machine-readable registry exports
- `scripts/export-design-system-json.mjs` — headless JSON generator

## [1.0.0] — Initial Design System Registry

### Added
- Component registry with metadata
- Design token foundations (colors, typography, spacing)
- Workspace component library
- HTML review pack (21 pages)
- Screenshot generator
- Resolver, validation, graph, and manifest modules
