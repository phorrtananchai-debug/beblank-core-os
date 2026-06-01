export type SourceMode = 'mock' | 'live' | 'fallback'

export interface SourceStatus {
  sourceName: string
  lastSyncedAt: string
  isStale: boolean
  mode: SourceMode
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

export interface Project {
  id: string
  slug: string
  name: string
  status: 'active' | 'paused' | 'planning'
  owner: string
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

export interface DocumentRecord {
  id: string
  projectId: string
  title: string
  version: string
  updatedAt: string
}

export interface SiteIssue {
  id: string
  projectId: string
  issue: string
  severity: 'low' | 'medium' | 'high'
}

export interface FinanceAsset {
  id: string
  name: string
  currency: 'THB' | 'USD'
  category: 'stock' | 'fund' | 'cash'
}

export interface Holding {
  id: string
  assetId: string
  quantity: number
  averageCost: number
}

export interface ThaiNavAsset {
  id: string
  symbol: string
  nav: number
  updatedAt: string
}

export interface TransactionRecord {
  id: string
  description: string
  amountTHB: number
  type: 'buy' | 'sell' | 'income' | 'expense'
  occurredAt: string
}

export interface FamilyFinanceRecord {
  id: string
  bucket: 'cashflow' | 'bill' | 'debt' | 'expense' | 'reserve'
  label: string
  amountTHB: number
  dueDate?: string
}

export interface TradingSignal {
  id: string
  symbol: string
  signal: 'watch' | 'enter' | 'exit'
  confidence: number
  note: string
}

export interface TradingStrategyNote {
  id: string
  title: string
  note: string
  riskLevel: 'low' | 'medium' | 'high'
}

export interface OsData {
  projects: Project[]
  tasks: Task[]
  timeline: TimelineItem[]
  documents: DocumentRecord[]
  siteIssues: SiteIssue[]
  financeAssets: FinanceAsset[]
  holdings: Holding[]
  thaiNavAssets: ThaiNavAsset[]
  transactions: TransactionRecord[]
  familyFinanceRecords: FamilyFinanceRecord[]
  tradingSignals: TradingSignal[]
  tradingStrategyNotes: TradingStrategyNote[]
  aiContexts: AIContext[]
  aiSuggestions: AISuggestion[]
}

