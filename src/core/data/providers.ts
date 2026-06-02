import { mockOsData, mockSourceStatuses } from '../../data/mockData'
import type { DataProviderStatus, OsData, SourceStatus } from '../../types/models'
import type { AIDataProvider, ConnectorDataProvider, FinanceDataProvider, ProviderResult, StudioDataProvider } from './contracts'

const now = '2026-06-02T09:00:00.000Z'

const providerStatus = (source: string, sourceStatus: SourceStatus, fallbackUsed = false): DataProviderStatus => ({
  source,
  mode: fallbackUsed ? 'fallback' : sourceStatus.mode,
  lastUpdated: sourceStatus.lastSyncedAt || now,
  stale: sourceStatus.isStale,
  error: sourceStatus.health === 'error' || sourceStatus.health === 'disconnected' ? sourceStatus.bridgeWarning ?? 'Source is not connected yet.' : undefined,
  fallbackUsed,
})

const emptyStatus = (source: string): SourceStatus => ({
  sourceName: source,
  lastSyncedAt: now,
  isStale: true,
  mode: 'fallback',
  health: 'warning',
  syncState: 'review-required',
  pendingSyncCount: 0,
  bridgeWarning: 'No live data available. Empty provider state is rendering safely.',
  authority: 'mock',
  ownerModule: source,
})

export const createStudioDataProvider = (mode: 'mock' | 'live' | 'fallback' | 'empty' = 'mock'): StudioDataProvider => ({
  read: () => {
    const sourceStatus = mode === 'empty' ? emptyStatus('Studio Provider') : mockSourceStatuses.studio
    const data = mode === 'empty'
      ? { projects: [], tasks: [], timeline: [], studioTimelinePhases: [], documents: [], siteIssues: [], workScopeSections: [], siteWatchUpdates: [], artworkRecords: [], creativeBriefs: [], studioReviews: [] }
      : {
          projects: mockOsData.projects,
          tasks: mockOsData.tasks,
          timeline: mockOsData.timeline,
          studioTimelinePhases: mockOsData.studioTimelinePhases,
          documents: mockOsData.documents,
          siteIssues: mockOsData.siteIssues,
          workScopeSections: mockOsData.workScopeSections,
          siteWatchUpdates: mockOsData.siteWatchUpdates,
          artworkRecords: mockOsData.artworkRecords,
          creativeBriefs: mockOsData.creativeBriefs,
          studioReviews: mockOsData.studioReviews,
        }
    return { data, status: providerStatus('StudioDataProvider', sourceStatus, mode === 'fallback'), sourceStatus }
  },
})

export const createFinanceDataProvider = (mode: 'mock' | 'live' | 'fallback' | 'empty' = 'mock'): FinanceDataProvider => ({
  read: () => {
    const sourceStatus = mode === 'empty' ? emptyStatus('Finance Provider') : mockSourceStatuses.investments
    const data = mode === 'empty'
      ? { financeAssets: [], holdings: [], thaiNavAssets: [], transactions: [], familyFinanceRecords: [], tradingSignals: [], tradingStrategyNotes: [], dcaRecords: [], dividendRecords: [], financeSnapshots: [], financeLedgerRows: [], reserveRows: [], tradingWatchlist: [], sandboxPositions: [], paperTradeRecords: [], marketDataSymbols: [] }
      : {
          financeAssets: mockOsData.financeAssets,
          holdings: mockOsData.holdings,
          thaiNavAssets: mockOsData.thaiNavAssets,
          transactions: mockOsData.transactions,
          familyFinanceRecords: mockOsData.familyFinanceRecords,
          tradingSignals: mockOsData.tradingSignals,
          tradingStrategyNotes: mockOsData.tradingStrategyNotes,
          dcaRecords: mockOsData.dcaRecords,
          dividendRecords: mockOsData.dividendRecords,
          financeSnapshots: mockOsData.financeSnapshots,
          financeLedgerRows: mockOsData.financeLedgerRows,
          reserveRows: mockOsData.reserveRows,
          tradingWatchlist: mockOsData.tradingWatchlist,
          sandboxPositions: mockOsData.sandboxPositions,
          paperTradeRecords: mockOsData.paperTradeRecords,
          marketDataSymbols: mockOsData.marketDataSymbols,
        }
    return { data, status: providerStatus('FinanceDataProvider', sourceStatus, mode === 'fallback'), sourceStatus }
  },
})

export const createAIDataProvider = (mode: 'mock' | 'live' | 'fallback' | 'empty' = 'mock'): AIDataProvider => ({
  read: () => {
    const sourceStatus = mode === 'empty' ? emptyStatus('AI Provider') : mockSourceStatuses.aiWorkflow
    const data = mode === 'empty'
      ? { aiContexts: [], aiSuggestions: [], aiExports: [], aiImports: [], aiReviews: [], aiMemories: [], aiDigests: [], aiObservations: [] }
      : {
          aiContexts: mockOsData.aiContexts,
          aiSuggestions: mockOsData.aiSuggestions,
          aiExports: mockOsData.aiExports,
          aiImports: mockOsData.aiImports,
          aiReviews: mockOsData.aiReviews,
          aiMemories: mockOsData.aiMemories,
          aiDigests: mockOsData.aiDigests,
          aiObservations: mockOsData.aiObservations,
        }
    return { data, status: providerStatus('AIDataProvider', sourceStatus, mode === 'fallback'), sourceStatus }
  },
})

export const createConnectorDataProvider = (mode: 'mock' | 'live' | 'fallback' | 'empty' = 'mock'): ConnectorDataProvider => ({
  read: () => {
    const sourceStatus = mode === 'empty' ? emptyStatus('Connector Provider') : mockSourceStatuses.settings
    const data = mode === 'empty'
      ? { connectors: [], sheetSources: [], syncQueue: [], bridgeContracts: [], marketDataSymbols: [] }
      : { connectors: mockOsData.connectors, sheetSources: mockOsData.sheetSources, syncQueue: mockOsData.syncQueue, bridgeContracts: mockOsData.bridgeContracts, marketDataSymbols: mockOsData.marketDataSymbols }
    return { data, status: providerStatus('ConnectorDataProvider', sourceStatus, mode === 'fallback'), sourceStatus }
  },
})

export const createInitialOsDataFromProviders = (): { data: OsData; sourceStatuses: Record<string, SourceStatus>; providerStatuses: Record<string, DataProviderStatus> } => {
  const studio = createStudioDataProvider().read()
  const finance = createFinanceDataProvider().read()
  const ai = createAIDataProvider().read()
  const connectors = createConnectorDataProvider().read()

  return {
    data: {
      ...mockOsData,
      ...studio.data,
      ...finance.data,
      ...ai.data,
      ...connectors.data,
    },
    sourceStatuses: mockSourceStatuses,
    providerStatuses: {
      studio: studio.status,
      finance: finance.status,
      ai: ai.status,
      connectors: connectors.status,
    },
  }
}

export const dataProviders = {
  studio: createStudioDataProvider(),
  finance: createFinanceDataProvider(),
  ai: createAIDataProvider(),
  connectors: createConnectorDataProvider(),
}

export type { ProviderResult }
