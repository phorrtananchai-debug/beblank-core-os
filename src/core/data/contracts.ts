import type { ActionRequest, DataProviderStatus, OsData, SourceStatus } from '../../types/models'

export interface ProviderResult<T> {
  data: T
  status: DataProviderStatus
  sourceStatus: SourceStatus
}

export interface AppsScriptReadBridgeContract<T = unknown> {
  bridgeName: string
  readRows: (params: { sourceId: string; worksheetName: string; updatedAfter?: string }) => Promise<T[]>
}

export interface AppsScriptWriteBridgeContract {
  bridgeName: string
  queueReviewedWrite: (request: ActionRequest) => Promise<{ accepted: boolean; bridgeRequestId: string }>
}

export interface FinnhubManualRefreshContract {
  refreshSymbols: (symbols: string[]) => Promise<Array<{ symbol: string; delayedPriceTHB?: number; refreshedAt: string }>>
}

export interface GoogleSheetSourceRow<T = Record<string, unknown>> {
  id: string
  sourceId: string
  worksheetName: string
  row: T
  updatedAt: string
  sourceStatus: SourceStatus
}

export interface DomainDataProviders {
  studio: StudioDataProvider
  finance: FinanceDataProvider
  ai: AIDataProvider
  connectors: ConnectorDataProvider
}

export interface StudioDataProvider {
  read: () => ProviderResult<Pick<OsData, 'projects' | 'tasks' | 'timeline' | 'studioTimelinePhases' | 'documents' | 'siteIssues' | 'workScopeSections' | 'siteWatchUpdates' | 'artworkRecords' | 'creativeBriefs' | 'studioReviews'>>
}

export interface FinanceDataProvider {
  read: () => ProviderResult<Pick<OsData, 'financeAssets' | 'holdings' | 'thaiNavAssets' | 'transactions' | 'familyFinanceRecords' | 'tradingSignals' | 'tradingStrategyNotes' | 'dcaRecords' | 'dividendRecords' | 'financeSnapshots' | 'financeLedgerRows' | 'reserveRows' | 'tradingWatchlist' | 'sandboxPositions' | 'paperTradeRecords' | 'marketDataSymbols'>>
}

export interface AIDataProvider {
  read: () => ProviderResult<Pick<OsData, 'aiContexts' | 'aiSuggestions' | 'aiExports' | 'aiImports' | 'aiReviews' | 'aiMemories' | 'aiDigests' | 'aiObservations'>>
}

export interface ConnectorDataProvider {
  read: () => ProviderResult<Pick<OsData, 'connectors' | 'sheetSources' | 'syncQueue' | 'bridgeContracts' | 'marketDataSymbols'>>
}
