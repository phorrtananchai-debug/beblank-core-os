import type {
  ApprovalRecord,
  DocumentRecord,
  OsData,
  Project,
  SiteIssue,
  SiteWatchUpdate,
  StudioReview,
  StudioTimelinePhase,
  TimelineItem,
} from '../../types/models'
import type {
  StudioApprovalV1,
  StudioProjectHealth,
  StudioProjectOperationalStatusV1,
  StudioProjectTeamMemberV1,
  StudioProjectV1,
  StudioRiskLevel,
  StudioWorkspaceFlatData,
  StudioWorkspaceInput,
  StudioWorkspaceV1,
} from './types'
import { isStudioWorkspaceV1 } from './types'

const latestTimestamp = (timestamps: Array<string | undefined>) => {
  const valid = timestamps
    .filter((value): value is string => Boolean(value))
    .map((value) => new Date(value))
    .filter((value) => !Number.isNaN(value.getTime()))
    .sort((a, b) => b.getTime() - a.getTime())

  return valid[0]?.toISOString()
}

const earliestTimestamp = (timestamps: Array<string | undefined>) => {
  const valid = timestamps
    .filter((value): value is string => Boolean(value))
    .map((value) => new Date(value))
    .filter((value) => !Number.isNaN(value.getTime()))
    .sort((a, b) => a.getTime() - b.getTime())

  return valid[0]?.toISOString()
}

const uniqueById = <T extends { id: string }>(items: T[]) => {
  const map = new Map<string, T>()
  for (const item of items) map.set(item.id, item)
  return [...map.values()]
}

const inferProjectType = (project: Project, phases: StudioTimelinePhase[], documents: DocumentRecord[]) => {
  if (project.phase) return project.phase
  if (phases.some((phase) => phase.phase === 'construction' || phase.phase === 'handover')) return 'delivery'
  if (documents.some((document) => document.approvalState === 'issued' || document.approvalState === 'approved')) return 'delivery'
  return undefined
}

const inferReceiveDate = (timeline: TimelineItem[], phases: StudioTimelinePhase[]) => {
  return earliestTimestamp([
    ...timeline.map((item) => item.dueDate),
    ...phases.map((phase) => phase.startDate),
  ])
}

const inferTargetOpenDate = (timeline: TimelineItem[], phases: StudioTimelinePhase[]) => {
  return latestTimestamp([
    ...timeline.map((item) => item.dueDate),
    ...phases.map((phase) => phase.endDate),
  ])
}

const inferDeadline = (timeline: TimelineItem[], reviews: StudioReview[], phases: StudioTimelinePhase[]) => {
  return latestTimestamp([
    ...timeline.map((item) => item.dueDate),
    ...reviews.map((review) => review.dueAt),
    ...phases.map((phase) => phase.endDate),
  ])
}

const inferRiskLevel = (
  project: Project,
  timeline: TimelineItem[],
  phases: StudioTimelinePhase[],
  issues: SiteIssue[],
  watchUpdates: SiteWatchUpdate[],
): StudioRiskLevel => {
  if (project.timelineStatus === 'at-risk') return 'high'
  if (project.timelineStatus === 'watch') return 'medium'
  if (phases.some((phase) => phase.status === 'blocked' || phase.risk === 'high')) return 'high'
  if (issues.some((issue) => issue.severity === 'high' || issue.status === 'open')) return 'high'
  if (watchUpdates.some((update) => update.severity === 'high' || update.status === 'open')) return 'high'
  if (timeline.some((item) => item.state === 'at-risk')) return 'medium'
  if (phases.some((phase) => phase.risk === 'medium')) return 'medium'
  if (issues.some((issue) => issue.severity === 'medium')) return 'medium'
  return 'low'
}

const inferProjectHealth = (riskLevel: StudioRiskLevel, isBlocked: boolean, hasOpenIssues: boolean): StudioProjectHealth => {
  if (isBlocked) return 'blocked'
  if (riskLevel === 'high') return 'at-risk'
  if (hasOpenIssues || riskLevel === 'medium') return 'watch'
  if (riskLevel === 'unknown') return 'unknown'
  return 'healthy'
}

const buildTeam = (
  project: Project,
  approvals: ApprovalRecord[],
  reviews: StudioReview[],
): StudioProjectTeamMemberV1[] => {
  const members: StudioProjectTeamMemberV1[] = []
  if (project.owner) {
    members.push({ id: `owner:${project.owner}`, name: project.owner, role: 'Project lead', source: 'project' })
  }

  for (const approval of approvals) {
    if (approval.owner) {
      members.push({ id: `approval:${approval.owner}`, name: approval.owner, role: 'Approval owner', source: 'approval' })
    }
    if (approval.requestedBy) {
      members.push({ id: `requested:${approval.requestedBy}`, name: approval.requestedBy, role: 'Requester', source: 'approval' })
    }
  }

  for (const review of reviews) {
    if (review.type) {
      members.push({ id: `review:${review.type}`, name: review.type, role: 'Review lane', source: 'review' })
    }
  }

  return uniqueById(members)
}

const projectSummary = (project: Project, riskLevel: StudioRiskLevel, health: StudioProjectHealth, approvals: ApprovalRecord[]) => {
  if (health === 'blocked') return `${project.name} is blocked and needs intervention.`
  if (riskLevel === 'high') return `${project.name} has high delivery risk and should be reviewed.`
  if (approvals.some((approval) => approval.status === 'submitted' || approval.status === 'waiting')) return `${project.name} has pending approvals.`
  return `${project.name} is tracking normally.`
}

const ensureProjectShell = (projectId: string, seed?: Partial<Project>): Project => ({
  id: projectId,
  slug: seed?.slug ?? projectId,
  name: seed?.name ?? `Project ${projectId}`,
  status: seed?.status ?? 'planning',
  owner: seed?.owner ?? 'Unassigned',
  client: seed?.client,
  location: seed?.location,
  phase: seed?.phase,
  timelineStatus: seed?.timelineStatus,
  operationalNotes: seed?.operationalNotes,
  coverImageUrl: seed?.coverImageUrl,
  mediaImageUrls: seed?.mediaImageUrls,
})

const groupByProjectId = <T extends { projectId: string }>(rows: T[]) => {
  const map = new Map<string, T[]>()
  for (const row of rows) {
    const bucket = map.get(row.projectId) ?? []
    bucket.push(row)
    map.set(row.projectId, bucket)
  }
  return map
}

const flattenWorkspace = (workspace: StudioWorkspaceV1): StudioWorkspaceFlatData => {
  const projects: Project[] = workspace.projects.map((project) => ({
    id: project.metadata.id,
    slug: project.metadata.slug ?? project.metadata.id,
    name: project.metadata.projectName,
    status: project.metadata.status === 'unknown' ? 'planning' : project.metadata.status,
    owner: project.metadata.projectLead ?? project.team[0]?.name ?? 'Unassigned',
    client: project.metadata.client,
    location: project.metadata.location,
    phase: project.metadata.phase,
    timelineStatus: project.metadata.timelineStatus && project.metadata.timelineStatus !== 'unknown'
      ? (project.metadata.timelineStatus as Project['timelineStatus'])
      : undefined,
    operationalNotes: project.metadata.notes,
    coverImageUrl: project.metadata.coverImageUrl,
    mediaImageUrls: project.metadata.mediaImageUrls,
  }))
  const tasks = workspace.projects.flatMap((project) => project.tasks)
  const approvals = workspace.approvals as ApprovalRecord[]
  const timeline = workspace.projects.flatMap((project) => project.timeline)
  const studioTimelinePhases = workspace.projects.flatMap((project) => project.phases)
  const documents = workspace.projects.flatMap((project) => project.documents)
  const siteIssues = workspace.projects.flatMap((project) => project.siteIssues)
  const workScopeSections = workspace.projects.flatMap((project) => project.workScopeSections)
  const siteWatchUpdates = workspace.projects.flatMap((project) => project.siteWatchUpdates)
  const artworkRecords = workspace.projects.flatMap((project) => project.artwork)
  const creativeBriefs = workspace.projects.flatMap((project) => project.creativeBriefs)
  const studioReviews = workspace.projects.flatMap((project) => project.reviews)

  return {
    projects,
    tasks,
    approvals,
    timeline,
    studioTimelinePhases,
    documents,
    siteIssues,
    workScopeSections,
    siteWatchUpdates,
    artworkRecords,
    creativeBriefs,
    studioReviews,
  }
}

export const createStudioWorkspace = (data: OsData): StudioWorkspaceV1 => {
  const projectRows = data.projects.length > 0
    ? data.projects
    : Array.from(new Set([
        ...data.timeline.map((item) => item.projectId),
        ...data.tasks.map((task) => task.projectId),
        ...data.studioTimelinePhases.map((phase) => phase.projectId),
        ...data.documents.map((document) => document.projectId),
        ...data.siteIssues.map((issue) => issue.projectId),
        ...data.workScopeSections.map((scope) => scope.projectId),
        ...data.siteWatchUpdates.map((update) => update.projectId),
        ...data.artworkRecords.map((artwork) => artwork.projectId),
        ...data.creativeBriefs.map((brief) => brief.projectId),
        ...data.studioReviews.map((review) => review.projectId),
        ...data.approvals.map((approval) => approval.projectId),
      ]).values()).map((projectId) => ensureProjectShell(projectId))

  const timelineByProject = groupByProjectId(data.timeline)
  const tasksByProject = groupByProjectId(data.tasks)
  const phasesByProject = groupByProjectId(data.studioTimelinePhases)
  const documentsByProject = groupByProjectId(data.documents)
  const siteIssuesByProject = groupByProjectId(data.siteIssues)
  const workScopeByProject = groupByProjectId(data.workScopeSections)
  const siteWatchByProject = groupByProjectId(data.siteWatchUpdates)
  const artworkByProject = groupByProjectId(data.artworkRecords)
  const briefsByProject = groupByProjectId(data.creativeBriefs)
  const reviewsByProject = groupByProjectId(data.studioReviews)
  const approvalsByProject = groupByProjectId(data.approvals)

  const projects: StudioProjectV1[] = projectRows.map((project) => {
    const timeline = timelineByProject.get(project.id) ?? []
    const tasks = tasksByProject.get(project.id) ?? []
    const phases = phasesByProject.get(project.id) ?? []
    const documents = documentsByProject.get(project.id) ?? []
    const siteIssues = siteIssuesByProject.get(project.id) ?? []
    const workScopeSections = workScopeByProject.get(project.id) ?? []
    const siteWatchUpdates = siteWatchByProject.get(project.id) ?? []
    const artwork = artworkByProject.get(project.id) ?? []
    const creativeBriefs = briefsByProject.get(project.id) ?? []
    const reviews = reviewsByProject.get(project.id) ?? []
    const approvals = approvalsByProject.get(project.id) ?? []

    const riskLevel = inferRiskLevel(project, timeline, phases, siteIssues, siteWatchUpdates)
    const health = inferProjectHealth(riskLevel, phases.some((phase) => phase.status === 'blocked'), siteIssues.some((issue) => issue.status === 'open') || siteWatchUpdates.some((update) => update.status === 'open'))
    const targetOpenDate = inferTargetOpenDate(timeline, phases)
    const receiveDate = inferReceiveDate(timeline, phases)
    const deadline = inferDeadline(timeline, reviews, phases)
    const projectLead = project.owner || approvals[0]?.owner || approvals[0]?.requestedBy
    const projectType = inferProjectType(project, phases, documents)
    const team = buildTeam(project, approvals, reviews)
    const updatedAt = latestTimestamp([
      project.operationalNotes ? undefined : undefined,
      project.timelineStatus ? undefined : undefined,
      ...timeline.map((item) => item.dueDate),
      ...phases.map((phase) => phase.endDate),
      ...documents.map((document) => document.updatedAt),
      ...siteWatchUpdates.map((update) => update.observedAt),
      ...reviews.map((review) => review.dueAt),
    ])

    const operationalStatus: StudioProjectOperationalStatusV1 = {
      health,
      riskLevel,
      renderingStatus: artwork.some((item) => item.status === 'concept') ? 'concept' : artwork.some((item) => item.status === 'review') ? 'review' : artwork.some((item) => item.status === 'approved') ? 'approved' : 'unknown',
      proposalStatus: approvals.some((approval) => approval.status === 'draft') ? 'draft' : approvals.some((approval) => approval.status === 'submitted' || approval.status === 'waiting') ? 'review' : approvals.some((approval) => approval.status === 'approved') ? 'approved' : approvals.some((approval) => approval.status === 'rejected') ? 'review' : documents.some((document) => document.approvalState === 'issued') ? 'issued' : 'unknown',
      summary: projectSummary(project, riskLevel, health, approvals),
      updatedAt,
      confidence: 'Inferred',
    }

    return {
      metadata: {
        id: project.id,
        projectName: project.name,
        client: project.client,
        projectType,
        status: project.status,
        phase: project.phase,
        receiveDate,
        targetOpenDate,
        deadline,
        projectLead,
        team,
        notes: project.operationalNotes,
        updatedAt,
        slug: project.slug,
        location: project.location,
        timelineStatus: (project.timelineStatus ?? 'unknown') as Project['timelineStatus'] | 'unknown',
        coverImageUrl: project.coverImageUrl,
        mediaImageUrls: project.mediaImageUrls,
      },
      tasks,
      timeline,
      phases,
      reviews,
      documents,
      artwork,
      approvals: approvals as StudioApprovalV1[],
      siteIssues,
      siteWatchUpdates,
      workScopeSections,
      creativeBriefs,
      team,
      operationalStatus,
    }
  })

  const approvals = uniqueById(data.approvals.map((approval) => ({
    ...approval,
    confidence: 'Inferred' as const,
    source: 'sheet' as const,
    updatedAt: approval.dueDate,
  })))

  const updatedAt = latestTimestamp([
    ...projects.map((project) => project.operationalStatus.updatedAt),
    ...approvals.map((approval) => approval.updatedAt),
  ]) ?? new Date().toISOString()

  return {
    schemaVersion: 'studio.workspace.v1',
    updatedAt,
    confidence: 'Inferred',
    projects,
    tasks: data.tasks,
    approvals,
  }
}

export const toStudioWorkspaceFlatData = (input: StudioWorkspaceInput): StudioWorkspaceFlatData => {
  if (isStudioWorkspaceV1(input)) {
    return flattenWorkspace(input)
  }

  return {
    projects: input.projects,
    tasks: input.tasks,
    approvals: input.approvals,
    timeline: input.timeline,
    studioTimelinePhases: input.studioTimelinePhases,
    documents: input.documents,
    siteIssues: input.siteIssues,
    workScopeSections: input.workScopeSections,
    siteWatchUpdates: input.siteWatchUpdates,
    artworkRecords: input.artworkRecords,
    creativeBriefs: input.creativeBriefs,
    studioReviews: input.studioReviews,
  }
}
