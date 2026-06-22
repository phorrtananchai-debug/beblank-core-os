import type {
  ApprovalRecord,
  ArtworkRecord,
  CreativeBrief,
  DocumentRecord,
  OsData,
  Project,
  SiteIssue,
  SiteWatchUpdate,
  Task,
  StudioReview,
  StudioTimelinePhase,
  WorkScopeSection,
  TimelineItem,
  SourceStatus,
} from '../../types/models'

export type StudioProjectHealth = 'healthy' | 'watch' | 'at-risk' | 'blocked' | 'unknown'
export type StudioRiskLevel = 'low' | 'medium' | 'high' | 'critical' | 'unknown'

export type StudioProjectMetadataV1 = {
  id: string
  projectName: string
  client?: string
  projectType?: string
  status: Project['status'] | 'unknown'
  phase?: string
  receiveDate?: string
  targetOpenDate?: string
  deadline?: string
  projectLead?: string
  team: StudioProjectTeamMemberV1[]
  notes?: string
  updatedAt?: string
  slug?: string
  location?: string
  timelineStatus?: Project['timelineStatus'] | 'unknown'
  coverImageUrl?: string
  mediaImageUrls?: string[]
}

export type StudioProjectTeamMemberV1 = {
  id: string
  name: string
  role: string
  source: 'project' | 'approval' | 'review' | 'derived'
}

export type StudioProjectOperationalStatusV1 = {
  health: StudioProjectHealth
  riskLevel: StudioRiskLevel
  renderingStatus: 'concept' | 'review' | 'approved' | 'queued' | 'unknown'
  proposalStatus: 'draft' | 'review' | 'approved' | 'issued' | 'unknown'
  summary: string
  updatedAt?: string
  confidence: 'Real' | 'Inferred' | 'Fallback' | 'Mock'
}

export type StudioProjectV1 = {
  metadata: StudioProjectMetadataV1
  tasks: Task[]
  timeline: TimelineItem[]
  phases: StudioTimelinePhase[]
  reviews: StudioReview[]
  documents: DocumentRecord[]
  artwork: ArtworkRecord[]
  approvals: StudioApprovalV1[]
  siteIssues: SiteIssue[]
  siteWatchUpdates: SiteWatchUpdate[]
  workScopeSections: WorkScopeSection[]
  creativeBriefs: CreativeBrief[]
  team: StudioProjectTeamMemberV1[]
  operationalStatus: StudioProjectOperationalStatusV1
}

export type StudioApprovalV1 = ApprovalRecord & {
  confidence?: 'Real' | 'Inferred' | 'Fallback' | 'Mock'
  source?: 'sheet' | 'derived' | 'manual'
  updatedAt?: string
}

export type StudioWorkspaceV1 = {
  schemaVersion: 'studio.workspace.v1'
  updatedAt: string
  confidence: 'Real' | 'Inferred' | 'Fallback' | 'Mock'
  projects: StudioProjectV1[]
  tasks: Task[]
  approvals: StudioApprovalV1[]
  sourceStatus?: SourceStatus | null
}

export type StudioWorkspaceFlatData = Pick<
  OsData,
  | 'projects'
  | 'tasks'
  | 'approvals'
  | 'timeline'
  | 'studioTimelinePhases'
  | 'documents'
  | 'siteIssues'
  | 'workScopeSections'
  | 'siteWatchUpdates'
  | 'artworkRecords'
  | 'creativeBriefs'
  | 'studioReviews'
>

export type StudioWorkspaceInput = OsData | StudioWorkspaceV1

export const isStudioWorkspaceV1 = (value: unknown): value is StudioWorkspaceV1 => {
  if (!value || typeof value !== 'object') return false
  return (value as Record<string, unknown>).schemaVersion === 'studio.workspace.v1'
}
