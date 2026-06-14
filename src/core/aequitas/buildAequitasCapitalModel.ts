import type { OsData, SourceStatus } from '../../types/models'

const USD_TO_THB = 36

type AgentState = 'running' | 'waiting-review' | 'completed'
type DivisionMood = 'calm' | 'busy' | 'review-needed' | 'offline'
type DataConfidence = 'Real' | 'Inferred' | 'Fallback' | 'Mock'
type FreshnessState = 'Fresh' | 'Stale' | 'Unknown'

export type AequitasAgentModel = {
  id: string
  name: string
  role: string
  state: AgentState
  currentTask: string
  progress: number
  updatedAt: string
}

export type AequitasCapitalModel = {
  integrationMode: 'read-only'
  division: {
    mood: DivisionMood
    activeAgents: number
    runningTasks: number
    waitingReviews: number
    completedToday: number
    summary: string
  }
  scanner: {
    status: string
    trackedUniverseCount: number
    strongWatchCount: number
    watchCount: number
    lastUpdated: string
    sourceLabel: string
    confidence: DataConfidence
    freshness: FreshnessState
    emptyState?: string
  }
  market: {
    bias: string
    note: string
    lastUpdated: string
    confidence: DataConfidence
    freshness: FreshnessState
    emptyState?: string
  }
  portfolio: {
    holdingsCount: number
    portfolioValueTHB: number
    usdExposureValueTHB: number
    reviewCount: number
    dividendCount: number
    confidence: DataConfidence
    freshness: FreshnessState
    emptyState?: string
  }
  agents: {
    items: AequitasAgentModel[]
    confidence: 'Derived'
    freshness: FreshnessState
    emptyState?: string
  }
  statuses: {
    investments: SourceStatus | null
    tradingLab: SourceStatus | null
    finnhub: SourceStatus | null
  }
  lastUpdated: string
  overallFreshness: FreshnessState
}

type HoldingsWithExtendedValues = Array<Record<string, unknown>>

const formatBangkokTime = (value?: string) => {
  if (!value) return 'Unavailable'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString('en-US', {
    timeZone: 'Asia/Bangkok',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const resolveLatestTimestamp = (timestamps: Array<string | undefined>) => {
  const valid = timestamps
    .filter((value): value is string => Boolean(value))
    .map((value) => new Date(value))
    .filter((date) => !Number.isNaN(date.getTime()))
    .sort((a, b) => b.getTime() - a.getTime())

  return valid[0]?.toISOString()
}

const getFreshness = (status?: SourceStatus | null): FreshnessState => {
  if (!status?.lastSyncedAt) return 'Unknown'
  return status.isStale ? 'Stale' : 'Fresh'
}

const getConfidenceLabel = (status?: SourceStatus | null, fallback: DataConfidence = 'Fallback'): DataConfidence => {
  if (!status) return 'Fallback'
  if (status.mode === 'live') return 'Real'
  if (status.mode === 'mock') return 'Mock'
  if (status.mode === 'fallback') return fallback
  return fallback
}

const getPortfolioValueTHB = (holdings: HoldingsWithExtendedValues) => {
  return holdings.reduce((sum, holding) => {
    const marketValueTHB = typeof holding.marketValueTHB === 'number' ? holding.marketValueTHB : undefined
    const marketValueUSD = typeof holding.marketValueUSD === 'number' ? holding.marketValueUSD : undefined
    const quantity = typeof holding.quantity === 'number' ? holding.quantity : 0
    const averageCost = typeof holding.averageCost === 'number' ? holding.averageCost : 0

    if (typeof marketValueTHB === 'number') return sum + marketValueTHB
    if (typeof marketValueUSD === 'number') return sum + marketValueUSD * USD_TO_THB

    return sum + quantity * averageCost
  }, 0)
}

export const buildAequitasCapitalModel = (
  data: OsData,
  sourceStatuses: Record<string, SourceStatus>,
): AequitasCapitalModel => {
  // Manual verification guide for this pure adapter:
  // 1. Empty holdings + empty signals should produce section empty states instead of throwing.
  // 2. Missing source statuses should downgrade freshness to Unknown.
  // 3. Live statuses should upgrade confidence from Fallback/Inferred to Real where direct data exists.
  const holdings = data.holdings as unknown as HoldingsWithExtendedValues
  const watchHoldings = holdings.filter((holding) => holding.currentPosture === 'watch')
  const strongSignals = data.tradingSignals.filter((signal) => signal.confidence >= 70 && signal.signal !== 'exit')
  const directWatchCount = data.tradingWatchlist.length
  const watchCount = directWatchCount > 0 ? directWatchCount : watchHoldings.length
  const trackedSymbols = new Set<string>()

  data.financeAssets.forEach((asset) => {
    if (asset.symbol) trackedSymbols.add(asset.symbol)
  })
  data.marketDataSymbols.forEach((symbol) => trackedSymbols.add(symbol.symbol))
  data.tradingWatchlist.forEach((item) => trackedSymbols.add(item.symbol))
  data.tradingSignals.forEach((signal) => trackedSymbols.add(signal.symbol))

  const reviewCount =
    data.tradingWatchlist.filter((item) => item.risk === 'high').length +
    data.paperTradeRecords.filter((record) => record.status === 'draft').length +
    holdings.filter((holding) => {
      const allocationPercent = holding.allocationPercent as number | undefined
      const targetAllocationPercent = holding.targetAllocationPercent as number | undefined
      if (typeof allocationPercent !== 'number' || typeof targetAllocationPercent !== 'number') return false
      return Math.abs(allocationPercent - targetAllocationPercent) >= 2
    }).length +
    watchHoldings.filter((holding) => holding.risk === 'high').length

  const completedToday =
    data.dividendRecords.filter((record) => record.status === 'received').slice(0, 3).length +
    data.paperTradeRecords.filter((record) => record.status === 'approved').length

  const runningTasks =
    data.tradingSignals.length +
    Math.max(data.dcaRecords.filter((record) => record.status === 'planned' || record.status === 'review').length, 1) +
    Math.max(data.dividendRecords.filter((record) => record.status === 'received').slice(0, 2).length, 1)

  const investmentStatus = sourceStatuses.investments ?? null
  const tradingStatus = sourceStatuses.tradingLab ?? null
  const finnhubStatus = sourceStatuses.finnhub ?? null

  const lastUpdatedRaw = resolveLatestTimestamp([
    investmentStatus?.lastSyncedAt,
    tradingStatus?.lastSyncedAt,
    finnhubStatus?.lastSyncedAt,
    ...data.dividendRecords.map((record) => record.lastUpdated),
    ...data.tradingWatchlist.map((item) => item.lastUpdated),
    ...data.paperTradeRecords.map((record) => record.lastUpdated),
    ...holdings.map((holding) => (holding.lastUpdated as string | undefined)),
  ]) ?? investmentStatus?.lastSyncedAt

  const scannerStatus =
    data.tradingSignals.length > 0 || data.tradingWatchlist.length > 0
      ? tradingStatus?.isStale
        ? 'Scanner linked / stale'
        : 'Scanner active'
      : data.marketDataSymbols.length > 0
        ? 'Universe loaded'
        : 'Adapter using portfolio universe'

  const enterSignals = data.tradingSignals.filter((signal) => signal.signal === 'enter').length
  const exitSignals = data.tradingSignals.filter((signal) => signal.signal === 'exit').length
  const marketBias =
    enterSignals > exitSignals
      ? 'Constructive'
      : exitSignals > enterSignals
        ? 'Defensive'
        : watchHoldings.length > 0
          ? 'Selective'
          : holdings.length > 0
            ? 'Income-led'
            : 'Unavailable'

  const marketNote =
    data.tradingSignals.length > 0
      ? `${enterSignals} enter vs ${exitSignals} exit signals in the current sandbox feed.`
      : finnhubStatus?.isStale
        ? 'No direct signal feed yet, so bias is inferred from current portfolio posture.'
        : holdings.length === 0
          ? 'No holdings are available yet, so market bias cannot be read directly.'
          : 'Bias is inferred from current portfolio posture while scanner summaries stay read-only.'

  const portfolioValueTHB = getPortfolioValueTHB(holdings)
  const usdExposureValueTHB = holdings.reduce((sum, holding) => {
    const marketValueUSD = typeof holding.marketValueUSD === 'number' ? holding.marketValueUSD : 0
    return sum + marketValueUSD * USD_TO_THB
  }, 0)

  const portfolioFreshness = getFreshness(investmentStatus)
  const scannerFreshness =
    tradingStatus?.lastSyncedAt
      ? getFreshness(tradingStatus)
      : investmentStatus?.lastSyncedAt
        ? getFreshness(investmentStatus)
        : 'Unknown'
  const marketFreshness =
    finnhubStatus?.lastSyncedAt
      ? getFreshness(finnhubStatus)
      : investmentStatus?.lastSyncedAt
        ? getFreshness(investmentStatus)
        : 'Unknown'
  const overallFreshness =
    [portfolioFreshness, scannerFreshness, marketFreshness].includes('Stale')
      ? 'Stale'
      : [portfolioFreshness, scannerFreshness, marketFreshness].includes('Fresh')
        ? 'Fresh'
        : 'Unknown'

  const portfolioConfidence: DataConfidence =
    holdings.length > 0
      ? getConfidenceLabel(investmentStatus, 'Fallback')
      : investmentStatus
        ? 'Fallback'
        : 'Mock'

  const scannerConfidence: DataConfidence =
    data.tradingSignals.length > 0 || data.tradingWatchlist.length > 0
      ? getConfidenceLabel(tradingStatus, 'Fallback')
      : trackedSymbols.size > 0 || data.financeAssets.length > 0
        ? 'Fallback'
        : 'Mock'

  const marketConfidence: DataConfidence =
    data.tradingSignals.length > 0
      ? getConfidenceLabel(finnhubStatus ?? tradingStatus, 'Inferred')
      : holdings.length > 0
        ? 'Inferred'
        : finnhubStatus || investmentStatus
          ? 'Fallback'
          : 'Mock'

  const agents: AequitasAgentModel[] = [
    {
      id: 'research-agent',
      name: 'Research Agent',
      role: 'Scanner coverage',
      state: tradingStatus?.isStale ? 'waiting-review' : 'running',
      currentTask: `Scanning ${trackedSymbols.size || data.financeAssets.length} tracked symbols across the current Aequitas universe`,
      progress: trackedSymbols.size > 0 ? 74 : 52,
      updatedAt: formatBangkokTime(lastUpdatedRaw),
    },
    {
      id: 'quant-agent',
      name: 'Quant Agent',
      role: 'Market bias',
      state: finnhubStatus?.isStale ? 'waiting-review' : 'running',
      currentTask: `Analyzing market bias: ${marketBias.toLowerCase()} posture from available portfolio and signal data`,
      progress: data.tradingSignals.length > 0 ? 68 : 43,
      updatedAt: formatBangkokTime(finnhubStatus?.lastSyncedAt ?? lastUpdatedRaw),
    },
    {
      id: 'risk-agent',
      name: 'Risk Agent',
      role: 'Portfolio monitoring',
      state: reviewCount > 0 ? 'running' : 'completed',
      currentTask: `Monitoring ${holdings.length} holdings with ${reviewCount} review checkpoints currently open`,
      progress: reviewCount > 0 ? 61 : 100,
      updatedAt: formatBangkokTime(investmentStatus?.lastSyncedAt ?? lastUpdatedRaw),
    },
  ]

  const mood: DivisionMood =
    reviewCount > 0 || tradingStatus?.isStale
      ? 'review-needed'
      : holdings.length > 0
        ? 'calm'
        : 'offline'

  return {
    integrationMode: 'read-only',
    division: {
      mood,
      activeAgents: agents.filter((agent) => agent.state !== 'completed').length,
      runningTasks,
      waitingReviews: reviewCount,
      completedToday,
      summary: `Read-only Aequitas view from current holdings, dividends, and sandbox trading summaries inside Core OS. Scanner status: ${scannerStatus}.`,
    },
    scanner: {
      status: scannerStatus,
      trackedUniverseCount: trackedSymbols.size || data.financeAssets.length,
      strongWatchCount: strongSignals.length,
      watchCount,
      lastUpdated: formatBangkokTime(tradingStatus?.lastSyncedAt ?? lastUpdatedRaw),
      sourceLabel: tradingStatus?.sourceName ?? 'Trading summary adapter',
      confidence: scannerConfidence,
      freshness: scannerFreshness,
      emptyState:
        data.tradingSignals.length === 0 && data.tradingWatchlist.length === 0
          ? trackedSymbols.size > 0 || data.financeAssets.length > 0
            ? 'No direct scanner or watchlist feed is exposed yet, so the adapter falls back to the Aequitas universe.'
            : 'No scanner universe is available yet.'
          : undefined,
    },
    market: {
      bias: marketBias,
      note: marketNote,
      lastUpdated: formatBangkokTime(finnhubStatus?.lastSyncedAt ?? investmentStatus?.lastSyncedAt ?? lastUpdatedRaw),
      confidence: marketConfidence,
      freshness: marketFreshness,
      emptyState:
        data.tradingSignals.length === 0 && holdings.length === 0
          ? 'No holdings or signal summaries are available, so market bias is unavailable.'
          : undefined,
    },
    portfolio: {
      holdingsCount: holdings.length,
      portfolioValueTHB,
      usdExposureValueTHB,
      reviewCount,
      dividendCount: data.dividendRecords.length,
      confidence: portfolioConfidence,
      freshness: portfolioFreshness,
      emptyState: holdings.length === 0 ? 'No holdings are available in the current Aequitas read-only feed.' : undefined,
    },
    agents: {
      items: agents,
      confidence: 'Derived',
      freshness: overallFreshness,
      emptyState: agents.length === 0 ? 'No agent state could be derived from the current Aequitas feed.' : undefined,
    },
    statuses: {
      investments: investmentStatus,
      tradingLab: tradingStatus,
      finnhub: finnhubStatus,
    },
    lastUpdated: formatBangkokTime(lastUpdatedRaw),
    overallFreshness,
  }
}
