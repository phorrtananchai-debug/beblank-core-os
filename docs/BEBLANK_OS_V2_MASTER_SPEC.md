# Be Blank OS v2 — Master Product Spec

> Preserved product direction. For agent continuity across sessions.

---

## 1. Product Mission

Be Blank OS is a sheet-first operating surface for the studio. It replaces scattered spreadsheets, chat logs, and mental tracking with a unified OS that keeps the owner (Por) in control without ERP overhead.

**Key principles:**
- Manual CRUD before real APIs
- Local-first before cloud sync
- Approval workflow for every mutation
- No broker execution, no auto-trading, no LLM auto-decisions

---

## 2. Core Modules

| Module | Route | Purpose |
|---|---|---|
| Command Center | `/os` | Daily dashboard, pending items, system status |
| Studio | `/os/studio/*` | Project management, timeline, documents, art, reviews |
| Capital | `/os/capital` | Cash flow, reserves, bills, ledger (replaces "Family Office") |
| Investments | `/os/finance/investments` | Portfolio, allocation, DCA, dividends, watchlist, sandbox |
| Trading Lab | `/os/finance/trading-lab` | Paper trades, signals, strategy notes |
| AI Workflow | `/os/ai/*` | Jarvis B — digests, observations, memory, exports |
| Settings | `/os/settings` | Connector registry, credentials, sync queue |

---

## 3. Navigation Architecture

```
OSLayout (sidebar)
├── Command Center     /os
├── Studio Work        /os/studio
├── Finance            /os/finance
├── Investments        /os/finance/investments
├── Capital            /os/capital
├── Trading Lab        /os/finance/trading-lab
├── AI Workflow        /os/ai
└── Settings           /os/settings
```

Every OS page follows this grid:
- Main content column (flexible width)
- Intelligence rail (360px fixed) — PendingApprovalPanel + ModuleAISummaryPanel
- Bottom row — AIContextExportPanel + AISuggestionImportPanel
- Bottom row — ChangeLogList + SnapshotLog

---

## 4. UX Language Rule

- **Headings, navigation labels, data column headers:** English
- **Everything else (helper text, empty states, explanations, detail copy, error messages):** Thai
- Empty states must include: ghost illustration or dashed border, Thai text, CTA button
- Desktop-first responsive. Tab bars at top of sub-pages.

---

## 5. Approval Workflow Rule

No mutation happens directly. Every write goes through:

1. `createActionRequest()` — queues an `ActionRequest`
2. User reviews in `PendingApprovalPanel`
3. `approveActionRequest()` — triggers `mockSheetWriteAdapter` handler
4. Handler updates `OsData` in memory and logs to ChangeLog + Snapshot
5. Future: real Google Sheets write-back

This pattern applies to every add, edit, delete, and status change across all modules.

---

## 6. Studio Project Detail Spec Summary

Per-project drill-down at `/os/studio/projects/:id` with 9 nested tabs:

| Tab | Data Source | CRUD |
|---|---|---|
| Timeline | `studioTimelinePhases` filtered by projectId | Phase add/edit/drag |
| Documents | `documents` filtered by projectId | Issue/View |
| Site Watch | `siteWatchUpdates` filtered by projectId | Add/Edit/Delete |
| WorkScope | `workScopeSections` filtered by projectId | Add/Edit/Delete |
| Artwork | `artworkRecords` filtered by projectId | Gallery + lightbox |
| Briefs | `creativeBriefs` filtered by projectId | AI draft button |
| Reviews | `studioReviews` filtered by projectId | Approve/Reject |
| Notes | localStorage (no approval) | Add/Edit/Delete |
| Project Control | Status/phase change, danger zone | ActionRequest |

Current status: `StudioWorkspacePage.tsx` (1070 lines) is monolithic with flat view modes. Per-project detail pages not yet built.

---

## 7. Capital Spec Summary

3-tab layout at `/os/capital`:

| Tab | Content |
|---|---|
| Overview | CashFlowBar, RunwayGauge, ReserveHealth bars, Pending Items, Obligations |
| Studio Office | Studio-scoped ledger rows (ฟิลเตอร์เฉพาะหมวด studio-) |
| Family | Reserve buckets, obligations, full ledger, snapshot summaries |

Full LedgerTable with add/edit/delete CRUD comes in Phase 1 PR 2.
Bills tab, Reserves tab, Reports tab come in Phase 2.

Current status: 3-tab container exists. Overview tab built. Studio Office tab shows basic list. Family tab uses `<FamilyPage />` component (extracted from old `FamilyOfficePage`). Backward compat via `/os/finance/family-office`.

---

## 8. Investments Spec Summary

10-tab layout at `/os/finance/investments` (tab nav not yet built):

| Tab | Status |
|---|---|
| Dashboard | Not built |
| Holdings | Exists in monolith (no tab isolation) |
| Allocation | Not built (Aequitas donut pending) |
| Performance | Not built (chart pending) |
| Dividends | Exists as inline panel |
| DCA | Exists as inline panel |
| Rebalance | Not built |
| Transactions | Not built |
| Watchlist | Not built |
| Sandbox | Not built |

Current status: 628-line monolith. Must be split into tab components. Add Asset modal (2-step) already exists inline.

---

## 9. Data Ownership Rules

| Entity | Source of Truth | Write Path | Approval |
|---|---|---|---|
| FinanceLedgerRow | Manual | ActionRequest → mock adapter | Required |
| ReserveRow | Manual | ActionRequest → mock adapter | Required |
| FamilyFinanceRecord | Manual | ActionRequest → mock adapter | Required |
| Holding | Manual | ActionRequest → mock adapter | Required |
| Asset/FinanceAsset | Manual | ActionRequest → mock adapter | Required |
| DcaRecord | Manual | ActionRequest → mock adapter | Required |
| DividendRecord | Manual | ActionRequest → mock adapter | Required |
| ThaiNavAsset | Manual/Sheet helper | ActionRequest → mock adapter | Required |
| SiteWatchUpdate | Manual | ActionRequest → mock adapter | Required |
| Studio Notes | LocalStorage | Direct write | Not required |
| Watchlist | LocalStorage | Direct write | Not required |

Finnhub is helper-only for US assets. Never overwrites units, avg cost, allocation, manual notes, or Thai NAV rows.

---

## 10. Current Build Status

- Phase 1 PR 1 complete ✅
- Capital route exists at `/os/capital`
- FamilyOfficePage remains backward compatible at `/os/finance/family-office`
- Typecheck and build pass (`tsc -b && vite build`)
- Working tree clean, 1 commit ahead of `origin/main`

**Next up:** Phase 1 PR 2 — Capital Ledger with full CRUD (LedgerTable, AddLedgerRowSheet, EditLedgerRowDrawer, mock adapter action types).
