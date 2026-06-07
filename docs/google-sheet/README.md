# Google Sheet CSV Templates

This folder contains CSV templates for bootstrapping the Be Blank OS Google Sheet bridge.

## How to Import into Google Sheets

1. Open your Google Sheet (`sheets.new` or existing)
2. For each tab:
   - Click **File → Import → Upload**
   - Select the CSV file
   - Choose **Replace current sheet** or **New sheet**
   - Click **Import**
3. Rename each tab to match the required name (see table below)

## Tab Mapping

| CSV File | Sheet Tab Name | Resource ID | Be Blank OS Field | Import Status |
|---|---|---|---|---|
| `StudioProjects.csv` | `StudioProjects` | `studio-projects` | `projects` | Enabled |
| `CapitalRecords.csv` | `CapitalRecords` | `capital-records` | `financeLedgerRows` | Enabled |
| `Holdings.csv` | `Holdings` | `investment-holdings` | `holdings` | Enabled |
| `AIContexts.csv` | `AIContexts` | `ai-context-logs` | `aiContexts` | Enabled |
| `AllocationBuckets.csv` | `AllocationBuckets` | `allocation-buckets` | *(no OsData field yet)* | Preview/export only |

## Notes

- **AllocationBuckets** is future-ready. The bridge shows it in preview/export mode only. Import is disabled until a dedicated OsData field is added.
- The `AllocationBuckets.csv` columns differ from the bridge's `allocation-buckets` resource definition (`id, name, targetPercent, toleranceBand` vs `id, bucket, targetPercent, currentPercent, posture`). Adjust the sheet columns to match when import is enabled.
- Example rows use zero quantities and placeholder values. Replace with real data before importing.
- After importing CSVs, deploy the Apps Script Web App. See `docs/GOOGLE_SHEET_PRODUCTION_BOOTSTRAP.md` for the full guide.
- The Apps Script bridge template that supports `?resource=<resourceId>` lives at `docs/google-sheet/AppsScriptWebApp.gs`.

## Related Documentation

- `docs/GOOGLE_SHEET_BRIDGE_SETUP.md` — Bridge configuration and safety rules
- `docs/GOOGLE_SHEET_PRODUCTION_BOOTSTRAP.md` — Full bootstrap guide with Apps Script code
