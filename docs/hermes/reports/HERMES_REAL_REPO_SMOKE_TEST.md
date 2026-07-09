# Hermes Real Repo Smoke Test — BeBlank Core OS

**Date:** 2026-07-09
**Hermes Version:** v0.18.2
**Provider/Model:** Ollama qwen3:14b (local)
**Branch:** chore/hermes-smoke-test
**Base branch:** main

---

## 1. Repo Summary

| Field | Value |
|---|---|
| **Name** | BeBlank Core OS (BE BLANK OS Production Audit) |
| **Remote** | https://github.com/phorrtananchai-debug/beblank-core-os.git |
| **Framework** | React 18 + TypeScript + Vite |
| **Styling** | Tailwind CSS |
| **Routing** | react-router-dom v6 |
| **Build** | `npm run dev` (vite), `npm run build` (tsc -b && vite build) |
| **Lint** | ESLint |

### Top-level structure:
```
artifacts/        — Design assets, screenshots, QA reports
data/             — Static data files
dist/             — Build output
docs/             — Documentation
public/           — Static public assets
scripts/          — Build/utility scripts
src/              — Application source
  app/            — App-level config (Firebase, etc.)
  components/     — UI components
  core/           — Business logic, models
  data/           — Data layer
  design/         — Design system tokens
  hooks/          — React hooks
  layouts/        — Layout wrappers (OSLayout, PublicWebsiteLayout)
  pages/          — Page components (public/ and os/ subdirs)
  routes/         — Route definitions (index.tsx)
  types/          — TypeScript type definitions
```

---

## 2. Existing Route Summary

### Public routes (PublicWebsiteLayout):
- `/` — HomePage
- `/projects` — ProjectsPage
- `/projects/:slug` — ProjectDetailPage
- `/work` — ProjectsPage (alias)
- `/journal` — JournalPage
- `/services` — ServicesPage
- `/careers` — CareersPage
- `/about` — AboutPage
- `/contact` — ContactPage
- `/login` — LoginPage

### OS routes (ProtectedRoute + OSLayout):
- `/os` — CommandCenterPage (index)
- `/os/studio` — StudioWorkspacePage
- `/os/studio/mobile` — StudioMobilePage
- `/os/studio/projects/:projectId` — StudioProjectDetailPage
- `/os/studio/projects` — StudioWorkspacePage
- `/os/studio/timeline` — StudioWorkspacePage
- `/os/studio/site-watch` — StudioWorkspacePage
- `/os/studio/documents` — StudioWorkspacePage
- `/os/studio/artwork` — StudioWorkspacePage
- `/os/studio/briefs` — StudioWorkspacePage
- `/os/studio/reviews` — StudioWorkspacePage
- `/os/finance` — FinancePage
- `/os/finance/investments` — InvestmentsPage
- `/os/finance/investments/dividend-history` — DividendHistoryPage
- `/os/capital` — CapitalPage
- `/os/finance/family-office` — FamilyOfficePage
- `/os/finance/trading-lab` — TradingLabPage
- `/os/ai` — AIWorkflowPage
- `/os/ai/context` — AIWorkflowPage
- `/os/ai/reviews` — AIWorkflowPage
- `/os/ai/memory` — AIWorkflowPage
- `/os/ai/exports` — AIWorkflowPage
- `/os/ai/imports` — AIWorkflowPage
- `/os/ai-workflow` — AIWorkflowPage
- `/os/settings` — SettingsPage
- `/os/bridge` — BridgeSettingsPage
- `/os/design-system` — DesignSystemPage

---

## 3. Does `/os/jarvis` Exist?

**No.** There is no `/os/jarvis` route in `src/routes/index.tsx`.

However, a `JarvisDashboardPage` component exists at `src/pages/os/JarvisDashboardPage.tsx` (untracked, from prior Jarvis scaffold work) but it is **not wired into the router**. The backup branch `backup/pre-hermes-smoke-jarvis-scaffold` preserves this work.

---

## 4. Package/Build Commands

| Command | Script |
|---|---|
| `npm run dev` | `vite` |
| `npm run build` | `tsc -b && vite build` |
| `npm run lint` | `eslint .` |
| `npm run preview` | `vite preview` |

No test framework is configured.

---

## 5. Suggested Hermes/Jarvis Integration Points

The following integration points should be restricted to `docs/` and non-production scaffolding:

| Path | Purpose |
|---|---|
| `docs/hermes/` | Hermes orchestration plans, runbooks, agent configurations |
| `docs/jarvis/` | Jarvis agent specs, task definitions, state files |
| `scripts/hermes*.mjs` | Hermes runner scripts (already has `scripts/jarvis-runner.mjs`) |
| `.hermes/` | Hermes agent config (sandbox only, not in repo) |

---

## 6. Risks Identified

| Risk | Severity | Notes |
|---|---|---|
| **Route collision** | Low | JarvisDashboardPage exists as component but no route — must add carefully |
| **Production scope** | High | Hermes must never modify `src/finance/`, `src/trading/`, `src/creator/`, `src/auth/` |
| **Build safety** | Medium | No test suite exists — build breaks won't be caught by tests |
| **Firebase integration** | High | Auth/config files must never be touched |
| **Uncommitted work** | Medium | Previous Jarvis scaffold work (backup branch) must be reviewed before any new work |

---

## 7. Recommended Phase 6

**Phase 6 — Read-Only Orchestration Planning**

Before any code changes:
1. Add `/os/jarvis` route to `src/routes/index.tsx` (import + Route element)
2. Wire JarvisDashboardPage into OSLayout
3. Create `docs/hermes/` directory with orchestration plans
4. Define Hermes agent boundaries (allowed paths, blocked paths)
5. Add a `docs/hermes/SCOPE.md` file listing exactly what Hermes may and may not touch

---

## 8. What Hermes Would Do Next If Approved

If Phase 6 is approved, Hermes would:
1. Read `docs/hermes/SCOPE.md` to learn allowed boundaries
2. Switch from `chore/hermes-smoke-test` to a feature branch
3. Add the `/os/jarvis` route import in `src/routes/index.tsx`
4. Create a `JarvisDashboardPage` placeholder or wire the existing component
5. Run `npm run build` to verify no compilation errors
6. Update `docs/hermes/` with completed work log
7. Present diff for human review before any merge

---

## 9. No Production Logic Changed

**Explicit statement:** No production logic was changed during this test. No `src/` files, `package.json`, lock files, `.env` files, routes, finance, trading, creator, or auth files were created, modified, or deleted. The only file created is this report: `docs/HERMES_REAL_REPO_SMOKE_TEST.md`.
