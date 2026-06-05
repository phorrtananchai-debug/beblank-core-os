import { useState, useCallback } from 'react'
import { SHEET_RESOURCES } from '../core/sheetBridge/resources'
import type { ExportPreview } from '../core/sheetBridge/types'
import type { ImportPreview, SheetBridgeConfig } from '../core/sheetBridge/types'
import { normalizeRows } from '../core/sheetBridge/adapters'
import { createBackup, loadBackup, removeBackup } from '../core/sheetBridge/backup'

const STORAGE_KEY = 'beblank_os_bridge_config_v1'

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
    if (stored) return { ...DEFAULT_CONFIG, ...JSON.parse(stored) }
  } catch { /* ignore */ }
  return { ...DEFAULT_CONFIG }
}

export function useSheetBridge() {
  const [config, setConfigState] = useState<SheetBridgeConfig>(loadConfig)
  const [importPreview, setImportPreview] = useState<ImportPreview | null>(null)
  const [exportPreview, setExportPreview] = useState<ExportPreview | null>(null)
  const [testing, setTesting] = useState(false)
  const [importError, setImportError] = useState<string | null>(null)

  const persistConfig = useCallback((next: SheetBridgeConfig) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    setConfigState(next)
  }, [])

  const updateConfig = useCallback((patch: Partial<SheetBridgeConfig>) => {
    setConfigState((prev) => {
      const next = { ...prev, ...patch }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      return next
    })
  }, [])

  const testConnection = useCallback(async () => {
    setTesting(true)
    updateConfig({ lastSyncStatus: 'connecting' })

    try {
      const endpoint = config.appsScriptEndpoint || config.sheetUrl
      if (!endpoint) {
        throw new Error('No Sheet URL or Apps Script endpoint configured.')
      }

      const response = await fetch(endpoint, {
        method: 'GET',
        signal: AbortSignal.timeout(8000),
        headers: { 'Accept': 'application/json' },
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const now = new Date().toISOString()
      updateConfig({ lastSyncAt: now, lastSyncStatus: 'success', lastErrorMessage: null })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Connection test failed.'
      updateConfig({ lastSyncStatus: 'error', lastErrorMessage: message })
    } finally {
      setTesting(false)
    }
  }, [config.appsScriptEndpoint, config.sheetUrl, updateConfig])

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
    onImport(resourceId, newRows)
    setImportPreview(null)

    const now = new Date().toISOString()
    updateConfig({ lastSyncAt: now, lastSyncStatus: 'success', lastErrorMessage: null })
    return true
  }, [config.syncMode, updateConfig])

  const cancelImport = useCallback(() => {
    setImportPreview(null)
    setImportError(null)
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

  return {
    config,
    importPreview,
    exportPreview,
    testing,
    importError,
    updateConfig,
    testConnection,
    simulateImport,
    confirmImport,
    cancelImport,
    buildExportPreview,
    cancelExport,
    resetConfig,
    loadBackup,
    removeBackup,
  }
}
