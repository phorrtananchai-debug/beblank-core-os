import type { DividendRecord, SourceStatus } from '../../types/models'

const FULL_HISTORY_CACHE_KEY = 'beblank_os_dividend_full_history_cache_v1'

type DividendHistoryCacheEntry = Record<string, unknown>

const defaultSourceStatus = (updatedAt: string): SourceStatus => ({
  sourceName: 'Dividend Full History Cache',
  lastSyncedAt: updatedAt,
  isStale: false,
  mode: 'fallback',
  health: 'healthy',
  syncState: 'idle',
  pendingSyncCount: 0,
  authority: 'manual',
  ownerModule: 'finance',
})

const toFiniteNumber = (value: unknown): number | undefined => {
  if (value === undefined || value === null || value === '') return undefined
  const numberValue = Number(value)
  return Number.isFinite(numberValue) ? numberValue : undefined
}

const normalizeCacheEntry = (entry: DividendHistoryCacheEntry): DividendRecord | null => {
  const id = String(entry.id ?? '').trim()
  if (!id) return null

  const payDate = String(entry.payDate ?? '').trim()
  const symbol = String(entry.symbol ?? entry.assetId ?? '').trim()
  const assetId = String(entry.assetId ?? symbol).trim() || symbol
  const grossAmount = toFiniteNumber(entry.grossAmount) ?? 0
  const taxWithheld = toFiniteNumber(entry.taxWithheld ?? entry.taxAmount) ?? 0
  const netAmount = toFiniteNumber(entry.netAmount ?? entry.expectedAmountTHB) ?? 0
  const currency = entry.currency === 'THB' ? 'THB' : 'USD'
  const source = String(entry.source ?? 'Dime screenshot')
  const status = entry.status === 'received' || entry.status === 'review' || entry.status === 'expected'
    ? entry.status
    : 'received'
  const note = String(entry.note ?? entry.notes ?? '')
  const lastUpdated = String(entry.lastUpdated ?? payDate ?? new Date().toISOString())
  const tags = Array.isArray(entry.tags) ? entry.tags.map(String) : []
  const sourceStatus = (entry.sourceStatus as SourceStatus | undefined) ?? defaultSourceStatus(lastUpdated)

  return {
    id,
    accountId: String(entry.accountId ?? 'acct-dime'),
    assetId,
    symbol,
    expectedAmountTHB: toFiniteNumber(entry.expectedAmountTHB) ?? 0,
    payDate,
    grossAmount,
    taxAmount: taxWithheld,
    taxWithheld,
    netAmount,
    currency,
    source,
    status,
    note,
    sourceStatus,
    lastUpdated,
    notes: String(entry.notes ?? note),
    risk: (entry.risk === 'medium' || entry.risk === 'high') ? entry.risk : 'low',
    tags,
  }
}

export function loadFullHistoryCache(): DividendRecord[] {
  if (typeof window === 'undefined') return []

  try {
    const stored = window.localStorage.getItem(FULL_HISTORY_CACHE_KEY)
    if (!stored) return []

    const parsed = JSON.parse(stored) as DividendHistoryCacheEntry[]
    if (!Array.isArray(parsed)) return []

    return parsed.map((entry) => normalizeCacheEntry(entry)).filter((entry): entry is DividendRecord => entry !== null)
  } catch {
    return []
  }
}

export function saveFullHistoryCache(records: Array<Record<string, unknown>>): void {
  if (typeof window === 'undefined') return

  try {
    const normalized = records.map((record) => {
      const taxWithheld = toFiniteNumber(record.taxWithheld ?? record.taxAmount) ?? 0
      const next = { ...record, taxWithheld }
      delete (next as Record<string, unknown>).taxAmount
      return next
    })
    window.localStorage.setItem(FULL_HISTORY_CACHE_KEY, JSON.stringify(normalized))
  } catch {
    /* ignore cache write failures */
  }
}

export function mergeDividendFullHistory(baseRecords: DividendRecord[], cacheRecords: DividendRecord[]): DividendRecord[] {
  if (cacheRecords.length === 0) return baseRecords

  const merged = [...baseRecords]
  const indexById = new Map(baseRecords.map((record, index) => [record.id, index]))

  for (const record of cacheRecords) {
    const existingIndex = indexById.get(record.id)
    if (existingIndex === undefined) {
      indexById.set(record.id, merged.length)
      merged.push(record)
      continue
    }

    merged[existingIndex] = { ...merged[existingIndex], ...record }
  }

  return merged
}
