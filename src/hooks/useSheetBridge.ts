import { useState, useCallback, useEffect } from 'react'
import { SHEET_RESOURCES } from '../core/sheetBridge/resources'
import { getActiveAppsScriptEndpoint, getEnvAppsScriptEndpoint, STORAGE_KEY } from '../core/sheetBridge/config'
import type { ExportPreview } from '../core/sheetBridge/types'
import type { ImportPreview, SheetBridgeConfig } from '../core/sheetBridge/types'
import type { PendingWriteRow, WriteHistoryRecord } from '../core/sheetBridge/writeback'
import { buildRowForResource, loadWriteHistory, appendWriteHistory, buildPayloadSummary, computeWriteStatusSummary, saveWriteStatusSummary } from '../core/sheetBridge/writeback'
import { normalizeRows } from '../core/sheetBridge/adapters'
import { createBackup, loadBackup, removeBackup } from '../core/sheetBridge/backup'

const DEFAULT_CONFIG: SheetBridgeConfig = {
  sheetUrl: '',
  sheetId: '',
  appsScriptEndpoint: '',
  syncMode: 'manual',
  lastSyncAt: null,
  lastSyncStatus: 'idle',
  lastErrorMessage: null,
}

function loadConfig(): SheetBridgeConfig {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const parsed = JSON.parse(stored) as SheetBridgeConfig
      const envEndpoint = getEnvAppsScriptEndpoint()
      if (!parsed.appsScriptEndpoint && envEndpoint) {
        parsed.appsScriptEndpoint = envEndpoint
        parsed.isEnvDefault = true
      }
      return { ...DEFAULT_CONFIG, ...parsed }
    }
  } catch { /* ignore */ }
  const envEndpoint = getEnvAppsScriptEndpoint()
  if (envEndpoint) {
    return { ...DEFAULT_CONFIG, appsScriptEndpoint: envEndpoint, isEnvDefault: true }
  }
  return { ...DEFAULT_CONFIG }
}

export function useSheetBridge() {
  const [config, setConfigState] = useState<SheetBridgeConfig>(loadConfig)
  const [importPreview, setImportPreview] = useState<ImportPreview | null>(null)
  const [exportPreview, setExportPreview] = useState<ExportPreview | null>(null)
  const [testing, setTesting] = useState(false)
  const [importError, setImportError] = useState<string | null>(null)
  const [fetchingResource, setFetchingResource] = useState<string | null>(null)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [pendingWrites, setPendingWrites] = useState<PendingWriteRow[]>([])
  const [writeHistory, setWriteHistory] = useState<WriteHistoryRecord[]>(() => loadWriteHistory())

  useEffect(() => {
    saveWriteStatusSummary(computeWriteStatusSummary(pendingWrites))
  }, [pendingWrites])

  const envEndpoint = getEnvAppsScriptEndpoint()
  const envEndpointStatus = !envEndpoint ? 'missing' : envEndpoint.startsWith('https://') ? 'configured' : 'invalid'
  const activeEndpoint = getActiveAppsScriptEndpoint()
  const activeEndpointUrl = activeEndpoint.url
  const activeEndpointSource: 'manual' | 'env' | 'none' = activeEndpoint.source

  const persistConfig = useCallback((next: SheetBridgeConfig) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    setConfigState(next)
  }, [])

  const updateConfig = useCallback((patch: Partial<SheetBridgeConfig>) => {
    setConfigState((prev) => {
      const next = { ...prev, ...patch }
      if ('appsScriptEndpoint' in patch) {
        next.isEnvDefault = false
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      return next
    })
  }, [])

  const testConnection = useCallback(async () => {
    setTesting(true)
    updateConfig({ lastSyncStatus: 'connecting' })

    try {
      const endpoint = activeEndpointUrl
      if (!endpoint) {
        throw new Error('No Apps Script endpoint configured. Enter the endpoint URL or use Simulate Import for mock data.')
      }

      if (!endpoint.startsWith('https://')) {
        throw new Error('Endpoint must be an HTTPS URL.')
      }

      const response = await fetch(endpoint, {
        method: 'GET',
        signal: AbortSignal.timeout(8000),
        headers: { 'Accept': 'application/json' },
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const body: unknown = await response.json()

      if (!body || typeof body !== 'object') {
        throw new Error('Response is not a valid JSON object.')
      }

      const parsed = body as Record<string, unknown>

      if (parsed.ok !== true) {
        throw new Error(`Response ok flag is false or missing. ${parsed.error ? `Error: ${parsed.error}` : ''}`)
      }

      if (!Array.isArray(parsed.rows)) {
        throw new Error('Response is missing "rows" array.')
      }

      if (typeof parsed.resource !== 'string' || !parsed.resource) {
        throw new Error('Response is missing "resource" string identifier.')
      }

      const now = new Date().toISOString()
      updateConfig({ lastSyncAt: now, lastSyncStatus: 'success', lastErrorMessage: null })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Connection test failed.'
      updateConfig({ lastSyncStatus: 'error', lastErrorMessage: message })
    } finally {
      setTesting(false)
    }
  }, [activeEndpointUrl, updateConfig])

  const fetchFromEndpoint = useCallback(async (resourceId: string): Promise<ImportPreview | null> => {
    const resource = SHEET_RESOURCES.find((r) => r.id === resourceId)
    if (!resource) throw new Error(`Unknown resource: ${resourceId}`)

    const endpoint = activeEndpointUrl
    if (!endpoint) {
      setFetchError('No Apps Script endpoint configured. Enter the endpoint URL in the Connection section.')
      return null
    }

    setFetchingResource(resourceId)
    setFetchError(null)
    setImportError(null)

    try {
      const resourceUrl = new URL(endpoint)
      resourceUrl.searchParams.set('resource', resourceId)

      const response = await fetch(resourceUrl.toString(), {
        method: 'GET',
        signal: AbortSignal.timeout(15000),
        headers: { 'Accept': 'application/json' },
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const body: unknown = await response.json()

      if (!body || typeof body !== 'object') {
        throw new Error('Response is not a valid JSON object.')
      }

      const parsed = body as Record<string, unknown>

      if (parsed.ok !== true) {
        throw new Error(`Endpoint returned ok: false. ${parsed.error ? parsed.error : ''}`)
      }

      if (!Array.isArray(parsed.rows)) {
        throw new Error('Response is missing "rows" array.')
      }

      if (typeof parsed.resource === 'string' && parsed.resource && parsed.resource !== resourceId) {
        throw new Error(`Endpoint returned resource "${parsed.resource}" while "${resourceId}" was requested.`)
      }

      const { rows, errors } = normalizeRows(parsed.rows as Record<string, unknown>[], resource)

      const rowIndicesWithErrors = new Set(errors.map((e) => e.row))
      const validCount = rows.length - rowIndicesWithErrors.size

      const preview: ImportPreview = {
        resourceId,
        resourceName: resource.name,
        rows,
        validCount,
        invalidCount: errors.length,
        errors,
        createdAt: new Date().toISOString(),
      }

      setImportPreview(preview)
      return preview
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch from endpoint.'
      setFetchError(message)
      return null
    } finally {
      setFetchingResource(null)
    }
  }, [activeEndpointUrl])

  const simulateImport = useCallback((resourceId: string, rawRows: Record<string, unknown>[]) => {
    const resource = SHEET_RESOURCES.find((r) => r.id === resourceId)
    if (!resource) throw new Error(`Unknown resource: ${resourceId}`)

    const { rows, errors } = normalizeRows(rawRows, resource)

    const rowIndicesWithErrors = new Set(errors.map((e) => e.row))
    const validCount = rows.length - rowIndicesWithErrors.size

    const preview: ImportPreview = {
      resourceId,
      resourceName: resource.name,
      rows,
      validCount,
      invalidCount: errors.length,
      errors,
      createdAt: new Date().toISOString(),
    }

    setImportPreview(preview)
    setImportError(null)
    setFetchError(null)
    return preview
  }, [])

  const confirmImport = useCallback((
    resourceId: string,
    currentData: unknown[],
    newRows: Record<string, unknown>[],
    onImport: (resourceId: string, rows: Record<string, unknown>[]) => void,
  ): boolean => {
    const resource = SHEET_RESOURCES.find((r) => r.id === resourceId)

    if (config.syncMode === 'readonly') {
      setImportError('Import is disabled in read-only mode. Switch to Manual mode to import.')
      return false
    }

    if (!resource?.importEnabled) {
      setImportError(`"${resource?.name ?? resourceId}" import is not enabled. Preview/export only.`)
      return false
    }

    const backup = createBackup(resourceId, resource?.name ?? resourceId, currentData, 'Pre-import backup')
    if (!backup) {
      setImportError('Backup failed. Import was cancelled to protect existing data.')
      return false
    }

    setImportError(null)
    setFetchError(null)
    onImport(resourceId, newRows)
    setImportPreview(null)

    const now = new Date().toISOString()
    updateConfig({ lastSyncAt: now, lastSyncStatus: 'success', lastErrorMessage: null })
    return true
  }, [config.syncMode, updateConfig])

  const cancelImport = useCallback(() => {
    setImportPreview(null)
    setImportError(null)
    setFetchError(null)
  }, [])

  const buildExportPreview = useCallback((resourceId: string, rows: Record<string, unknown>[]) => {
    const resource = SHEET_RESOURCES.find((r) => r.id === resourceId)
    const preview: ExportPreview = {
      resourceId,
      resourceName: resource?.name ?? resourceId,
      rows,
      jsonPayload: JSON.stringify(rows, null, 2),
      createdAt: new Date().toISOString(),
    }
    setExportPreview(preview)
    return preview
  }, [])

  const cancelExport = useCallback(() => {
    setExportPreview(null)
  }, [])

  const resetConfig = useCallback(() => {
    persistConfig({ ...DEFAULT_CONFIG })
  }, [persistConfig])

  const addPendingWrite = useCallback((resourceId: string, fields: Record<string, unknown>) => {
    const resource = SHEET_RESOURCES.find((r) => r.id === resourceId)
    if (!resource) return

    const row = buildRowForResource(resource, fields)
    const write: PendingWriteRow = {
      id: `write-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      resourceId,
      resourceName: resource.name,
      row,
      createdAt: new Date().toISOString(),
      approvedAt: null,
      writtenAt: null,
      writeError: null,
      status: 'draft',
    }

    setPendingWrites((current) => [write, ...current])
  }, [])

  const approvePendingWrite = useCallback((writeId: string) => {
    setPendingWrites((current) =>
      current.map((w) =>
        w.id === writeId ? { ...w, approvedAt: new Date().toISOString(), status: 'approved' as const } : w,
      ),
    )
  }, [])

  const removePendingWrite = useCallback((writeId: string) => {
    setPendingWrites((current) => current.filter((w) => w.id !== writeId))
  }, [])

  const exportPendingWrite = useCallback((writeId: string): PendingWriteRow | null => {
    let found: PendingWriteRow | null = null
    setPendingWrites((current) =>
      current.map((w) => {
        if (w.id === writeId) {
          found = { ...w, status: 'exported' as const }
          return found
        }
        return w
      }),
    )
    return found
  }, [])

  const writePendingWrite = useCallback(async (writeId: string): Promise<boolean> => {
    const endpoint = activeEndpointUrl
    if (!endpoint) return false

    const write = pendingWrites.find((w) => w.id === writeId)
    if (!write || write.status !== 'approved') return false

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        signal: AbortSignal.timeout(15000),
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resource: write.resourceId,
          row: write.row,
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const body: unknown = await response.json()
      const parsed = body as Record<string, unknown>

      if (parsed.ok !== true) {
        throw new Error(parsed.error ? String(parsed.error) : 'Sheet write failed.')
      }

      const now = new Date().toISOString()
      setPendingWrites((current) =>
        current.map((w) =>
          w.id === writeId ? { ...w, status: 'written' as const, writtenAt: now, writeError: null } : w,
        ),
      )
      const historyRecord: WriteHistoryRecord = {
        id: `hist-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        resourceId: write.resourceId,
        resourceName: write.resourceName,
        recordId: String(write.row.id ?? ''),
        status: 'success',
        endpointLabel: activeEndpointUrl ? activeEndpointUrl.slice(0, 50) + '...' : 'unknown',
        payloadSummary: buildPayloadSummary(write.row),
        writtenAt: now,
      }
      setWriteHistory(appendWriteHistory(historyRecord))
      return true
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Write to sheet failed.'
      const errorCode = err instanceof TypeError ? 'NETWORK_ERROR' : err instanceof DOMException && err.name === 'AbortError' ? 'TIMEOUT' : 'UNKNOWN'
      setPendingWrites((current) =>
        current.map((w) =>
          w.id === writeId ? { ...w, status: 'failed' as const, writeError: message } : w,
        ),
      )
      const now = new Date().toISOString()
      const failedRecord: WriteHistoryRecord = {
        id: `hist-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        resourceId: write.resourceId,
        resourceName: write.resourceName,
        recordId: String(write.row.id ?? ''),
        status: 'failed',
        endpointLabel: activeEndpointUrl ? activeEndpointUrl.slice(0, 50) + '...' : 'unknown',
        payloadSummary: buildPayloadSummary(write.row),
        writtenAt: now,
        errorMessage: message,
        errorCode,
      }
      setWriteHistory(appendWriteHistory(failedRecord))
      return false
    }
  }, [activeEndpointUrl, pendingWrites])

  return {
    config,
    importPreview,
    exportPreview,
    testing,
    importError,
    fetchError,
    fetchingResource,
    envEndpointStatus,
    activeEndpointUrl,
    activeEndpointSource,
    updateConfig,
    testConnection,
    simulateImport,
    fetchFromEndpoint,
    confirmImport,
    cancelImport,
    buildExportPreview,
    cancelExport,
    resetConfig,
    loadBackup,
    removeBackup,
    pendingWrites,
    addPendingWrite,
    approvePendingWrite,
    removePendingWrite,
    exportPendingWrite,
    writePendingWrite,
    writeHistory,
  }
}
