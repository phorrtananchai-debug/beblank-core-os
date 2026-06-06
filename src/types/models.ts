export type SourceMode = 'mock' | 'live' | 'fallback'
export type DataSourceMode = SourceMode | 'empty'

export interface DataProviderStatus {
  source: string
  mode: DataSourceMode
  lastUpdated: string
  stale: boolean
  error?: string
  fallbackUsed: boolean
}

export interface SourceStatus {
  sourceName: string
  lastSyncedAt: string
  isStale: boolean
  mode: SourceMode
  health?: 'healthy' | 'warning' | 'error' | 'disconnected'
  syncState?: 'idle' | 'pending' | 'syncing' | 'failed' | 'review-required'
  pendingSyncCount?: number
  bridgeWarning?: string
  authority?: 'mock' | 'sheet' | 'connector' | 'manual'
  ownerModule?: string
}

export interface ActionRequest {
  id: string
  module: 'studio' | 'finance' | 'trading' | 'ai' | 'settings'
  actionType: string
  description: string
  payload: Record<string, unknown>
  requestedBy: string
  requestedAt: string
  requiresApproval: boolean
}

export interface ChangeLogRecord {
  id: string
  actionRequestId: string
  module: string
  actionType: string
  summary: string
  changedAt: string
  changedBy: string
}

export interface SnapshotRecord {
  id: string
  triggerActionRequestId: string
  module: string
  reason: string
  createdAt: string
}

export interface AIContext {
  id: string
  module: string
  title: string
  body: string
  createdAt: string
}

export interface AISuggestion {
  id: string
  module: string
  title: string
  recommendation: string
  riskNotes: string
  createdAt: string
  status: 'imported' | 'approved' | 'rejected'
}

export interface AIExportRecord {
  id: string
  module: 'studio' | 'finance' | 'timeline' | 'trading-lab' | 'combined'
  title: string
  sourceIds: string[]
  snapshotId?: string
  createdAt: string
  sourceStatus: SourceStatus
  summary: string
  jsonPreview: string
  handoffNotes: string
  confidence: number
  reviewStatus: 'draft' | 'exported' | 'archived'
  approvedBy?: string
  notes: string
  tags: string[]
}

export interface AIImportRecord {
  id: string
  module: string
  sourceIds: string[]
  snapshotId?: string
  createdAt: string
  sourceStatus: SourceStatus
  title: string
  suggestionJson: string
  diffPreview: string
  confidence: number
  reviewStatus: 'pending' | 'approved' | 'rejected'
  approvedBy?: string
  notes: string
  tags: string[]
}

export interface AIReviewRecord {
  id: string
  module: string
  sourceIds: string[]
  snapshotId?: string
  createdAt: string
  sourceStatus: SourceStatus
  title: string
  reviewStatus: 'pending' | 'approved' | 'rejected' | 'archived'
  confidence: number
  approvedBy?: string
  notes: string
  tags: string[]
}

export interface AIMemoryRecord {
  id: string
  module: string
  sourceIds: string[]
  snapshotId?: string
  createdAt: string
  sourceStatus: SourceStatus
  title: string
  body: string
  memoryType: 'note' | 'observation' | 'decision' | 'review-history'
  confidence: number
  reviewStatus: 'active' | 'archived'
  approvedBy?: string
  notes: string
  tags: string[]
}

export interface AIDigestRecord {
  id: string
  module: 'daily' | 'finance' | 'studio' | 'timeline' | 'trading-lab'
  sourceIds: string[]
  snapshotId?: string
  createdAt: string
  sourceStatus: SourceStatus
  title: string
  summary: string
  confidence: number
  reviewStatus: 'draft' | 'approved' | 'archived'
  approvedBy?: string
  notes: string
  tags: string[]
}

export interface AIObservationRecord {
  id: string
  module: string
  sourceIds: string[]
  snapshotId?: string
  createdAt: string
  sourceStatus: SourceStatus
  title: string
  observation: string
  severity: 'low' | 'medium' | 'high'
  confidence: number
  reviewStatus: 'open' | 'reviewed' | 'archived'
  approvedBy?: string
  notes: string
  tags: string[]
}

export type ConnectorCategory =
  | 'apps-script-bridge'
  | 'google-sheets'
  | 'finnhub'
  | 'ai-provider'
  | 'agent-layer'
  | 'communication'
  | 'calendar'

export interface ConnectorDefinition {
  id: string
  name: string
  category: ConnectorCategory
  status: 'mock' | 'ready' | 'disabled' | 'future'
  capabilities: Array<'read' | 'write' | 'market-data' | 'notifications' | 'summaries' | 'manual-refresh'>
  sourceOwnership: string[]
  syncMode: 'manual' | 'scheduled-placeholder' | 'disabled'
  health: 'healthy' | 'warning' | 'error' | 'disconnected'
  lastSyncAt?: string
  staleAfterHours: number
  environmentNotes: string
  credentialStatus: 'not-configured' | 'placeholder' | 'future-secret'
  sourceStatus: SourceStatus
}

export interface SheetWorksheetDefinition {
  id: string
  sheetSourceId: string
  name: string
  ownerModule: string
  rowOwnership: 'sheet-authoritative' | 'os-reviewed-write' | 'connector-readonly' | 'manual-import'
  primaryKey: string
  lastSyncedAt: string
  isStale: boolean
  sourceStatus: SourceStatus
  notes: string
}

export interface SheetSourceDefinition {
  id: string
  name: string
  connectorId: string
  authority: 'source-of-truth' | 'derived' | 'readonly-reference'
  ownerModule: string
  syncState: 'idle' | 'pending' | 'failed' | 'review-required'
  lastSyncedAt: string
  staleAfterHours: number
  sourceStatus: SourceStatus
  notes: string
  worksheets: SheetWorksheetDefinition[]
}

export interface SyncQueueItem {
  id: string
  connectorId: string
  sourceId: string
  module: string
  operation: 'read-refresh' | 'write-export' | 'retry' | 'test-connection'
  status: 'pending' | 'review-required' | 'approved' | 'failed' | 'completed'
  requestedAt: string
  lastAttemptAt?: string
  retryCount: number
  sourceStatus: SourceStatus
  payloadPreview: string
  notes: string
  tags: string[]
}

export interface BridgeContract {
  id: string
  connectorId: string
  name: string
  readContract: string
  writeContract: string
  approvalRequired: boolean
  snapshotRequired: boolean
  changelogRequired: boolean
  notes: string
}

export interface MarketDataSymbol {
  id: string
  connectorId: string
  symbol: string
  assetId?: string
  sourceStatus: SourceStatus
  lastUpdated: string
  staleAfterHours: number
  delayedPriceTHB?: number
  notes: string
  tags: string[]
}

export interface Project {
  id: string
  slug: string
  name: string
  status: 'active' | 'paused' | 'planning'
  owner: string
  client?: string
  location?: string
  phase?: string
  timelineStatus?: 'steady' | 'watch' | 'at-risk'
  operationalNotes?: string
}

export interface Task {
  id: string
  projectId: string
  title: string
  status: 'todo' | 'doing' | 'done'
}

export interface TimelineItem {
  id: string
  projectId: string
  label: string
  dueDate: string
  state: 'planned' | 'at-risk' | 'completed'
}

export interface StudioTimelinePhase {
  id: string
  projectId: string
  phase: 'briefing' | 'design' | 'drawing' | 'approval' | 'procurement' | 'construction' | 'handover' | 'opening'
  startDate: string
  endDate: string
  status: 'planned' | 'active' | 'blocked' | 'reviewed' | 'complete'
  risk: 'low' | 'medium' | 'high'
  sourceStatus: SourceStatus
  blockerIds: string[]
  notes: string
}

export interface DocumentRecord {
  id: string
  projectId: string
  title: string
  version: string
  updatedAt: string
  packageType?: string
  approvalState?: 'draft' | 'review' | 'issued' | 'approved'
  issueDate?: string
  linkedScopeIds?: string[]
}

export interface SiteIssue {
  id: string
  projectId: string
  issue: string
  severity: 'low' | 'medium' | 'high'
  status?: 'open' | 'review' | 'resolved'
}

export interface WorkScopeSection {
  id: string
  projectId: string
  code: string
  group: string
  title: string
  phase: string
  operationalStatus: 'planned' | 'active' | 'blocked' | 'complete'
  reviewStatus: 'draft' | 'needs-review' | 'approved'
  linkedApprovalIds: string[]
}

export interface SiteWatchUpdate {
  id: string
  projectId: string
  title: string
  observedAt: string
  severity: 'low' | 'medium' | 'high'
  status: 'open' | 'review' | 'resolved'
  note: string
  imagePlaceholder: string
}

export interface ArtworkRecord {
  id: string
  projectId: string
  briefId: string
  title: string
  group: string
  status: 'concept' | 'review' | 'approved'
  previewTone: 'stone' | 'paper' | 'ink' | 'warm'
  operationalNotes: string
}

export interface CreativeBrief {
  id: string
  projectId: string
  title: string
  direction: string
  references: string[]
  moodKeywords: string[]
  status: 'draft' | 'review' | 'approved'
  linkedArtworkIds: string[]
  linkedReviewIds: string[]
  aiSummary: string
}

export interface StudioReview {
  id: string
  projectId: string
  type: 'approval' | 'revision' | 'drawing' | 'ai-suggestion' | 'site-review'
  title: string
  linkedRecordId: string
  status: 'pending' | 'approved' | 'resolved'
  dueAt: string
}

export interface FinanceAsset {
  id: string
  name: string
  symbol?: string
  currency: 'THB' | 'USD'
  category: 'stock' | 'etf' | 'fund' | 'cash'
  region?: 'US' | 'TH' | 'Global'
  assetType?: 'us-equity-etf' | 'thai-stock' | 'thai-mutual-fund' | 'thai-rmf' | 'cash' | 'other'
  market?: 'US' | 'TH' | 'Global' | 'manual'
  sourceOfTruth?: 'manual' | 'sheet' | 'imported' | 'helper'
  helperSource?: 'finnhub' | 'thai-nav' | 'manual-nav' | 'google-sheet-nav' | 'none'
  currentHelperPrice?: number
  manualContribution?: number
  sourceStatus?: SourceStatus
  createdAt?: string
  updatedAt?: string
  lastUpdated?: string
  notes?: string
  tags?: string[]
}

export interface Holding {
  id: string
  accountId?: string
  assetId: string
  units?: number
  quantity: number
  averageCost: number
  marketValueTHB?: number
  allocationPercent?: number
  targetAllocationPercent?: number
  currentPosture?: 'core' | 'growth' | 'income' | 'reserve' | 'watch'
  dcaStatus?: 'active' | 'paused' | 'review'
  dividendStatus?: 'none' | 'expected' | 'received' | 'review'
  sourceStatus?: SourceStatus
  lastUpdated?: string
  notes?: string
  risk?: 'low' | 'medium' | 'high'
  tags?: string[]
}

export interface ThaiNavAsset {
  id: string
  symbol: string
  displayName?: string
  nav: number
  units?: number
  valueTHB?: number
  sourceStatus?: SourceStatus
  helperSource?: 'manual-nav' | 'google-sheet-nav' | 'fallback'
  sourceOfTruth?: 'manual' | 'sheet' | 'imported' | 'helper'
  stale?: boolean
  notes?: string
  tags?: string[]
  updatedAt: string
}

export interface TransactionRecord {
  id: string
  accountId?: string
  assetId?: string
  description: string
  amountTHB: number
  type: 'buy' | 'sell' | 'income' | 'expense'
  occurredAt: string
  sourceStatus?: SourceStatus
  lastUpdated?: string
  notes?: string
  risk?: 'low' | 'medium' | 'high'
  tags?: string[]
}

export interface FamilyFinanceRecord {
  id: string
  accountId?: string
  bucket: 'cashflow' | 'bill' | 'debt' | 'expense' | 'reserve'
  label: string
  amountTHB: number
  dueDate?: string
  sourceStatus?: SourceStatus
  lastUpdated?: string
  notes?: string
  risk?: 'low' | 'medium' | 'high'
  tags?: string[]
}

export interface TradingSignal {
  id: string
  accountId?: string
  symbol: string
  signal: 'watch' | 'enter' | 'exit'
  confidence: number
  note: string
  sourceStatus?: SourceStatus
  lastUpdated?: string
  risk?: 'low' | 'medium' | 'high'
  tags?: string[]
}

export interface TradingStrategyNote {
  id: string
  title: string
  note: string
  riskLevel: 'low' | 'medium' | 'high'
  status?: 'active' | 'archived'
  sourceStatus?: SourceStatus
  lastUpdated?: string
  tags?: string[]
}

export interface DcaRecord {
  id: string
  accountId: string
  assetId: string
  cadence: 'weekly' | 'monthly' | 'quarterly'
  plannedAmountTHB: number
  status: 'planned' | 'approved' | 'paused' | 'review'
  nextRunDate: string
  sourceStatus: SourceStatus
  lastUpdated: string
  notes: string
  risk: 'low' | 'medium' | 'high'
  tags: string[]
}

export interface DividendRecord {
  id: string
  accountId: string
  assetId: string
  expectedAmountTHB: number
  payDate: string
  status: 'expected' | 'received' | 'review'
  sourceStatus: SourceStatus
  lastUpdated: string
  notes: string
  risk: 'low' | 'medium' | 'high'
  tags: string[]
}

export interface FinanceSnapshot {
  id: string
  module: 'investments' | 'family-office' | 'trading-lab'
  title: string
  valueTHB: number
  posture: string
  sourceStatus: SourceStatus
  lastUpdated: string
  notes: string
  risk: 'low' | 'medium' | 'high'
  tags: string[]
}

export interface FinanceLedgerRow {
  id: string
  accountId: string
  category: 'studio-income' | 'project-payment' | 'subscription' | 'equipment' | 'debt' | 'reserve-transfer' | 'expense'
  label: string
  amountTHB: number
  direction: 'inflow' | 'outflow'
  occurredAt: string
  status: 'planned' | 'cleared' | 'review'
  sourceStatus: SourceStatus
  lastUpdated: string
  notes: string
  risk: 'low' | 'medium' | 'high'
  tags: string[]
}

export interface ReserveRow {
  id: string
  accountId: string
  label: string
  currentAmountTHB: number
  targetAmountTHB: number
  status: 'healthy' | 'watch' | 'low'
  sourceStatus: SourceStatus
  lastUpdated: string
  notes: string
  risk: 'low' | 'medium' | 'high'
  tags: string[]
}

export interface TradingWatchlistItem {
  id: string
  accountId: string
  symbol: string
  thesis: string
  status: 'watching' | 'paper-active' | 'paused'
  sourceStatus: SourceStatus
  lastUpdated: string
  notes: string
  risk: 'low' | 'medium' | 'high'
  tags: string[]
}

export interface SandboxPosition {
  id: string
  accountId: string
  symbol: string
  units: number
  entryPriceTHB: number
  thesis: string
  status: 'open' | 'closed' | 'review'
  sourceStatus: SourceStatus
  lastUpdated: string
  notes: string
  risk: 'low' | 'medium' | 'high'
  tags: string[]
}

export interface PaperTradeRecord {
  id: string
  accountId: string
  symbol: string
  action: 'watch' | 'paper-buy' | 'paper-sell' | 'note'
  amountTHB: number
  occurredAt: string
  status: 'draft' | 'approved' | 'archived'
  sourceStatus: SourceStatus
  lastUpdated: string
  notes: string
  risk: 'low' | 'medium' | 'high'
  tags: string[]
}

export interface ApprovalRecord {
  id: string
  projectId: string
  title: string
  status: 'draft' | 'submitted' | 'waiting' | 'approved' | 'rejected' | 'cancelled'
  owner: string
  dueDate: string
  requestedBy: string
  notes: string
}

export interface OsData {
  projects: Project[]
  tasks: Task[]
  timeline: TimelineItem[]
  studioTimelinePhases: StudioTimelinePhase[]
  documents: DocumentRecord[]
  siteIssues: SiteIssue[]
  workScopeSections: WorkScopeSection[]
  siteWatchUpdates: SiteWatchUpdate[]
  artworkRecords: ArtworkRecord[]
  creativeBriefs: CreativeBrief[]
  studioReviews: StudioReview[]
  financeAssets: FinanceAsset[]
  holdings: Holding[]
  thaiNavAssets: ThaiNavAsset[]
  transactions: TransactionRecord[]
  familyFinanceRecords: FamilyFinanceRecord[]
  tradingSignals: TradingSignal[]
  tradingStrategyNotes: TradingStrategyNote[]
  dcaRecords: DcaRecord[]
  dividendRecords: DividendRecord[]
  financeSnapshots: FinanceSnapshot[]
  financeLedgerRows: FinanceLedgerRow[]
  reserveRows: ReserveRow[]
  tradingWatchlist: TradingWatchlistItem[]
  sandboxPositions: SandboxPosition[]
  paperTradeRecords: PaperTradeRecord[]
  aiContexts: AIContext[]
  aiSuggestions: AISuggestion[]
  aiExports: AIExportRecord[]
  aiImports: AIImportRecord[]
  aiReviews: AIReviewRecord[]
  aiMemories: AIMemoryRecord[]
  aiDigests: AIDigestRecord[]
  aiObservations: AIObservationRecord[]
  connectors: ConnectorDefinition[]
  sheetSources: SheetSourceDefinition[]
  syncQueue: SyncQueueItem[]
  bridgeContracts: BridgeContract[]
  marketDataSymbols: MarketDataSymbol[]
  approvals: ApprovalRecord[]
}

