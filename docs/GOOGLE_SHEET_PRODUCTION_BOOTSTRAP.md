# Google Sheet Production Bootstrap

## Overview

This guide covers the complete setup of a live Google Sheet bridge for Be Blank OS.

**Prerequisites:**
- A Google account (Google Workspace or personal)
- Access to Google Sheets and Google Apps Script
- Be Blank OS deployed (Vercel or local)

---

## 1. Sheet Schema Specification

### 1.1 StudioProjects Tab

**Tab name:** `StudioProjects`  
**Resource ID:** `studio-projects`  
**OsData field:** `projects`

| Column | Key | Type | Required | Example |
|---|---|---|---|---|
| ID | `id` | string | Yes | `karun-phuket` |
| Slug | `slug` | string | Yes | `karun-phuket-old-town` |
| Name | `name` | string | Yes | `Karun Phuket Old Town` |
| Status | `status` | string | Yes | `active` |
| Owner | `owner` | string | Yes | `Studio` |
| Client | `client` | string | No | `Karun Hospitality` |
| Location | `location` | string | No | `Phuket` |
| Phase | `phase` | string | No | `site-handoff` |

**Example row:**

| id | slug | name | status | owner | client | location | phase |
|---|---|---|---|---|---|---|---|
| `karun-phuket` | `karun-phuket-old-town` | Karun Phuket Old Town | active | Studio | Karun Hospitality | Phuket | site-handoff |
| `blank-studio` | `blank-studio-hq` | Be Blank Studio HQ | active | Studio | Internal | Bangkok | operations |

---

### 1.2 CapitalRecords Tab

**Tab name:** `CapitalRecords`  
**Resource ID:** `capital-records`  
**OsData field:** `financeLedgerRows`

| Column | Key | Type | Required | Example |
|---|---|---|---|---|
| ID | `id` | string | Yes | `c1` |
| Label | `label` | string | Yes | `Sample Income` |
| Amount THB | `amountTHB` | number | Yes | `50000` |
| Direction | `direction` | string | Yes | `inflow` |
| Category | `category` | string | Yes | `studio-income` |
| Date | `occurredAt` | date | Yes | `2026-06-01` |
| Status | `status` | string | No | `cleared` |

**Example row:**

| id | label | amountTHB | direction | category | occurredAt | status |
|---|---|---|---|---|---|---|
| `c1` | Sample Income | 50000 | inflow | studio-income | 2026-06-01 | cleared |
| `c2` | Office Rent | 15000 | outflow | studio-expense | 2026-06-01 | pending |

---

### 1.3 Holdings Tab

**Tab name:** `Holdings`  
**Resource ID:** `investment-holdings`  
**OsData field:** `holdings`

| Column | Key | Type | Required | Example |
|---|---|---|---|---|
| ID | `id` | string | Yes | `h1` |
| Asset ID | `assetId` | string | Yes | `a1` |
| Quantity | `quantity` | number | Yes | `100` |
| Avg Cost | `averageCost` | number | Yes | `150` |
| Allocation % | `allocationPercent` | number | No | `25` |

**Example row:**

| id | assetId | quantity | averageCost | allocationPercent |
|---|---|---|---|---|
| `h1` | `a1` | 100 | 150 | 25 |
| `h2` | `a2` | 50 | 200 | 15 |

---

### 1.4 AIContexts Tab

**Tab name:** `AIContexts`  
**Resource ID:** `ai-context-logs`  
**OsData field:** `aiContexts`

| Column | Key | Type | Required | Example |
|---|---|---|---|---|
| ID | `id` | string | Yes | `ctx1` |
| Module | `module` | string | Yes | `studio` |
| Title | `title` | string | Yes | `Weekly Briefing` |
| Body | `body` | string | No | `Context body placeholder` |
| Created | `createdAt` | date | Yes | `2026-06-06` |

**Example row:**

| id | module | title | body | createdAt |
|---|---|---|---|---|
| `ctx1` | studio | Weekly Briefing | Context body placeholder | 2026-06-06 |
| `ctx2` | finance | Monthly Report | Monthly financial summary | 2026-06-01 |

---

### 1.5 AllocationBuckets Tab (Future-Ready)

**Tab name:** `AllocationBuckets`  
**Resource ID:** `allocation-buckets`  
**OsData field:** (not yet in OsData — preview/export only)

| Column | Key | Type | Required | Example |
|---|---|---|---|---|
| ID | `id` | string | Yes | `b1` |
| Bucket | `bucket` | string | Yes | `Core Equity` |
| Target % | `targetPercent` | number | Yes | `50` |
| Current % | `currentPercent` | number | Yes | `45` |
| Posture | `posture` | string | No | `core` |

**Note:** This tab can be populated now for future use. Import is not yet enabled in the bridge — preview/export only.

---

## 2. Apps Script Specification

### 2.1 Resource Routes

The Apps Script Web App accepts a query parameter `resource` to specify which sheet tab to return:

| URL | Returns |
|---|---|
| `?resource=studio-projects` | StudioProjects tab rows |
| `?resource=capital-records` | CapitalRecords tab rows |
| `?resource=investment-holdings` | Holdings tab rows |
| `?resource=ai-context-logs` | AIContexts tab rows |
| `?resource=allocation-buckets` | AllocationBuckets tab rows (preview/export only) |

If no `resource` parameter is provided, the endpoint should return the first resource or error.

### 2.2 Response Contract

Every endpoint response must match this shape:

```json
{
  "ok": true,
  "resource": "studio-projects",
  "rows": [
    {
      "id": "karun-phuket",
      "slug": "karun-phuket-old-town",
      "name": "Karun Phuket Old Town",
      "status": "active",
      "owner": "Studio",
      "client": "Karun Hospitality",
      "location": "Phuket",
      "phase": "site-handoff"
    }
  ],
  "updatedAt": "2026-06-06T00:00:00.000Z"
}
```

**Error response:**

```json
{
  "ok": false,
  "resource": "studio-projects",
  "rows": [],
  "error": "Sheet tab 'StudioProjects' not found."
}
```

### 2.3 Apps Script Source Code

Create a new Apps Script project attached to your Google Sheet and paste the following code:

```javascript
/**
 * Google Sheet Bridge — Be Blank OS
 * 
 * Deploy as Web App → Execute as: Me → Access: Anyone
 * 
 * GET ?resource=studio-projects
 * GET ?resource=capital-records
 * GET ?resource=investment-holdings
 * GET ?resource=ai-context-logs
 * GET ?resource=allocation-buckets
 */

const RESOURCE_MAP = {
  'studio-projects': { sheetName: 'StudioProjects', id: 'studio-projects' },
  'capital-records': { sheetName: 'CapitalRecords', id: 'capital-records' },
  'investment-holdings': { sheetName: 'Holdings', id: 'investment-holdings' },
  'ai-context-logs': { sheetName: 'AIContexts', id: 'ai-context-logs' },
  'allocation-buckets': { sheetName: 'AllocationBuckets', id: 'allocation-buckets' },
}

function doGet(e) {
  const resource = e?.parameter?.resource
  
  if (!resource || !RESOURCE_MAP[resource]) {
    return jsonResponse({
      ok: false,
      resource: resource || '',
      rows: [],
      error: resource
        ? `Unknown resource: "${resource}". Valid resources: ${Object.keys(RESOURCE_MAP).join(', ')}`
        : 'No resource parameter provided. Use ?resource=studio-projects',
    })
  }

  const config = RESOURCE_MAP[resource]
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(config.sheetName)

  if (!sheet) {
    return jsonResponse({
      ok: false,
      resource: config.id,
      rows: [],
      error: `Sheet tab "${config.sheetName}" not found.`,
    })
  }

  const range = sheet.getDataRange()
  const values = range.getValues()
  
  if (values.length < 2) {
    return jsonResponse({
      ok: true,
      resource: config.id,
      rows: [],
      updatedAt: new Date().toISOString(),
    })
  }

  const headers = values[0].map(String)
  const rows = values.slice(1).map(row => {
    const obj = {}
    headers.forEach((header, i) => {
      obj[header] = row[i]
    })
    return obj
  })

  return jsonResponse({
    ok: true,
    resource: config.id,
    rows,
    updatedAt: new Date().toISOString(),
  })
}

/**
 * POST handler — write a single row to the sheet.
 * 
 * Body: { "resource": "studio-projects", "row": { ... } }
 * 
 * Appends the row to the matching sheet tab.
 */
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents)
    const resource = data?.resource
    const row = data?.row

    if (!resource || !RESOURCE_MAP[resource]) {
      return jsonResponse({
        ok: false,
        resource: resource || '',
        rows: [],
        error: resource
          ? `Unknown resource: "${resource}". Valid resources: ${Object.keys(RESOURCE_MAP).join(', ')}`
          : 'No resource provided.',
      })
    }

    if (!row || typeof row !== 'object') {
      return jsonResponse({
        ok: false,
        resource,
        rows: [],
        error: 'No row data provided.',
      })
    }

    const config = RESOURCE_MAP[resource]
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(config.sheetName)

    if (!sheet) {
      return jsonResponse({
        ok: false,
        resource: config.id,
        rows: [],
        error: `Sheet tab "${config.sheetName}" not found.`,
      })
    }

    const headers = sheet.getDataRange().getValues()[0] || []
    const newRow = headers.map((header) => row[header] ?? '')
    sheet.appendRow(newRow)

    return jsonResponse({
      ok: true,
      resource: config.id,
      rows: [row],
      updatedAt: new Date().toISOString(),
    })
  } catch (err) {
    return jsonResponse({
      ok: false,
      resource: '',
      rows: [],
      error: err.message || 'Unknown error during write.',
    })
  }
}

function jsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON)
}
```

### 2.4 Apps Script Tests

After deploying, verify each endpoint returns the expected shape. Example test URLs:

```
https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec?resource=studio-projects
https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec?resource=capital-records
https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec?resource=investment-holdings
https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec?resource=ai-context-logs
```

Each should return `{ "ok": true, "resource": "...", "rows": [...] }`.

---

## 3. Bootstrap Guide

### Step 1: Create the Google Sheet

1. Go to [sheets.new](https://sheets.new)
2. Rename the sheet to `Be Blank OS Bridge`
3. Create the following tabs by clicking **+** at the bottom:
   - `StudioProjects`
   - `CapitalRecords`
   - `Holdings`
   - `AIContexts`
   - `AllocationBuckets` (optional, for future use)

### Step 2: Add Headers and Sample Data

For each tab, add the header row and at least one sample row. See Section 1 above for column definitions per tab.

### Step 3: Open Apps Script Editor

1. In the sheet, click **Extensions → Apps Script**
2. Rename the project to `Be Blank OS Bridge`
3. Delete any default code in `Code.gs`
4. Paste the Apps Script code from Section 2.3 above
5. Click **Save** (💾 icon or `Ctrl+S`)

### Step 4: Deploy the Web App

1. Click **Deploy → New deployment**
2. Select type: **Web app**
3. Configure:
   - **Description:** `Be Blank OS Bridge v1`
   - **Execute as:** `Me` (your Google account)
   - **Who has access:** `Anyone` (required for the bridge to fetch without authentication)
4. Click **Deploy**
5. Review the permissions dialog and click **Authorize**
6. Copy the **Web App URL** (looks like `https://script.google.com/macros/s/.../exec`)

### Step 5: Configure Permissions

The Web App is deployed as **Me** (your account) and accessible by **Anyone**. This means:
- The sheet data is protected by your Google account
- Anyone with the Web App URL can fetch the data (read-only)
- No authentication is required for the bridge HTTP requests
- The endpoint URL should be kept private (not committed to git)

### Step 6: Add to Environment

**Option A: Local development (`.env.local`)**

```bash
# .env.local (gitignored — never commit)
VITE_APPS_SCRIPT_KARUN_ENDPOINT=https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec
```

**Option B: Vercel deployment**

1. Go to your Vercel project → **Settings** → **Environment Variables**
2. Add:
   - **Name:** `VITE_APPS_SCRIPT_KARUN_ENDPOINT`
   - **Value:** `https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec`
   - **Environments:** Production, Preview, Development
3. Redeploy

**Option C: Manual entry in bridge UI**

1. Open `/os/bridge` in Be Blank OS
2. Paste the Web App URL into the **Apps Script Endpoint** field
3. The URL is stored in browser localStorage only

### Step 7: Test the Bridge

1. Open `/os/bridge`
2. Click **Test Connection** — verify you see a green "Connected" status
3. For each resource tab, click **Simulate Import** to verify preview works
4. Then click **Fetch from Endpoint** to verify live data loads
5. Review the preview and confirm import
6. Verify backup appears in the Backups section
7. Verify restore works

---

## 4. Validation Checklist

Use this checklist to verify the bridge is fully operational.

### 4.1 Endpoint Reachable

- [ ] Test Connection shows green "Connected" status
- [ ] Status indicator shows last successful test timestamp
- [ ] Error cases return clear messages (invalid URL, network error, etc.)

### 4.2 Response Valid

- [ ] Each resource URL returns `{ "ok": true, "resource": "...", "rows": [...] }`
- [ ] Rows array contains the expected number of rows from the sheet
- [ ] Row objects have keys matching the header columns
- [ ] Empty tabs return `{ "ok": true, "resource": "...", "rows": [] }` (not an error)

### 4.3 Import Preview Works

- [ ] Click **Fetch from Endpoint** on a resource card
- [ ] Preview panel shows: valid count, invalid count, row table
- [ ] Data matches sheet contents
- [ ] Errors are shown clearly if validation fails

### 4.4 Backup Works

- [ ] Confirm an import
- [ ] Navigate to Backups section
- [ ] Verify backup appears with correct timestamp, row count, and reason
- [ ] Delete backup works

### 4.5 Merge Works

- [ ] Import the same data twice with same IDs
- [ ] Verify the second import shows `0 rows appended, N rows updated`
- [ ] Import new data with different IDs
- [ ] Verify the import shows `N rows appended, 0 rows updated`
- [ ] Existing rows not in the import are preserved

### 4.6 Restore Works

- [ ] Click **Restore** on a backup
- [ ] Confirm the restore dialog
- [ ] Verify data is restored to the backed-up state
- [ ] Click **Cancel** to verify the restore is not automatic

### 4.7 Read-Only Mode

- [ ] Switch sync mode to Read-only
- [ ] Verify Fetch from Endpoint still shows preview
- [ ] Verify Import button is hidden and amber notice appears
- [ ] Switch back to Manual — verify import works again

### 4.8 Safety Rules

- [ ] Backup failure blocks import (simulate by clearing localStorage or exceeding quota)
- [ ] Allocation Buckets resource shows "Preview / Export Only" badge
- [ ] Import button disabled when validCount is 0
- [ ] No autosync — every action is user-initiated

---

## Quick Reference

```
Google Sheet:        Be Blank OS Bridge
Tabs:                StudioProjects, CapitalRecords, Holdings, AIContexts, AllocationBuckets
Apps Script:         Extensions → Apps Script → Code.gs (paste from Section 2.3)
Deploy:              Deploy → New deployment → Web app
Execute as:          Me
Access:              Anyone
Endpoint URL:        https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec
Env var:             VITE_APPS_SCRIPT_KARUN_ENDPOINT
Bridge UI:           /os/bridge
```

**Never commit the endpoint URL to git. Use `.env.local` or manual entry.**
