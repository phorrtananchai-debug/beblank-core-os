import { createContext } from 'react'
import type {
  ActionRequest,
  ChangeLogRecord,
  DataProviderStatus,
  OsData,
  SnapshotRecord,
  SourceStatus,
} from '../../types/models'

export interface BridgeBootstrapDiagnostic {
  resourceId: string
  resourceName: string
  status: 'imported' | 'empty' | 'failed'
  rowCount: number
  invalidCount: number
  error?: string
  updatedAt?: string
}

export interface OsContextValue {
  data: OsData
  sourceStatuses: Record<string, SourceStatus>
  providerStatuses: Record<string, DataProviderStatus>
  bootstrapDiagnostics: BridgeBootstrapDiagnostic[]
  refreshKarunBridge: () => Promise<void>
  pendingApprovals: ActionRequest[]
  changeLogs: ChangeLogRecord[]
  snapshots: SnapshotRecord[]
  createActionRequest: (input: Omit<ActionRequest, 'id' | 'requestedAt' | 'requestedBy' | 'requiresApproval'>) => void
  approveActionRequest: (requestId: string) => void
  rejectActionRequest: (requestId: string) => void
  queueSuggestionImport: (module: string, title: string, recommendation: string, riskNotes: string) => void
  bulkMergeData: (field: string, rows: unknown[]) => { appended: number; updated: number; skipped: number }
  restoreField: (field: string, rows: unknown[]) => void
  updateBridgeDiagnostic: (diagnostic: BridgeBootstrapDiagnostic) => void
}

export const OsContext = createContext<OsContextValue | undefined>(undefined)
