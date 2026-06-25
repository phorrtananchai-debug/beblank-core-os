# Changelog

## [2.0.0] — 2026-06-25

### Added
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
