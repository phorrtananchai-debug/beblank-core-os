import type { DividendRecord } from '../../types/models'
import { normalizeDividendRow, deduplicateDividends, type RawDividendRow, type NormalizedDividend } from './normalizeDividendImport'

export function parseCsvLines(text: string): RawDividendRow[] {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter((l) => l.length > 0)
  if (lines.length < 2) return []

  const headers = parseCsvLine(lines[0])
  const rows: RawDividendRow[] = []

  for (let i = 1; i < lines.length; i++) {
    const values = parseCsvLine(lines[i])
    if (values.length === 0 || values.every((v) => v === '')) continue

    const row: Record<string, string | number> = {}
    headers.forEach((header, idx) => {
      const raw = values[idx] ?? ''
      const num = parseFloat(raw)
      row[header] = Number.isFinite(num) && raw !== '' ? num : raw
    })
    rows.push(row as unknown as RawDividendRow)
  }

  return rows
}

function parseCsvLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      inQuotes = !inQuotes
    } else if (ch === ',' && !inQuotes) {
      result.push(current.trim())
      current = ''
    } else {
      current += ch
    }
  }
  result.push(current.trim())
  return result
}

export interface CsvImportResult {
  rows: NormalizedDividend[]
  added: NormalizedDividend[]
  skipped: number
}

export function importDividendCsv(
  csvText: string,
  existingRecords: DividendRecord[],
  defaultSource: string = 'Dime full history PDF',
  defaultDocument: string = 'Binder1(1).pdf',
  needsReviewDefault: boolean = true,
): CsvImportResult {
  const raw = parseCsvLines(csvText)
  const normalized = raw.map((r, idx) => normalizeDividendRow({
    ...r,
    source: r.source ?? defaultSource,
    sourceDocument: r.sourceDocument ?? defaultDocument,
    needsReview: r.needsReview ?? needsReviewDefault,
    sourceScope: 'full-dime-history',
  }, idx))

  const existing = existingRecords.map((r) => ({
    id: r.id,
    symbol: r.symbol,
    assetId: r.assetId,
    payDate: r.payDate,
    grossAmount: r.grossAmount,
    taxAmount: r.taxAmount,
    netAmount: r.netAmount,
    currency: r.currency,
    source: r.source,
    sourceScope: (r.sourceScope ?? 'imported-ledger') as 'imported-ledger' | 'full-dime-history' | 'manual-review',
    sourceDocument: r.sourceDocument ?? '',
    sourcePage: r.sourcePage ?? 0,
    sourceRow: r.sourceRow ?? '',
    dedupeKey: r.dedupeKey ?? '',
    needsReview: r.needsReview ?? false,
    reviewNote: r.reviewNote ?? '',
    isCurrentHolding: r.isCurrentHolding ?? false,
    status: 'received' as const,
  }))

  const { added, skipped } = deduplicateDividends(normalized, existing)

  return { rows: normalized, added, skipped }
}
