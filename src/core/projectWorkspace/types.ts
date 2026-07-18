export type EntityId = string
export type IsoDate = string
export type IsoDateTime = string
export type RecordSource = 'seed' | 'legacy-adapter' | 'local' | 'remote'

export type ProjectEntityKind =
  | 'project'
  | 'task'
  | 'asset'
  | 'site-report'
  | 'boq-item'
  | 'material'
  | 'drawing-revision'
  | 'procurement-item'
  | 'purchase-order'
  | 'rfi'
  | 'decision'
  | 'snag'
  | 'inspection'
  | 'meeting'
  | 'payment'
  | 'handover-item'

export interface RecordMeta {
  id: EntityId
  projectId: EntityId
  createdAt: IsoDateTime
  updatedAt: IsoDateTime
  createdBy: string
  source: RecordSource
}

export interface ProjectMember {
  id: EntityId
  name: string
  role: string
  company?: string
  responsibility: string
}

export interface ProjectLocation {
  id: EntityId
  name: string
  parentId?: EntityId
  kind: 'site' | 'zone' | 'level' | 'room' | 'workface'
}

export interface WorkSection {
  id: EntityId
  code: string
  name: string
  description?: string
}

export interface ProjectWorkspaceProject {
  id: EntityId
  slug: string
  code: string
  name: string
  client: string
  locationLabel: string
  summary: string
  status: 'planning' | 'active' | 'on-hold' | 'handover' | 'complete'
  phase: string
  startDate: IsoDate
  targetHandoverDate: IsoDate
  targetOpeningDate?: IsoDate
  plannedProgress: number
  actualProgress: number
  approvedBudget: number
  currency: 'THB'
  coverAssetId?: EntityId
  members: ProjectMember[]
  locations: ProjectLocation[]
  workSections: WorkSection[]
  createdAt: IsoDateTime
  updatedAt: IsoDateTime
  source: RecordSource
}

export interface TaskDependency {
  taskId: EntityId
  dependsOnTaskId: EntityId
  type: 'finish-to-start' | 'start-to-start' | 'finish-to-finish'
}

export interface TaskChecklistItem {
  id: EntityId
  label: string
  complete: boolean
}

export interface ProjectTask extends RecordMeta {
  title: string
  description: string
  phase: string
  workSectionId?: EntityId
  locationId?: EntityId
  responsibleMemberId?: EntityId
  contractor?: string
  plannedStart: IsoDate
  plannedFinish: IsoDate
  actualStart?: IsoDate
  actualFinish?: IsoDate
  dependencies: TaskDependency[]
  progress: number
  priority: 'low' | 'medium' | 'high' | 'critical'
  status: 'backlog' | 'ready' | 'in-progress' | 'blocked' | 'review' | 'done'
  timeImpactDays: number
  costImpact: number
  checklist: TaskChecklistItem[]
  commentIds: EntityId[]
  /** @deprecated v1 compatibility only; v2 resolves assets from assetRelationships. */
  assetIds?: EntityId[]
  boqItemIds: EntityId[]
  siteReportIds: EntityId[]
  decisionIds: EntityId[]
  drawingReferenceIds: EntityId[]
}

export type AssetCategory =
  | 'site-photo'
  | 'approved-render'
  | 'sketch-markup'
  | 'construction-drawing'
  | 'shop-drawing'
  | 'material-sample'
  | 'quotation'
  | 'boq'
  | 'invoice-payment'
  | 'equipment-specification'
  | 'meeting-document'
  | 'handover-document'

export interface AssetRelationship {
  id: EntityId
  assetId: EntityId
  targetType: ProjectEntityKind
  targetId: EntityId
  relation: 'evidence' | 'reference' | 'attachment' | 'approval' | 'source' | 'deliverable'
}

export interface ProjectAsset extends RecordMeta {
  name: string
  fileName: string
  mimeType: string
  sizeBytes: number
  category: AssetCategory
  locationId?: EntityId
  workSectionId?: EntityId
  revision?: string
  approvalStatus: 'not-required' | 'draft' | 'pending' | 'approved' | 'rejected'
  caption?: string
  storage: { kind: 'seed-url' | 'indexed-db' | 'external'; key: string; url?: string }
  /** @deprecated v1 compatibility only; v2 stores normalized assetRelationships. */
  relationships?: AssetRelationship[]
}

export interface SiteReport extends RecordMeta {
  date: IsoDate
  shift: 'morning' | 'afternoon' | 'night' | 'full-day'
  teams: string[]
  workerCount: number
  workScope: string
  locationIds: EntityId[]
  materialsArriving: string[]
  equipment: string[]
  permitRequirements: string[]
  hotWork: boolean
  workAtHeight: boolean
  supervisor: string
  beforeAssetIds: EntityId[]
  duringAssetIds: EntityId[]
  afterAssetIds: EntityId[]
  completedToday: string
  issues: string
  planTomorrow: string
  taskIds: EntityId[]
  boqItemIds: EntityId[]
  /** @deprecated v1 compatibility only; v2 resolves assets from assetRelationships. */
  assetIds?: EntityId[]
  status: 'draft' | 'submitted'
}

export interface BOQItem extends RecordMeta {
  code: string
  workSectionId: EntityId
  description: string
  specification: string
  unit: string
  quantity: number
  materialRate: number
  labourRate: number
  approvedAmount: number
  variation: number
  actualCost: number
  forecastCost: number
  supplier?: string
  contractor?: string
  drawingReferenceIds: EntityId[]
  taskIds: EntityId[]
  /** @deprecated v1 compatibility only; v2 resolves assets from assetRelationships. */
  assetIds?: EntityId[]
  procurementState: 'not-started' | 'quoting' | 'ordered' | 'delivered' | 'installed'
  paymentState: 'not-due' | 'pending' | 'part-paid' | 'paid'
  installationProgress: number
  valueStatus: 'sample-estimate' | 'provisional' | 'approved'
}

export interface ProjectDecision extends RecordMeta {
  title: string
  description: string
  status: 'pending' | 'approved' | 'rejected' | 'superseded'
  dueDate?: IsoDate
  owner: string
  originType: ProjectEntityKind
  originId: EntityId
  impact: 'low' | 'medium' | 'high'
}

export interface ProjectRisk extends RecordMeta {
  title: string
  description: string
  status: 'open' | 'mitigating' | 'closed'
  severity: 'low' | 'medium' | 'high' | 'critical'
  owner: string
  dueDate?: IsoDate
  relatedEntityType?: ProjectEntityKind
  relatedEntityId?: EntityId
}

export interface ProjectEvent {
  id: EntityId
  projectId: EntityId
  occurredAt: IsoDateTime
  actor: string
  type: 'created' | 'updated' | 'completed' | 'uploaded' | 'submitted' | 'approved' | 'risk' | 'decision'
  entityType: ProjectEntityKind
  entityId: EntityId
  title: string
  detail?: string
}

export interface ActivityRecord extends RecordMeta {
  entityType: ProjectEntityKind
  entityId: EntityId
  body: string
  kind: 'comment' | 'note' | 'status-change'
}

export interface ProjectWorkspaceData {
  schemaVersion: 'project-workspace.v1' | 'project-workspace.v2'
  project: ProjectWorkspaceProject
  tasks: ProjectTask[]
  assets: ProjectAsset[]
  siteReports: SiteReport[]
  boqItems: BOQItem[]
  decisions: ProjectDecision[]
  risks: ProjectRisk[]
  activities: ActivityRecord[]
  /** Canonical normalized source for every asset-to-entity relationship in v2. */
  assetRelationships?: AssetRelationship[]
}

export type PersistedProjectWorkspace = Omit<ProjectWorkspaceData, 'schemaVersion' | 'assetRelationships'> & {
  schemaVersion: 'project-workspace.v2'
  assetRelationships: AssetRelationship[]
}

export interface ProjectRepositoryErrorShape {
  code: 'hydrate-failed' | 'metadata-write-failed' | 'blob-write-failed' | 'blob-delete-failed' | 'not-found' | 'validation-failed'
  message: string
  operationId?: string
  recoverable: boolean
  cause?: unknown
}

export interface ProjectWorkspaceSnapshot {
  status: 'idle' | 'loading' | 'ready' | 'error'
  data: PersistedProjectWorkspace | null
  error: ProjectRepositoryErrorShape | null
}

export interface CostSummary {
  approvedBudget: number
  baseAmount: number
  revisedAmount: number
  actualCost: number
  forecastFinalCost: number
  remainingCommitment: number
  varianceToBudget: number
  variationTotal: number
}

export interface ProjectIntelligence {
  lateTasks: ProjectTask[]
  dueTodayTasks: ProjectTask[]
  dueThisWeekTasks: ProjectTask[]
  atRiskTasks: ProjectTask[]
  pendingDecisions: ProjectDecision[]
  openRisks: ProjectRisk[]
  unapprovedAssets: ProjectAsset[]
  boqWithoutActualCost: BOQItem[]
  tomorrowTasks: ProjectTask[]
  thisWeekTasks: ProjectTask[]
  latestSiteReport?: SiteReport
  nextMilestone?: ProjectTask
  recentEvents: ProjectEvent[]
  scheduleRiskDays: number
  cost: CostSummary
}
