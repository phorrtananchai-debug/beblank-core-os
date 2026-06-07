# Google Sheet Bridge Setup

## Overview

The Be Blank OS Sheet Bridge connects your local application state to a Google Sheet via an **Apps Script Web App** endpoint.

**Design principles:**
- Manual only — no autosync, no polling
- Preview before every import
- Backup before every import
- No silent overwrite — id-based merge preserves existing rows
- Read-only mode blocks imports at the hook level

---

## Required Sheet Tabs

The bridge expects a Google Sheet with one tab per resource. Each tab must have a header row matching the column definitions below.

| Tab / Resource | Sheet Tab Name | Expected Columns |
|---|---|---|
| Studio Projects | `projects` | `id`, `slug`, `name`, `status`, `owner`, `client`, `location`, `phase` |
| Capital Records | `capital` | `id`, `label`, `amountTHB`, `direction`, `category`, `occurredAt`, `status` |
| Investment Holdings | `holdings` | `id`, `assetId`, `quantity`, `averageCost`, `allocationPercent` |
| AI Context Logs | `ai-contexts` | `id`, `module`, `title`, `body`, `createdAt` |

Allocation Buckets tab is defined but **import is disabled** until a dedicated OsData field exists. Preview/export only.

---

## Apps Script Web App Endpoint

### Response Contract

Your Apps Script endpoint must return JSON with this shape:

```json
{
  "ok": true,
  "resource": "studio-projects",
  "rows": [
    {
      "id": "record-id",
      "slug": "example-slug",
      "name": "Example Name",
      "status": "active",
      "owner": "Por",
      "client": "Client A",
      "location": "Phuket",
      "phase": "design"
    }
  ],
  "updatedAt": "2026-06-06T00:00:00.000Z"
}
```

### Fields

| Field | Type | Required | Description |
|---|---|---|---|
| `ok` | boolean | Yes | Must be `true`. If `false`, the bridge shows the error message. |
| `resource` | string | Yes | Resource ID matching one of the defined tabs (e.g. `studio-projects`, `capital-records`). |
| `rows` | array | Yes | Array of row objects. Each row object should have keys matching the column definitions for the resource. |
| `updatedAt` | string (ISO) | No | Timestamp of the last data update. Displayed in the bridge UI. |
| `error` | string | No | Error message returned when `ok` is `false`. |

### Apps Script Example

```javascript
function doGet(e) {
  const resource = e && e.parameter ? e.parameter.resource : '';
  const config = RESOURCE_MAP[resource];

  if (!resource || !config) {
    return jsonResponse({
      ok: false,
      resource: resource || '',
      rows: [],
      error: !resource
        ? 'No resource parameter provided. Use ?resource=studio-projects'
        : 'Unknown resource: "' + resource + '"',
      updatedAt: new Date().toISOString(),
    });
  }

  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(config.sheetName);
  const values = sheet.getDataRange().getValues();
  const headers = values.length > 0 ? values[0].map(String) : [];
  const rows = values.slice(1).map((row) => {
    const obj = {};
    headers.forEach((header, i) => { obj[header] = row[i]; });
    return obj;
  });

  return jsonResponse({
    ok: true,
    resource: config.id,
    rows,
    updatedAt: new Date().toISOString(),
  });
}
```

Use `docs/google-sheet/AppsScriptWebApp.gs` as the full canonical Apps Script template. Supported resource IDs:
- `studio-projects`
- `approvals`
- `capital-records`
- `investment-holdings`
- `dca-records`
- `dividend-records`
- `allocation-buckets`
- `ai-context-logs`

---

## Local Environment Setup

### 1. Create `.env.local`

```bash
# .env.local (gitignored — never commit this file)
VITE_APPS_SCRIPT_KARUN_ENDPOINT=https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec
```

### 2. Verify Configuration

Open the bridge UI at `/os/bridge`. The environment section shows:
- **Configured** (green) — endpoint URL is set via environment variable
- **Missing** (amber) — no env var found, but you can paste a URL manually
- **Invalid** (red) — env var exists but is not a valid HTTPS URL

### 3. Test Connection

Click **Test Connection** in the Connection section. The bridge validates:
- Endpoint responds with HTTP 200
- Response body is valid JSON
- `ok` field is `true`
- `rows` is an array
- `resource` is a non-empty string

No data is imported during the test.

---

## Vercel Deployment

### Environment Variables

1. Go to your Vercel project dashboard → **Settings** → **Environment Variables**
2. Add:
   - **Name:** `VITE_APPS_SCRIPT_KARUN_ENDPOINT`
   - **Value:** Your Apps Script Web App URL
   - **Environments:** Production, Preview, Development
3. Redeploy your application

### Security Notes

- Never commit real endpoint URLs to the repository
- The `.env.local` file is gitignored by default
- Environment variables added in Vercel are encrypted at rest

---

## Manual Import Flow

1. **Navigate** to `/os/bridge`
2. **Configure** the endpoint URL (env var or manual entry)
3. **Test connection** to verify the endpoint is reachable
4. **Select a resource** tab (e.g. Studio Projects)
5. Click **Fetch from Endpoint** (if endpoint is configured) or **Simulate Import** (for mock data)
6. **Review the preview** — valid/invalid counts, row table, validation errors
7. **Confirm import** — backup is created, data is merged by id
8. **Review import result** — appended/updated/skipped counts

### Safeguards

- **Backup before import** — if localStorage backup fails, the import is cancelled
- **Read-only mode** — if sync mode is set to Read-only, import is blocked at both UI and hook level
- **Id-based merge** — existing rows not in the import are preserved; matching rows are updated; new rows are appended
- **No autosync** — every import is user-initiated

---

## Rollback / Restore

1. Open the **Backups** section at `/os/bridge`
2. Find the resource you want to restore
3. Click **Restore** — a confirmation prompt appears
4. Click **Confirm** to restore the last backup for that resource
5. The resource field is replaced with the backed-up data

To delete a backup, click **Delete**. No confirmation needed (deleting a backup does not change application data).

---

## Troubleshooting

| Symptom | Likely Cause | Solution |
|---|---|---|
| "No endpoint configured" | No URL entered | Enter the Apps Script URL or set `VITE_APPS_SCRIPT_KARUN_ENDPOINT` |
| "HTTP 401" | Endpoint requires auth | Deploy Apps Script as "Anyone" or configure access |
| "Response is not a valid JSON object" | Endpoint returns HTML/error | Check the Apps Script log for errors |
| "Response ok flag is false" | Apps Script returned `ok: false` | Check the `error` field in the response |
| "Response is missing rows array" | Apps Script response shape is wrong | Verify the response matches the contract |
| Import button disabled | Read-only mode active | Switch to Manual mode |
| "Backup failed" | localStorage quota exceeded | Clear old backups or reduce import size |
