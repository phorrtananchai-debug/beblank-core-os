import { createContext, useContext, useMemo, useState } from 'react'
import { generateId } from '../../app/utils'
import { mockSheetWriteAdapter, validateActionRequest } from '../adapters/mockSheetWriteAdapter'
import { createInitialOsDataFromProviders } from '../data/providers'
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

  const approveActionRequest = (requestId: string) => {
    const request = pendingApprovals.find((item) => item.id === requestId)
    if (!request) return

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
      providerStatuses,
      pendingApprovals,
      changeLogs,
      snapshots,
      createActionRequest,
      approveActionRequest,
      rejectActionRequest,
      queueSuggestionImport,
    }),
    [data, sourceStatuses, providerStatuses, pendingApprovals, changeLogs, snapshots],
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

