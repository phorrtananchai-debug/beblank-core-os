import type {
  DocumentRecord,
  Project,
  SiteWatchUpdate,
  SourceStatus,
  StudioReview,
  StudioTimelinePhase,
  WorkScopeSection,
} from '../../../types/models'

export interface KarunBridgePayload {
  metadata?: {
    sourceName?: string
    syncedAt?: string
    sheetId?: string
    mode?: string
  }
  project?: Partial<Project>
  timelinePhases?: Array<Partial<StudioTimelinePhase>>
  workScopeRows?: Array<Partial<WorkScopeSection>>
  siteWatchRows?: Array<Partial<SiteWatchUpdate>>
  documentRows?: Array<Partial<DocumentRecord>>
  reviewRows?: Array<Partial<StudioReview>>
}

export interface NormalizedKarunBridgeResult {
  sourceStatus: SourceStatus
  project?: Project
  timelinePhases: StudioTimelinePhase[]
  workScopeSections: WorkScopeSection[]
  siteWatchUpdates: SiteWatchUpdate[]
  documents: DocumentRecord[]
  studioReviews: StudioReview[]
  warnings: string[]
}

const asString = (value: unknown, fallback: string) => (typeof value === 'string' && value.trim() ? value : fallback)
const asArray = <T>(value: T[] | undefined) => Array.isArray(value) ? value : []

export const normalizeKarunBridgePayload = (payload: KarunBridgePayload): NormalizedKarunBridgeResult => {
  const warnings: string[] = []
  const syncedAt = payload.metadata?.syncedAt ?? new Date().toISOString()
  const sourceStatus: SourceStatus = {
    sourceName: payload.metadata?.sourceName ?? 'Karun Phuket Apps Script Bridge',
    lastSyncedAt: syncedAt,
    isStale: Date.now() - Date.parse(syncedAt) > 24 * 60 * 60 * 1000,
    mode: 'live',
    health: 'healthy',
    syncState: 'idle',
    pendingSyncCount: 0,
    authority: 'connector',
    ownerModule: 'studio',
  }

  if (!payload.project?.id) warnings.push('Project id missing from bridge payload.')
  if (!payload.timelinePhases) warnings.push('Timeline phases missing from bridge payload.')
  if (!payload.workScopeRows) warnings.push('WorkScope rows missing from bridge payload.')

  const project = payload.project?.id
    ? {
        id: asString(payload.project.id, 'p1'),
        slug: asString(payload.project.slug, 'karun-phuket'),
        name: asString(payload.project.name, 'Karun Phuket'),
        status: payload.project.status ?? 'active',
        owner: asString(payload.project.owner, 'Studio Core'),
        client: payload.project.client,
        location: payload.project.location,
        phase: payload.project.phase,
        timelineStatus: payload.project.timelineStatus,
        operationalNotes: payload.project.operationalNotes,
      }
    : undefined

  const timelinePhases = asArray(payload.timelinePhases).filter((row) => row.id && row.projectId).map((row): StudioTimelinePhase => ({
    id: asString(row.id, 'stp-missing'),
    projectId: asString(row.projectId, 'p1'),
    phase: row.phase ?? 'design',
    startDate: asString(row.startDate, syncedAt.slice(0, 10)),
    endDate: asString(row.endDate, syncedAt.slice(0, 10)),
    status: row.status ?? 'planned',
    risk: row.risk ?? 'medium',
    sourceStatus,
    blockerIds: row.blockerIds ?? [],
    notes: asString(row.notes, 'Live bridge row missing notes.'),
  }))

  const workScopeSections = asArray(payload.workScopeRows).filter((row) => row.id && row.projectId).map((row): WorkScopeSection => ({
    id: asString(row.id, 'ws-missing'),
    projectId: asString(row.projectId, 'p1'),
    code: asString(row.code, 'WS-LIVE'),
    group: asString(row.group, 'Bridge'),
    title: asString(row.title, 'Untitled WorkScope row'),
    phase: asString(row.phase, 'Live bridge'),
    operationalStatus: row.operationalStatus ?? 'planned',
    reviewStatus: row.reviewStatus ?? 'draft',
    linkedApprovalIds: row.linkedApprovalIds ?? [],
  }))

  const siteWatchUpdates = asArray(payload.siteWatchRows).filter((row) => row.id && row.projectId).map((row): SiteWatchUpdate => ({
    id: asString(row.id, 'sw-missing'),
    projectId: asString(row.projectId, 'p1'),
    title: asString(row.title, 'Untitled site watch row'),
    observedAt: asString(row.observedAt, syncedAt),
    severity: row.severity ?? 'medium',
    status: row.status ?? 'review',
    note: asString(row.note, 'Live bridge row missing note.'),
    imagePlaceholder: asString(row.imagePlaceholder, 'live bridge / no image'),
  }))

  const documents = asArray(payload.documentRows).filter((row) => row.id && row.projectId).map((row): DocumentRecord => ({
    id: asString(row.id, 'doc-missing'),
    projectId: asString(row.projectId, 'p1'),
    title: asString(row.title, 'Untitled document row'),
    version: asString(row.version, 'LIVE-01'),
    updatedAt: asString(row.updatedAt, syncedAt.slice(0, 10)),
    packageType: row.packageType,
    approvalState: row.approvalState,
    issueDate: row.issueDate,
    linkedScopeIds: row.linkedScopeIds,
  }))

  const studioReviews = asArray(payload.reviewRows).filter((row) => row.id && row.projectId).map((row): StudioReview => ({
    id: asString(row.id, 'rv-missing'),
    projectId: asString(row.projectId, 'p1'),
    type: row.type ?? 'approval',
    title: asString(row.title, 'Untitled review row'),
    linkedRecordId: asString(row.linkedRecordId, ''),
    status: row.status ?? 'pending',
    dueAt: asString(row.dueAt, syncedAt.slice(0, 10)),
  }))

  return { sourceStatus, project, timelinePhases, workScopeSections, siteWatchUpdates, documents, studioReviews, warnings }
}
