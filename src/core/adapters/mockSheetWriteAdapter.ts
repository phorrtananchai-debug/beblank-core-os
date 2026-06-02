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
  transactions: [...data.transactions],
  tradingSignals: [...data.tradingSignals],
  aiSuggestions: [...data.aiSuggestions],
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

  if (request.actionType === 'ai.applySuggestion') {
    const suggestionId = String(request.payload.suggestionId ?? '')
    nextData.aiSuggestions = nextData.aiSuggestions.map((item): AISuggestion =>
      item.id === suggestionId ? { ...item, status: 'approved' } : item,
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

