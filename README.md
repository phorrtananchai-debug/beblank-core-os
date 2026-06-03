# Be Blank Core OS (PR #1)

Greenfield rebuild for **Be Blank Core OS** using React + Vite + Tailwind.

## Vision
- Google Sheets are the future operational database / source of truth.
- Apps Script will become the read/write API, alert engine, and automation bridge.
- The OS is the visual control surface.
- Jarvis B / AI is the reasoning and summarization layer.
- AI workflow is manual-first in this phase.
- Hermes / OpenClaw / MCP are future agent layers.

## Current Scope (No Real Integrations)
This PR intentionally uses mock-only abstractions:
- No real Google Sheets connection.
- No real Apps Script API.
- No real Gmail, LINE, Calendar, or broker API calls.
- No auto email sending, auto LINE replies, auto trading, or broker execution.

## Core Write Architecture
All mutations are modeled as a two-way sync pipeline:

`UI Action -> ActionRequest -> Validate -> Mock SheetWriteAdapter -> ChangeLogRecord -> SnapshotRecord -> Refresh OS`

Rules implemented in PR #1:
- Do not write business data directly from UI controls.
- Queue edits as `ActionRequest` and require manual approval.
- Approved requests go through the mock adapter.
- Every approved edit creates a `ChangeLogRecord`.
- Every approved apply creates a `SnapshotRecord`.

## Routes
### Public
- `/`
- `/projects`
- `/projects/:slug`
- `/about`
- `/contact`
- `/login`

### Private (mock-protected)
- `/os`
- `/os/studio`
- `/os/finance`
- `/os/finance/investments`
- `/os/finance/family-office`
- `/os/finance/trading-lab`
- `/os/ai-workflow`
- `/os/settings`

## Modules Included
- Command Center
- Studio Work
- Finance (Investments, Family Office, Trading Lab)
- AI Workflow (global and module-level panels)
- Settings

## Required Shared Components Included
- `SourceStatusBadge`
- `PendingApprovalPanel`
- `SnapshotLog`
- `ChangeLogList`
- `AIContextExportPanel`
- `AISuggestionImportPanel`
- `ModuleAISummaryPanel`
- `MockSheetSyncStatus`

## Domain Models Included
- `SourceStatus`
- `ActionRequest`
- `ChangeLogRecord`
- `SnapshotRecord`
- `AIContext`
- `AISuggestion`
- `Project`
- `Task`
- `TimelineItem`
- `DocumentRecord`
- `SiteIssue`
- `FinanceAsset`
- `Holding`
- `ThaiNavAsset`
- `TransactionRecord`
- `FamilyFinanceRecord`
- `TradingSignal`
- `TradingStrategyNote`

## UI Direction
- Public site is front-of-house and intentionally not a dashboard.
- Private OS follows Stitch-inspired Be Blank design cues:
  - floating ivory sidebar
  - warm ivory workspace
  - deep graphite typography
  - subtle orange accents
  - large soft radii and calm panel system

## Run
```bash
npm install
npm run dev
```

## Build
```bash
npm run build
```

## Mock Drain Strategy
- Mock data is no longer owned by individual pages or UI components.
- Domain providers now control source mode for Studio, Finance, AI, and Connectors.
- Supported provider modes are `mock`, `live`, `fallback`, and `empty`.
- Pages render through provider-fed OS state and include empty states for future live-source outages.
- Live adapters can replace mock adapters later without changing page ownership.
- Apps Script read/write bridge, Finnhub manual refresh, and Google Sheet row contracts are scaffolded for future implementation.
- Do not destructively remove mock data until live Sheet/App Script/Finnhub sources are stable.
- All writes must still pass through `ActionRequest -> Approval -> Adapter/Bridge -> ChangeLog -> Snapshot`.

## Apps Script Read Bridge v1
- PR #11 introduces the first read-only Apps Script bridge scaffold for the Karun Phuket workflow.
- Configure `VITE_APPS_SCRIPT_KARUN_ENDPOINT` in a local `.env` file to test a real Apps Script read endpoint.
- `.env.example` documents the key, but no endpoint values or credentials are committed.
- The app works when the env key is missing and shows the bridge as unconfigured/fallback instead of crashing.
- Manual refresh only: use `Refresh Karun Bridge` in Settings to request a read.
- No auto polling, hidden sync loops, write-back, or destructive actions are implemented.
- Bridge payloads are normalized into Studio project, timeline, WorkScope, site watch, document, and review rows when present.
- If the endpoint fails or returns malformed/partial data, the OS keeps mock fallback data and surfaces the error through provider/source status.
- Future write-back should reuse the existing approval-first flow before any Apps Script write adapter is enabled.

## Finnhub Manual Refresh v1
- PR #12 introduces the first Finnhub market data foundation for Finance / Investments.
- Configure `VITE_FINNHUB_API_KEY` in a local `.env` file only. `.env.example` documents the key, but no secrets are committed.
- The connector supports approved manual quote refresh for: VOO, SCHD, MSFT, GOOGL, AMZN, NVDA, AVGO, PLTR, MRVL, RBRK, ABBV, and JEPQ.
- If the key is missing, the Investments page shows Finnhub as unconfigured/fallback and keeps mock Sheet cache rows visible.
- If a request times out, fails, or returns malformed quote data, the provider falls back safely and surfaces `fallbackUsed`, stale state, and connector error details.
- The Investments page never fetches Finnhub directly. Manual refresh flows through `ActionRequest -> Approval -> Finance provider -> Finnhub connector -> ChangeLog -> Snapshot/SourceStatus`.
- This is read-only market data. There is no realtime stream, websocket, background polling, broker connection, auto buy/sell, or trading execution.

## Investments Manual Input + Thai NAV Foundation
- PR #12.1 clarifies the early Aequitas rule: manual portfolio input is the source of truth.
- Finnhub is helper/enrichment data for supported US assets only. It must not create holdings or overwrite units, average cost, allocation targets, or manual holding records.
- Thai NAV assets use manual NAV rows now and a future Google Sheet NAV bridge later. Thai funds, RMF, and local NAV assets do not use Finnhub.
- Adding a portfolio asset starts as a local draft/preview, then must pass through `ActionRequest -> Approval -> Mock SheetWriteAdapter -> ChangeLog -> Snapshot`.
- The current Thai NAV foundation includes `K-US500X-A(A)`, `K-US500XRMF`, and a Thai income/dividend placeholder.
- No write-back, realtime market data, broker execution, auto trading, credentials, or automatic holding creation are added.
