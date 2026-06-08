import type { Holding } from '../../types/models'

const HOLDINGS_CACHE_KEY = 'beblank_os_investment_holdings_cache_v1'

type HoldingsCacheEntry = Record<string, unknown>

export interface HoldingsCacheSnapshot {
  updatedAt: string | null
  records: Holding[]
}

const toFiniteNumber = (value: unknown): number | undefined => {
  if (value === undefined || value === null || value === '') return undefined
  if (typeof value === 'number') return Number.isFinite(value) ? value : undefined
  if (typeof value !== 'string') return undefined

  const normalized = value
    .replace(/THB/gi, '')
    .replace(/฿/g, '')
    .replace(/,/g, '')
    .trim()

  if (!normalized) return undefined

  const parsed = Number(normalized)
  return Number.isFinite(parsed) ? parsed : undefined
}

const normalizeCacheEntry = (entry: HoldingsCacheEntry): Holding | null => {
  const id = String(entry.id ?? '').trim()
  const assetId = String(entry.assetId ?? '').trim()
  if (!id || !assetId) return null

  const quantity = toFiniteNumber(entry.quantity) ?? 0
  const averageCost = toFiniteNumber(entry.averageCost) ?? 0
  const marketValueTHB = toFiniteNumber(entry.marketValueTHB)
  const allocationPercent = toFiniteNumber(entry.allocationPercent)
  const targetAllocationPercent = toFiniteNumber(entry.targetAllocationPercent)
  const averageCostUSD = toFiniteNumber(entry.averageCostUSD)
  const marketValueUSD = toFiniteNumber(entry.marketValueUSD)
  const currentPriceUSD = toFiniteNumber(entry.currentPriceUSD)
  const costBasisUSD = toFiniteNumber(entry.costBasisUSD)

  return {
    id,
    accountId: entry.accountId === undefined ? undefined : String(entry.accountId),
    assetId,
    units: toFiniteNumber(entry.units),
    quantity,
    averageCost,
    marketValueTHB,
    allocationPercent,
    targetAllocationPercent,
    currentPosture: entry.currentPosture as Holding['currentPosture'] | undefined,
    dcaStatus: entry.dcaStatus as Holding['dcaStatus'] | undefined,
    dividendStatus: entry.dividendStatus as Holding['dividendStatus'] | undefined,
    sourceStatus: entry.sourceStatus as Holding['sourceStatus'] | undefined,
    lastUpdated: entry.lastUpdated === undefined ? undefined : String(entry.lastUpdated),
    notes: entry.notes === undefined ? undefined : String(entry.notes),
    risk: entry.risk as Holding['risk'] | undefined,
    tags: Array.isArray(entry.tags) ? entry.tags.map(String) : undefined,
    currencyMode: entry.currencyMode === undefined ? undefined : String(entry.currencyMode),
    averageCostUSD,
    currentPriceUSD,
    marketValueUSD,
    costBasisUSD,
    costBasisTHB: toFiniteNumber(entry.costBasisTHB),
    unrealizedGainTHB: toFiniteNumber(entry.unrealizedGainTHB),
    unrealizedGainPercent: toFiniteNumber(entry.unrealizedGainPercent),
  } as Holding
}

export function loadHoldingsCache(): HoldingsCacheSnapshot {
  if (typeof window === 'undefined') return { updatedAt: null, records: [] }

  try {
    const stored = window.localStorage.getItem(HOLDINGS_CACHE_KEY)
    if (!stored) return { updatedAt: null, records: [] }

    const parsed = JSON.parse(stored) as unknown
    const rawRecords: HoldingsCacheEntry[] = Array.isArray(parsed)
      ? parsed
      : Array.isArray((parsed as Record<string, unknown> | null)?.records)
        ? (parsed as Record<string, unknown>).records as HoldingsCacheEntry[]
        : []

    const parsedObject = !Array.isArray(parsed) && typeof parsed === 'object' && parsed !== null
      ? parsed as Record<string, unknown>
      : null

    const updatedAt = typeof parsedObject?.updatedAt === 'string'
      ? parsedObject.updatedAt
      : null

    return {
      updatedAt,
      records: rawRecords.map((entry) => normalizeCacheEntry(entry)).filter((entry): entry is Holding => entry !== null),
    }
  } catch {
    return { updatedAt: null, records: [] }
  }
}

export function saveHoldingsCache(records: Array<Record<string, unknown>>): HoldingsCacheSnapshot {
  const updatedAt = new Date().toISOString()
  const normalized = records
    .map((record) => normalizeCacheEntry(record))
    .filter((record): record is Holding => record !== null)

  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(HOLDINGS_CACHE_KEY, JSON.stringify({ updatedAt, records: normalized }))
    } catch {
      /* ignore cache write failures */
    }
  }

  return { updatedAt, records: normalized }
}

export function mergeHoldingsCache(baseRecords: Holding[], cacheRecords: Holding[]): Holding[] {
  return cacheRecords.length > 0 ? cacheRecords : baseRecords
}
