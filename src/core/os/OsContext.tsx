import { createContext, useContext, useMemo, useState } from 'react'
import { generateId } from '../../app/utils'
import { isKarunBridgeConfigured } from '../connectors/appsScript/config'
import { readKarunPhuketBridge } from '../connectors/appsScript/karunReadConnector'
import { isFinnhubConfigured } from '../connectors/finnhub/config'
import { mockSheetWriteAdapter, validateActionRequest } from '../adapters/mockSheetWriteAdapter'
import { createInitialOsDataFromProviders, refreshFinanceMarketData } from '../data/providers'
import type {
  ActionRequest,
  ChangeLogRecord,
  DataProviderStatus,
  OsData,
  SnapshotRecord,
  SourceStatus,
} from '../../types/models'

interface OsContextValue {
  data: OsData
  sourceStatuses: Record<string, SourceStatus>
  providerStatuses: Record<string, DataProviderStatus>
  refreshKarunBridge: () => Promise<void>
  pendingApprovals: ActionRequest[]
  changeLogs: ChangeLogRecord[]
  snapshots: SnapshotRecord[]
  createActionRequest: (input: Omit<ActionRequest, 'id' | 'requestedAt' | 'requestedBy' | 'requiresApproval'>) => void
  approveActionRequest: (requestId: string) => void
  rejectActionRequest: (requestId: string) => void
  queueSuggestionImport: (module: string, title: string, recommendation: string, riskNotes: string) => void
}

const OsContext = createContext<OsContextValue | undefined>(undefined)
const initialProviderState = createInitialOsDataFromProviders()

export const OsProvider = ({ children }: { children: React.ReactNode }) => {
  const [data, setData] = useState<OsData>(initialProviderState.data)
  const [sourceStatuses, setSourceStatuses] = useState<Record<string, SourceStatus>>(initialProviderState.sourceStatuses)
  const [providerStatuses] = useState<Record<string, DataProviderStatus>>(initialProviderState.providerStatuses)
  const [karunBridgeStatus, setKarunBridgeStatus] = useState<DataProviderStatus>({
    source: 'Karun Phuket Apps Script Read Bridge',
    mode: isKarunBridgeConfigured ? 'live' : 'fallback',
    lastUpdated: initialProviderState.sourceStatuses.appsScriptBridge.lastSyncedAt,
    stale: true,
    error: isKarunBridgeConfigured ? undefined : 'VITE_APPS_SCRIPT_KARUN_ENDPOINT is not configured.',
    fallbackUsed: !isKarunBridgeConfigured,
  })
  const [finnhubStatus, setFinnhubStatus] = useState<DataProviderStatus>({
    source: 'Finnhub Manual Market Refresh',
    mode: isFinnhubConfigured ? 'live' : 'fallback',
    lastUpdated: initialProviderState.sourceStatuses.finnhub.lastSyncedAt,
    stale: true,
    error: isFinnhubConfigured ? undefined : 'VITE_FINNHUB_API_KEY is not configured.',
    fallbackUsed: !isFinnhubConfigured,
  })
  const [pendingApprovals, setPendingApprovals] = useState<ActionRequest[]>([])
  const [changeLogs, setChangeLogs] = useState<ChangeLogRecord[]>([])
  const [snapshots, setSnapshots] = useState<SnapshotRecord[]>([])

  const createActionRequest: OsContextValue['createActionRequest'] = (input) => {
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
    setPendingApprovals((current) => current.filter((item) => item.id !== requestId))
  }

  const refreshKarunBridge = async () => {
    setKarunBridgeStatus((current) => ({ ...current, mode: isKarunBridgeConfigured ? 'live' : 'fallback', stale: true }))
    const response = await readKarunPhuketBridge()
    const now = new Date().toISOString()

    if (!response.ok || !response.result) {
      const error = response.error ?? 'Karun bridge refresh failed.'
      setKarunBridgeStatus({
        source: 'Karun Phuket Apps Script Read Bridge',
        mode: response.configured ? 'fallback' : 'fallback',
        lastUpdated: now,
        stale: true,
        error,
        fallbackUsed: true,
      })
      setSourceStatuses((current) => ({
        ...current,
        appsScriptBridge: {
          ...current.appsScriptBridge,
          isStale: true,
          lastSyncedAt: now,
          mode: 'fallback',
          health: response.configured ? 'warning' : 'disconnected',
          syncState: response.configured ? 'failed' : 'review-required',
          bridgeWarning: error,
        },
        studio: {
          ...current.studio,
          mode: 'fallback',
          bridgeWarning: `Karun bridge fallback used: ${error}`,
        },
      }))
      return
    }

    const normalized = response.result
    setData((current) => ({
      ...current,
      projects: normalized.project ? current.projects.map((project) => project.id === normalized.project?.id ? { ...project, ...normalized.project } : project) : current.projects,
      studioTimelinePhases: normalized.timelinePhases.length ? [...normalized.timelinePhases, ...current.studioTimelinePhases.filter((phase) => phase.projectId !== 'p1')] : current.studioTimelinePhases,
      workScopeSections: normalized.workScopeSections.length ? [...normalized.workScopeSections, ...current.workScopeSections.filter((scope) => scope.projectId !== 'p1')] : current.workScopeSections,
      siteWatchUpdates: normalized.siteWatchUpdates.length ? [...normalized.siteWatchUpdates, ...current.siteWatchUpdates.filter((update) => update.projectId !== 'p1')] : current.siteWatchUpdates,
      documents: normalized.documents.length ? [...normalized.documents, ...current.documents.filter((document) => document.projectId !== 'p1')] : current.documents,
      studioReviews: normalized.studioReviews.length ? [...normalized.studioReviews, ...current.studioReviews.filter((review) => review.projectId !== 'p1')] : current.studioReviews,
    }))
    setSourceStatuses((current) => ({
      ...current,
      appsScriptBridge: normalized.sourceStatus,
      studio: {
        ...current.studio,
        mode: 'live',
        isStale: normalized.sourceStatus.isStale,
        lastSyncedAt: normalized.sourceStatus.lastSyncedAt,
        health: normalized.warnings.length ? 'warning' : 'healthy',
        syncState: 'idle',
        bridgeWarning: normalized.warnings.length ? normalized.warnings.join(' ') : undefined,
      },
    }))
    setKarunBridgeStatus({
      source: normalized.sourceStatus.sourceName,
      mode: 'live',
      lastUpdated: normalized.sourceStatus.lastSyncedAt,
      stale: normalized.sourceStatus.isStale,
      error: normalized.warnings.length ? normalized.warnings.join(' ') : undefined,
      fallbackUsed: false,
    })
  }

  const queueSuggestionImport: OsContextValue['queueSuggestionImport'] = (
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

  const value = useMemo<OsContextValue>(
    () => ({
      data,
      sourceStatuses,
      providerStatuses: { ...providerStatuses, karunBridge: karunBridgeStatus, finnhub: finnhubStatus },
      refreshKarunBridge,
      pendingApprovals,
      changeLogs,
      snapshots,
      createActionRequest,
      approveActionRequest,
      rejectActionRequest,
      queueSuggestionImport,
    }),
    [data, sourceStatuses, providerStatuses, karunBridgeStatus, finnhubStatus, pendingApprovals, changeLogs, snapshots],
  )

  return <OsContext.Provider value={value}>{children}</OsContext.Provider>
}

export const useOs = () => {
  const context = useContext(OsContext)
  if (!context) {
    throw new Error('useOs must be used within OsProvider')
  }
  return context
}

