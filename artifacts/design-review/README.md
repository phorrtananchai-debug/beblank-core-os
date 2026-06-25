# BBH Design System — Visual Review Artifacts

## Structure

```
artifacts/design-review/
├── index.json              — Machine-readable index of all pages
├── README.md               — This file
├── html/                   — Static HTML copies of all review pages
├── screenshots/            — Full-page PNG screenshots (1920×3000 @2x)
├── thumbnails/             — Thumbnail PNG (320px width)
└── contact-sheet/          — Contact sheet mosaic
    └── design-system-contact-sheet.png
```

## Pages

| # | Page | Screenshot | Thumbnail |
|---|------|------------|-----------|
| 00 | Design System Index | [PNG](screenshots/00-index.png) | [THUMB](thumbnails/00-index.png) |
| 01 | Primitives | [PNG](screenshots/01-primitives.png) | [THUMB](thumbnails/01-primitives.png) |
| 02 | Workspace | [PNG](screenshots/02-workspace.png) | [THUMB](thumbnails/02-workspace.png) |
| 03 | Symbols | [PNG](screenshots/03-symbols.png) | [THUMB](thumbnails/03-symbols.png) |
| 04 | Patterns | [PNG](screenshots/04-patterns.png) | [THUMB](thumbnails/04-patterns.png) |
| 05 | Templates | [PNG](screenshots/05-templates.png) | [THUMB](thumbnails/05-templates.png) |
| 06 | States | [PNG](screenshots/06-states.png) | [THUMB](thumbnails/06-states.png) |
| 07 | Anatomy | [PNG](screenshots/07-anatomy.png) | [THUMB](thumbnails/07-anatomy.png) |
| 08 | Scale | [PNG](screenshots/08-scale.png) | [THUMB](thumbnails/08-scale.png) |
| 09 | Recipes | [PNG](screenshots/09-recipes.png) | [THUMB](thumbnails/09-recipes.png) |
| 10 | Blueprints | [PNG](screenshots/10-blueprints.png) | [THUMB](thumbnails/10-blueprints.png) |
| 11 | Interactions | [PNG](screenshots/11-interactions.png) | [THUMB](thumbnails/11-interactions.png) |
| 12 | Responsive | [PNG](screenshots/12-responsive.png) | [THUMB](thumbnails/12-responsive.png) |
| 13 | Accessibility | [PNG](screenshots/13-accessibility.png) | [THUMB](thumbnails/13-accessibility.png) |
| 14 | Relationships | [PNG](screenshots/14-relationships.png) | [THUMB](thumbnails/14-relationships.png) |
| 15 | Migration | [PNG](screenshots/15-migration.png) | [THUMB](thumbnails/15-migration.png) |
| 16 | Color Tokens | [PNG](screenshots/16-color-tokens.png) | [THUMB](thumbnails/16-color-tokens.png) |
| 17 | Typography | [PNG](screenshots/17-typography-tokens.png) | [THUMB](thumbnails/17-typography-tokens.png) |
| 18 | Spacing | [PNG](screenshots/18-spacing-tokens.png) | [THUMB](thumbnails/18-spacing-tokens.png) |
| 19 | Radius & Shadow | [PNG](screenshots/19-radius-shadow.png) | [THUMB](thumbnails/19-radius-shadow.png) |
| 20 | Layering & Z-Index | [PNG](screenshots/20-layering-zindex.png) | [THUMB](thumbnails/20-layering-zindex.png) |
| 21 | Spatial Grid | [PNG](screenshots/21-spatial-grid.png) | [THUMB](thumbnails/21-spatial-grid.png) |
| 22 | Spatial Runtime | [PNG](screenshots/22-spatial-runtime.png) | [THUMB](thumbnails/22-spatial-runtime.png) |

## Generation

Generated on 2026-06-25.

```bash
npm run design:screenshots
```

Requires Playwright. Install:

```bash
npm install --save-dev playwright
npx playwright install chromium
```

## Review Workflow

1. Open `00-index` in screenshots/ to see the full catalog
2. Browse individual PNGs for detailed visual review
3. Use thumbnails/ for quick scanning
4. Open contact-sheet/ for the full mosaic overview
5. Check index.json for machine-readable metadata
