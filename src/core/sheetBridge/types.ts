export type SyncMode = 'manual' | 'readonly'

export type BridgeConnectionStatus = 'idle' | 'connecting' | 'success' | 'error'

export interface SheetBridgeConfig {
  sheetUrl: string
  sheetId: string
  appsScriptEndpoint: string
  syncMode: SyncMode
  lastSyncAt: string | null
  lastSyncStatus: BridgeConnectionStatus
  lastErrorMessage: string | null
}

export interface SheetColumnDef {
  key: string
  label: string
  type: 'string' | 'number' | 'date' | 'boolean'
  required: boolean
  description?: string
}

export interface SheetResourceDef {
  id: string
  name: string
  label: string
  description: string
  osField: string
  columns: SheetColumnDef[]
  importEnabled?: boolean
}

export interface RowValidationError {
  row: number
  field: string
  message: string
}

export interface ImportPreview {
  resourceId: string
  resourceName: string
  rows: Record<string, unknown>[]
  validCount: number
  invalidCount: number
  errors: RowValidationError[]
  createdAt: string
}

export interface ExportPreview {
  resourceId: string
  resourceName: string
  rows: Record<string, unknown>[]
  jsonPayload: string
  createdAt: string
}

export interface BackupRecord {
  id: string
  resourceId: string
  resourceName: string
  data: unknown[]
  createdAt: string
  reason: string
}

export interface BridgeResourceResponse {
  ok: boolean
  resource: string
  rows: Record<string, unknown>[]
  updatedAt?: string
  error?: string
}
