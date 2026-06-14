import type { OsData, SourceStatus } from '../../types/models'

type AgentState = 'running' | 'waiting-review' | 'completed'
type DivisionMood = 'calm' | 'busy' | 'review-needed' | 'offline'
type DataConfidence = 'Real' | 'Inferred' | 'Fallback' | 'Mock'
type FreshnessState = 'Fresh' | 'Stale' | 'Unknown'

export type StudioAgentModel = {
  id: string
  name: string
  role: string
  state: AgentState
  currentTask: string
  progress: number
  updatedAt: string
}

export type StudioModel = {
  integrationMode: 'read-only'
  division: {
    mood: DivisionMood
    activeProjects: number
    waitingClient: number
    deadlinesThisWeek: number
    renderingQueue: number
    proposalQueue: number
    projectHealth: string
    activeAgents: number
    runningTasks: number
    waitingReviews: number
    completedToday: number
    summary: string
  }
  projects: {
    active: number
    planning: number
    paused: number
    atRisk: number
    confidence: DataConfidence
    freshness: FreshnessState
    emptyState?: string
  }
  deadlines: {
    timelineDueThisWeek: number
    reviewsDueThisWeek: number
    openingOrHandoverThisWeek: number
    confidence: DataConfidence
    freshness: FreshnessState
    emptyState?: string
  }
  queues: {
    renderingQueue: number
    proposalQueue: number
    confidence: DataConfidence
    freshness: FreshnessState
    emptyState?: string
  }
  operations: {
    sourceLabel: string
    lastUpdated: string
    freshness: FreshnessState
    confidence: DataConfidence
    projectHealth: string
    emptyState?: string
  }
  agents: {
    items: StudioAgentModel[]
    confidence: 'Inferred'
    freshness: FreshnessState
    emptyState?: string
  }
  statuses: {
    studio: SourceStatus | null
  }
  lastUpdated: string
  overallFreshness: FreshnessState
}

const formatBangkokTime = (value?: string) => {
  if (!value) return 'Unavailable'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString('en-US', {
    timeZone: 'Asia/Bangkok',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const resolveFreshness = (status?: SourceStatus | null): FreshnessState => {
  if (!status?.lastSyncedAt) return 'Unknown'
  return status.isStale ? 'Stale' : 'Fresh'
}

const getLatestTimestamp = (timestamps: Array<string | undefined>) => {
  const valid = timestamps
    .filter((value): value is string => Boolean(value))
    .map((value) => new Date(value))
    .filter((date) => !Number.isNaN(date.getTime()))
    .sort((a, b) => b.getTime() - a.getTime())

  return valid[0]?.toISOString()
}

const getSectionConfidence = (hasRows: boolean, status?: SourceStatus | null): DataConfidence => {
  if (!hasRows) return status ? 'Fallback' : 'Fallback'
  if (!status) return 'Fallback'
  if (status.mode === 'live') return 'Real'
  if (status.mode === 'mock') return 'Mock'
  return 'Fallback'
}

const withinNextWeek = (value?: string) => {
  if (!value) return false
  const target = new Date(`${value.slice(0, 10)}T00:00:00.000Z`)
  if (Number.isNaN(target.getTime())) return false
  const today = new Date()
  const start = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate())
  const end = start + 7 * 24 * 60 * 60 * 1000
  const time = Date.UTC(target.getUTCFullYear(), target.getUTCMonth(), target.getUTCDate())
  return time >= start && time <= end
}

const buildAgent = (
  id: string,
  name: string,
  role: string,
  workload: number,
  baseline: number,
  updatedAt: string,
  detail: string,
): StudioAgentModel => {
  const state: AgentState =
    workload > 0
      ? 'running'
      : baseline > 0
        ? 'completed'
        : 'waiting-review'

  const divisor = Math.max(workload, baseline, 1)
  const progress = state === 'completed' ? 100 : Math.max(18, Math.min(91, Math.round((workload / divisor) * 100)))

  return { id, name, role, state, currentTask: detail, progress, updatedAt }
}

export const buildStudioModel = (
  data: OsData,
  sourceStatuses: Record<string, SourceStatus>,
): StudioModel => {
  // Manual verification guide for this pure adapter:
  // 1. Empty studio arrays should produce fallback summaries instead of synthetic project rows.
  // 2. Live studio rows should upgrade project/deadline confidence to Real without changing queue derivations.
  // 3. Derived agent states should come only from existing OS studio arrays and source status.
  const studioStatus = sourceStatuses.studio ?? null
  const sourceLabel = studioStatus?.sourceName ?? 'Studio aggregation adapter'
  const freshness = resolveFreshness(studioStatus)

  const activeProjects = data.projects.filter((project) => project.status === 'active')
  const planningProjects = data.projects.filter((project) => project.status === 'planning')
  const pausedProjects = data.projects.filter((project) => project.status === 'paused')
  const atRiskProjectIds = new Set(
    data.projects
      .filter((project) => project.timelineStatus === 'watch' || project.timelineStatus === 'at-risk')
      .map((project) => project.id),
  )

  data.timeline.forEach((item) => {
    if (item.state === 'at-risk') atRiskProjectIds.add(item.projectId)
  })

  data.studioTimelinePhases.forEach((phase) => {
    if (phase.status === 'blocked' || phase.risk === 'high') atRiskProjectIds.add(phase.projectId)
  })

  data.siteIssues.forEach((issue) => {
    if (issue.severity === 'high' || issue.status === 'open') atRiskProjectIds.add(issue.projectId)
  })

  data.siteWatchUpdates.forEach((update) => {
    if (update.severity === 'high' || update.status === 'open') atRiskProjectIds.add(update.projectId)
  })

  const timelineDueThisWeek = data.timeline.filter((item) => withinNextWeek(item.dueDate) && item.state !== 'completed').length
  const reviewsDueThisWeek = data.studioReviews.filter((review) => withinNextWeek(review.dueAt) && review.status === 'pending').length
  const openingOrHandoverThisWeek = data.studioTimelinePhases.filter((phase) =>
    (phase.phase === 'handover' || phase.phase === 'opening') && withinNextWeek(phase.endDate) && phase.status !== 'complete',
  ).length

  const proposalQueue =
    data.documents.filter((document) => ['draft', 'review', 'issued'].includes(document.approvalState ?? 'draft')).length +
    data.studioReviews.filter((review) => review.type === 'approval' && review.status === 'pending').length +
    data.creativeBriefs.filter((brief) => brief.status === 'draft' || brief.status === 'review').length

  const renderingQueue =
    data.artworkRecords.filter((artwork) => artwork.status === 'concept' || artwork.status === 'review').length +
    data.creativeBriefs.filter((brief) => brief.status === 'review').length +
    data.studioTimelinePhases.filter((phase) => phase.phase === 'design' || phase.phase === 'drawing').filter((phase) => phase.status !== 'complete').length

  const waitingClient =
    data.studioReviews.filter((review) => review.status === 'pending').length +
    data.approvals.filter((approval) => ['submitted', 'waiting'].includes(approval.status)).length +
    data.documents.filter((document) => document.approvalState === 'review').length

  const completedToday =
    data.timeline.filter((item) => item.state === 'completed' && withinNextWeek(item.dueDate)).length +
    data.studioReviews.filter((review) => review.status === 'resolved' && withinNextWeek(review.dueAt)).length

  const runningTasks =
    data.tasks.filter((task) => task.status !== 'done').length +
    data.studioTimelinePhases.filter((phase) => phase.status === 'active' || phase.status === 'blocked').length +
    data.siteWatchUpdates.filter((update) => update.status !== 'resolved').length

  const totalStudioRows =
    data.projects.length +
    data.tasks.length +
    data.timeline.length +
    data.studioTimelinePhases.length +
    data.documents.length +
    data.siteIssues.length +
    data.workScopeSections.length +
    data.siteWatchUpdates.length +
    data.artworkRecords.length +
    data.creativeBriefs.length +
    data.studioReviews.length

  const lastUpdatedRaw = getLatestTimestamp([
    studioStatus?.lastSyncedAt,
    ...data.timeline.map((item) => item.dueDate),
    ...data.studioReviews.map((review) => review.dueAt),
    ...data.documents.map((document) => document.updatedAt),
    ...data.siteWatchUpdates.map((update) => update.observedAt),
    ...data.studioTimelinePhases.map((phase) => phase.endDate),
  ]) ?? studioStatus?.lastSyncedAt

  const projectConfidence = getSectionConfidence(data.projects.length > 0, studioStatus)
  const deadlineConfidence = getSectionConfidence(
    data.timeline.length + data.studioReviews.length + data.studioTimelinePhases.length > 0,
    studioStatus,
  )
  const queueConfidence: DataConfidence =
    data.documents.length + data.creativeBriefs.length + data.artworkRecords.length + data.studioReviews.length > 0
      ? projectConfidence === 'Real'
        ? 'Inferred'
        : projectConfidence
      : studioStatus
        ? 'Fallback'
        : 'Fallback'

  const projectHealth =
    totalStudioRows === 0
      ? 'Awaiting source'
      : atRiskProjectIds.size > 0
        ? `${atRiskProjectIds.size} project${atRiskProjectIds.size === 1 ? '' : 's'} need attention`
        : waitingClient > 0
          ? `${waitingClient} client decisions pending`
          : 'Stable'

  const updatedAtLabel = formatBangkokTime(lastUpdatedRaw)
  const agents: StudioAgentModel[] = [
    buildAgent(
      'studio-project-manager',
      'Project Manager',
      'Project coordination',
      activeProjects.length + waitingClient + timelineDueThisWeek,
      Math.max(data.projects.length, 1),
      updatedAtLabel,
      activeProjects.length > 0
        ? `Coordinating ${activeProjects.length} active projects with ${waitingClient} client-side decisions and ${timelineDueThisWeek} near-term deadlines`
        : 'Waiting for studio project rows to reach the command layer',
    ),
    buildAgent(
      'design-agent',
      'Design Agent',
      'Design phases',
      data.studioTimelinePhases.filter((phase) => phase.phase === 'design' || phase.phase === 'drawing').filter((phase) => phase.status !== 'complete').length,
      Math.max(data.studioTimelinePhases.length, 1),
      updatedAtLabel,
      data.studioTimelinePhases.length > 0
        ? `Tracking design and drawing activity across ${data.studioTimelinePhases.filter((phase) => phase.phase === 'design' || phase.phase === 'drawing').length} mapped phases`
        : 'No design or drawing phase rows are exposed yet',
    ),
    buildAgent(
      'visualization-agent',
      'Visualization Agent',
      'Artwork and render flow',
      renderingQueue,
      Math.max(data.artworkRecords.length + data.creativeBriefs.length, 1),
      updatedAtLabel,
      renderingQueue > 0
        ? `Managing ${renderingQueue} artwork, render, or brief items still moving through visualization flow`
        : 'Visualization queue is quiet in the current studio feed',
    ),
    buildAgent(
      'proposal-agent',
      'Proposal Agent',
      'Packages and approvals',
      proposalQueue,
      Math.max(data.documents.length + data.studioReviews.length, 1),
      updatedAtLabel,
      proposalQueue > 0
        ? `Watching ${proposalQueue} proposal, document, or approval items that still need client-side movement`
        : 'Proposal queue is clear in the current studio feed',
    ),
    buildAgent(
      'site-watch-agent',
      'Site Watch Agent',
      'Field issues',
      data.siteWatchUpdates.filter((update) => update.status !== 'resolved').length + data.siteIssues.filter((issue) => issue.status !== 'resolved').length,
      Math.max(data.siteWatchUpdates.length + data.siteIssues.length, 1),
      updatedAtLabel,
      data.siteWatchUpdates.length + data.siteIssues.length > 0
        ? `Covering ${data.siteWatchUpdates.filter((update) => update.status !== 'resolved').length} live site-watch items and ${data.siteIssues.filter((issue) => issue.status !== 'resolved').length} open issues`
        : 'No site-watch or field issue rows are exposed yet',
    ),
  ]

  const mood: DivisionMood =
    totalStudioRows === 0
      ? 'offline'
      : atRiskProjectIds.size > 0 || waitingClient > 0
        ? 'review-needed'
        : activeProjects.length > 0 || runningTasks > 0
          ? 'busy'
          : 'calm'

  return {
    integrationMode: 'read-only',
    division: {
      mood,
      activeProjects: activeProjects.length,
      waitingClient,
      deadlinesThisWeek: timelineDueThisWeek + reviewsDueThisWeek + openingOrHandoverThisWeek,
      renderingQueue,
      proposalQueue,
      projectHealth,
      activeAgents: agents.filter((agent) => agent.state !== 'completed').length,
      runningTasks,
      waitingReviews: waitingClient,
      completedToday,
      summary:
        totalStudioRows === 0
          ? 'BBH Studio is wired as a read-only adapter, but the current studio provider still exposes no project rows to Command Center.'
          : `Read-only BBH Studio view over ${sourceLabel.toLowerCase()} with projects, deadlines, site watch, reviews, and delivery queues summarized for Command Center.`,
    },
    projects: {
      active: activeProjects.length,
      planning: planningProjects.length,
      paused: pausedProjects.length,
      atRisk: atRiskProjectIds.size,
      confidence: projectConfidence,
      freshness,
      emptyState: data.projects.length === 0 ? 'No studio project rows are available in the current read-only feed.' : undefined,
    },
    deadlines: {
      timelineDueThisWeek,
      reviewsDueThisWeek,
      openingOrHandoverThisWeek,
      confidence: deadlineConfidence,
      freshness,
      emptyState:
        data.timeline.length === 0 && data.studioReviews.length === 0 && data.studioTimelinePhases.length === 0
          ? 'No timeline, review, or phase rows are available to calculate studio deadlines yet.'
          : undefined,
    },
    queues: {
      renderingQueue,
      proposalQueue,
      confidence: queueConfidence,
      freshness,
      emptyState:
        data.documents.length === 0 && data.creativeBriefs.length === 0 && data.artworkRecords.length === 0 && data.studioReviews.length === 0
          ? 'No document, brief, artwork, or review rows are available to estimate studio queues yet.'
          : undefined,
    },
    operations: {
      sourceLabel,
      lastUpdated: updatedAtLabel,
      freshness,
      confidence: totalStudioRows > 0 ? projectConfidence : 'Fallback',
      projectHealth,
      emptyState: totalStudioRows === 0 ? 'Studio source status exists, but no rows are currently flowing into Core OS.' : undefined,
    },
    agents: {
      items: agents,
      confidence: 'Inferred',
      freshness,
      emptyState: totalStudioRows === 0 ? 'Agent activity is derived from fallback studio counts until project rows are exposed.' : undefined,
    },
    statuses: {
      studio: studioStatus,
    },
    lastUpdated: updatedAtLabel,
    overallFreshness: freshness,
  }
}
