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
