import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { isFinnhubConfigured, isKarunBridgeConfigured, readKarunPhuketBridge } from '../connectors'
import { createInitialOsDataFromProviders } from '../data/providers'
import { normalizeRows } from '../sheetBridge/adapters'
import { getActiveAppsScriptEndpoint } from '../sheetBridge/config'
import { SHEET_RESOURCES } from '../sheetBridge/resources'
import { loadFullHistoryCache, mergeDividendFullHistory } from '../investments/dividendFullHistoryCache'
import { loadHoldingsCache, mergeHoldingsCache } from '../investments/holdingsCache'
import { createCommandEventBus } from '../events/commandEventBus'
import { COMMAND_EVENT_LOG_LIMIT, createCommandEvent, type CommandEvent, type CommandEventInput, type CommandEventListener } from '../events/commandCenterEvents'
import { OsContext, type BridgeBootstrapDiagnostic, type OsContextValue } from './osContextObject'
import { useApprovalWorkflow } from './useApprovalWorkflow'
import type { DataProviderStatus, OsData, SourceStatus } from '../../types/models'

const ALLOWED_BRIDGE_FIELDS = new Set(['projects', 'approvals', 'financeLedgerRows', 'holdings', 'dcaRecords', 'dividendRecords', 'dividendRecordsFullHistory', 'aiContexts'])

const initialProviderState = createInitialOsDataFromProviders()
const cachedDividendHistory = loadFullHistoryCache()
const cachedHoldings = loadHoldingsCache()
const hydratedInitialData = {
  ...initialProviderState.data,
  dividendRecords: mergeDividendFullHistory(initialProviderState.data.dividendRecords, cachedDividendHistory),
  dividendRecordsFullHistory: mergeDividendFullHistory(initialProviderState.data.dividendRecordsFullHistory, cachedDividendHistory),
  holdings: mergeHoldingsCache(initialProviderState.data.holdings, cachedHoldings.records),
}
const IMPORTABLE_BRIDGE_RESOURCES = SHEET_RESOURCES.filter((resource) => resource.importEnabled !== false && ALLOWED_BRIDGE_FIELDS.has(resource.osField))

const synthesizeBootstrapDiagnosticsFromData = (data: OsData): BridgeBootstrapDiagnostic[] => {
  return IMPORTABLE_BRIDGE_RESOURCES.flatMap((resource) => {
    const value = (data as unknown as Record<string, unknown>)[resource.osField]
    const rowCount = Array.isArray(value) ? value.length : 0

    if (rowCount <= 0) {
      return []
    }

    return [{
      resourceId: resource.id,
      resourceName: resource.name,
      status: 'imported' as const,
      rowCount,
      invalidCount: 0,
      updatedAt: new Date().toISOString(),
    }]
  })
}

if (typeof window !== 'undefined') {
  const resources = [
    { label: 'Projects', count: initialProviderState.data.projects.length },
    { label: 'Holdings', count: hydratedInitialData.holdings.length },
    { label: 'DCA Plans', count: initialProviderState.data.dcaRecords.length },
    { label: 'Dividends', count: initialProviderState.data.dividendRecords.length },
    { label: 'Approvals', count: initialProviderState.data.approvals.length },
    { label: 'Capital Records', count: initialProviderState.data.financeLedgerRows.length },
    { label: 'AI Contexts', count: initialProviderState.data.aiContexts.length },
  ]
  console.group('[OsProvider] Startup Hydration')
  console.log('Provider statuses:', initialProviderState.providerStatuses)
  console.log('Holdings cache records:', cachedHoldings.records.length)
  console.log('Last holdings import timestamp:', cachedHoldings.updatedAt ?? 'n/a')
  resources.forEach((r) => console.log(`${r.label}: ${r.count} rows`))
  console.groupEnd()
}

export const OsProvider = ({ children }: { children: React.ReactNode }) => {
  const [data, setData] = useState<OsData>(hydratedInitialData)
  const [sourceStatuses, setSourceStatuses] = useState<Record<string, SourceStatus>>(initialProviderState.sourceStatuses)
  const [providerStatuses] = useState<Record<string, DataProviderStatus>>(initialProviderState.providerStatuses)
  const [bootstrapDiagnostics, setBootstrapDiagnostics] = useState<BridgeBootstrapDiagnostic[]>(() => synthesizeBootstrapDiagnosticsFromData(hydratedInitialData))
  const [commandEvents, setCommandEvents] = useState<CommandEvent[]>([])
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
  const {
    pendingApprovals,
    changeLogs,
    snapshots,
    createActionRequest,
    approveActionRequest,
    rejectActionRequest,
    queueSuggestionImport,
  } = useApprovalWorkflow(data, setData, sourceStatuses, setSourceStatuses, setFinnhubStatus)
  const hasBootstrappedRef = useRef(false)
  const commandEventBusRef = useRef(createCommandEventBus())

  const publishCommandEvent = useCallback((input: CommandEventInput) => {
    const event = createCommandEvent(input)
    setCommandEvents((current) => [event, ...current].slice(0, COMMAND_EVENT_LOG_LIMIT))
    commandEventBusRef.current.emit(event)
    return event
  }, [])

  const clearCommandEvents = useCallback(() => {
    setCommandEvents([])
  }, [])

  const subscribeToCommandEvents = useCallback((listener: CommandEventListener) => {
    return commandEventBusRef.current.subscribe(listener)
  }, [])

  const bulkMergeData = useCallback((field: string, rows: unknown[]): { appended: number; updated: number; skipped: number; total: number } => {
    if (!ALLOWED_BRIDGE_FIELDS.has(field)) {
      return { appended: 0, updated: 0, skipped: rows.length, total: 0 }
    }
    let result = { appended: 0, updated: 0, skipped: rows.length, total: 0 }

    setData((current) => {
      const arr = (current as unknown as Record<string, unknown>)[field]
      if (!Array.isArray(arr)) return current

      if (field === 'holdings') {
        const incomingRows = rows as Array<Record<string, unknown>>
        const nextHoldings = [...incomingRows] as unknown as OsData['holdings']
        result = { appended: incomingRows.length, updated: 0, skipped: 0, total: incomingRows.length }
        return { ...current, [field]: nextHoldings }
      }

      const currentIds = new Set(arr.map((item) => (item as Record<string, unknown>)?.id))
      let appended = 0
      let updated = 0
      const ids = new Set(arr.map((item) => (item as Record<string, unknown>)?.id))
      const merged = [...arr]

      for (const row of rows) {
        const id = (row as Record<string, unknown>)?.id
        if (id === undefined || id === null) {
          appended++
          merged.push(row)
        } else if (ids.has(id)) {
          if (currentIds.has(id)) {
            updated++
          }
          const index = merged.findIndex((item) => (item as Record<string, unknown>)?.id === id)
          if (index !== -1) {
            merged[index] = { ...(merged[index] as Record<string, unknown>), ...(row as Record<string, unknown>) }
          }
        } else {
          appended++
          merged.push(row)
          ids.add(id)
        }
      }

      result = { appended, updated, skipped: rows.length - appended - updated, total: merged.length }
      return { ...current, [field]: merged }
    })

    return result
  }, [])

  const restoreField = useCallback((field: string, rows: unknown[]) => {
    setData((current) => ({ ...current, [field]: rows }))
  }, [])

  const updateBridgeDiagnostic = useCallback((diagnostic: BridgeBootstrapDiagnostic) => {
    setBootstrapDiagnostics((current) => {
      const next = [...current]
      const existingIndex = next.findIndex((entry) => entry.resourceId === diagnostic.resourceId)

      if (existingIndex >= 0) {
        next[existingIndex] = diagnostic
      } else {
        next.push(diagnostic)
      }

      return next
    })
  }, [])

  const refreshKarunBridge = useCallback(async () => {
    publishCommandEvent({
      type: 'connector.refresh.started',
      category: 'connector',
      severity: 'info',
      title: 'Karun refresh started',
      message: 'Karun Phuket bridge refresh has started.',
      source: 'OsProvider.refreshKarunBridge',
      tags: ['karun', 'connector', 'studio'],
    })

    setKarunBridgeStatus((current) => ({ ...current, mode: isKarunBridgeConfigured ? 'live' : 'fallback', stale: true }))
    const response = await readKarunPhuketBridge()
    const now = new Date().toISOString()

    if (!response.ok || !response.result) {
      const error = response.error ?? 'Karun bridge refresh failed.'
      publishCommandEvent({
        type: 'connector.refresh.failed',
        category: 'connector',
        severity: 'error',
        title: 'Karun refresh failed',
        message: error,
        source: 'OsProvider.refreshKarunBridge',
        tags: ['karun', 'connector', 'studio'],
        metadata: { configured: response.configured },
      })
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

    publishCommandEvent({
      type: normalized.warnings.length > 0 ? 'connector.status.changed' : 'connector.refresh.completed',
      category: 'connector',
      severity: normalized.warnings.length > 0 ? 'warning' : 'success',
      title: normalized.warnings.length > 0 ? 'Karun refresh completed with warnings' : 'Karun refresh completed',
      message: normalized.warnings.length > 0
        ? normalized.warnings.join(' ')
        : `Studio bridge refreshed from ${normalized.sourceStatus.sourceName}.`,
      source: 'OsProvider.refreshKarunBridge',
      tags: ['karun', 'connector', 'studio'],
      metadata: {
        stale: normalized.sourceStatus.isStale,
        warnings: normalized.warnings.length,
      },
    })
  }, [publishCommandEvent])

  useEffect(() => {
    if (hasBootstrappedRef.current) return
    hasBootstrappedRef.current = true

    if (data.projects.length > 0 || data.holdings.length > 0) {
      return
    }

    const { url } = getActiveAppsScriptEndpoint()
    if (!url) {
      return
    }

    const hydrate = async () => {
      let hydratedAny = false
      const diagnostics: BridgeBootstrapDiagnostic[] = []

      for (const resource of IMPORTABLE_BRIDGE_RESOURCES) {
        try {
          const resourceUrl = new URL(url)
          resourceUrl.searchParams.set('resource', resource.id)

          const response = await fetch(resourceUrl.toString(), {
            method: 'GET',
            headers: { Accept: 'application/json' },
            signal: AbortSignal.timeout(15000),
          })

          if (!response.ok) {
          diagnostics.push({
            resourceId: resource.id,
            resourceName: resource.name,
            status: 'failed',
            rowCount: 0,
            invalidCount: 0,
            error: `HTTP ${response.status}: ${response.statusText}`,
            updatedAt: new Date().toISOString(),
          })
          continue
        }

          const parsed = await response.json() as Record<string, unknown>
          if (parsed.ok !== true || !Array.isArray(parsed.rows)) {
            diagnostics.push({
              resourceId: resource.id,
              resourceName: resource.name,
            status: 'failed',
            rowCount: 0,
            invalidCount: 0,
            error: typeof parsed.error === 'string' ? parsed.error : 'Response payload is invalid.',
            updatedAt: new Date().toISOString(),
          })
          continue
        }
          if (typeof parsed.resource === 'string' && parsed.resource && parsed.resource !== resource.id) {
            diagnostics.push({
              resourceId: resource.id,
              resourceName: resource.name,
            status: 'failed',
            rowCount: 0,
            invalidCount: 0,
            error: `Endpoint returned resource "${parsed.resource}" while "${resource.id}" was requested.`,
            updatedAt: new Date().toISOString(),
          })
          continue
        }

          const { rows, errors } = normalizeRows(parsed.rows as Record<string, unknown>[], resource)
          if (!rows.length) {
            diagnostics.push({
              resourceId: resource.id,
              resourceName: resource.name,
              status: errors.length > 0 ? 'failed' : 'empty',
              rowCount: 0,
              invalidCount: errors.length,
              error: errors.length > 0 ? 'All fetched rows were invalid for this resource.' : undefined,
              updatedAt: new Date().toISOString(),
            })
            continue
          }

          const mergeResult = bulkMergeData(resource.osField, rows)
          diagnostics.push({
            resourceId: resource.id,
            resourceName: resource.name,
            status: 'imported',
            rowCount: mergeResult.total,
            invalidCount: errors.length,
            updatedAt: new Date().toISOString(),
          })
          if (mergeResult.appended > 0 || mergeResult.updated > 0) {
            hydratedAny = true
          }

        } catch (error) {
          diagnostics.push({
            resourceId: resource.id,
            resourceName: resource.name,
            status: 'failed',
            rowCount: 0,
            invalidCount: 0,
            error: error instanceof Error ? error.message : 'Unknown bootstrap failure.',
            updatedAt: new Date().toISOString(),
          })
        }
      }

      setBootstrapDiagnostics(diagnostics)

      if (hydratedAny) {
        const now = new Date().toISOString()
        publishCommandEvent({
          type: 'system.bootstrap.completed',
          category: 'system',
          severity: 'success',
          title: 'Bootstrap hydration completed',
          message: `Imported ${diagnostics.filter((item) => item.status === 'imported').length} bridge resources during startup hydration.`,
          source: 'OsProvider.bootstrap',
          tags: ['bootstrap', 'startup'],
          metadata: {
            imported: diagnostics.filter((item) => item.status === 'imported').length,
            failed: diagnostics.filter((item) => item.status === 'failed').length,
            empty: diagnostics.filter((item) => item.status === 'empty').length,
          },
        })
        setSourceStatuses((current) => ({
          ...current,
          appsScriptBridge: {
            ...current.appsScriptBridge,
            lastSyncedAt: now,
            isStale: false,
            mode: 'live',
            health: 'healthy',
            syncState: 'idle',
            bridgeWarning: undefined,
          },
        }))
      } else if (diagnostics.some((item) => item.status === 'failed')) {
        publishCommandEvent({
          type: 'system.bootstrap.failed',
          category: 'system',
          severity: 'warning',
          title: 'Bootstrap hydration incomplete',
          message: 'Startup hydration did not import bridge rows and at least one resource failed.',
          source: 'OsProvider.bootstrap',
          tags: ['bootstrap', 'startup'],
          metadata: {
            failed: diagnostics.filter((item) => item.status === 'failed').length,
          },
        })
      }
    }

    void hydrate()
  }, [bulkMergeData, data.holdings.length, data.projects.length, publishCommandEvent])

  const value = useMemo<OsContextValue>(
    () => ({
      data,
      sourceStatuses,
      providerStatuses: { ...providerStatuses, karunBridge: karunBridgeStatus, finnhub: finnhubStatus },
      bootstrapDiagnostics,
      commandEvents,
      refreshKarunBridge,
      pendingApprovals,
      changeLogs,
      snapshots,
      createActionRequest,
      approveActionRequest,
      rejectActionRequest,
      queueSuggestionImport,
      bulkMergeData,
      restoreField,
      updateBridgeDiagnostic,
      publishCommandEvent,
      clearCommandEvents,
      subscribeToCommandEvents,
    }),
    [data, sourceStatuses, providerStatuses, bootstrapDiagnostics, commandEvents, karunBridgeStatus, finnhubStatus, pendingApprovals, changeLogs, snapshots, bulkMergeData, restoreField, updateBridgeDiagnostic, createActionRequest, approveActionRequest, rejectActionRequest, queueSuggestionImport, publishCommandEvent, clearCommandEvents, subscribeToCommandEvents, refreshKarunBridge],
  )

  return <OsContext.Provider value={value}>{children}</OsContext.Provider>
}

