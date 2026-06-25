# BBH System Map

## Architecture Overview

```
Visual Language (src/design/)
├── visual-language.ts       — OperationalStatus, STATUS_VISUALS
├── grid.ts                  — Grid tokens, configs, variants
└── spatial.ts               — SpatialContext, useSpatial, SpacingRhythm
        │
        ▼
Spatial Runtime (src/components/shared/)
├── GridOverlay.tsx           — CSS grid overlay (shell/overlay modes)
├── GridCanvas.tsx            — Wrapper component
├── SpatialProvider.tsx       — React context provider
├── GridDebug.tsx             — Dev debug overlay
└── WorkspaceShell.tsx        — Shell with spatial context
        │
        ▼
Design Tokens (src/design-system/foundations/)
├── colors.ts                 — Color tokens (16)
├── typography.ts              — Typography tokens (9)
└── spacing.ts                 — Spacing tokens (12+6)
        │
        ▼
Component Registry (src/design-system/registry/)
├── components.ts              — Composite/workspace components (26+)
├── primitives.ts              — Base UI primitives (17)
├── symbols.ts                 — Visual symbols (7)
├── templates.ts               — Page templates (4)
├── patterns.ts                — Operating patterns (4)
└── workspace.ts               — Workspace page defs (5)
        │
        ├── Design Engine (src/design-system/)
        │   ├── resolvers.ts    — Lookup functions
        │   ├── rules.ts        — Validation
        │   ├── graph.ts        — Dependency graph
        │   └── manifest.ts     — Page manifests
        │
        ├── Versioning (src/design-system/)
        │   ├── version.ts      — RegistryVersion, isCompatible
        │   └── types.ts        — Shared types
        │
        ▼
Runtime Pages (src/pages/os/)
├── CommandCenterPage
├── StudioWorkspacePage
├── StudioProjectDetailPage
├── InvestmentsPage
├── BridgeSettingsPage
├── CapitalPage
├── DesignSystemPage
└── (6 more)
        │
        ▼
Review Artifacts
├── artifacts/design-system-review/    — 23 HTML review pages
│   └── screenshots/                   — 23 PNG screenshots
├── artifacts/design-review/           — Visual review pack
│   ├── html/                          — 23 HTML copies
│   ├── screenshots/                   — 23 full-page PNGs
│   ├── thumbnails/                    — 23 thumbnail PNGs
│   ├── contact-sheet/                 — Mosaic overview
│   ├── index.json                     — Machine-readable index
│   └── README.md                      — Documentation
└── artifacts/design-system/json/      — 10 JSON export files
        │
        ▼
Scripts (scripts/)
├── generate-design-system-review.mjs          — HTML generator
├── generate-design-system-review-extras.mjs    — Pages 07-22
├── generate-design-system-screenshots.mjs      — Screenshot + thumbnail + contact sheet
└── export-design-system-json.mjs               — JSON export
