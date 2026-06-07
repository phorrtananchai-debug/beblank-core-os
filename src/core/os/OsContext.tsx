import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { isFinnhubConfigured, isKarunBridgeConfigured, readKarunPhuketBridge } from '../connectors'
import { createInitialOsDataFromProviders } from '../data/providers'
import { normalizeRows } from '../sheetBridge/adapters'
import { getActiveAppsScriptEndpoint } from '../sheetBridge/config'
import { SHEET_RESOURCES } from '../sheetBridge/resources'
import { OsContext, type OsContextValue } from './osContextObject'
import { useApprovalWorkflow } from './useApprovalWorkflow'
import type { DataProviderStatus, OsData, SourceStatus } from '../../types/models'

const ALLOWED_BRIDGE_FIELDS = new Set(['projects', 'approvals', 'financeLedgerRows', 'holdings', 'dcaRecords', 'dividendRecords', 'aiContexts'])

const initialProviderState = createInitialOsDataFromProviders()

if (typeof window !== 'undefined') {
  const resources = [
    { label: 'Projects', count: initialProviderState.data.projects.length },
    { label: 'Holdings', count: initialProviderState.data.holdings.length },
    { label: 'DCA Plans', count: initialProviderState.data.dcaRecords.length },
    { label: 'Dividends', count: initialProviderState.data.dividendRecords.length },
    { label: 'Approvals', count: initialProviderState.data.approvals.length },
    { label: 'Capital Records', count: initialProviderState.data.financeLedgerRows.length },
    { label: 'AI Contexts', count: initialProviderState.data.aiContexts.length },
  ]
  console.group('[OsProvider] Startup Hydration')
  console.log('Provider statuses:', initialProviderState.providerStatuses)
  resources.forEach((r) => console.log(`${r.label}: ${r.count} rows`))
  console.groupEnd()
}

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

  const bulkMergeData = useCallback((field: string, rows: unknown[]): { appended: number; updated: number; skipped: number } => {
    if (!ALLOWED_BRIDGE_FIELDS.has(field)) {
      return { appended: 0, updated: 0, skipped: rows.length }
    }
    let result = { appended: 0, updated: 0, skipped: rows.length }

    setData((current) => {
      const arr = (current as unknown as Record<string, unknown>)[field]
      if (!Array.isArray(arr)) return current

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

      result = { appended, updated, skipped: rows.length - appended - updated }
      return { ...current, [field]: merged }
    })

    return result
  }, [])

  const restoreField = useCallback((field: string, rows: unknown[]) => {
    setData((current) => ({ ...current, [field]: rows }))
  }, [])

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
      const importableResources = SHEET_RESOURCES.filter((resource) => resource.importEnabled !== false && ALLOWED_BRIDGE_FIELDS.has(resource.osField))

      for (const resource of importableResources) {
        try {
          const resourceUrl = new URL(url)
          resourceUrl.searchParams.set('resource', resource.id)

          const response = await fetch(resourceUrl.toString(), {
            method: 'GET',
            headers: { Accept: 'application/json' },
            signal: AbortSignal.timeout(15000),
          })

          if (!response.ok) continue

          const parsed = await response.json() as Record<string, unknown>
          if (parsed.ok !== true || !Array.isArray(parsed.rows)) continue
          if (typeof parsed.resource === 'string' && parsed.resource && parsed.resource !== resource.id) continue

          const { rows } = normalizeRows(parsed.rows as Record<string, unknown>[], resource)
          if (!rows.length) continue

          const mergeResult = bulkMergeData(resource.osField, rows)
          if (mergeResult.appended > 0 || mergeResult.updated > 0) {
            hydratedAny = true
          }
        } catch {
          // Safe bootstrap preserves current state on any read failure.
        }
      }

      if (hydratedAny) {
        const now = new Date().toISOString()
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
      }
    }

    void hydrate()
  }, [bulkMergeData, data.holdings.length, data.projects.length])

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
      bulkMergeData,
      restoreField,
    }),
    [data, sourceStatuses, providerStatuses, karunBridgeStatus, finnhubStatus, pendingApprovals, changeLogs, snapshots, bulkMergeData, restoreField, createActionRequest, approveActionRequest, rejectActionRequest, queueSuggestionImport],
  )

  return <OsContext.Provider value={value}>{children}</OsContext.Provider>
}

