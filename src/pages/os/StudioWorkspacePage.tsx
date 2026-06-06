import { useMemo, useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { AIContextExportPanel } from '../../components/shared/AIContextExportPanel'
import { AISuggestionImportPanel } from '../../components/shared/AISuggestionImportPanel'
import { ChangeLogList } from '../../components/shared/ChangeLogList'
import { EmptyState } from '../../components/shared/EmptyState'
import { StudioTimelineBoard } from '../../components/studio/StudioTimelineBoard'
import { ProjectContextDrawer } from '../../components/studio/ProjectContextDrawer'
import { ExecutiveDashboard } from '../../components/studio/ExecutiveDashboard'
import { OperatingRhythm } from '../../components/studio/OperatingRhythm'
import { WorkspaceDrawer } from '../../components/shared/WorkspaceDrawer'
import { PendingApprovalPanel } from '../../components/shared/PendingApprovalPanel'
import { SnapshotLog } from '../../components/shared/SnapshotLog'
import { useOs } from '../../core/os/OsContext'
import type {
  ActionRequest,
  ApprovalRecord,
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
  if (['blocked', 'high', 'at-risk', 'open'].includes(status)) return 'text-[var(--bb-red)]'
  if (['review', 'needs-review', 'medium', 'active', 'pending'].includes(status)) return 'text-[var(--bb-amber)]'
  return 'text-[var(--bb-green)]'
}

const projectName = (projects: Project[], projectId: string) =>
  projects.find((project) => project.id === projectId)?.name ?? 'Unlinked project'

export const StudioWorkspacePage = ({ view = 'overview' }: { view?: StudioWorkspaceView }) => {
  const {
    data,
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
  const upcomingOpenings = data.studioTimelinePhases.filter((p) => p.phase === 'handover' || p.phase === 'opening')
  const atRiskProjectIds = new Set(data.timeline.filter((t) => t.state === 'at-risk').map((t) => t.projectId))
  const atRiskProjects = data.projects.filter((p) => atRiskProjectIds.has(p.id) || p.timelineStatus === 'at-risk' || p.timelineStatus === 'watch' || data.studioTimelinePhases.some((ph) => ph.projectId === p.id && (ph.status === 'blocked' || ph.risk === 'high')))

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

  return (
    <section className="studio-workspace-space space-y-5">
      <header className="command-hero rounded-[36px] border border-black/[0.05] bg-[#faf9f8] p-6 md:p-9">
        <div className="flex items-start justify-between gap-6">
          <div>
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--bb-text-muted)]">
              Studio OS / Control Room
            </p>
            <h2 className="mt-1 text-2xl font-extrabold tracking-tight">
              Studio Control Room
            </h2>
            <p className="mt-1 text-sm leading-6 text-[var(--bb-text-soft)]">
              Active projects, timeline, openings, and resource capacity
            </p>
          </div>
          <span className="shrink-0 rounded-full border border-black/[0.08] bg-white/80 px-4 py-2 font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--bb-text-muted)]">
            {new Date().toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
          </span>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="os-hero-metric os-hero-metric-neutral">
            <div className="flex items-center gap-3">
              <span className="os-icon-badge os-icon-badge-neutral">?</span>
              <div className="min-w-0 flex-1">
                <p className="os-hero-value">{data.projects.length}</p>
                <p className="mt-0.5 truncate font-mono text-[9px] font-semibold uppercase tracking-[0.12em] text-[var(--bb-text-muted)]">Active Projects</p>
              </div>
            </div>
            <p className="os-hero-sub">{data.projects.map((p) => p.name).slice(0, 3).join(', ')}{data.projects.length > 3 ? ` +${data.projects.length - 3}` : ''}</p>
          </div>
          <div className="os-hero-metric os-hero-metric-purple">
            <div className="flex items-center gap-3">
              <span className="os-icon-badge os-icon-badge-purple">?</span>
              <div className="min-w-0 flex-1">
                <p className="os-hero-value">{upcomingOpenings.length}</p>
                <p className="mt-0.5 truncate font-mono text-[9px] font-semibold uppercase tracking-[0.12em] text-[var(--bb-text-muted)]">Upcoming Openings</p>
              </div>
            </div>
            <p className="os-hero-sub">handover / opening phases</p>
          </div>
          <div className="os-hero-metric os-hero-metric-amber">
            <div className="flex items-center gap-3">
              <span className="os-icon-badge os-icon-badge-amber">!</span>
              <div className="min-w-0 flex-1">
                <p className="os-hero-value">{atRiskProjects.length}</p>
                <p className="mt-0.5 truncate font-mono text-[9px] font-semibold uppercase tracking-[0.12em] text-[var(--bb-text-muted)]">At-Risk</p>
              </div>
            </div>
            <p className="os-hero-sub">{atRiskProjects.map((p) => p.name).join(', ') || 'none'}</p>
          </div>
          <div className="os-hero-metric os-hero-metric-green">
            <div className="flex items-center gap-3">
              <span className="os-icon-badge os-icon-badge-green">=</span>
              <div className="min-w-0 flex-1">
                <p className="os-hero-value">{activeScope.length + openSiteWatch.length + pendingStudioReviews.length}</p>
                <p className="mt-0.5 truncate font-mono text-[9px] font-semibold uppercase tracking-[0.12em] text-[var(--bb-text-muted)]">Resource Load</p>
              </div>
            </div>
            <p className="os-hero-sub">{activeScope.length} scope / {openSiteWatch.length} site / {pendingStudioReviews.length} reviews</p>
          </div>
        </div>

        <nav className="mt-6 flex flex-wrap gap-2">
          {studioTabs.map((tab) => (
            <NavLink
              key={tab.to}
              to={tab.to}
              end={tab.view === 'overview'}
              className={({ isActive }) =>
                `rounded-full px-4 py-2 font-mono text-[10px] font-semibold uppercase tracking-[0.12em] transition ${
                  isActive ? 'bg-black text-white' : 'bg-white/70 text-[var(--bb-text-muted)] hover:bg-black/[0.05] hover:text-[var(--bb-text)]'
                }`
              }
            >
              {tab.label}
            </NavLink>
          ))}
        </nav>
      </header>

      {data.projects.length === 0 ? (
        <EmptyState title="Studio provider has no rows" body="Studio is rendering safely without project rows. Mock fallback can be restored or a live Apps Script read provider can supply Sheet rows later." />
      ) : null}

      {view === 'overview' ? (
        <Overview
          activeScope={activeScope}
          openSiteWatch={openSiteWatch}
          pendingStudioReviews={pendingStudioReviews}
          pendingApprovals={pendingApprovals}
          projectApprovals={data.approvals}
          projects={data.projects}
          phases={data.studioTimelinePhases}
          timeline={data.timeline}
          tasks={data.tasks}
          siteWatch={data.siteWatchUpdates}
          documents={data.documents}
          artwork={data.artworkRecords}
          briefs={data.creativeBriefs}
          workScope={data.workScopeSections}
          upcomingOpenings={upcomingOpenings}
          atRiskProjects={atRiskProjects}
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
        <MasterTimelineView
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

const Overview = ({
  activeScope,
  openSiteWatch,
  pendingStudioReviews,
  pendingApprovals,
  projectApprovals,
  projects,
  phases,
  timeline,
  tasks,
  siteWatch,
  documents,
  artwork,
  briefs,
  workScope,
  upcomingOpenings,
  atRiskProjects,
}: {
  activeScope: WorkScopeSection[]
  openSiteWatch: SiteWatchUpdate[]
  pendingStudioReviews: StudioReview[]
  pendingApprovals: ActionRequest[]
  projectApprovals: ApprovalRecord[]
  projects: Project[]
  phases: StudioTimelinePhase[]
  timeline: TimelineItem[]
  tasks: Task[]
  siteWatch: SiteWatchUpdate[]
  documents: DocumentRecord[]
  artwork: ArtworkRecord[]
  briefs: CreativeBrief[]
  workScope: WorkScopeSection[]
  upcomingOpenings: StudioTimelinePhase[]
  atRiskProjects: Project[]
}) => {
  const sortedEvents = [...timeline, ...siteWatch.map((sw) => ({ id: sw.id, projectId: sw.projectId, label: sw.title, dueDate: sw.observedAt.slice(0, 10), state: sw.status }))]
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
    .slice(0, 8)

  const openingsSorted = [...upcomingOpenings].sort((a, b) => a.endDate.localeCompare(b.endDate))

  const projectLinkCount = (projectId: string, source: { projectId: string }[]) =>
    source.filter((item) => item.projectId === projectId).length

  const taskCount = tasks.length

  const [contextProject, setContextProject] = useState<Project | null>(null)

  return (
    <div className="grid gap-7 xl:grid-cols-[minmax(0,1fr)_360px]">
      <main className="space-y-5">
        {/* OPERATING RHYTHM — daily executive brief */}
        <OperatingRhythm projects={projects} phases={phases} timeline={timeline} pendingApprovals={pendingApprovals} projectApprovals={projectApprovals} />

        {/* EXECUTIVE DASHBOARD */}
        <ExecutiveDashboard projects={projects} phases={phases} timeline={timeline} pendingApprovals={pendingApprovals} projectApprovals={projectApprovals} />

        {/* STUDIO TIMELINE BOARD */}
        <StudioTimelineBoard projects={projects} phases={phases} timeline={timeline} projectApprovals={projectApprovals} onProjectClick={setContextProject} />

        <WorkspaceDrawer open={contextProject !== null} onClose={() => setContextProject(null)} title={contextProject?.name ?? 'Project'}>
          <ProjectContextDrawer project={contextProject} phases={phases} timeline={timeline} tasks={tasks} projectApprovals={projectApprovals} onClose={() => setContextProject(null)} />
        </WorkspaceDrawer>

        {/* L1: Active Projects — detailed project inventory */}
        <section className="os-card-primary">
          <div className="panel-header">
            <div>
              <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--bb-text-muted)]">Studio Portfolio</p>
              <h3>Active Projects</h3>
              <p className="text-xs text-[var(--bb-text-soft)]">Project inventory with scope, documents, artwork, and site watch counts.</p>
            </div>
            <span className="pill">{projects.length} projects</span>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {projects.map((project) => {
              const isAtRisk = atRiskProjects.some((p) => p.id === project.id)
              const wsCount = projectLinkCount(project.id, workScope)
              const docCount = projectLinkCount(project.id, documents)
              const artCount = projectLinkCount(project.id, artwork)
              const briefPreview = briefs.find((b) => b.projectId === project.id)?.direction
              const projectPhases = phases.filter((p) => p.projectId === project.id)
              const completedPhases = projectPhases.filter((p) => p.status === 'complete')
              return (
                <Link
                  key={project.id}
                  to={`/os/studio/projects/${project.id}`}
                  className={`block rounded-2xl border p-3.5 transition hover:-translate-y-0.5 ${isAtRisk ? 'border-[#ead7c3] bg-[#fffaf4]' : 'border-black/[0.05] bg-[#faf9f8]'}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-base font-bold break-words">{project.name}</p>
                      <p className="mt-1 text-xs text-[var(--bb-text-muted)]">{project.client ?? 'Studio client'} / {project.location}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      {isAtRisk ? <span className="os-severity-dot os-severity-dot-red" /> : null}
                      <span className={`font-mono text-[10px] font-semibold uppercase ${statusClass(project.timelineStatus ?? 'steady')}`}>
                        {project.timelineStatus ?? 'steady'}
                      </span>
                    </div>
                  </div>
                  <p className="mt-1 text-xs font-semibold text-[var(--bb-text-muted)]">{project.phase}</p>
                  {projectPhases.length > 0 && (
                    <div className="mt-2 flex items-center gap-1">
                      {projectPhases.map((p) => (
                        <span
                          key={p.id}
                          className={`block rounded-full ${
                            p.status === 'active' ? 'h-2 w-2 border-2 border-[var(--bb-blue)] bg-transparent' :
                            'h-1.5 w-1.5 ' + (
                              p.status === 'complete' ? 'bg-[var(--bb-green)]' :
                              p.status === 'blocked' ? 'bg-[var(--bb-red)]' :
                              'bg-black/[0.08]'
                            )
                          }`}
                        />
                      ))}
                      <span className="ml-1 font-mono text-[9px] font-semibold text-[var(--bb-text-muted)]">{completedPhases.length}/{projectPhases.length}</span>
                    </div>
                  )}
                  <div className="mt-2 flex flex-wrap gap-2 text-[10px] text-[var(--bb-text-muted)]">
                    <span>{wsCount} scope</span>
                    <span>{docCount} docs</span>
                    <span>{artCount} artwork</span>
                    <span>{projectLinkCount(project.id, siteWatch)} site</span>
                  </div>
                  {briefPreview ? (
                    <p className="mt-2 text-xs leading-5 text-[var(--bb-text-soft)] line-clamp-2">{briefPreview}</p>
                  ) : null}
                </Link>
              )
            })}
          </div>
        </section>

        {/* L2: Studio Master Timeline + Upcoming Openings */}
        <section className="grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="panel panel-float">
            <div className="panel-header">
              <div>
                <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--bb-text-muted)]">Timeline</p>
                <h3>Studio Master Timeline</h3>
              </div>
              <span className="pill">{sortedEvents.length}</span>
            </div>
            <div className="space-y-2">
              {sortedEvents.map((event) => (
                <div key={event.id} className="grid gap-2 border-b border-black/[0.04] pb-2 last:border-b-0 md:grid-cols-[90px_1fr_auto] md:items-center">
                  <p className="font-mono text-[10px] font-semibold uppercase text-[var(--bb-text-muted)]">{event.dueDate}</p>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate">{event.label}</p>
                    <p className="text-xs text-[var(--bb-text-muted)]">{projectName(projects, event.projectId)}</p>
                  </div>
                  <span className={`font-mono text-[9px] font-semibold uppercase ${statusClass(event.state)}`}>{event.state}</span>
                </div>
              ))}
              {sortedEvents.length === 0 && (
                <p className="text-sm text-[var(--bb-text-muted)]">????????????????????????</p>
              )}
            </div>
          </div>

          <div className="space-y-5">
            <div className="panel panel-float">
              <div className="panel-header">
                <div>
                  <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--bb-text-muted)]">Openings</p>
                  <h3>Upcoming Openings</h3>
                </div>
                <span className="pill">{openingsSorted.length}</span>
              </div>
              <div className="space-y-3">
                {openingsSorted.length === 0 ? (
                  <p className="text-sm text-[var(--bb-text-muted)]">?????????????????????????</p>
                ) : (
                  openingsSorted.map((phase) => (
                    <div key={phase.id} className="os-list-row">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold">{projectName(projects, phase.projectId)}</p>
                          <p className="mt-0.5 text-xs text-[var(--bb-text-muted)]">{phase.phase} / {phase.endDate}</p>
                        </div>
                        <span className={`font-mono text-[9px] font-semibold uppercase ${phase.status === 'blocked' || phase.risk === 'high' ? 'text-[var(--bb-red)]' : 'text-[var(--bb-green)]'}`}>
                          {phase.status}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="panel panel-float">
              <div className="panel-header">
                <div>
                  <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--bb-text-muted)]">Capacity</p>
                  <h3>Resource Capacity</h3>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-black/[0.04] bg-white/80 p-3 text-center">
                  <p className="text-2xl font-bold">{activeScope.length}</p>
                  <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.1em] text-[var(--bb-text-muted)]">WorkScope</p>
                </div>
                <div className="rounded-2xl border border-black/[0.04] bg-white/80 p-3 text-center">
                  <p className="text-2xl font-bold">{openSiteWatch.length}</p>
                  <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.1em] text-[var(--bb-text-muted)]">Site Watch</p>
                </div>
                <div className="rounded-2xl border border-black/[0.04] bg-white/80 p-3 text-center">
                  <p className="text-2xl font-bold">{pendingStudioReviews.length}</p>
                  <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.1em] text-[var(--bb-text-muted)]">Reviews</p>
                </div>
                <div className="rounded-2xl border border-black/[0.04] bg-white/80 p-3 text-center">
                  <p className="text-2xl font-bold">{taskCount}</p>
                  <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.1em] text-[var(--bb-text-muted)]">Tasks</p>
                </div>
              </div>
            </div>
          </div>
        </section>

      </main>

      <aside className="intelligence-rail space-y-4">
        <div className="rounded-[30px] border border-black/[0.05] bg-white/85 p-5">
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--bb-text-muted)]">Reviews</p>
          <p className="mt-1 text-xs text-[var(--bb-text-muted)]">{pendingStudioReviews.length} pending</p>
        </div>
        {pendingStudioReviews.map((review) => (
          <ReviewCard key={review.id} review={review} projectName={projectName(projects, review.projectId)} />
        ))}
        {pendingStudioReviews.length === 0 && (
          <p className="text-sm text-[var(--bb-text-muted)]">?????????????????????????</p>
        )}
      </aside>
    </div>
  )
}

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
      <Link key={project.id} to={`/os/studio/projects/${project.id}`} className="panel panel-float block transition hover:-translate-y-0.5">
        <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--bb-text-muted)]">{project.location} / {project.phase}</p>
        <h3 className="mt-3 text-3xl font-bold tracking-tight">{project.name}</h3>
        <p className="mt-3 text-sm leading-6 text-[var(--bb-text-soft)]">{project.operationalNotes}</p>
        <div className="mt-5 grid gap-3 md:grid-cols-2">
          <PreviewBlock label="Client" value={project.client ?? 'Studio client'} />
          <PreviewBlock label="Timeline" value={project.timelineStatus ?? 'steady'} />
          <PreviewBlock label="WorkScope" value={`${workScope.filter((scope) => scope.projectId === project.id).length} sections`} />
          <PreviewBlock label="Documents" value={`${documents.filter((document) => document.projectId === project.id).length} linked`} />
          <PreviewBlock label="Artwork" value={`${artwork.filter((item) => item.projectId === project.id).length} references`} />
          <PreviewBlock label="Site" value={`${siteWatch.filter((item) => item.projectId === project.id && item.status !== 'resolved').length} open`} />
        </div>
        <div className="mt-5">
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--bb-text-muted)]">Brief preview</p>
          <p className="mt-2 text-sm text-[var(--bb-text-muted)]">{briefs.find((brief) => brief.projectId === project.id)?.direction ?? 'No brief linked yet.'}</p>
        </div>
      </Link>
    ))}
  </section>
)

const MasterTimelineView = ({
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
  const [viewWindow, setViewWindow] = useState<'month' | 'quarter'>('quarter')

  const windowStart = useMemo(() => new Date('2026-06-01T00:00:00.000Z'), [])
  const windowEnd = useMemo(() => new Date(viewWindow === 'month' ? '2026-06-30T00:00:00.000Z' : '2026-08-31T00:00:00.000Z'), [viewWindow])
  const totalDays = useMemo(() => daysBetween(windowStart, windowEnd) + 1, [windowStart, windowEnd])
  const todayOffset = useMemo(() => clamp((daysBetween(windowStart, new Date('2026-06-03T00:00:00.000Z')) / totalDays) * 100, 0, 100), [windowStart, totalDays])

  const visiblePhases = projectFilter === 'all'
    ? phases
    : phases.filter((p) => p.projectId === projectFilter)

  const projectRows = useMemo(() =>
    projects
      .filter((project) => visiblePhases.some((phase) => phase.projectId === project.id))
      .map((project) => ({
        project,
        phases: visiblePhases.filter((phase) => phase.projectId === project.id),
        milestones: [
          ...timeline.filter((e) => e.projectId === project.id).map((e) => ({ id: e.id, date: e.dueDate, label: e.label, state: e.state })),
          ...reviews.filter((r) => r.projectId === project.id).map((r) => ({ id: r.id, date: r.dueAt, label: r.title, state: r.status })),
        ],
      })),
    [visiblePhases, projects, timeline, reviews])

  const overlappingPhases = useMemo(() => getOverlappingPhases(visiblePhases), [visiblePhases])
  const blockedPhases = visiblePhases.filter((p) => p.status === 'blocked' || p.blockerIds.length > 0)
  const upcomingOpenings = visiblePhases.filter((p) => p.phase === 'handover' || p.phase === 'opening')
  const pendingReviews = reviews.filter((r) => r.status === 'pending')

  const decisions = useMemo(() => {
    const items: Array<{ id: string; type: 'review' | 'milestone' | 'blocker'; title: string; date: string; owner: string; status: string }> = []
    pendingReviews.forEach((r) => {
      const p = projects.find((pr) => pr.id === r.projectId)
      items.push({ id: r.id, type: 'review', title: r.title, date: r.dueAt, owner: p?.owner ?? '', status: r.status })
    })
    timeline.filter((e) => e.state === 'at-risk').forEach((e) => {
      const p = projects.find((pr) => pr.id === e.projectId)
      items.push({ id: e.id, type: 'milestone', title: e.label, date: e.dueDate, owner: p?.owner ?? '', status: e.state })
    })
    blockedPhases.forEach((ph) => {
      const p = projects.find((pr) => pr.id === ph.projectId)
      items.push({ id: ph.id, type: 'blocker', title: `${ph.phase} blocked`, date: ph.endDate, owner: p?.owner ?? '', status: 'blocked' })
    })
    return items.sort((a, b) => a.date.localeCompare(b.date)).slice(0, 6)
  }, [pendingReviews, timeline, blockedPhases, projects])

  const events = [
    ...timeline.map((e) => ({ id: e.id, date: e.dueDate, title: e.label, meta: `${projectName(projects, e.projectId)} / ${e.state}` })),
    ...reviews.map((r) => ({ id: r.id, date: r.dueAt, title: r.title, meta: `${projectName(projects, r.projectId)} / ${r.type}` })),
    ...siteWatch.map((u) => ({ id: u.id, date: u.observedAt.slice(0, 10), title: u.title, meta: `${projectName(projects, u.projectId)} / site watch` })),
  ].sort((a, b) => a.date.localeCompare(b.date))

  const resourceWeeks = useMemo(() => {
    const weeks: Array<{ label: string; count: number; names: string[] }> = []
    for (let i = 0; i < 12; i++) {
      const weekStart = new Date(windowStart)
      weekStart.setDate(weekStart.getDate() + i * 7)
      const weekEnd = new Date(weekStart)
      weekEnd.setDate(weekEnd.getDate() + 6)
      const label = `${weekStart.getDate()} ${weekStart.toLocaleString('en', { month: 'short' })}`
      const active: string[] = []
      visiblePhases.forEach((ph) => {
        const phStart = new Date(ph.startDate)
        const phEnd = new Date(ph.endDate)
        if (phStart <= weekEnd && phEnd >= weekStart) {
          const pn = projects.find((pr) => pr.id === ph.projectId)?.name ?? ''
          if (!active.includes(pn)) active.push(pn)
        }
      })
      weeks.push({ label, count: active.length, names: active })
    }
    return weeks
  }, [visiblePhases, projects, windowStart])

  const schedulePhases = ['design', 'approval', 'procurement', 'construction', 'handover', 'opening'] as const

  if (phases.length === 0) {
    return <EmptyState title="Timeline provider has no phase rows" body="The planning board can render an empty state while waiting for Sheet-backed timeline phases or mock fallback data." />
  }

  return (
    <section className="space-y-6">
      {/* Phase Summary Strip */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {schedulePhases.map((phaseLabel) => {
          const count = visiblePhases.filter((p) => p.phase === phaseLabel).length
          const riskCount = visiblePhases.filter((p) => p.phase === phaseLabel && (p.risk === 'high' || p.status === 'blocked')).length
          return (
            <div key={phaseLabel} className="min-w-[120px] flex-1 rounded-[22px] border border-black/[0.04] bg-[#faf9f8] p-3">
              <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.12em] text-[var(--bb-text-muted)]">{phaseLabel}</p>
              <p className="mt-2 text-2xl font-bold">{count}</p>
              <div className="mt-1 flex items-center gap-1.5">
                {riskCount > 0 ? <span className="os-severity-dot os-severity-dot-red" /> : <span className="os-severity-dot os-severity-dot-green" />}
                <span className={`font-mono text-[9px] font-semibold uppercase ${riskCount ? 'text-[var(--bb-red)]' : 'text-[var(--bb-green)]'}`}>
                  {riskCount ? `${riskCount} risk` : 'steady'}
                </span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Main Timeline Board */}
      <div className="panel panel-float overflow-hidden">
        <div className="panel-header">
          <div>
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--bb-text-muted)]">Studio Master Timeline</p>
            <h3>Planning board</h3>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select
              className="rounded-full border border-black/[0.08] bg-white/80 px-3 py-1.5 font-mono text-[9px] font-semibold uppercase tracking-[0.12em] text-[var(--bb-text-muted)] outline-none"
              value={projectFilter}
              onChange={(e) => setProjectFilter(e.target.value)}
            >
              <option value="all">All projects</option>
              {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <button className={viewWindow === 'month' ? 'btn-primary' : 'btn-secondary'} type="button" onClick={() => setViewWindow('month')}>Month</button>
            <button className={viewWindow === 'quarter' ? 'btn-primary' : 'btn-secondary'} type="button" onClick={() => setViewWindow('quarter')}>Quarter</button>
          </div>
        </div>

        <div className="overflow-x-auto pb-2">
          <div className="min-w-[900px] rounded-[30px] border border-black/[0.05] bg-[#faf9f8] p-4">
            {/* Axis Header */}
            <div className="grid grid-cols-[200px_1fr] gap-4">
              <div />
              <div className="relative grid grid-cols-6 gap-2">
                {buildAxisLabels(viewWindow).map((label) => (
                  <div key={label} className="rounded-2xl bg-white/70 px-3 py-2 text-center font-mono text-[9px] font-semibold uppercase tracking-[0.12em] text-[var(--bb-text-muted)]">
                    {label}
                  </div>
                ))}
              </div>

              {/* Today Marker */}
              <div className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--bb-text-muted)]">Today</div>
              <div className="relative h-5">
                <div className="absolute top-0 h-full w-px bg-[#111111]" style={{ left: `${todayOffset}%` }} />
                <div className="absolute -top-1 rounded-full bg-[#111111] px-2 py-1 font-mono text-[8px] uppercase tracking-[0.12em] text-white" style={{ left: `${todayOffset}%`, transform: 'translateX(-50%)' }}>today</div>
              </div>

              {/* Project Rows */}
              {projectRows.map(({ project, phases: rowPhases, milestones }) => {
                const projectOverlaps = overlappingPhases.filter((p) => p.projectId === project.id)
                const hasCriticalOverlap = projectOverlaps.length > 0 && rowPhases.some((p) => p.status === 'blocked' || p.risk === 'high')
                return (
                  <MasterTimelineRow
                    key={project.id}
                    milestones={milestones}
                    onPhaseReview={onPhaseReview}
                    phases={rowPhases}
                    project={project}
                    totalDays={totalDays}
                    windowStart={windowStart}
                    overlapCount={projectOverlaps.length}
                    criticalOverlap={hasCriticalOverlap}
                  />
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Resource Capacity + Upcoming Openings + Decisions */}
      <div className="grid gap-5 lg:grid-cols-[1fr_1fr] xl:grid-cols-[1.2fr_0.8fr_1fr]">
        {/* Resource Capacity */}
        <div className="panel">
          <div className="panel-header">
            <h3>Resource capacity</h3>
            <span className="pill">{resourceWeeks.filter((w) => w.count > 0).length} active weeks</span>
          </div>
          <div className="flex items-end gap-1 overflow-x-auto pb-1">
            {resourceWeeks.map((week) => {
              const maxLoad = Math.max(...resourceWeeks.map((w) => w.count), 1)
              const barH = Math.max(4, (week.count / maxLoad) * 100)
              const color = week.count >= 4 ? 'var(--bb-red)' : week.count >= 2 ? 'var(--bb-amber)' : 'var(--bb-green)'
              return (
                <div key={week.label} className="flex flex-1 flex-col items-center gap-1" title={week.names.join(', ')}>
                  <div className="flex w-full items-end justify-center" style={{ height: '48px' }}>
                    <div className="w-full rounded-full transition-all" style={{ height: `${barH}%`, maxHeight: '48px', background: color, minHeight: '4px' }} />
                  </div>
                  <span className="font-mono text-[7px] font-semibold uppercase tracking-[0.06em] text-[var(--bb-text-muted)]">{week.label}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Upcoming Openings */}
        <div className="panel">
          <div className="panel-header">
            <h3>Upcoming openings</h3>
            <span className="pill">{upcomingOpenings.length}</span>
          </div>
          <div className="space-y-2">
            {upcomingOpenings.length === 0 ? (
              <p className="text-sm text-[var(--bb-text-muted)]">No upcoming openings</p>
              ) : upcomingOpenings.slice(0, 6).map((ph) => {
              const p = projects.find((pr) => pr.id === ph.projectId)
              const openingTone = ph.status === 'blocked' || ph.risk === 'high' ? 'red' : ph.status === 'active' || ph.risk === 'medium' ? 'amber' : 'green'
              return (
                <div key={ph.id} className="os-list-row">
                  <div className="flex items-center gap-2">
                    <span className={`os-severity-dot os-severity-dot-${openingTone}`} />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold">{p?.name ?? 'Unknown'}</p>
                      <p className="text-xs text-[var(--bb-text-muted)]">{ph.phase} / {ph.endDate} {p?.client ? `/ ${p.client}` : ''}</p>
                    </div>
                    <span className={`font-mono text-[9px] font-semibold uppercase ${openingTone === 'red' ? 'text-[var(--bb-red)]' : openingTone === 'amber' ? 'text-[var(--bb-amber)]' : 'text-[var(--bb-green)]'}`}>
                      {ph.status}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Design Director Decisions */}
        <div className="panel">
          <div className="panel-header">
            <h3>Director actions</h3>
            <span className="pill">{decisions.length} decisions</span>
          </div>
          <div className="space-y-2">
            {decisions.length === 0 ? (
              <p className="text-sm text-[var(--bb-text-muted)]">No pending decisions</p>
            ) : decisions.map((d) => (
              <div key={d.id} className="os-list-row">
                <div className="flex items-center gap-2">
                  <span className={`os-severity-dot ${d.type === 'blocker' ? 'os-severity-dot-red' : 'os-severity-dot-amber'}`} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold truncate">{d.title}</p>
                    <p className="text-xs text-[var(--bb-text-muted)]">{d.owner}{d.owner && d.date ? ' / ' : ''}{d.date}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Event Feed + Pending Approvals */}
      <section className="grid gap-5 xl:grid-cols-[1fr_0.9fr]">
        <div className="panel">
          <div className="panel-header">
            <div>
              <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--bb-text-muted)]">Timeline feed</p>
              <h3>Recent events</h3>
            </div>
            <span className="pill">{events.length} events</span>
          </div>
          <div className="space-y-3">
            {events.slice(0, 8).map((event) => (
              <div key={event.id} className="grid gap-3 border-b border-black/[0.04] pb-3 last:border-b-0 md:grid-cols-[120px_1fr]">
                <p className="font-mono text-[10px] font-semibold uppercase text-[var(--bb-text-muted)]">{event.date}</p>
                <div>
                  <p className="text-sm font-semibold">{event.title}</p>
                  <p className="mt-0.5 text-xs text-[var(--bb-text-muted)]">{event.meta}</p>
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

const MasterTimelineRow = ({
  milestones,
  onPhaseReview,
  phases,
  project,
  totalDays,
  windowStart,
  overlapCount,
  criticalOverlap,
}: {
  milestones: Array<{ id: string; date: string; label: string; state: string }>
  onPhaseReview: (phase: StudioTimelinePhase) => void
  phases: StudioTimelinePhase[]
  project: Project
  totalDays: number
  windowStart: Date
  overlapCount: number
  criticalOverlap: boolean
}) => (
  <>
    <div className="rounded-[24px] border border-black/[0.05] bg-white/80 p-4">
      <div className="flex items-center gap-2">
        <span className={`os-severity-dot ${project.timelineStatus === 'at-risk' ? 'os-severity-dot-red' : project.timelineStatus === 'watch' ? 'os-severity-dot-amber' : 'os-severity-dot-green'}`} />
        <p className="text-sm font-bold truncate">{project.name}</p>
      </div>
      <p className="mt-1 text-xs text-[var(--bb-text-muted)] truncate">
        {project.location ?? ''}{project.client ? ` / ${project.client}` : ''}
      </p>
      <p className="mt-1 font-mono text-[9px] font-semibold uppercase text-[var(--bb-text-muted)]">{project.owner}</p>
      {overlapCount > 0 && (
        <div className={`mt-2 flex items-center gap-1 rounded-full px-2 py-0.5 ${criticalOverlap ? 'bg-[#fff7ed]' : 'bg-[#f6f0df]'}`}>
          <span className={`font-mono text-[8px] font-bold uppercase ${criticalOverlap ? 'text-[var(--bb-red)]' : 'text-[var(--bb-amber)]'}`}>
            {overlapCount} {criticalOverlap ? 'conflict' : 'overlap'}
          </span>
        </div>
      )}
    </div>
    <div className="relative min-h-[120px] rounded-[24px] border border-black/[0.04] bg-white/55 p-3">
      <div className="absolute inset-y-3 left-0 right-0 grid grid-cols-6 px-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="border-l border-black/[0.04] first:border-l-0" />
        ))}
      </div>
      {phases.map((phase, i) => {
        const { left, width } = getPhasePosition(phase, windowStart, totalDays)
        const top = 8 + i * 28
        const isOverlapping = overlapCount > 0
        return (
          <button
            key={phase.id}
            className={`absolute rounded-full px-2.5 py-1.5 text-left text-[9px] font-bold shadow-[0_8px_20px_rgba(0,0,0,0.08)] ring-2 transition hover:-translate-y-0.5 ${phaseTone[phase.phase]} ${riskRing[phase.risk]} ${isOverlapping ? 'opacity-90' : ''}`}
            style={{ left: `${left}%`, top, width: `${width}%` }}
            type="button"
            onClick={() => onPhaseReview(phase)}
            title={`${phase.phase}: ${phase.startDate} to ${phase.endDate} / ${phase.status} / ${phase.risk}`}
          >
            <span className="block truncate uppercase tracking-[0.08em]">{phase.phase}</span>
            <span className="block truncate font-mono text-[7px] opacity-70">{phase.startDate} - {phase.endDate}</span>
          </button>
        )
      })}
      {milestones.map((milestone) => {
        const left = clamp((daysBetween(windowStart, new Date(`${milestone.date}T00:00:00.000Z`)) / totalDays) * 100, 0, 100)
        return (
          <span
            key={milestone.id}
            className={`absolute bottom-2 h-2.5 w-2.5 rotate-45 rounded-[2px] border border-white shadow-[0_4px_10px_rgba(0,0,0,0.12)] ${milestone.state === 'at-risk' ? 'bg-[var(--bb-red)]' : milestone.state === 'pending' ? 'bg-[var(--bb-amber)]' : 'bg-[var(--bb-text)]'}`}
            style={{ left: `${left}%` }}
            title={milestone.label}
          />
        )
      })}
      {phases.some((p) => p.status === 'blocked' || p.risk === 'high') && (
        <span className="absolute bottom-2 right-2 rounded-full bg-[#fff7ed] px-2 py-0.5 font-mono text-[7px] font-bold uppercase text-[var(--bb-red)]">blocked</span>
      )}
    </div>
  </>
)

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
  medium: 'ring-[var(--bb-amber)]/35',
  high: 'ring-[var(--bb-red)]/45',
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
        <p className="mt-4 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--bb-text-muted)]">{projectName(projects, update.projectId)} / {update.status}</p>
        <h3 className="mt-2 text-xl font-semibold">{update.title}</h3>
        <p className="mt-3 text-sm leading-6 text-[var(--bb-text-soft)]">{update.note}</p>
        <p className="mt-3 text-xs text-[var(--bb-text-muted)]">{update.imagePlaceholder}</p>
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
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--bb-text-muted)]">{projectName(projects, document.projectId)} / {document.packageType}</p>
            <h3 className="mt-2 text-xl font-semibold">{document.title}</h3>
            <p className="mt-2 text-sm text-[var(--bb-text-soft)]">{document.version} / issue {document.issueDate} / {document.approvalState}</p>
            <p className="mt-2 text-xs text-[var(--bb-text-muted)]">
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
        <p className="mt-4 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--bb-text-muted)]">{projectName(projects, item.projectId)} / {item.group}</p>
        <h3 className="mt-2 text-lg font-semibold">{item.title}</h3>
        <p className="mt-3 text-sm leading-6 text-[var(--bb-text-soft)]">{item.operationalNotes}</p>
        <p className="mt-3 text-xs text-[var(--bb-text-muted)]">Brief: {briefs.find((brief) => brief.id === item.briefId)?.title ?? 'Unlinked brief'}</p>
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
        <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--bb-text-muted)]">{projectName(projects, brief.projectId)} / {brief.status}</p>
        <h3 className="mt-3 text-2xl font-bold">{brief.title}</h3>
        <p className="mt-3 text-sm leading-6 text-[var(--bb-text-soft)]">{brief.direction}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {brief.moodKeywords.map((keyword) => <span key={keyword} className="pill">{keyword}</span>)}
        </div>
        <p className="mt-4 text-sm leading-6 text-[var(--bb-text-muted)]">AI summary: {brief.aiSummary}</p>
        <p className="mt-3 text-xs text-[var(--bb-text-muted)]">
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

const PreviewBlock = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-2xl border border-black/[0.04] bg-[#faf9f8] p-3">
    <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.14em] text-[var(--bb-text-muted)]">{label}</p>
    <p className="mt-2 text-sm font-semibold">{value}</p>
  </div>
)

const ReviewCard = ({ projectName, review }: { projectName: string; review: StudioReview }) => (
  <div className="surface-hover rounded-2xl border border-black/[0.05] bg-[#faf9f8] p-4">
    <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--bb-text-muted)]">{projectName} / {review.type}</p>
    <p className="mt-2 text-sm font-semibold">{review.title}</p>
    <p className={`mt-2 font-mono text-[10px] font-semibold uppercase ${statusClass(review.status)}`}>{review.status} / due {review.dueAt}</p>
  </div>
)


