# Dependency Report

## Module Dependencies

| Module | Dependencies | Type |
|--------|-------------|------|
| src/design/grid.ts | none | Leaf |
| src/design/spatial.ts | react (createContext, useContext) | Leaf |
| src/design/visual-language.ts | none | Leaf |
| GridOverlay.tsx | grid.ts | UI |
| GridCanvas.tsx | GridOverlay.tsx, grid.ts | UI |
| SpatialProvider.tsx | spatial.ts, grid.ts, GridDebug.tsx, react-router | Context |
| GridDebug.tsx | spatial.ts | UI |
| WorkspaceShell.tsx | spatial.ts, GridOverlay.tsx | UI |
| version.ts | types.ts | Utility |
| resolvers.ts | types.ts, all registries | Lookup |
| rules.ts | types.ts, registries | Validation |
| graph.ts | types.ts, registries | Graph |
| manifest.ts | types.ts | Config |

## Circular Dependencies

None detected.

## Unused Dependencies

None detected — all imports are used in their respective modules.

## External Dependencies

| Package | Used By |
|---------|---------|
| react | All components |
| react-router-dom | OSLayout, SpatialProvider |

## Script Dependencies

| Script | Node Built-in | External |
|--------|---------------|----------|
| generate-design-system-review.mjs | fs, path | none |
| generate-design-system-review-extras.mjs | fs, path | none |
| generate-design-system-screenshots.mjs | fs, path | playwright |
| export-design-system-json.mjs | fs, path | none |

## Build Dependency Chain

```
git clone → npm install → npm run build
  → tsc compiles TypeScript
  → vite bundles
  → dist/ ready for deployment

npm run design:review
  → generates 23 HTML files

npm run design:screenshots
  → generates 23 PNG + 23 thumbnails + contact sheet + index.json

npm run design:export
  → generates 10 JSON files
```
