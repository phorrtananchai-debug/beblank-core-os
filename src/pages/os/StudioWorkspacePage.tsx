import { useMemo, useState, type ReactNode } from 'react'
import { NavLink } from 'react-router-dom'
import { AIContextExportPanel } from '../../components/shared/AIContextExportPanel'
import { AISuggestionImportPanel } from '../../components/shared/AISuggestionImportPanel'
import { ChangeLogList } from '../../components/shared/ChangeLogList'
import { EmptyState } from '../../components/shared/EmptyState'
import { PendingApprovalPanel } from '../../components/shared/PendingApprovalPanel'
import { SnapshotLog } from '../../components/shared/SnapshotLog'
import { SourceStatusBadge } from '../../components/shared/SourceStatusBadge'
import { useOs } from '../../core/os/OsContext'
import type {
  ArtworkRecord,
  CreativeBrief,
  DocumentRecord,
  Project,
  SiteWatchUpdate,
  StudioReview,
  StudioTimelinePhase,
  Task,
  TimelineItem,
  WorkScopeSection,
} from '../../types/models'

export type StudioWorkspaceView =
  | 'overview'
  | 'projects'
  | 'timeline'
  | 'site-watch'
  | 'documents'
  | 'artwork'
  | 'briefs'
  | 'reviews'

const studioTabs: Array<{ to: string; label: string; view: StudioWorkspaceView }> = [
  { to: '/os/studio', label: 'overview', view: 'overview' },
  { to: '/os/studio/projects', label: 'projects', view: 'projects' },
  { to: '/os/studio/timeline', label: 'timeline', view: 'timeline' },
  { to: '/os/studio/site-watch', label: 'site watch', view: 'site-watch' },
  { to: '/os/studio/documents', label: 'documents', view: 'documents' },
  { to: '/os/studio/artwork', label: 'artwork', view: 'artwork' },
  { to: '/os/studio/briefs', label: 'briefs', view: 'briefs' },
  { to: '/os/studio/reviews', label: 'reviews', view: 'reviews' },
]

const statusClass = (status: string) => {
  if (['blocked', 'high', 'at-risk', 'open'].includes(status)) return 'text-[#c2410c]'
  if (['review', 'needs-review', 'medium', 'active', 'pending'].includes(status)) return 'text-[#9a6a1f]'
  return 'text-[#59634a]'
}

const projectName = (projects: Project[], projectId: string) =>
  projects.find((project) => project.id === projectId)?.name ?? 'Unlinked project'

export const StudioWorkspacePage = ({ view = 'overview' }: { view?: StudioWorkspaceView }) => {
  const {
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
  } = useOs()

  const pendingStudioReviews = data.studioReviews.filter((review) => review.status === 'pending')
  const activeScope = data.workScopeSections.filter((scope) => scope.operationalStatus !== 'complete')
  const openSiteWatch = data.siteWatchUpdates.filter((update) => update.status !== 'resolved')
  const reviewDocument = data.documents.find((document) => document.approvalState === 'review') ?? data.documents[0]
  const reviewScope = data.workScopeSections.find((scope) => scope.reviewStatus === 'needs-review') ?? data.workScopeSections[0]
  const reviewSite = data.siteWatchUpdates.find((update) => update.status !== 'resolved') ?? data.siteWatchUpdates[0]

  const queueScopeApproval = (scope: WorkScopeSection) => {
    createActionRequest({
      module: 'studio',
      actionType: 'studio.approveWorkScopeRevision',
      description: `Approve ${scope.code} WorkScope revision`,
      payload: { scopeId: scope.id },
    })
  }

  const queueDocumentIssue = (document: DocumentRecord) => {
    createActionRequest({
      module: 'studio',
      actionType: 'studio.issueDocumentPackage',
      description: `Issue document package: ${document.title}`,
      payload: { documentId: document.id },
    })
  }

  const queueSiteResolution = (siteUpdate: SiteWatchUpdate) => {
    createActionRequest({
      module: 'studio',
      actionType: 'studio.resolveSiteWatch',
      description: `Resolve site watch item: ${siteUpdate.title}`,
      payload: { siteWatchId: siteUpdate.id },
    })
  }

  const queueBriefApproval = (brief: CreativeBrief) => {
    createActionRequest({
      module: 'studio',
      actionType: 'studio.approveCreativeBrief',
      description: `Approve creative brief: ${brief.title}`,
      payload: { briefId: brief.id },
    })
  }

  const queueTimelinePhaseReview = (phase: StudioTimelinePhase) => {
    createActionRequest({
      module: 'studio',
      actionType: 'studio.markTimelinePhaseReviewed',
      description: `Mark ${projectName(data.projects, phase.projectId)} ${phase.phase} phase reviewed`,
      payload: { phaseId: phase.id },
    })
  }

  const queueStudioTask = () => {
    createActionRequest({
      module: 'studio',
      actionType: 'studio.addTask',
      description: 'Add MVP studio work queue task',
      payload: { title: 'Review MVP studio queue and assign next owner' },
    })
  }

  const queueStudioMilestone = () => {
    createActionRequest({
      module: 'studio',
      actionType: 'studio.addTimeline',
      description: 'Add MVP studio milestone',
      payload: { label: 'MVP usability review checkpoint', dueDate: '2026-06-10' },
    })
  }

  return (
    <section className="studio-workspace-space space-y-7">
      <header className="command-hero rounded-[36px] border border-black/[0.05] bg-[#faf9f8] p-6 md:p-9">
        <div className="grid gap-6 xl:grid-cols-[1fr_0.4fr]">
          <div>
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-[#777777]">
              Studio Workspace / Sheet-first operations
            </p>
            <h2 className="mt-4 max-w-4xl text-5xl font-extrabold leading-[0.92] tracking-tight md:text-7xl">
              Studio work, held as an operating environment.
            </h2>
            <p className="mt-5 max-w-2xl text-sm leading-7 text-[#666666]">
              Projects, WorkScope, timeline, site awareness, documents, artwork, briefs, and reviews remain manual-first and approval-first.
            </p>
          </div>
          <div className="intelligence-card rounded-[30px] border border-black/[0.06] bg-white/92 p-5">
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[#777777]">
              Studio AI note
            </p>
            <p className="mt-4 text-xl font-semibold leading-snug">Quiet operational reading</p>
            <p className="mt-3 text-sm leading-6 text-[#666666]">
              Prioritize Karun Phuket scope review, then issue document packages only after manual approval.
            </p>
          </div>
        </div>

        <nav className="mt-8 flex flex-wrap gap-2">
          {studioTabs.map((tab) => (
            <NavLink
              key={tab.to}
              to={tab.to}
              end={tab.view === 'overview'}
              className={({ isActive }) =>
                `rounded-full px-4 py-2 font-mono text-[10px] font-semibold uppercase tracking-[0.12em] transition ${
                  isActive ? 'bg-black text-white' : 'bg-white/70 text-[#777777] hover:bg-black/[0.05] hover:text-[#111111]'
                }`
              }
            >
              {tab.label}
            </NavLink>
          ))}
        </nav>

        <div className="mt-5 grid gap-3 md:grid-cols-4">
          <SourceStatusBadge status={sourceStatuses.studio} />
          <Metric label="Projects" value={data.projects.length} />
          <Metric label="Pending reviews" value={pendingStudioReviews.length} />
          <Metric label="Karun bridge" value={providerStatuses.karunBridge?.fallbackUsed ? 'fallback' : providerStatuses.karunBridge?.mode ?? 'mock'} />
        </div>
      </header>

      {data.projects.length === 0 ? (
        <EmptyState title="Studio provider has no rows" body="Studio is rendering safely without project rows. Mock fallback can be restored or a live Apps Script read provider can supply Sheet rows later." />
      ) : null}

      {view === 'overview' ? (
        <Overview
          activeScope={activeScope}
          openSiteWatch={openSiteWatch}
          pendingStudioReviews={pendingStudioReviews}
          projects={data.projects}
          reviewDocument={reviewDocument}
          reviewScope={reviewScope}
          reviewSite={reviewSite}
          tasks={data.tasks}
          timeline={data.timeline}
          onDocumentIssue={queueDocumentIssue}
          onMilestoneAdd={queueStudioMilestone}
          onScopeApproval={queueScopeApproval}
          onSiteResolution={queueSiteResolution}
          onTaskAdd={queueStudioTask}
        />
      ) : null}

      {view === 'projects' ? (
        <ProjectsView
          artwork={data.artworkRecords}
          briefs={data.creativeBriefs}
          documents={data.documents}
          projects={data.projects}
          siteWatch={data.siteWatchUpdates}
          workScope={data.workScopeSections}
        />
      ) : null}

      {view === 'timeline' ? (
        <TimelineView
          pendingApprovals={pendingApprovals}
          phases={data.studioTimelinePhases}
          projects={data.projects}
          reviews={data.studioReviews}
          siteWatch={data.siteWatchUpdates}
          timeline={data.timeline}
          onApprove={approveActionRequest}
          onPhaseReview={queueTimelinePhaseReview}
          onReject={rejectActionRequest}
        />
      ) : null}

      {view === 'site-watch' ? (
        <SiteWatchView projects={data.projects} siteWatch={data.siteWatchUpdates} onSiteResolution={queueSiteResolution} />
      ) : null}

      {view === 'documents' ? (
        <DocumentsView documents={data.documents} projects={data.projects} workScope={data.workScopeSections} onDocumentIssue={queueDocumentIssue} />
      ) : null}

      {view === 'artwork' ? (
        <ArtworkView artwork={data.artworkRecords} briefs={data.creativeBriefs} projects={data.projects} />
      ) : null}

      {view === 'briefs' ? (
        <BriefsView artwork={data.artworkRecords} briefs={data.creativeBriefs} projects={data.projects} onBriefApproval={queueBriefApproval} />
      ) : null}

      {view === 'reviews' ? (
        <ReviewsView
          pendingApprovals={pendingApprovals}
          reviews={data.studioReviews}
          projects={data.projects}
          onApprove={approveActionRequest}
          onReject={rejectActionRequest}
        />
      ) : null}

      <section className="grid gap-5 xl:grid-cols-[1fr_0.9fr]">
        <AIContextExportPanel contexts={data.aiContexts} />
        <AISuggestionImportPanel onImport={queueSuggestionImport} />
      </section>
      <section className="grid gap-5 xl:grid-cols-2">
        <ChangeLogList items={changeLogs} />
        <SnapshotLog items={snapshots} />
      </section>
    </section>
  )
}

const Metric = ({ label, value }: { label: string; value: number | string }) => (
  <div className="rounded-2xl border border-black/[0.04] bg-white/70 px-4 py-3">
    <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.14em] text-[#777777]">{label}</p>
    <p className="mt-2 text-xl font-bold">{value}</p>
  </div>
)

const Overview = ({
  activeScope,
  openSiteWatch,
  pendingStudioReviews,
  projects,
  reviewDocument,
  reviewScope,
  reviewSite,
  tasks,
  timeline,
  onDocumentIssue,
  onMilestoneAdd,
  onScopeApproval,
  onSiteResolution,
  onTaskAdd,
}: {
  activeScope: WorkScopeSection[]
  openSiteWatch: SiteWatchUpdate[]
  pendingStudioReviews: StudioReview[]
  projects: Project[]
  reviewDocument?: DocumentRecord
  reviewScope?: WorkScopeSection
  reviewSite?: SiteWatchUpdate
  tasks: Task[]
  timeline: TimelineItem[]
  onDocumentIssue: (document: DocumentRecord) => void
  onMilestoneAdd: () => void
  onScopeApproval: (scope: WorkScopeSection) => void
  onSiteResolution: (siteUpdate: SiteWatchUpdate) => void
  onTaskAdd: () => void
}) => (
  <div className="grid gap-7 xl:grid-cols-[minmax(0,1fr)_360px]">
    <main className="space-y-7">
      <section className="panel panel-float">
        <div className="panel-header">
          <div>
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[#777777]">MVP quick operations</p>
            <h3>Task + milestone queue</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            <button className="btn-primary" type="button" onClick={onTaskAdd}>Queue Task</button>
            <button className="btn-secondary" type="button" onClick={onMilestoneAdd}>Queue Milestone</button>
          </div>
        </div>
        <div className="grid gap-3 lg:grid-cols-2">
          <div className="rounded-[24px] border border-black/[0.05] bg-[#faf9f8] p-4">
            <p className="font-semibold">Work queue</p>
            <div className="mt-3 space-y-2">{tasks.slice(0, 4).map((task) => <CompactRow key={task.id} title={task.title} meta={projectName(projects, task.projectId)} status={task.status} />)}</div>
          </div>
          <div className="rounded-[24px] border border-black/[0.05] bg-[#faf9f8] p-4">
            <p className="font-semibold">Milestone queue</p>
            <div className="mt-3 space-y-2">{timeline.slice(0, 4).map((item) => <CompactRow key={item.id} title={item.label} meta={`${projectName(projects, item.projectId)} / due ${item.dueDate}`} status={item.state} />)}</div>
          </div>
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="panel panel-float">
          <div className="panel-header">
            <div>
              <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[#777777]">Project system</p>
              <h3>Active studio pulse</h3>
            </div>
            <span className="pill">{projects.length} projects</span>
          </div>
          <div className="space-y-3">
            {projects.slice(0, 4).map((project) => (
              <ProjectRow key={project.id} project={project} />
            ))}
          </div>
        </div>

        <div className="panel panel-float">
          <div className="panel-header">
            <div>
              <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[#777777]">Review-first flow</p>
              <h3>Operational actions</h3>
            </div>
          </div>
          <div className="space-y-3">
            {reviewScope ? <ActionCard label="Approve WorkScope revision" detail={`${reviewScope.code} / ${reviewScope.title}`} onClick={() => onScopeApproval(reviewScope)} /> : null}
            {reviewDocument ? <ActionCard label="Issue document package" detail={`${reviewDocument.title} / ${reviewDocument.version}`} onClick={() => onDocumentIssue(reviewDocument)} /> : null}
            {reviewSite ? <ActionCard label="Resolve site watch item" detail={reviewSite.title} onClick={() => onSiteResolution(reviewSite)} /> : null}
          </div>
        </div>
      </section>

      <section className="studio-fragment-board">
        <div className="panel-header">
          <div>
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[#777777]">Workspace backbone</p>
            <h3>Scope, site, review</h3>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <FoundationTile label="WorkScope" value={activeScope.length} body="WS-coded scope sections with review states and linked approvals." />
          <FoundationTile label="Site Watch" value={openSiteWatch.length} body="Operational awareness feed for field observations and risk markers." />
          <FoundationTile label="Review Queue" value={pendingStudioReviews.length} body="Manual approvals for drawings, site review, AI notes, and briefs." />
        </div>
      </section>
    </main>

    <aside className="intelligence-rail space-y-5">
      <div className="rounded-[30px] border border-black/[0.05] bg-[#111111] p-5 text-white">
        <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-white/50">Studio operations flow</p>
        <p className="mt-4 text-sm leading-6 text-white/75">
          Nothing writes directly to state. Queue an action, approve it, then the mock Sheet adapter logs the change and creates a snapshot.
        </p>
      </div>
      {pendingStudioReviews.map((review) => (
        <ReviewCard key={review.id} review={review} projectName={projectName(projects, review.projectId)} />
      ))}
    </aside>
  </div>
)

const ProjectsView = ({
  artwork,
  briefs,
  documents,
  projects,
  siteWatch,
  workScope,
}: {
  artwork: ArtworkRecord[]
  briefs: CreativeBrief[]
  documents: DocumentRecord[]
  projects: Project[]
  siteWatch: SiteWatchUpdate[]
  workScope: WorkScopeSection[]
}) => (
  <section className="grid gap-5 xl:grid-cols-2">
    {projects.map((project) => (
      <article key={project.id} className="panel panel-float">
        <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[#777777]">{project.location} / {project.phase}</p>
        <h3 className="mt-3 text-3xl font-bold tracking-tight">{project.name}</h3>
        <p className="mt-3 text-sm leading-6 text-[#666666]">{project.operationalNotes}</p>
        <div className="mt-5 grid gap-3 md:grid-cols-2">
          <PreviewBlock label="Client" value={project.client ?? 'Studio client'} />
          <PreviewBlock label="Timeline" value={project.timelineStatus ?? 'steady'} />
          <PreviewBlock label="WorkScope" value={`${workScope.filter((scope) => scope.projectId === project.id).length} sections`} />
          <PreviewBlock label="Documents" value={`${documents.filter((document) => document.projectId === project.id).length} linked`} />
          <PreviewBlock label="Artwork" value={`${artwork.filter((item) => item.projectId === project.id).length} references`} />
          <PreviewBlock label="Site" value={`${siteWatch.filter((item) => item.projectId === project.id && item.status !== 'resolved').length} open`} />
        </div>
        <div className="mt-5">
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[#777777]">Brief preview</p>
          <p className="mt-2 text-sm text-[#555555]">{briefs.find((brief) => brief.projectId === project.id)?.direction ?? 'No brief linked yet.'}</p>
        </div>
      </article>
    ))}
  </section>
)

const TimelineView = ({
  onApprove,
  onPhaseReview,
  onReject,
  pendingApprovals,
  phases,
  projects,
  reviews,
  siteWatch,
  timeline,
}: {
  onApprove: (requestId: string) => void
  onPhaseReview: (phase: StudioTimelinePhase) => void
  onReject: (requestId: string) => void
  pendingApprovals: Parameters<typeof PendingApprovalPanel>[0]['items']
  phases: StudioTimelinePhase[]
  projects: Project[]
  reviews: StudioReview[]
  siteWatch: SiteWatchUpdate[]
  timeline: Array<{ id: string; projectId: string; label: string; dueDate: string; state: string }>
}) => {
  const [projectFilter, setProjectFilter] = useState('all')
  const [phaseFilter, setPhaseFilter] = useState('all')
  const [riskFilter, setRiskFilter] = useState('all')
  const [viewWindow, setViewWindow] = useState<'month' | 'quarter'>('quarter')

  const windowStart = new Date(viewWindow === 'month' ? '2026-06-01T00:00:00.000Z' : '2026-06-01T00:00:00.000Z')
  const windowEnd = new Date(viewWindow === 'month' ? '2026-06-30T00:00:00.000Z' : '2026-08-31T00:00:00.000Z')
  const totalDays = daysBetween(windowStart, windowEnd) + 1
  const todayOffset = clamp((daysBetween(windowStart, new Date('2026-06-03T00:00:00.000Z')) / totalDays) * 100, 0, 100)

  const visiblePhases = useMemo(
    () =>
      phases.filter((phase) => {
        const matchesProject = projectFilter === 'all' || phase.projectId === projectFilter
        const matchesPhase = phaseFilter === 'all' || phase.phase === phaseFilter
        const matchesRisk = riskFilter === 'all' || phase.risk === riskFilter || phase.status === riskFilter
        return matchesProject && matchesPhase && matchesRisk
      }),
    [phaseFilter, phases, projectFilter, riskFilter],
  )

  const projectRows = projects
    .filter((project) => visiblePhases.some((phase) => phase.projectId === project.id))
    .map((project) => ({
      project,
      phases: visiblePhases.filter((phase) => phase.projectId === project.id),
      milestones: [
        ...timeline
          .filter((event) => event.projectId === project.id)
          .map((event) => ({ id: event.id, date: event.dueDate, label: event.label, state: event.state })),
        ...reviews
          .filter((review) => review.projectId === project.id)
          .map((review) => ({ id: review.id, date: review.dueAt, label: review.title, state: review.status })),
      ],
    }))

  const constructionConflicts = getOverlappingPhases(phases.filter((phase) => phase.phase === 'construction'))
  const reviewWeeks = reviews.filter((review) => review.status === 'pending')
  const clusteredHandover = phases.filter((phase) => ['handover', 'opening'].includes(phase.phase))
  const blockedPhases = phases.filter((phase) => phase.status === 'blocked' || phase.blockerIds.length > 0)
  const stalePhases = phases.filter((phase) => phase.sourceStatus.isStale)

  const events = [
    ...timeline.map((event) => ({ id: event.id, date: event.dueDate, title: event.label, meta: `${projectName(projects, event.projectId)} / ${event.state}` })),
    ...reviews.map((review) => ({ id: review.id, date: review.dueAt, title: review.title, meta: `${projectName(projects, review.projectId)} / ${review.type}` })),
    ...siteWatch.map((update) => ({ id: update.id, date: update.observedAt.slice(0, 10), title: update.title, meta: `${projectName(projects, update.projectId)} / site watch` })),
  ].sort((a, b) => a.date.localeCompare(b.date))

  if (phases.length === 0) {
    return <EmptyState title="Timeline provider has no phase rows" body="The planning board can render an empty state while waiting for Sheet-backed timeline phases or mock fallback data." />
  }

  return (
    <section className="space-y-6">
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="panel panel-float overflow-hidden">
          <div className="panel-header">
            <div>
              <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[#777777]">
                Studio Timeline / overlap planning
              </p>
              <h3>Calendar planning board</h3>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-[#666666]">
                A calm architectural planning surface for design, construction, handover, opening, blockers, and workload overlap.
              </p>
            </div>
            <span className="pill">{visiblePhases.length} phase rows</span>
          </div>

          <div className="mb-5 grid gap-3 lg:grid-cols-[1fr_1fr_1fr_auto]">
            <TimelineSelect label="project" value={projectFilter} onChange={setProjectFilter}>
              <option value="all">All projects</option>
              {projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}
            </TimelineSelect>
            <TimelineSelect label="phase" value={phaseFilter} onChange={setPhaseFilter}>
              <option value="all">All phases</option>
              {timelinePhaseLabels.map((phase) => <option key={phase} value={phase}>{phase}</option>)}
            </TimelineSelect>
            <TimelineSelect label="risk/status" value={riskFilter} onChange={setRiskFilter}>
              <option value="all">All risks</option>
              <option value="high">High risk</option>
              <option value="medium">Medium risk</option>
              <option value="blocked">Blocked</option>
              <option value="active">Active</option>
            </TimelineSelect>
            <div className="flex items-end gap-2">
              <button className={viewWindow === 'month' ? 'btn-primary' : 'btn-secondary'} type="button" onClick={() => setViewWindow('month')}>
                This month
              </button>
              <button className={viewWindow === 'quarter' ? 'btn-primary' : 'btn-secondary'} type="button" onClick={() => setViewWindow('quarter')}>
                Q view
              </button>
            </div>
          </div>

          <div className="overflow-x-auto pb-2">
            <div className="min-w-[980px] rounded-[30px] border border-black/[0.05] bg-[#faf9f8] p-4">
              <div className="grid grid-cols-[190px_1fr] gap-4">
                <div />
                <div className="relative grid grid-cols-6 gap-2">
                  {buildAxisLabels(viewWindow).map((label) => (
                    <div key={label} className="rounded-2xl bg-white/70 px-3 py-2 text-center font-mono text-[9px] font-semibold uppercase tracking-[0.12em] text-[#777777]">
                      {label}
                    </div>
                  ))}
                </div>

                <div className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[#777777]">
                  Today / 03 Jun
                </div>
                <div className="relative h-5">
                  <div className="absolute top-0 h-full w-px bg-[#111111]" style={{ left: `${todayOffset}%` }} />
                  <div className="absolute -top-1 rounded-full bg-[#111111] px-2 py-1 font-mono text-[8px] uppercase tracking-[0.12em] text-white" style={{ left: `${todayOffset}%`, transform: 'translateX(-50%)' }}>
                    today
                  </div>
                </div>

                {projectRows.map(({ milestones, project, phases: rowPhases }) => (
                  <ProjectTimelineRow
                    key={project.id}
                    milestones={milestones}
                    onPhaseReview={onPhaseReview}
                    phases={rowPhases}
                    project={project}
                    totalDays={totalDays}
                    windowStart={windowStart}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        <aside className="intelligence-rail space-y-5">
          <div className="rounded-[30px] border border-black/[0.05] bg-[#111111] p-5 text-white">
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-white/50">
              Jarvis B timeline read
            </p>
            <p className="mt-4 text-sm leading-6 text-white/75">
              Karun Phuket construction, Karun Central build-out, and BKK Office procurement create the main July load. Keep approvals manual and review blockers before shifting dates.
            </p>
          </div>
          <TimelineSignal label="Construction overlap" value={constructionConflicts.length} tone="risk" detail="Windows that share build pressure." />
          <TimelineSignal label="Pending review load" value={reviewWeeks.length} tone="watch" detail="Approvals that can block phase movement." />
          <TimelineSignal label="Handover / opening cluster" value={clusteredHandover.length} tone="watch" detail="Dates near final public/studio pressure." />
          <TimelineSignal label="Blocked phases" value={blockedPhases.length} tone="risk" detail="Phases with blockers or blocked status." />
          <TimelineSignal label="Stale source rows" value={stalePhases.length} tone="risk" detail="Mock source rows requiring sync review." />
        </aside>
      </div>

      <section className="grid gap-5 xl:grid-cols-[1fr_0.9fr]">
        <div className="panel">
          <div className="panel-header">
            <div>
              <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[#777777]">Secondary feed</p>
              <h3>Recent timeline events</h3>
            </div>
            <span className="pill">{events.length} events</span>
          </div>
          <div className="space-y-4">
            {events.map((event) => (
              <div key={event.id} className="grid gap-4 border-b border-black/[0.05] pb-4 last:border-b-0 md:grid-cols-[8rem_1fr]">
                <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[#777777]">{event.date}</p>
                <div>
                  <p className="text-sm font-semibold">{event.title}</p>
                  <p className="mt-1 text-xs text-[#777777]">{event.meta}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <PendingApprovalPanel items={pendingApprovals} onApprove={onApprove} onReject={onReject} />
      </section>
    </section>
  )
}

const timelinePhaseLabels: StudioTimelinePhase['phase'][] = [
  'briefing',
  'design',
  'drawing',
  'approval',
  'procurement',
  'construction',
  'handover',
  'opening',
]

const phaseTone: Record<StudioTimelinePhase['phase'], string> = {
  briefing: 'bg-[#e9dfcf] text-[#3d352c]',
  design: 'bg-[#d9d5cc] text-[#2f302d]',
  drawing: 'bg-[#cfd8d1] text-[#26332b]',
  approval: 'bg-[#ead9c5] text-[#4c321a]',
  procurement: 'bg-[#e7e0b8] text-[#403b18]',
  construction: 'bg-[#111111] text-white',
  handover: 'bg-[#d7c4ad] text-[#382716]',
  opening: 'bg-[#f1a86a] text-[#2f1606]',
}

const riskRing: Record<StudioTimelinePhase['risk'], string> = {
  low: 'ring-black/[0.05]',
  medium: 'ring-[#d97706]/35',
  high: 'ring-[#c2410c]/45',
}

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value))

const daysBetween = (start: Date, end: Date) => {
  const day = 24 * 60 * 60 * 1000
  return Math.round((Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate()) - Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate())) / day)
}

const buildAxisLabels = (viewWindow: 'month' | 'quarter') =>
  viewWindow === 'month'
    ? ['Jun 01', 'Jun 06', 'Jun 11', 'Jun 16', 'Jun 21', 'Jun 26']
    : ['Jun', 'Late Jun', 'Jul', 'Late Jul', 'Aug', 'Late Aug']

const getPhasePosition = (phase: StudioTimelinePhase, windowStart: Date, totalDays: number) => {
  const start = new Date(`${phase.startDate}T00:00:00.000Z`)
  const end = new Date(`${phase.endDate}T00:00:00.000Z`)
  const left = clamp((daysBetween(windowStart, start) / totalDays) * 100, 0, 100)
  const width = clamp(((daysBetween(start, end) + 1) / totalDays) * 100, 2.5, 100 - left)
  return { left, width }
}

const getOverlappingPhases = (phases: StudioTimelinePhase[]) =>
  phases.filter((phase, index) => {
    const start = new Date(phase.startDate)
    const end = new Date(phase.endDate)
    return phases.some((candidate, candidateIndex) => {
      if (candidateIndex === index || candidate.projectId === phase.projectId) return false
      const candidateStart = new Date(candidate.startDate)
      const candidateEnd = new Date(candidate.endDate)
      return start <= candidateEnd && candidateStart <= end
    })
  })

const TimelineSelect = ({
  children,
  label,
  onChange,
  value,
}: {
  children: ReactNode
  label: string
  onChange: (value: string) => void
  value: string
}) => (
  <label className="rounded-[22px] border border-black/[0.05] bg-white/75 px-4 py-3">
    <span className="block font-mono text-[9px] font-semibold uppercase tracking-[0.14em] text-[#777777]">{label}</span>
    <select
      className="mt-2 w-full bg-transparent text-sm font-semibold text-[#111111] outline-none"
      value={value}
      onChange={(event) => onChange(event.target.value)}
    >
      {children}
    </select>
  </label>
)

const ProjectTimelineRow = ({
  milestones,
  onPhaseReview,
  phases,
  project,
  totalDays,
  windowStart,
}: {
  milestones: Array<{ id: string; date: string; label: string; state: string }>
  onPhaseReview: (phase: StudioTimelinePhase) => void
  phases: StudioTimelinePhase[]
  project: Project
  totalDays: number
  windowStart: Date
}) => (
  <>
    <div className="rounded-[24px] border border-black/[0.05] bg-white/80 p-4">
      <p className="text-sm font-bold">{project.name}</p>
      <p className="mt-1 text-xs text-[#777777]">{project.location} / {project.phase}</p>
      <p className={`mt-3 font-mono text-[9px] font-semibold uppercase tracking-[0.12em] ${statusClass(project.timelineStatus ?? 'steady')}`}>
        {project.timelineStatus ?? 'steady'}
      </p>
    </div>
    <div className="relative min-h-[164px] rounded-[24px] border border-black/[0.04] bg-white/55 p-3">
      <div className="absolute inset-y-3 left-0 right-0 grid grid-cols-6 px-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="border-l border-black/[0.04] first:border-l-0" />
        ))}
      </div>
      {phases.map((phase, index) => {
        const { left, width } = getPhasePosition(phase, windowStart, totalDays)
        const top = 12 + index * 42
        return (
          <button
            key={phase.id}
            className={`absolute rounded-full px-3 py-2 text-left text-[10px] font-bold shadow-[0_14px_28px_rgba(0,0,0,0.10)] ring-2 transition duration-300 hover:-translate-y-0.5 ${phaseTone[phase.phase]} ${riskRing[phase.risk]}`}
            style={{ left: `${left}%`, top, width: `${width}%` }}
            type="button"
            onClick={() => onPhaseReview(phase)}
            title={`${phase.phase}: ${phase.startDate} to ${phase.endDate}`}
          >
            <span className="block truncate uppercase tracking-[0.08em]">{phase.phase}</span>
            <span className="block truncate font-mono text-[8px] opacity-70">{phase.startDate} - {phase.endDate}</span>
            <span className="block truncate font-mono text-[8px] opacity-70">{phase.status} / {phase.risk}{phase.sourceStatus.isStale ? ' / stale' : ''}</span>
          </button>
        )
      })}
      {milestones.map((milestone) => {
        const left = clamp((daysBetween(windowStart, new Date(`${milestone.date}T00:00:00.000Z`)) / totalDays) * 100, 0, 100)
        return (
          <span
            key={milestone.id}
            className={`absolute bottom-3 h-3 w-3 rotate-45 rounded-[3px] border border-white shadow-[0_8px_14px_rgba(0,0,0,0.14)] ${milestone.state === 'at-risk' || milestone.state === 'pending' ? 'bg-[#c2410c]' : 'bg-[#111111]'}`}
            style={{ left: `${left}%` }}
            title={milestone.label}
          />
        )
      })}
      {phases.some((phase) => phase.status === 'blocked' || phase.risk === 'high') ? (
        <span className="absolute bottom-3 right-3 rounded-full bg-[#fff7ed] px-3 py-1 font-mono text-[8px] font-bold uppercase tracking-[0.12em] text-[#c2410c]">
          conflict / blocker
        </span>
      ) : null}
    </div>
  </>
)

const TimelineSignal = ({
  detail,
  label,
  tone,
  value,
}: {
  detail: string
  label: string
  tone: 'risk' | 'watch'
  value: number
}) => (
  <div className="surface-hover rounded-[26px] border border-black/[0.05] bg-white/85 p-5">
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[#777777]">{label}</p>
        <p className="mt-3 text-sm leading-6 text-[#666666]">{detail}</p>
      </div>
      <span className={`rounded-full px-3 py-2 font-mono text-[11px] font-bold ${tone === 'risk' ? 'bg-[#fff7ed] text-[#c2410c]' : 'bg-[#f6f0df] text-[#9a6a1f]'}`}>
        {value}
      </span>
    </div>
  </div>
)

const SiteWatchView = ({
  projects,
  siteWatch,
  onSiteResolution,
}: {
  projects: Project[]
  siteWatch: SiteWatchUpdate[]
  onSiteResolution: (siteUpdate: SiteWatchUpdate) => void
}) => (
  <section className="grid gap-5 xl:grid-cols-3">
    {siteWatch.map((update) => (
      <article key={update.id} className="panel panel-float">
        <div className={`studio-fragment-media studio-fragment-${update.severity === 'high' ? 'ink' : update.severity === 'medium' ? 'paper' : 'stone'}`} />
        <p className="mt-4 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[#777777]">{projectName(projects, update.projectId)} / {update.status}</p>
        <h3 className="mt-2 text-xl font-semibold">{update.title}</h3>
        <p className="mt-3 text-sm leading-6 text-[#666666]">{update.note}</p>
        <p className="mt-3 text-xs text-[#777777]">{update.imagePlaceholder}</p>
        <button className="btn-primary mt-5" type="button" onClick={() => onSiteResolution(update)}>
          Queue Site Resolution
        </button>
      </article>
    ))}
  </section>
)

const DocumentsView = ({
  documents,
  projects,
  workScope,
  onDocumentIssue,
}: {
  documents: DocumentRecord[]
  projects: Project[]
  workScope: WorkScopeSection[]
  onDocumentIssue: (document: DocumentRecord) => void
}) => (
  <section className="panel">
    <div className="panel-header">
      <h3>Document operations</h3>
      <span className="pill">{documents.length} packages</span>
    </div>
    <div className="space-y-4">
      {documents.map((document) => (
        <div key={document.id} className="grid gap-4 rounded-[24px] border border-black/[0.05] bg-[#faf9f8] p-4 lg:grid-cols-[1fr_0.28fr]">
          <div>
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[#777777]">{projectName(projects, document.projectId)} / {document.packageType}</p>
            <h3 className="mt-2 text-xl font-semibold">{document.title}</h3>
            <p className="mt-2 text-sm text-[#666666]">{document.version} / issue {document.issueDate} / {document.approvalState}</p>
            <p className="mt-2 text-xs text-[#777777]">
              Linked WorkScope: {(document.linkedScopeIds ?? []).map((id) => workScope.find((scope) => scope.id === id)?.code ?? id).join(', ')}
            </p>
          </div>
          <button className="btn-primary self-center" type="button" onClick={() => onDocumentIssue(document)}>
            Queue Issue
          </button>
        </div>
      ))}
    </div>
  </section>
)

const ArtworkView = ({ artwork, briefs, projects }: { artwork: ArtworkRecord[]; briefs: CreativeBrief[]; projects: Project[] }) => (
  <section className="grid gap-5 xl:grid-cols-4">
    {artwork.map((item) => (
      <article key={item.id} className="panel panel-float">
        <div className={`studio-fragment-media studio-fragment-${item.previewTone}`} />
        <p className="mt-4 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[#777777]">{projectName(projects, item.projectId)} / {item.group}</p>
        <h3 className="mt-2 text-lg font-semibold">{item.title}</h3>
        <p className="mt-3 text-sm leading-6 text-[#666666]">{item.operationalNotes}</p>
        <p className="mt-3 text-xs text-[#777777]">Brief: {briefs.find((brief) => brief.id === item.briefId)?.title ?? 'Unlinked brief'}</p>
      </article>
    ))}
  </section>
)

const BriefsView = ({
  artwork,
  briefs,
  projects,
  onBriefApproval,
}: {
  artwork: ArtworkRecord[]
  briefs: CreativeBrief[]
  projects: Project[]
  onBriefApproval: (brief: CreativeBrief) => void
}) => (
  <section className="grid gap-5 xl:grid-cols-2">
    {briefs.map((brief) => (
      <article key={brief.id} className="panel panel-float">
        <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[#777777]">{projectName(projects, brief.projectId)} / {brief.status}</p>
        <h3 className="mt-3 text-2xl font-bold">{brief.title}</h3>
        <p className="mt-3 text-sm leading-6 text-[#666666]">{brief.direction}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {brief.moodKeywords.map((keyword) => <span key={keyword} className="pill">{keyword}</span>)}
        </div>
        <p className="mt-4 text-sm leading-6 text-[#555555]">AI summary: {brief.aiSummary}</p>
        <p className="mt-3 text-xs text-[#777777]">
          Linked artwork: {brief.linkedArtworkIds.map((id) => artwork.find((item) => item.id === id)?.title ?? id).join(', ')}
        </p>
        <button className="btn-primary mt-5" type="button" onClick={() => onBriefApproval(brief)}>
          Queue Brief Approval
        </button>
      </article>
    ))}
  </section>
)

const ReviewsView = ({
  pendingApprovals,
  projects,
  reviews,
  onApprove,
  onReject,
}: {
  pendingApprovals: Parameters<typeof PendingApprovalPanel>[0]['items']
  projects: Project[]
  reviews: StudioReview[]
  onApprove: (requestId: string) => void
  onReject: (requestId: string) => void
}) => (
  <section className="grid gap-5 xl:grid-cols-[1fr_0.9fr]">
    <div className="panel">
      <div className="panel-header">
        <h3>Studio review queue</h3>
        <span className="pill">{reviews.filter((review) => review.status === 'pending').length} pending</span>
      </div>
      <div className="space-y-3">
        {reviews.map((review) => <ReviewCard key={review.id} review={review} projectName={projectName(projects, review.projectId)} />)}
      </div>
    </div>
    <PendingApprovalPanel items={pendingApprovals} onApprove={onApprove} onReject={onReject} />
  </section>
)

const ProjectRow = ({ project }: { project: Project }) => (
  <div className="surface-hover rounded-2xl border border-black/[0.05] bg-[#faf9f8] p-4">
    <div className="flex items-start justify-between gap-3">
      <div>
        <p className="text-base font-semibold">{project.name}</p>
        <p className="mt-1 text-xs text-[#777777]">{project.client} / {project.location}</p>
      </div>
      <span className={`font-mono text-[10px] font-semibold uppercase ${statusClass(project.timelineStatus ?? 'steady')}`}>
        {project.timelineStatus}
      </span>
    </div>
  </div>
)

const ActionCard = ({ detail, label, onClick }: { detail: string; label: string; onClick: () => void }) => (
  <div className="rounded-2xl border border-black/[0.05] bg-[#faf9f8] p-4">
    <p className="text-sm font-semibold">{label}</p>
    <p className="mt-2 text-xs leading-5 text-[#666666]">{detail}</p>
    <button className="btn-primary mt-4" type="button" onClick={onClick}>
      Queue Action
    </button>
  </div>
)

const FoundationTile = ({ body, label, value }: { body: string; label: string; value: number }) => (
  <div className="rounded-[28px] border border-black/[0.05] bg-white/80 p-5">
    <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[#777777]">{label}</p>
    <p className="mt-4 text-3xl font-bold">{value}</p>
    <p className="mt-3 text-sm leading-6 text-[#666666]">{body}</p>
  </div>
)

const PreviewBlock = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-2xl border border-black/[0.04] bg-[#faf9f8] p-3">
    <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.14em] text-[#777777]">{label}</p>
    <p className="mt-2 text-sm font-semibold">{value}</p>
  </div>
)

const ReviewCard = ({ projectName, review }: { projectName: string; review: StudioReview }) => (
  <div className="surface-hover rounded-2xl border border-black/[0.05] bg-[#faf9f8] p-4">
    <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[#777777]">{projectName} / {review.type}</p>
    <p className="mt-2 text-sm font-semibold">{review.title}</p>
    <p className={`mt-2 font-mono text-[10px] font-semibold uppercase ${statusClass(review.status)}`}>{review.status} / due {review.dueAt}</p>
  </div>
)

const CompactRow = ({ meta, status, title }: { meta: string; status: string; title: string }) => (
  <div className="rounded-2xl border border-black/[0.05] bg-white/75 p-3">
    <div className="flex items-start justify-between gap-3">
      <div>
        <p className="text-sm font-semibold">{title}</p>
        <p className="mt-1 text-xs text-[#777777]">{meta}</p>
      </div>
      <span className={`font-mono text-[10px] font-semibold uppercase ${statusClass(status)}`}>{status}</span>
    </div>
  </div>
)
