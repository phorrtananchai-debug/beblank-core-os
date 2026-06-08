import type { DividendRecord } from '../../types/models'

const CACHE_KEY = 'beblank_os_dividend_full_history_cache_v1'

interface CachedDividend {
  id: string
  symbol: string
  assetId?: string
  payDate: string
  grossAmount: number
  taxWithheld: number
  netAmount: number
  currency: string
  source?: string
  sourceScope?: string
  sourceDocument?: string
  sourcePage?: number
  needsReview?: boolean
  reviewNote?: string
  dedupeKey?: string
  isCurrentHolding?: boolean
  status?: string
}

export function saveFullHistoryCache(records: DividendRecord[]): void {
  try {
    const cached: CachedDividend[] = records.map((r) => {
      const ext = r as unknown as Record<string, unknown>
      return {
        id: r.id,
        symbol: r.symbol,
        assetId: r.assetId,
        payDate: r.payDate,
        grossAmount: r.grossAmount,
        taxWithheld: ext.taxWithheld as number ?? r.taxAmount ?? 0,
        netAmount: r.netAmount,
        currency: r.currency,
        source: r.source,
        sourceScope: r.sourceScope ?? 'full-dime-history',
        sourceDocument: ext.sourceDocument as string | undefined,
        sourcePage: ext.sourcePage as number | undefined,
        needsReview: ext.needsReview as boolean | undefined,
        reviewNote: ext.reviewNote as string | undefined,
        dedupeKey: ext.dedupeKey as string | undefined,
        isCurrentHolding: ext.isCurrentHolding as boolean | undefined,
        status: r.status,
      }
    })
    localStorage.setItem(CACHE_KEY, JSON.stringify(cached))
  } catch { /* localStorage full or unavailable */ }
}

export function loadFullHistoryCache(): DividendRecord[] {
  try {
    const stored = localStorage.getItem(CACHE_KEY)
    if (!stored) return []
    const parsed: unknown = JSON.parse(stored)
    if (!Array.isArray(parsed)) return []

    return (parsed as Record<string, unknown>[]).map((item) => {
      const taxWithheld = (item.taxWithheld as number | undefined) ?? (item.taxAmount as number | undefined) ?? 0
      return {
        id: String(item.id ?? ''),
        accountId: '',
        assetId: String(item.assetId ?? item.symbol ?? ''),
        symbol: String(item.symbol ?? ''),
        expectedAmountTHB: 0,
        payDate: String(item.payDate ?? ''),
        grossAmount: Number(item.grossAmount ?? 0),
        taxAmount: taxWithheld,
        netAmount: Number(item.netAmount ?? 0),
        currency: String(item.currency ?? 'USD') as 'USD' | 'THB',
        source: String(item.source ?? 'Dime full history PDF'),
        sourceScope: (item.sourceScope as DividendRecord['sourceScope']) ?? 'full-dime-history',
        sourceDocument: String(item.sourceDocument ?? ''),
        sourcePage: Number(item.sourcePage ?? 0),
        sourceRow: '',
        needsReview: Boolean(item.needsReview),
        reviewNote: String(item.reviewNote ?? ''),
        dedupeKey: String(item.dedupeKey ?? ''),
        isCurrentHolding: Boolean(item.isCurrentHolding),
        status: (String(item.status ?? 'received') as DividendRecord['status']),
        note: '',
        sourceStatus: {} as DividendRecord['sourceStatus'],
        lastUpdated: '',
        notes: '',
        risk: 'low' as const,
        tags: [],
      } satisfies DividendRecord
    }) as DividendRecord[]
  } catch {
    return []
  }
}

export function clearFullHistoryCache(): void {
  try {
    localStorage.removeItem(CACHE_KEY)
  } catch { /* ignore */ }
}
