import type { DividendRecord } from '../../types/models'

export interface CanonicalDividendResult {
  canonical: DividendRecord[]
  duplicatesRemoved: number
  importedCount: number
  fullHistoryCount: number
}

function dedupeKey(r: DividendRecord): string {
  const tax = r.taxAmount ?? (r as unknown as Record<string, unknown>).taxWithheld as number ?? 0
  return `${r.symbol}|${r.payDate.slice(0, 10)}|${r.grossAmount.toFixed(2)}|${tax.toFixed(2)}`
}

export function buildCanonicalDividends(
  importedLedger: DividendRecord[],
  fullHistory: DividendRecord[],
): CanonicalDividendResult {
  const seen = new Map<string, DividendRecord>()
  let duplicatesRemoved = 0

  const priority: Array<{ records: DividendRecord[]; scope: string }> = [
    { records: fullHistory, scope: 'full-dime-history' },
    { records: importedLedger, scope: 'imported-ledger' },
  ]

  for (const { records } of priority) {
    for (const r of records) {
      const key = dedupeKey(r)
      if (seen.has(key)) {
        duplicatesRemoved++
      } else {
        seen.set(key, r)
      }
    }
  }

  const canonical = [...seen.values()].sort((a, b) => b.payDate.localeCompare(a.payDate))

  return {
    canonical,
    duplicatesRemoved,
    importedCount: importedLedger.length,
    fullHistoryCount: fullHistory.length,
  }
}
