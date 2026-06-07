import type { SheetResourceDef, RowValidationError } from './types'

function coerceValue(value: unknown, type: 'string' | 'number' | 'date' | 'boolean'): unknown {
  if (value === undefined || value === null || value === '') return undefined
  switch (type) {
    case 'number': {
      const n = Number(value)
      return Number.isFinite(n) ? n : undefined
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
    const rawValue = raw[col.key] ?? raw[col.label] ?? raw[col.key.toLowerCase()] ?? (col.label ? raw[col.label.toLowerCase()] : undefined)
    const coerced = coerceValue(rawValue, col.type)

    if (col.required && (coerced === undefined || coerced === null)) {
      errors.push({
        row: 0,
        field: col.key,
        message: `Missing required field "${col.label}"`,
      })
    }

    if (coerced !== undefined) {
      row[col.key] = coerced
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
