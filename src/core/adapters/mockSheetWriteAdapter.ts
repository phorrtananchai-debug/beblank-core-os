import { generateId } from '../../app/utils'
import type {
  ActionRequest,
  AISuggestion,
  ChangeLogRecord,
  OsData,
  SnapshotRecord,
  SourceStatus,
  StudioTimelinePhase,
  Task,
  TimelineItem,
  TransactionRecord,
  TradingSignal,
  WorkScopeSection,
} from '../../types/models'

export interface AdapterResult {
  data: OsData
  changeLog: ChangeLogRecord
  snapshot: SnapshotRecord
  sourceStatuses: Record<string, SourceStatus>
}

const cloneData = (data: OsData): OsData => ({
  ...data,
  tasks: [...data.tasks],
  timeline: [...data.timeline],
  studioTimelinePhases: [...data.studioTimelinePhases],
  documents: [...data.documents],
  siteIssues: [...data.siteIssues],
  workScopeSections: [...data.workScopeSections],
  siteWatchUpdates: [...data.siteWatchUpdates],
  creativeBriefs: [...data.creativeBriefs],
  studioReviews: [...data.studioReviews],
  financeAssets: [...data.financeAssets],
  holdings: [...data.holdings],
  thaiNavAssets: [...data.thaiNavAssets],
  transactions: [...data.transactions],
  familyFinanceRecords: [...data.familyFinanceRecords],
  tradingSignals: [...data.tradingSignals],
  tradingStrategyNotes: [...data.tradingStrategyNotes],
  aiSuggestions: [...data.aiSuggestions],
  dcaRecords: [...data.dcaRecords],
  dividendRecords: [...data.dividendRecords],
  financeSnapshots: [...data.financeSnapshots],
  financeLedgerRows: [...data.financeLedgerRows],
  reserveRows: [...data.reserveRows],
  tradingWatchlist: [...data.tradingWatchlist],
  sandboxPositions: [...data.sandboxPositions],
  paperTradeRecords: [...data.paperTradeRecords],
  aiExports: [...data.aiExports],
  aiImports: [...data.aiImports],
  aiReviews: [...data.aiReviews],
  aiMemories: [...data.aiMemories],
  aiDigests: [...data.aiDigests],
  aiObservations: [...data.aiObservations],
  connectors: [...data.connectors],
  sheetSources: [...data.sheetSources],
  syncQueue: [...data.syncQueue],
  bridgeContracts: [...data.bridgeContracts],
  marketDataSymbols: [...data.marketDataSymbols],
})

export const validateActionRequest = (request: ActionRequest): string[] => {
  const errors: string[] = []
  if (!request.actionType) errors.push('Action type is required')
  if (!request.module) errors.push('Module is required')
  if (!request.description.trim()) errors.push('Description is required')
  return errors
}

export const mockSheetWriteAdapter = (
  request: ActionRequest,
  currentData: OsData,
  sourceStatuses: Record<string, SourceStatus>,
): AdapterResult => {
  const nextData = cloneData(currentData)
  const statusMap = { ...sourceStatuses }
  const now = new Date().toISOString()

  if (request.actionType === 'studio.addTask') {
    const task: Task = {
      id: generateId('task'),
      projectId: 'p1',
      title: String(request.payload.title ?? 'New studio task'),
      status: 'todo',
    }
    nextData.tasks.unshift(task)
    statusMap.studio = { ...statusMap.studio, lastSyncedAt: now, isStale: false }
  }

  if (request.actionType === 'studio.addTimeline') {
    const item: TimelineItem = {
      id: generateId('timeline'),
      projectId: 'p1',
      label: String(request.payload.label ?? 'Milestone'),
      dueDate: String(request.payload.dueDate ?? '2026-06-30'),
      state: 'planned',
    }
    nextData.timeline.unshift(item)
    statusMap.studio = { ...statusMap.studio, lastSyncedAt: now, isStale: false }
  }

  if (request.actionType === 'studio.approveWorkScopeRevision') {
    const scopeId = String(request.payload.scopeId ?? '')
    nextData.workScopeSections = nextData.workScopeSections.map((section): WorkScopeSection =>
      section.id === scopeId
        ? { ...section, reviewStatus: 'approved', operationalStatus: 'active' }
        : section,
    )
    nextData.studioReviews = nextData.studioReviews.map((review) =>
      review.linkedRecordId === scopeId ? { ...review, status: 'approved' } : review,
    )
    statusMap.studio = { ...statusMap.studio, lastSyncedAt: now, isStale: false }
  }

  if (request.actionType === 'studio.issueDocumentPackage') {
    const documentId = String(request.payload.documentId ?? '')
    nextData.documents = nextData.documents.map((document) =>
      document.id === documentId
        ? { ...document, approvalState: 'issued', updatedAt: now.slice(0, 10) }
        : document,
    )
    nextData.studioReviews = nextData.studioReviews.map((review) =>
      review.linkedRecordId === documentId ? { ...review, status: 'approved' } : review,
    )
    statusMap.studio = { ...statusMap.studio, lastSyncedAt: now, isStale: false }
  }

  if (request.actionType === 'studio.resolveSiteWatch') {
    const siteWatchId = String(request.payload.siteWatchId ?? '')
    nextData.siteWatchUpdates = nextData.siteWatchUpdates.map((update) =>
      update.id === siteWatchId ? { ...update, status: 'resolved' } : update,
    )
    nextData.studioReviews = nextData.studioReviews.map((review) =>
      review.linkedRecordId === siteWatchId ? { ...review, status: 'resolved' } : review,
    )
    statusMap.studio = { ...statusMap.studio, lastSyncedAt: now, isStale: false }
  }

  if (request.actionType === 'studio.approveCreativeBrief') {
    const briefId = String(request.payload.briefId ?? '')
    nextData.creativeBriefs = nextData.creativeBriefs.map((brief) =>
      brief.id === briefId ? { ...brief, status: 'approved' } : brief,
    )
    nextData.studioReviews = nextData.studioReviews.map((review) =>
      review.linkedRecordId === briefId ? { ...review, status: 'approved' } : review,
    )
    statusMap.studio = { ...statusMap.studio, lastSyncedAt: now, isStale: false }
  }

  if (request.actionType === 'studio.markTimelinePhaseReviewed') {
    const phaseId = String(request.payload.phaseId ?? '')
    nextData.studioTimelinePhases = nextData.studioTimelinePhases.map((phase): StudioTimelinePhase =>
      phase.id === phaseId
        ? {
            ...phase,
            status: phase.status === 'complete' ? 'complete' : 'reviewed',
            risk: phase.risk === 'high' ? 'medium' : phase.risk,
            notes: `${phase.notes} Reviewed manually through Studio Timeline.`,
          }
        : phase,
    )
    statusMap.studio = { ...statusMap.studio, lastSyncedAt: now, isStale: false }
  }

  if (request.actionType === 'finance.addTransaction') {
    const tx: TransactionRecord = {
      id: generateId('tx'),
      description: String(request.payload.description ?? 'Manual transaction'),
      amountTHB: Number(request.payload.amountTHB ?? 0),
      type: 'buy',
      occurredAt: String(request.payload.occurredAt ?? now.slice(0, 10)),
    }
    nextData.transactions.unshift(tx)
    statusMap.investments = { ...statusMap.investments, lastSyncedAt: now, isStale: false }
  }

  if (request.actionType === 'finance.addManualAsset') {
    const symbol = String(request.payload.symbol ?? 'MANUAL').trim().toUpperCase()
    const assetType = String(request.payload.assetType ?? 'other')
    const currency = String(request.payload.currency ?? 'THB') === 'USD' ? 'USD' : 'THB'
    const units = Number(request.payload.units ?? 0)
    const averageCost = Number(request.payload.avgCost ?? 0)
    const manualContribution = Number(request.payload.manualContribution ?? units * averageCost)
    const helperPrice = Number(request.payload.currentHelperPrice ?? 0)
    const estimatedValue = helperPrice > 0 ? units * helperPrice : manualContribution
    const assetId = generateId('asset')

    nextData.financeAssets.unshift({
      id: assetId,
      symbol,
      name: String(request.payload.displayName ?? symbol),
      currency,
      category: assetType === 'us-equity-etf' ? 'etf' : assetType === 'cash' ? 'cash' : assetType.includes('thai') ? 'fund' : 'stock',
      region: assetType.startsWith('thai') ? 'TH' : currency === 'USD' ? 'US' : 'Global',
      assetType: assetType as 'us-equity-etf' | 'thai-stock' | 'thai-mutual-fund' | 'thai-rmf' | 'cash' | 'other',
      market: assetType.startsWith('thai') ? 'TH' : currency === 'USD' ? 'US' : 'manual',
      sourceOfTruth: 'manual',
      helperSource: String(request.payload.helperSource ?? 'none') as 'finnhub' | 'thai-nav' | 'manual-nav' | 'google-sheet-nav' | 'none',
      currentHelperPrice: helperPrice || undefined,
      manualContribution,
      sourceStatus: { ...statusMap.investments, authority: 'manual', lastSyncedAt: now, isStale: false },
      createdAt: now,
      updatedAt: now,
      lastUpdated: now.slice(0, 10),
      notes: String(request.payload.notes ?? 'Manual portfolio input. External helper data cannot overwrite this asset.'),
      tags: String(request.payload.tags ?? 'manual').split(',').map((tag) => tag.trim()).filter(Boolean),
    })

    nextData.holdings.unshift({
      id: generateId('hold'),
      accountId: 'acct-invest-manual',
      assetId,
      units,
      quantity: units,
      averageCost,
      marketValueTHB: currency === 'USD' ? Math.round(estimatedValue * 36.5) : Math.round(estimatedValue),
      allocationPercent: 0,
      targetAllocationPercent: 0,
      currentPosture: assetType === 'cash' ? 'reserve' : 'watch',
      dcaStatus: 'review',
      dividendStatus: 'review',
      sourceStatus: { ...statusMap.investments, authority: 'manual', lastSyncedAt: now, isStale: false },
      lastUpdated: now.slice(0, 10),
      notes: 'Created from approved manual asset input. Finnhub/Thai NAV helper data is enrichment only.',
      risk: assetType === 'cash' ? 'low' : 'medium',
      tags: ['manual-input', assetType],
    })

    nextData.transactions.unshift({
      id: generateId('tx'),
      accountId: 'acct-invest-manual',
      assetId,
      description: `Manual asset input: ${symbol}`,
      amountTHB: currency === 'USD' ? Math.round(manualContribution * 36.5) : Math.round(manualContribution),
      type: 'buy',
      occurredAt: String(request.payload.transactionDate ?? now.slice(0, 10)),
      sourceStatus: { ...statusMap.investments, authority: 'manual', lastSyncedAt: now, isStale: false },
      lastUpdated: now.slice(0, 10),
      notes: String(request.payload.notes ?? 'Manual asset transaction row.'),
      risk: 'low',
      tags: ['manual-input'],
    })

    statusMap.investments = { ...statusMap.investments, lastSyncedAt: now, isStale: false, authority: 'manual' }
  }

  if (request.actionType === 'finance.approveDcaContribution') {
    const dcaId = String(request.payload.dcaId ?? '')
    nextData.dcaRecords = nextData.dcaRecords.map((record) =>
      record.id === dcaId ? { ...record, status: 'approved', lastUpdated: now.slice(0, 10) } : record,
    )
    const record = nextData.dcaRecords.find((item) => item.id === dcaId)
    if (record) {
      nextData.transactions.unshift({
        id: generateId('tx'),
        accountId: record.accountId,
        assetId: record.assetId,
        description: `Approved DCA contribution: ${record.assetId}`,
        amountTHB: record.plannedAmountTHB,
        type: 'buy',
        occurredAt: now.slice(0, 10),
        sourceStatus: statusMap.investments,
        lastUpdated: now.slice(0, 10),
        notes: 'Created from approved DCA mock action.',
        risk: record.risk,
        tags: ['dca', 'approved'],
      })
    }
    statusMap.investments = { ...statusMap.investments, lastSyncedAt: now, isStale: false }
  }

  if (request.actionType === 'finance.resolveAllocationDrift') {
    const holdingId = String(request.payload.holdingId ?? '')
    nextData.holdings = nextData.holdings.map((holding) =>
      holding.id === holdingId ? { ...holding, dcaStatus: 'paused', notes: `${holding.notes ?? ''} Drift reviewed manually.` } : holding,
    )
    statusMap.investments = { ...statusMap.investments, lastSyncedAt: now, isStale: false }
  }

  if (request.actionType === 'finance.approveReserveTransfer') {
    const reserveId = String(request.payload.reserveId ?? '')
    const amountTHB = Number(request.payload.amountTHB ?? 0)
    nextData.reserveRows = nextData.reserveRows.map((reserve) =>
      reserve.id === reserveId
        ? { ...reserve, currentAmountTHB: reserve.currentAmountTHB + amountTHB, status: reserve.currentAmountTHB + amountTHB >= reserve.targetAmountTHB ? 'healthy' : 'watch', lastUpdated: now.slice(0, 10) }
        : reserve,
    )
    nextData.financeLedgerRows.unshift({
      id: generateId('ledger'),
      accountId: 'acct-cash-reserve',
      category: 'reserve-transfer',
      label: 'Approved reserve transfer',
      amountTHB,
      direction: 'inflow',
      occurredAt: now.slice(0, 10),
      status: 'cleared',
      sourceStatus: statusMap.familyOffice,
      lastUpdated: now.slice(0, 10),
      notes: 'Created from approved reserve transfer mock action.',
      risk: 'low',
      tags: ['reserve', 'approved'],
    })
    statusMap.familyOffice = { ...statusMap.familyOffice, lastSyncedAt: now, isStale: false }
  }

  if (request.actionType === 'trading.addSignal') {
    const signal: TradingSignal = {
      id: generateId('signal'),
      symbol: String(request.payload.symbol ?? 'SET50'),
      signal: 'watch',
      confidence: Number(request.payload.confidence ?? 50),
      note: String(request.payload.note ?? 'Manual import from notebook'),
    }
    nextData.tradingSignals.unshift(signal)
    statusMap.tradingLab = { ...statusMap.tradingLab, lastSyncedAt: now, isStale: false }
  }

  if (request.actionType === 'trading.approvePaperTradeNote') {
    const paperTradeId = String(request.payload.paperTradeId ?? '')
    const positionId = String(request.payload.positionId ?? '')
    nextData.paperTradeRecords = nextData.paperTradeRecords.map((record) =>
      record.id === paperTradeId ? { ...record, status: 'approved', lastUpdated: now.slice(0, 10) } : record,
    )
    nextData.sandboxPositions = nextData.sandboxPositions.map((position) =>
      position.id === positionId ? { ...position, status: 'open', lastUpdated: now.slice(0, 10) } : position,
    )
    statusMap.tradingLab = { ...statusMap.tradingLab, lastSyncedAt: now, isStale: false }
  }

  if (request.actionType === 'trading.archiveStrategyNote') {
    const noteId = String(request.payload.noteId ?? '')
    nextData.tradingStrategyNotes = nextData.tradingStrategyNotes.map((note) =>
      note.id === noteId ? { ...note, status: 'archived', lastUpdated: now.slice(0, 10) } : note,
    )
    statusMap.tradingLab = { ...statusMap.tradingLab, lastSyncedAt: now, isStale: false }
  }

  if (request.actionType === 'ai.applySuggestion') {
    const suggestionId = String(request.payload.suggestionId ?? '')
    nextData.aiSuggestions = nextData.aiSuggestions.map((item): AISuggestion =>
      item.id === suggestionId ? { ...item, status: 'approved' } : item,
    )
    statusMap.aiWorkflow = { ...statusMap.aiWorkflow, lastSyncedAt: now, isStale: false }
  }

  if (request.actionType === 'ai.approveImportReview') {
    const importId = String(request.payload.importId ?? '')
    nextData.aiImports = nextData.aiImports.map((item) =>
      item.id === importId ? { ...item, reviewStatus: 'approved', approvedBy: request.requestedBy } : item,
    )
    nextData.aiReviews = nextData.aiReviews.map((item) =>
      item.sourceIds.includes(importId) ? { ...item, reviewStatus: 'approved', approvedBy: request.requestedBy } : item,
    )
    statusMap.aiWorkflow = { ...statusMap.aiWorkflow, lastSyncedAt: now, isStale: false }
  }

  if (request.actionType === 'ai.rejectImportReview') {
    const importId = String(request.payload.importId ?? '')
    nextData.aiImports = nextData.aiImports.map((item) =>
      item.id === importId ? { ...item, reviewStatus: 'rejected', approvedBy: request.requestedBy } : item,
    )
    nextData.aiReviews = nextData.aiReviews.map((item) =>
      item.sourceIds.includes(importId) ? { ...item, reviewStatus: 'rejected', approvedBy: request.requestedBy } : item,
    )
    statusMap.aiWorkflow = { ...statusMap.aiWorkflow, lastSyncedAt: now, isStale: false }
  }

  if (request.actionType === 'ai.archiveMemory') {
    const memoryId = String(request.payload.memoryId ?? '')
    nextData.aiMemories = nextData.aiMemories.map((item) =>
      item.id === memoryId ? { ...item, reviewStatus: 'archived' } : item,
    )
    statusMap.aiWorkflow = { ...statusMap.aiWorkflow, lastSyncedAt: now, isStale: false }
  }

  if (request.actionType === 'ai.applyBriefRefinement') {
    const importId = String(request.payload.importId ?? '')
    const linkedImport = nextData.aiImports.find((item) => item.id === importId)
    nextData.aiImports = nextData.aiImports.map((item) =>
      item.id === importId ? { ...item, reviewStatus: 'approved', approvedBy: request.requestedBy } : item,
    )
    if (linkedImport) {
      nextData.aiMemories.unshift({
        id: generateId('aimem'),
        module: linkedImport.module,
        sourceIds: [linkedImport.id, ...linkedImport.sourceIds],
        snapshotId: linkedImport.snapshotId,
        createdAt: now,
        sourceStatus: statusMap.aiWorkflow,
        title: `Applied refinement: ${linkedImport.title}`,
        body: linkedImport.diffPreview,
        memoryType: 'decision',
        confidence: linkedImport.confidence,
        reviewStatus: 'active',
        approvedBy: request.requestedBy,
        notes: 'Created from approved AI brief refinement mock action.',
        tags: ['ai-review', 'brief-refinement'],
      })
    }
    statusMap.aiWorkflow = { ...statusMap.aiWorkflow, lastSyncedAt: now, isStale: false }
  }

  if (request.actionType === 'ai.approveDigest') {
    const digestId = String(request.payload.digestId ?? '')
    nextData.aiDigests = nextData.aiDigests.map((item) =>
      item.id === digestId ? { ...item, reviewStatus: 'approved', approvedBy: request.requestedBy } : item,
    )
    statusMap.aiWorkflow = { ...statusMap.aiWorkflow, lastSyncedAt: now, isStale: false }
  }

  if (request.actionType === 'ai.archiveObservation') {
    const observationId = String(request.payload.observationId ?? '')
    nextData.aiObservations = nextData.aiObservations.map((item) =>
      item.id === observationId ? { ...item, reviewStatus: 'archived', approvedBy: request.requestedBy } : item,
    )
    statusMap.aiWorkflow = { ...statusMap.aiWorkflow, lastSyncedAt: now, isStale: false }
  }

  if (request.actionType === 'ai.importSuggestion') {
    const suggestion: AISuggestion = {
      id: generateId('suggestion'),
      module: String(request.payload.module ?? 'General'),
      title: String(request.payload.title ?? 'Imported suggestion'),
      recommendation: String(request.payload.recommendation ?? ''),
      riskNotes: String(request.payload.riskNotes ?? ''),
      createdAt: now,
      status: 'imported',
    }
    nextData.aiSuggestions = [suggestion, ...nextData.aiSuggestions]
    statusMap.aiWorkflow = { ...statusMap.aiWorkflow, lastSyncedAt: now, isStale: false }
  }

  if (request.actionType === 'bridge.approveTimelineSync') {
    const syncId = String(request.payload.syncId ?? '')
    nextData.syncQueue = nextData.syncQueue.map((item) =>
      item.id === syncId ? { ...item, status: 'approved', lastAttemptAt: now, retryCount: item.retryCount + 1 } : item,
    )
    nextData.sheetSources = nextData.sheetSources.map((source) =>
      source.id === 'sheet-studio-ops'
        ? { ...source, syncState: 'idle', lastSyncedAt: now, sourceStatus: { ...source.sourceStatus, lastSyncedAt: now, isStale: false, syncState: 'idle', pendingSyncCount: 0 } }
        : source,
    )
    statusMap.studio = { ...statusMap.studio, lastSyncedAt: now, isStale: false, syncState: 'idle', pendingSyncCount: 0 }
    statusMap.appsScriptBridge = { ...statusMap.appsScriptBridge, lastSyncedAt: now, isStale: false, syncState: 'idle', pendingSyncCount: 0, health: 'healthy' }
  }

  if (request.actionType === 'bridge.approveFinanceRefresh') {
    const syncId = String(request.payload.syncId ?? '')
    nextData.syncQueue = nextData.syncQueue.map((item) =>
      item.id === syncId ? { ...item, status: 'approved', lastAttemptAt: now, retryCount: item.retryCount + 1 } : item,
    )
    nextData.marketDataSymbols = nextData.marketDataSymbols.map((symbol) => ({
      ...symbol,
      lastUpdated: now,
      sourceStatus: { ...symbol.sourceStatus, lastSyncedAt: now, isStale: false, syncState: 'idle', health: 'healthy' },
    }))
    statusMap.finnhub = { ...statusMap.finnhub, lastSyncedAt: now, isStale: false, syncState: 'idle', pendingSyncCount: 0, health: 'healthy' }
    statusMap.investments = { ...statusMap.investments, lastSyncedAt: now, isStale: false, syncState: 'idle', pendingSyncCount: 0 }
  }

  if (request.actionType === 'bridge.approveSheetExport') {
    const syncId = String(request.payload.syncId ?? '')
    nextData.syncQueue = nextData.syncQueue.map((item) =>
      item.id === syncId ? { ...item, status: 'approved', lastAttemptAt: now, retryCount: item.retryCount + 1 } : item,
    )
    statusMap.aiWorkflow = { ...statusMap.aiWorkflow, lastSyncedAt: now, isStale: false, syncState: 'idle', pendingSyncCount: 0 }
  }

  if (request.actionType === 'bridge.retryStaleSourceSync') {
    const syncId = String(request.payload.syncId ?? '')
    nextData.syncQueue = nextData.syncQueue.map((item) =>
      item.id === syncId ? { ...item, status: 'pending', lastAttemptAt: now, retryCount: item.retryCount + 1, notes: `${item.notes} Manual retry queued.` } : item,
    )
    statusMap.appsScriptBridge = { ...statusMap.appsScriptBridge, lastSyncedAt: now, isStale: true, syncState: 'pending', pendingSyncCount: 1, health: 'warning' }
  }

  const changeLog: ChangeLogRecord = {
    id: generateId('log'),
    actionRequestId: request.id,
    module: request.module,
    actionType: request.actionType,
    summary: request.description,
    changedAt: now,
    changedBy: request.requestedBy,
  }

  const snapshot: SnapshotRecord = {
    id: generateId('snapshot'),
    triggerActionRequestId: request.id,
    module: request.module,
    reason: `Approved apply for ${request.actionType}`,
    createdAt: now,
  }

  return { data: nextData, changeLog, snapshot, sourceStatuses: statusMap }
}

