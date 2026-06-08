# Dividend Full History Import Workflow

## Overview

This workflow enables importing full Dime dividend history into Be Blank OS from a structured CSV file. The CSV is prepared by Jarvis B (manual or OCR-assisted extraction from Dime app screenshots) and committed to the repo at a stable path.

## Workflow

```
User provides Dime screenshots (28-page PDF)
  → Jarvis B extracts dividend events to CSV
  → CSV saved to data/dividends/DividendRecordsFullHistory_extracted.csv
  → Run build-time generator: node scripts/generate-dividend-full-history.mjs
  → Build app: npm run build
  → Full history available under "Full Dime History" filter in Dividends tab
```

## Files

| Path | Purpose |
|---|---|
| `data/dividends/DividendRecordsFullHistory_extracted.csv` | **Source of truth.** Jarvis B updates this file. |
| `scripts/generate-dividend-full-history.mjs` | Converts CSV to TypeScript module at build time. |
| `src/core/dividends/fullHistoryData.ts` | **Auto-generated.** Do not edit manually. Exports the parsed records. |
| `src/core/dividends/normalizeDividendImport.ts` | Normalization + deduplication utilities. |
| `src/core/dividends/loadDividendCsv.ts` | CSV parser for runtime import or script use. |
| `docs/google-sheet/templates/DividendRecordsFullHistory.csv` | Template showing expected columns. |

## CSV Schema

| Column | Type | Required | Description |
|---|---|---|---|
| id | string | auto | Generated during import |
| symbol | string | required | Ticker symbol (uppercase) |
| assetId | string | auto | Copied from symbol |
| payDate | string | required | ISO date YYYY-MM-DD |
| grossAmount | number | required | Gross dividend received (positive) |
| taxWithheld | number | optional | Withholding tax (positive; converted from negative in source) |
| netAmount | number | auto | grossAmount - taxWithheld if missing |
| currency | string | default USD | "USD" or "THB" |
| source | string | default | "Dime full history PDF" |
| sourceScope | string | auto | Set to "full-dime-history" |
| sourceDocument | string | auto | "Binder1(1).pdf" |
| sourcePage | number | recommended | Page number in source PDF |
| needsReview | boolean | default true | Marks row for manual review |
| reviewNote | string | optional | Reason for review |
| dedupeKey | string | auto | symbol + payDate + grossAmount + taxWithheld |
| isCurrentHolding | boolean | optional | Whether this ticker is currently held |
| status | string | auto | "received" |

## Deduplication

Records are deduplicated by `dedupeKey` = `symbol|payDate|grossAmount|taxWithheld`. Full history records never overwrite imported-ledger records; they coexist under separate `sourceScope` values.

## UI Display

| Filter | Shows | Purpose |
|---|---|---|
| Imported Ledger | 20 verified records | Current production numbers ($33.97) |
| Full Dime History | Extracted records | Needs review, rows may have `needsReview: true` |
| All | Combined | Both scopes merged |

## Rules

- No broker sync. No Dime API. No auto trading.
- Full history is imported as `sourceScope: full-dime-history`.
- Records with `needsReview: true` should be manually reviewed before being relied upon.
- The CSV is the single source of truth for extracted data.
- The generator script (`scripts/generate-dividend-full-history.mjs`) must be re-run after updating the CSV.
