export interface RawDividendRow {
  payDate: string
  symbol: string
  grossAmount: number | string
  taxWithheld?: number | string
  netAmount?: number | string
  currency?: string
  source?: string
  sourceDocument?: string
  sourcePage?: number
  sourceRow?: string
  sourceScope?: 'imported-ledger' | 'full-dime-history' | 'manual-review'
  needsReview?: boolean
  reviewNote?: string
  isCurrentHolding?: boolean
}

export interface NormalizedDividend {
  id: string
  symbol: string
  assetId: string
  payDate: string
  grossAmount: number
  taxAmount: number
  netAmount: number
  currency: 'USD' | 'THB'
  source: string
  sourceScope: 'imported-ledger' | 'full-dime-history' | 'manual-review'
  sourceDocument: string
  sourcePage: number
  sourceRow: string
  dedupeKey: string
  needsReview: boolean
  reviewNote: string
  isCurrentHolding: boolean
  status: 'received'
}

export function normalizeDividendRow(raw: RawDividendRow, index: number): NormalizedDividend {
  const symbol = raw.symbol?.toString().trim().toUpperCase() ?? 'UNKNOWN'
  const gross = typeof raw.grossAmount === 'string' ? parseFloat(raw.grossAmount) : (raw.grossAmount ?? 0)
  const taxAbs = raw.taxWithheld !== undefined && raw.taxWithheld !== null
    ? Math.abs(typeof raw.taxWithheld === 'string' ? parseFloat(raw.taxWithheld) : raw.taxWithheld)
    : 0
  const net = raw.netAmount !== undefined && raw.netAmount !== null
    ? (typeof raw.netAmount === 'string' ? parseFloat(raw.netAmount) : raw.netAmount)
    : gross - taxAbs

  const payDate = raw.payDate?.toString().trim() ?? ''
  const dedupeKey = `${symbol}|${payDate}|${gross.toFixed(2)}|${taxAbs.toFixed(2)}`

  return {
    id: `div-full-${index + 1}-${Date.now()}`,
    symbol,
    assetId: symbol,
    payDate,
    grossAmount: gross,
    taxAmount: taxAbs,
    netAmount: net,
    currency: 'USD',
    source: raw.source ?? 'Dime full history PDF',
    sourceScope: raw.sourceScope ?? 'full-dime-history',
    sourceDocument: raw.sourceDocument ?? '',
    sourcePage: raw.sourcePage ?? 0,
    sourceRow: raw.sourceRow ?? String(index + 1),
    dedupeKey,
    needsReview: raw.needsReview ?? false,
    reviewNote: raw.reviewNote ?? '',
    isCurrentHolding: raw.isCurrentHolding ?? false,
    status: 'received',
  }
}

export function deduplicateDividends(
  incoming: NormalizedDividend[],
  existing: NormalizedDividend[],
): { added: NormalizedDividend[]; skipped: number } {
  const existingKeys = new Set(existing.map((r) => r.dedupeKey).filter(Boolean))
  const added: NormalizedDividend[] = []
  let skipped = 0

  for (const row of incoming) {
    if (row.dedupeKey && existingKeys.has(row.dedupeKey)) {
      skipped++
    } else {
      added.push(row)
    }
  }

  return { added, skipped }
}
