import { useState } from 'react'
import { generateId } from '../../app/utils'
import { mockSheetWriteAdapter, validateActionRequest } from '../adapters/mockSheetWriteAdapter'
import { refreshFinanceMarketData } from '../data/providers'
import type {
  ActionRequest,
  ApprovalRecord,
  ChangeLogRecord,
  DataProviderStatus,
  OsData,
  SnapshotRecord,
  SourceStatus,
} from '../../types/models'

export function useApprovalWorkflow(
  data: OsData,
  setData: React.Dispatch<React.SetStateAction<OsData>>,
  sourceStatuses: Record<string, SourceStatus>,
  setSourceStatuses: React.Dispatch<React.SetStateAction<Record<string, SourceStatus>>>,
  setFinnhubStatus: React.Dispatch<React.SetStateAction<DataProviderStatus>>,
) {
  const [pendingApprovals, setPendingApprovals] = useState<ActionRequest[]>(() => seedApprovals(data.approvals))
  const [changeLogs, setChangeLogs] = useState<ChangeLogRecord[]>([])
  const [snapshots, setSnapshots] = useState<SnapshotRecord[]>([])
  const createActionRequest: (input: Omit<ActionRequest, 'id' | 'requestedAt' | 'requestedBy' | 'requiresApproval'>) => void = (input) => {
    const request: ActionRequest = {
      ...input,
      id: generateId('ar'),
      requestedAt: new Date().toISOString(),
      requestedBy: 'Operator',
      requiresApproval: true,
    }

    const validationErrors = validateActionRequest(request)
    if (validationErrors.length) {
      return
    }

    setPendingApprovals((current) => [request, ...current])
  }

  const approveActionRequest = async (requestId: string) => {
    const request = pendingApprovals.find((item) => item.id === requestId)
    if (!request) return

    if (request.actionType === 'finance.manualMarketRefresh') {
      const now = new Date().toISOString()
      const response = await refreshFinanceMarketData(Array.isArray(request.payload.symbols) ? request.payload.symbols.filter((symbol): symbol is string => typeof symbol === 'string') : [])
      const successful = response.results.filter((result) => !result.error && result.delayedPriceTHB)

      if (successful.length) {
        setData((current) => ({
          ...current,
          marketDataSymbols: current.marketDataSymbols.map((symbol) => {
            const result = successful.find((item) => item.symbol === symbol.symbol)
            return result
              ? {
                  ...symbol,
                  delayedPriceTHB: result.delayedPriceTHB,
                  lastUpdated: result.refreshedAt,
                  sourceStatus: {
                    ...symbol.sourceStatus,
                    lastSyncedAt: result.refreshedAt,
                    isStale: false,
                    mode: 'live',
                    health: 'healthy',
                    syncState: 'idle',
                    bridgeWarning: undefined,
                  },
                }
              : symbol
          }),
        }))
      }

      const fallbackUsed = !response.ok
      const status: SourceStatus = {
        ...sourceStatuses.finnhub,
        lastSyncedAt: now,
        isStale: fallbackUsed,
        mode: fallbackUsed ? 'fallback' : 'live',
        health: fallbackUsed ? 'warning' : 'healthy',
        syncState: fallbackUsed ? 'failed' : 'idle',
        bridgeWarning: response.error,
        pendingSyncCount: fallbackUsed ? 1 : 0,
      }
      setSourceStatuses((current) => ({ ...current, finnhub: status, investments: { ...current.investments, lastSyncedAt: now, mode: fallbackUsed ? 'fallback' : 'live', isStale: fallbackUsed, bridgeWarning: response.error } }))
      setFinnhubStatus({
        source: 'Finnhub Manual Market Refresh',
        mode: fallbackUsed ? 'fallback' : 'live',
        lastUpdated: now,
        stale: fallbackUsed,
        error: response.error,
        fallbackUsed,
      })
      setChangeLogs((logs) => [{
        id: generateId('log'),
        actionRequestId: request.id,
        module: request.module,
        actionType: request.actionType,
        summary: fallbackUsed ? `Finnhub refresh used fallback: ${response.error ?? 'unknown error'}` : `Finnhub manual refresh completed for ${successful.length} symbols`,
        changedAt: now,
        changedBy: request.requestedBy,
      }, ...logs])
      setSnapshots((records) => [{
        id: generateId('snapshot'),
        triggerActionRequestId: request.id,
        module: request.module,
        reason: 'Approved Finnhub manual market refresh',
        createdAt: now,
      }, ...records])
      setPendingApprovals((current) => current.filter((item) => item.id !== requestId))
      return
    }

    if (request.actionType === 'finance.reviewStaleMarketSource') {
      const now = new Date().toISOString()
      setSourceStatuses((current) => ({
        ...current,
        finnhub: { ...current.finnhub, lastSyncedAt: now, syncState: 'idle', pendingSyncCount: 0, bridgeWarning: 'Stale market source reviewed manually. Refresh remains manual only.' },
      }))
      setFinnhubStatus((current) => ({ ...current, lastUpdated: now, error: 'Stale market source reviewed manually. Refresh remains manual only.' }))
      setChangeLogs((logs) => [{
        id: generateId('log'),
        actionRequestId: request.id,
        module: request.module,
        actionType: request.actionType,
        summary: 'Reviewed stale Finnhub market source status',
        changedAt: now,
        changedBy: request.requestedBy,
      }, ...logs])
      setSnapshots((records) => [{
        id: generateId('snapshot'),
        triggerActionRequestId: request.id,
        module: request.module,
        reason: 'Approved stale market source review',
        createdAt: now,
      }, ...records])
      setPendingApprovals((current) => current.filter((item) => item.id !== requestId))
      return
    }

    const result = mockSheetWriteAdapter(request, data, sourceStatuses)
    setData(result.data)
    setSourceStatuses(result.sourceStatuses)
    setChangeLogs((logs) => [result.changeLog, ...logs])
    setSnapshots((records) => [result.snapshot, ...records])
    setPendingApprovals((current) => current.filter((item) => item.id !== requestId))
  }

  const rejectActionRequest = (requestId: string) => {
    const request = pendingApprovals.find((item) => item.id === requestId)
    if (request) {
      setChangeLogs((logs) => [{
        id: generateId('log'),
        actionRequestId: request.id,
        module: request.module,
        actionType: request.actionType,
        summary: `Rejected action: ${request.description}`,
        changedAt: new Date().toISOString(),
        changedBy: 'Operator',
      }, ...logs])
    }
    setPendingApprovals((current) => current.filter((item) => item.id !== requestId))
  }

  const queueSuggestionImport: (module: string, title: string, recommendation: string, riskNotes: string) => void = (
    module,
    title,
    recommendation,
    riskNotes,
  ) => {
    createActionRequest({
      module: 'ai',
      actionType: 'ai.importSuggestion',
      description: `Import AI suggestion for ${module}`,
      payload: { module, title, recommendation, riskNotes },
    })
  }

  return {
    pendingApprovals,
    changeLogs,
    snapshots,
    createActionRequest,
    approveActionRequest,
    rejectActionRequest,
    queueSuggestionImport,
  }
}

const seedApprovals = (approvals: ApprovalRecord[]): ActionRequest[] =>
  approvals
    .filter((approval) => approval.status === 'waiting' || approval.status === 'submitted')
    .map((approval) => ({
      id: `seed-${approval.id}`,
      module: 'studio',
      actionType: 'studio.approvalReview',
      description: approval.title,
      payload: {
        projectId: approval.projectId,
        title: approval.title,
        owner: approval.owner,
        dueDate: approval.dueDate,
        notes: approval.notes,
        requestedBy: approval.requestedBy,
        status: approval.status,
      },
      requestedBy: approval.requestedBy,
      requestedAt: `${approval.dueDate}T08:00:00.000+07:00`,
      requiresApproval: true,
    }))
