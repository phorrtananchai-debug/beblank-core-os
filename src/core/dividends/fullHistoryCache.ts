import type { DividendRecord } from '../../types/models'

const CACHE_KEY = 'beblank_os_dividend_full_history_cache_v1'

export function saveFullHistoryCache(records: DividendRecord[]): void {
  try {
    const trimmed = records.map((r) => ({
      id: r.id,
      symbol: r.symbol,
      assetId: r.assetId,
      payDate: r.payDate,
      grossAmount: r.grossAmount,
      taxAmount: r.taxAmount,
      netAmount: r.netAmount,
      currency: r.currency,
      source: r.source,
      sourceScope: 'full-dime-history',
      status: r.status,
    }))
    localStorage.setItem(CACHE_KEY, JSON.stringify(trimmed))
  } catch { /* localStorage full or unavailable */ }
}

export function loadFullHistoryCache(): DividendRecord[] {
  try {
    const stored = localStorage.getItem(CACHE_KEY)
    if (!stored) return []
    const parsed = JSON.parse(stored)
    if (!Array.isArray(parsed)) return []
    return parsed as DividendRecord[]
  } catch {
    return []
  }
}

export function clearFullHistoryCache(): void {
  try {
    localStorage.removeItem(CACHE_KEY)
  } catch { /* ignore */ }
}
