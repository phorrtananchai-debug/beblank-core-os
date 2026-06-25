# Migration From Old Codex Repo

## Overview

The BBH Core OS project had two repos. This document summarizes the consolidation.

## Old Repo (Archive Only)

- **Path:** `C:\Users\UsEr\Documents\BE BLANK OS Production Audit`
- **Role:** Previous working directory used during early Codex agent sessions
- **Status:** Frozen. Do not use for new work.

## Canonical Repo (Current)

- **Path:** `C:\Users\UsEr\Documents\Codex\beblank-core-os`
- **Role:** Single source of truth for all BBH Core OS development
- **Remote:** `https://github.com/phorrtananchai-debug/beblank-core-os.git`
- **Branch:** `main`

## Why DeepSeek Is Canonical

1. **Ahead by 10+ commits** — includes Design System registry, engine, JSON export, Spatial Grid Language, Visual Review Artifact System
2. **Complete infrastructure** — `src/design-system/`, `artifacts/design-review/`, `artifacts/design-system/json/`, `scripts/` with 7 automation scripts
3. **Production pages intact** — Command Center, Studio, Investments, Bridge, Capital, AI Workspace — all present and building
4. **Build/Lint passing** — 0 errors
5. **Pushed to remote** — 0 commits ahead of `origin/main`

## Files Reviewed During Migration

| File | Old Repo | Canonical Repo | Action |
|---|---|---|---|
| `DESIGN.md` | Exists | Copied to `docs/DESIGN.md` | Migrated |
| `PRODUCT.md` | Exists | Copied to `docs/PRODUCT.md` | Migrated |
| `docs/design/BBH-Operating-Pattern-Library.md` | Exists | Copied | Migrated |
| `artifacts/` (UI audit) | Exists | Copied to `artifacts/ui-audit-from-old-codex/` | Migrated |
| `src/pages/os/InvestmentsV2Page.tsx` | Exists (untracked) | ❌ Not copied — broken imports, experimental only. Preserved in old repo. | Ignored |
| `src/components/investments/InvestmentWorkspace.tsx` | Exists (untracked) | ❌ Not copied — broken imports, experimental only. Preserved in old repo. | Ignored |

## Files Ignored

- `.impeccable/` — agent-specific configuration, not part of app source
- `.tmp-vite.err.log`, `.tmp-vite.log` — temporary build logs
- Old `artifacts/design-system-server.*.log` — server logs from previous sessions
- Old `artifacts/studio-*.png` — individual studio screenshots (review pack supersedes these)

## Verification

After migration:
- `npm run build` — PASS
- `npm run lint` — PASS
- `git diff --check` — clean
