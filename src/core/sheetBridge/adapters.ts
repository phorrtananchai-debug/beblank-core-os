import type { SheetResourceDef, RowValidationError } from './types'

function parseInlineMediaImageUrls(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean)
  }

  if (typeof value !== 'string') {
    return []
  }

  const raw = value.trim()
  if (!raw) {
    return []
  }

  if (raw.startsWith('[') && raw.endsWith(']')) {
    try {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) {
        return parsed.map((item) => String(item).trim()).filter(Boolean)
      }
    } catch {
      return []
    }
  }

  return raw.split(',').map((item) => item.trim()).filter(Boolean)
}

function parseSheetNumber(value: unknown): number | undefined {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : undefined
  }

  if (typeof value !== 'string') {
    return undefined
  }

  const normalized = value
    .replace(/THB/gi, '')
    .replace(/฿/g, '')
    .replace(/,/g, '')
    .trim()

  if (!normalized) {
    return undefined
  }

  const parsed = Number(normalized)
  return Number.isFinite(parsed) ? parsed : undefined
}

function coerceValue(value: unknown, type: 'string' | 'number' | 'date' | 'boolean'): unknown {
  if (value === undefined || value === null || value === '') return undefined
  switch (type) {
    case 'number': {
      return parseSheetNumber(value)
    }
    case 'date': {
      const d = new Date(String(value))
      return Number.isNaN(d.getTime()) ? undefined : d.toISOString()
    }
    case 'boolean': {
      if (typeof value === 'boolean') return value
      if (value === 'true' || value === '1') return true
      if (value === 'false' || value === '0') return false
      return undefined
    }
    default:
      return String(value)
  }
}

export function normalizeRow(
  raw: Record<string, unknown>,
  resource: SheetResourceDef,
): { row: Record<string, unknown>; errors: RowValidationError[] } {
  const row: Record<string, unknown> = {}
  const errors: RowValidationError[] = []

  for (const col of resource.columns) {
    const isDividendResource = resource.id === 'dividend-records' || resource.id === 'dividend-records-full-history'
    const dividendAliasValue = isDividendResource
      ? (
          col.key === 'symbol' ? (raw.assetId ?? raw['Asset ID']) :
          col.key === 'grossAmount' ? (raw.gross ?? raw['Gross']) :
          col.key === 'taxAmount' ? (raw.tax ?? raw.taxWithheld ?? raw['Tax']) :
          col.key === 'taxWithheld' ? (raw.tax ?? raw['Tax'] ?? raw.taxAmount ?? raw['Tax Amount']) :
          col.key === 'netAmount' ? (raw.net ?? raw['Net'] ?? raw.expectedAmountTHB ?? raw['Expected Amount THB']) :
          col.key === 'source' ? (raw.sourceLabel ?? raw['Source Label']) :
          col.key === 'note' ? (raw.note ?? raw.notes ?? raw['Notes']) :
          col.key === 'needsReview' ? (raw.needsReview ?? raw['Needs Review'] ?? raw.flag ?? raw['Flag']) :
          col.key === 'dedupeKey' ? (raw.dedupeKey ?? raw['Dedupe Key'] ?? raw.dedupKey ?? raw['Dedup Key']) :
          undefined
        )
      : undefined

    const rawValue = raw[col.key] ?? raw[col.label] ?? raw[col.key.toLowerCase()] ?? (col.label ? raw[col.label.toLowerCase()] : undefined) ?? dividendAliasValue
    const coerced = coerceValue(rawValue, col.type)

    if (col.required && (coerced === undefined || coerced === null)) {
      errors.push({
        row: 0,
        field: col.key,
        message: `Missing required field "${col.label}"`,
      })
    }

    if (coerced !== undefined) {
      row[col.key] = resource.id === 'studio-projects' && col.key === 'mediaImageUrls'
        ? parseInlineMediaImageUrls(coerced)
        : coerced
    }
  }

  if (resource.id === 'dividend-records') {
    if (typeof row.symbol === 'string' && !row.assetId) {
      row.assetId = row.symbol
    }

    if (row.note !== undefined && row.notes === undefined) {
      row.notes = row.note
    }

    if (row.expectedAmountTHB === undefined) {
      row.expectedAmountTHB = 0
    }
  }

  return { row, errors }
}

export function normalizeRows(
  rawRows: Record<string, unknown>[],
  resource: SheetResourceDef,
): { rows: Record<string, unknown>[]; errors: RowValidationError[] } {
  const rows: Record<string, unknown>[] = []
  const errors: RowValidationError[] = []

  rawRows.forEach((raw, index) => {
    const { row, errors: rowErrors } = normalizeRow(raw, resource)
    if (Object.keys(row).length > 0 && rowErrors.length === 0) {
      rows.push(row)
    }
    rowErrors.forEach((e) => {
      errors.push({ ...e, row: index + 1 })
    })
  })

  return { rows, errors }
}

export function validateRequired(raw: Record<string, unknown>, resource: SheetResourceDef): RowValidationError[] {
  const errors: RowValidationError[] = []
  for (const col of resource.columns) {
    if (col.required) {
      const rawValue = raw[col.key] ?? raw[col.label] ?? (col.label ? raw[col.label.toLowerCase()] : undefined)
      if (rawValue === undefined || rawValue === null || rawValue === '') {
        errors.push({ row: 0, field: col.key, message: `Missing required field "${col.label}"` })
      }
    }
  }
  return errors
}
