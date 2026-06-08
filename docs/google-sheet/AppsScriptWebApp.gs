/**
 * Google Sheet Bridge — Be Blank OS
 *
 * Deploy as Web App → Execute as: Me → Access: Anyone
 *
 * Supported GET examples:
 *   ?resource=studio-projects
 *   ?resource=approvals
 *   ?resource=capital-records
 *   ?resource=investment-holdings
 *   ?resource=dca-records
 *   ?resource=dividend-records
 *   ?resource=allocation-buckets
 *   ?resource=ai-context-logs
 *   ?resource=dividend-records-full-history
 */

const RESOURCE_MAP = {
  'studio-projects': { sheetName: 'StudioProjects', id: 'studio-projects' },
  approvals: { sheetName: 'Approvals', id: 'approvals' },
  'capital-records': { sheetName: 'CapitalRecords', id: 'capital-records' },
  'investment-holdings': { sheetName: 'Holdings', id: 'investment-holdings' },
  'dca-records': { sheetName: 'DCARecords', id: 'dca-records' },
  'dividend-records': { sheetName: 'DividendRecords', id: 'dividend-records' },
  'allocation-buckets': { sheetName: 'AllocationBuckets', id: 'allocation-buckets' },
  'ai-context-logs': { sheetName: 'AIContexts', id: 'ai-context-logs' },
  'dividend-records-full-history': { sheetName: 'DividendRecordsFullHistory', id: 'dividend-records-full-history' },
}

function doGet(e) {
  const resource = e && e.parameter ? e.parameter.resource : ''

  if (!resource) {
    return jsonResponse({
      ok: false,
      resource: '',
      rows: [],
      error: 'No resource parameter provided. Use ?resource=studio-projects',
      updatedAt: new Date().toISOString(),
    })
  }

  const config = RESOURCE_MAP[resource]
  if (!config) {
    return jsonResponse({
      ok: false,
      resource: resource,
      rows: [],
      error: 'Unknown resource: "' + resource + '". Valid resources: ' + Object.keys(RESOURCE_MAP).join(', '),
      updatedAt: new Date().toISOString(),
    })
  }

  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(config.sheetName)
  if (!sheet) {
    return jsonResponse({
      ok: false,
      resource: config.id,
      rows: [],
      error: 'Sheet tab "' + config.sheetName + '" not found.',
      updatedAt: new Date().toISOString(),
    })
  }

  const values = sheet.getDataRange().getValues()
  if (values.length === 0) {
    return jsonResponse({
      ok: true,
      resource: config.id,
      rows: [],
      updatedAt: new Date().toISOString(),
    })
  }

  const headers = values[0].map(String)
  const rows = values.slice(1).map(function (row) {
    const obj = {}
    headers.forEach(function (header, index) {
      obj[header] = row[index]
    })
    return obj
  })

  return jsonResponse({
    ok: true,
    resource: config.id,
    rows: rows,
    updatedAt: new Date().toISOString(),
  })
}

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents)
    const resource = data && data.resource ? data.resource : ''
    const row = data ? data.row : null

    if (!resource) {
      return jsonResponse({
        ok: false,
        resource: '',
        rows: [],
        error: 'No resource provided.',
        updatedAt: new Date().toISOString(),
      })
    }

    const config = RESOURCE_MAP[resource]
    if (!config) {
      return jsonResponse({
        ok: false,
        resource: resource,
        rows: [],
        error: 'Unknown resource: "' + resource + '". Valid resources: ' + Object.keys(RESOURCE_MAP).join(', '),
        updatedAt: new Date().toISOString(),
      })
    }

    if (!row || typeof row !== 'object') {
      return jsonResponse({
        ok: false,
        resource: config.id,
        rows: [],
        error: 'No row data provided.',
        updatedAt: new Date().toISOString(),
      })
    }

    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(config.sheetName)
    if (!sheet) {
      return jsonResponse({
        ok: false,
        resource: config.id,
        rows: [],
        error: 'Sheet tab "' + config.sheetName + '" not found.',
        updatedAt: new Date().toISOString(),
      })
    }

    const values = sheet.getDataRange().getValues()
    const headers = values.length > 0 ? values[0] : Object.keys(row)
    const newRow = headers.map(function (header) {
      return row[header] !== undefined ? row[header] : ''
    })

    if (values.length === 0) {
      sheet.appendRow(headers)
    }
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
      error: err && err.message ? err.message : 'Unknown error during write.',
      updatedAt: new Date().toISOString(),
    })
  }
}

function jsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON)
}
