import { useMemo, useState, type ReactNode } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { AIContextExportPanel } from '../../components/shared/AIContextExportPanel'
import { AISuggestionImportPanel } from '../../components/shared/AISuggestionImportPanel'
import { ChangeLogList } from '../../components/shared/ChangeLogList'
import { EmptyState } from '../../components/shared/EmptyState'
import { PendingApprovalPanel } from '../../components/shared/PendingApprovalPanel'
import { SnapshotLog } from '../../components/shared/SnapshotLog'
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
  const upcomingOpenings = data.studioTimelinePhases.filter((p) => p.phase === 'handover' || p.phase === 'opening')
  const atRiskProjectIds = new Set(data.timeline.filter((t) => t.state === 'at-risk').map((t) => t.projectId))
  const atRiskProjects = data.projects.filter((p) => atRiskProjectIds.has(p.id) || p.timelineStatus === 'at-risk' || p.timelineStatus === 'blocked')

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

  return (
    <section className="studio-workspace-space space-y-7">
      <header className="command-hero rounded-[36px] border border-black/[0.05] bg-[#faf9f8] p-6 md:p-9">
        <div className="flex items-start justify-between gap-6">
          <div>
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-[#777777]">
              Studio OS / Control Room
            </p>
            <h2 className="mt-1 text-2xl font-extrabold tracking-tight">
              Studio Control Room
            </h2>
            <p className="mt-1 text-sm leading-6 text-[#666666]">
              Active projects, timeline, openings, and resource capacity
            </p>
          </div>
          <span className="shrink-0 rounded-full border border-black/[0.08] bg-white/80 px-4 py-2 font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-[#777777]">
            {new Date().toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
          </span>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="os-hero-metric os-hero-metric-neutral">
            <div className="flex items-center gap-3">
              <span className="os-icon-badge os-icon-badge-neutral">◇</span>
              <div className="min-w-0 flex-1">
                <p className="os-hero-value">{data.projects.length}</p>
                <p className="mt-0.5 truncate font-mono text-[9px] font-semibold uppercase tracking-[0.12em] text-[var(--bb-text-muted)]">Active Projects</p>
              </div>
            </div>
            <p className="os-hero-sub">{data.projects.map((p) => p.name).slice(0, 3).join(', ')}{data.projects.length > 3 ? ` +${data.projects.length - 3}` : ''}</p>
          </div>
          <div className="os-hero-metric os-hero-metric-purple">
            <div className="flex items-center gap-3">
              <span className="os-icon-badge os-icon-badge-purple">▶</span>
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
              <span className="os-icon-badge os-icon-badge-green">≡</span>
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
                  isActive ? 'bg-black text-white' : 'bg-white/70 text-[#777777] hover:bg-black/[0.05] hover:text-[#111111]'
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
          reviewDocument={reviewDocument}
          reviewScope={reviewScope}
          reviewSite={reviewSite}
          onDocumentIssue={queueDocumentIssue}
          onScopeApproval={queueScopeApproval}
          onSiteResolution={queueSiteResolution}
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

const Overview = ({
  activeScope,
  openSiteWatch,
  pendingStudioReviews,
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
  reviewDocument,
  reviewScope,
  reviewSite,
  onDocumentIssue,
  onScopeApproval,
  onSiteResolution,
}: {
  activeScope: WorkScopeSection[]
  openSiteWatch: SiteWatchUpdate[]
  pendingStudioReviews: StudioReview[]
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
  reviewDocument?: DocumentRecord
  reviewScope?: WorkScopeSection
  reviewSite?: SiteWatchUpdate
  onDocumentIssue: (document: DocumentRecord) => void
  onScopeApproval: (scope: WorkScopeSection) => void
  onSiteResolution: (siteUpdate: SiteWatchUpdate) => void
}) => {
  const sortedEvents = [...timeline, ...siteWatch.map((sw) => ({ id: sw.id, projectId: sw.projectId, label: sw.title, dueDate: sw.observedAt.slice(0, 10), state: sw.status }))]
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
    .slice(0, 8)

  const openingsSorted = [...upcomingOpenings].sort((a, b) => a.endDate.localeCompare(b.endDate))

  const projectLinkCount = (projectId: string, source: { projectId: string }[]) =>
    source.filter((item) => item.projectId === projectId).length

  const taskCount = tasks.length

  return (
    <div className="grid gap-7 xl:grid-cols-[minmax(0,1fr)_360px]">
      <main className="space-y-7">
        {/* L1: Active Projects */}
        <section className="panel panel-float">
          <div className="panel-header">
            <div>
              <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[#777777]">Studio Portfolio</p>
              <h3>Active Projects</h3>
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
              return (
                <Link
                  key={project.id}
                  to={`/os/studio/projects/${project.id}`}
                  className={`block rounded-2xl border p-4 transition hover:-translate-y-0.5 ${isAtRisk ? 'border-[#ead7c3] bg-[#fffaf4]' : 'border-black/[0.05] bg-[#faf9f8]'}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-base font-bold break-words">{project.name}</p>
                      <p className="mt-1 text-xs text-[#777777]">{project.client ?? 'Studio client'} / {project.location}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      {isAtRisk ? <span className="font-mono text-[9px] font-semibold uppercase text-[#c2410c]">at risk</span> : null}
                      <span className={`font-mono text-[10px] font-semibold uppercase ${statusClass(project.timelineStatus ?? 'steady')}`}>
                        {project.timelineStatus ?? 'steady'}
                      </span>
                    </div>
                  </div>
                  <p className="mt-1 text-xs font-semibold text-[#555555]">{project.phase}</p>
                  <div className="mt-3 flex flex-wrap gap-2 text-[10px] text-[#777777]">
                    <span>{wsCount} scope</span>
                    <span>{docCount} docs</span>
                    <span>{artCount} artwork</span>
                    <span>{projectLinkCount(project.id, siteWatch)} site</span>
                  </div>
                  {briefPreview ? (
                    <p className="mt-2 text-xs leading-5 text-[#666666] line-clamp-2">{briefPreview}</p>
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
                <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[#777777]">Timeline</p>
                <h3>Studio Master Timeline</h3>
              </div>
              <span className="pill">{sortedEvents.length}</span>
            </div>
            <div className="space-y-2">
              {sortedEvents.map((event) => (
                <div key={event.id} className="grid gap-2 border-b border-black/[0.04] pb-2 last:border-b-0 md:grid-cols-[90px_1fr_auto] md:items-center">
                  <p className="font-mono text-[10px] font-semibold uppercase text-[#777777]">{event.dueDate}</p>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate">{event.label}</p>
                    <p className="text-xs text-[#777777]">{projectName(projects, event.projectId)}</p>
                  </div>
                  <span className={`font-mono text-[9px] font-semibold uppercase ${statusClass(event.state)}`}>{event.state}</span>
                </div>
              ))}
              {sortedEvents.length === 0 && (
                <p className="text-sm text-[#777777]">ไม่มีเหตุการณ์ในไทม์ไลน์</p>
              )}
            </div>
          </div>

          <div className="space-y-5">
            <div className="panel panel-float">
              <div className="panel-header">
                <div>
                  <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[#777777]">Openings</p>
                  <h3>Upcoming Openings</h3>
                </div>
                <span className="pill">{openingsSorted.length}</span>
              </div>
              <div className="space-y-3">
                {openingsSorted.length === 0 ? (
                  <p className="text-sm text-[#777777]">ไม่มีกำหนดการเปิดในขณะนี้</p>
                ) : (
                  openingsSorted.map((phase) => (
                    <div key={phase.id} className="rounded-2xl border border-black/[0.05] bg-[#faf9f8] p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold">{projectName(projects, phase.projectId)}</p>
                          <p className="mt-0.5 text-xs text-[#777777]">{phase.phase} / {phase.endDate}</p>
                        </div>
                        <span className={`font-mono text-[9px] font-semibold uppercase ${phase.status === 'blocked' || phase.risk === 'high' ? 'text-[#c2410c]' : 'text-[#59634a]'}`}>
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
                  <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[#777777]">Capacity</p>
                  <h3>Resource Capacity</h3>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-black/[0.04] bg-white/80 p-3 text-center">
                  <p className="text-2xl font-bold">{activeScope.length}</p>
                  <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.1em] text-[#777777]">WorkScope</p>
                </div>
                <div className="rounded-2xl border border-black/[0.04] bg-white/80 p-3 text-center">
                  <p className="text-2xl font-bold">{openSiteWatch.length}</p>
                  <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.1em] text-[#777777]">Site Watch</p>
                </div>
                <div className="rounded-2xl border border-black/[0.04] bg-white/80 p-3 text-center">
                  <p className="text-2xl font-bold">{pendingStudioReviews.length}</p>
                  <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.1em] text-[#777777]">Reviews</p>
                </div>
                <div className="rounded-2xl border border-black/[0.04] bg-white/80 p-3 text-center">
                  <p className="text-2xl font-bold">{taskCount}</p>
                  <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.1em] text-[#777777]">Tasks</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* L3: At-Risk Projects + Operational Actions */}
        <section className="grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="panel panel-float">
            <div className="panel-header">
              <div>
                <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[#777777]">Risk</p>
                <h3>At-Risk Projects</h3>
              </div>
              <span className="pill">{atRiskProjects.length}</span>
            </div>
            <div className="space-y-3">
              {atRiskProjects.length === 0 ? (
                <p className="text-sm text-[#777777]">ไม่มีโปรเจคที่มีความเสี่ยง</p>
              ) : (
                atRiskProjects.map((project) => {
                  const projectRisks = timeline.filter((t) => t.projectId === project.id && t.state === 'at-risk')
                  const blockedPhases = phases.filter((p) => p.projectId === project.id && (p.status === 'blocked' || p.risk === 'high'))
                  return (
                    <div key={project.id} className="rounded-2xl border border-[#ead7c3] bg-[#fffaf4] p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold">{project.name}</p>
                          <p className="mt-0.5 text-xs text-[#777777]">{project.client} / {project.location}</p>
                        </div>
                        <span className="font-mono text-[9px] font-semibold uppercase text-[#c2410c]">{project.timelineStatus}</span>
                      </div>
                      {projectRisks.length > 0 && (
                        <div className="mt-3 space-y-1">
                          {projectRisks.map((risk) => (
                            <p key={risk.id} className="text-xs text-[#c2410c]">• {risk.label}</p>
                          ))}
                        </div>
                      )}
                      {blockedPhases.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {blockedPhases.map((p) => (
                            <span key={p.id} className="rounded-full bg-[#fdeae7] px-2 py-0.5 font-mono text-[9px] font-semibold uppercase text-[#c2410c]">
                              {p.phase}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })
              )}
            </div>
          </div>

          <div className="panel panel-float">
            <div className="panel-header">
              <div>
                <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[#777777]">Actions</p>
                <h3>Pending Approvals</h3>
              </div>
            </div>
            <div className="space-y-3">
              {reviewScope ? <ActionCard label="Approve WorkScope revision" detail={`${reviewScope.code} / ${reviewScope.title}`} onClick={() => onScopeApproval(reviewScope)} /> : null}
              {reviewDocument ? <ActionCard label="Issue document package" detail={`${reviewDocument.title} / ${reviewDocument.version}`} onClick={() => onDocumentIssue(reviewDocument)} /> : null}
              {reviewSite ? <ActionCard label="Resolve site watch item" detail={reviewSite.title} onClick={() => onSiteResolution(reviewSite)} /> : null}
              {!reviewScope && !reviewDocument && !reviewSite ? (
                <p className="text-sm text-[#777777]">ไม่มีรายการรออนุมัติ</p>
              ) : null}
            </div>
          </div>
        </section>
      </main>

      <aside className="intelligence-rail space-y-4">
        <div className="rounded-[30px] border border-black/[0.05] bg-white/85 p-5">
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[#777777]">Reviews</p>
          <p className="mt-1 text-xs text-[#777777]">{pendingStudioReviews.length} pending</p>
        </div>
        {pendingStudioReviews.map((review) => (
          <ReviewCard key={review.id} review={review} projectName={projectName(projects, review.projectId)} />
        ))}
        {pendingStudioReviews.length === 0 && (
          <p className="text-sm text-[#777777]">ไม่มีรีวิวที่รอการตรวจสอบ</p>
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
      </Link>
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
  const [expandedPlanning, setExpandedPlanning] = useState(false)

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
                Linear roadmap for design, construction, handover, opening, blockers, and workload overlap.
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
              <button className={expandedPlanning ? 'btn-primary' : 'btn-secondary'} type="button" onClick={() => setExpandedPlanning((current) => !current)}>
                {expandedPlanning ? 'Close expanded view' : 'Expand planning view'}
              </button>
            </div>
          </div>

          <div className="mb-5 rounded-[28px] border border-black/[0.05] bg-white/75 p-4">
            <div className="mb-3 flex items-center justify-between gap-4">
              <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[#777777]">Planning Roadmap</p>
              <span className="pill">overlap visible</span>
            </div>
            <div className="flex min-h-24 items-stretch gap-2 overflow-x-auto pb-1">
              {timelinePhaseLabels.map((phaseLabel) => {
                const phaseCount = visiblePhases.filter((phase) => phase.phase === phaseLabel).length
                const riskCount = visiblePhases.filter((phase) => phase.phase === phaseLabel && (phase.risk === 'high' || phase.status === 'blocked')).length
                return (
                  <div key={phaseLabel} className="min-w-[130px] flex-1 rounded-[22px] border border-black/[0.04] bg-[#faf9f8] p-3">
                    <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.12em] text-[#777777]">{phaseLabel}</p>
                    <p className="mt-3 text-2xl font-bold">{phaseCount}</p>
                    <p className={`mt-1 text-xs ${riskCount ? 'text-[#c2410c]' : 'text-[#59634a]'}`}>{riskCount ? `${riskCount} conflict / review` : 'steady'}</p>
                  </div>
                )
              })}
            </div>
          </div>

          {expandedPlanning ? (
            <div className="mb-5 rounded-[32px] border border-black/[0.06] bg-white/90 p-4 shadow-[0_26px_70px_rgba(0,0,0,0.08)]">
              <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[#777777]">Expanded planning view</p>
                  <h3 className="mt-2 text-2xl font-bold">Overlap reading surface</h3>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-[#666666]">A wider roadmap view for reading project phase collisions, milestone clusters, and blocked approvals without changing the normal planning board.</p>
                </div>
                <button className="btn-secondary" type="button" onClick={() => setExpandedPlanning(false)}>Close expanded view</button>
              </div>
              <div className="overflow-x-auto pb-2">
                <div className="min-w-[1380px] rounded-[30px] border border-black/[0.05] bg-[#faf9f8] p-5">
                  <div className="grid grid-cols-[240px_1fr] gap-5">
                    <div />
                    <div className="relative grid grid-cols-6 gap-2">
                      {buildAxisLabels(viewWindow).map((label) => (
                        <div key={`expanded-${label}`} className="rounded-2xl bg-white/80 px-3 py-3 text-center font-mono text-[9px] font-semibold uppercase tracking-[0.12em] text-[#777777]">
                          {label}
                        </div>
                      ))}
                    </div>
                    <div className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[#777777]">
                      Today / 03 Jun
                    </div>
                    <div className="relative h-6">
                      <div className="absolute top-0 h-full w-px bg-[#111111]" style={{ left: `${todayOffset}%` }} />
                      <div className="absolute -top-1 rounded-full bg-[#111111] px-2 py-1 font-mono text-[8px] uppercase tracking-[0.12em] text-white" style={{ left: `${todayOffset}%`, transform: 'translateX(-50%)' }}>
                        today
                      </div>
                    </div>
                    {projectRows.map(({ milestones, project, phases: rowPhases }) => (
                      <ProjectTimelineRow
                        key={`expanded-${project.id}`}
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
          ) : null}

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

const ActionCard = ({ detail, label, onClick }: { detail: string; label: string; onClick: () => void }) => (
  <div className="rounded-2xl border border-black/[0.05] bg-[#faf9f8] p-4">
    <p className="text-sm font-semibold">{label}</p>
    <p className="mt-2 text-xs leading-5 text-[#666666]">{detail}</p>
    <button className="btn-primary mt-4" type="button" onClick={onClick}>
      Queue Action
    </button>
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


