import { NavLink } from 'react-router-dom'
import { AIContextExportPanel } from '../../components/shared/AIContextExportPanel'
import { AISuggestionImportPanel } from '../../components/shared/AISuggestionImportPanel'
import { ChangeLogList } from '../../components/shared/ChangeLogList'
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

        <div className="mt-5 grid gap-3 md:grid-cols-3">
          <SourceStatusBadge status={sourceStatuses.studio} />
          <Metric label="Projects" value={data.projects.length} />
          <Metric label="Pending reviews" value={pendingStudioReviews.length} />
        </div>
      </header>

      {view === 'overview' ? (
        <Overview
          activeScope={activeScope}
          openSiteWatch={openSiteWatch}
          pendingStudioReviews={pendingStudioReviews}
          projects={data.projects}
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
        <TimelineView projects={data.projects} timeline={data.timeline} reviews={data.studioReviews} siteWatch={data.siteWatchUpdates} />
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
  onDocumentIssue,
  onScopeApproval,
  onSiteResolution,
}: {
  activeScope: WorkScopeSection[]
  openSiteWatch: SiteWatchUpdate[]
  pendingStudioReviews: StudioReview[]
  projects: Project[]
  reviewDocument?: DocumentRecord
  reviewScope?: WorkScopeSection
  reviewSite?: SiteWatchUpdate
  onDocumentIssue: (document: DocumentRecord) => void
  onScopeApproval: (scope: WorkScopeSection) => void
  onSiteResolution: (siteUpdate: SiteWatchUpdate) => void
}) => (
  <div className="grid gap-7 xl:grid-cols-[minmax(0,1fr)_360px]">
    <main className="space-y-7">
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
  projects,
  reviews,
  siteWatch,
  timeline,
}: {
  projects: Project[]
  reviews: StudioReview[]
  siteWatch: SiteWatchUpdate[]
  timeline: Array<{ id: string; projectId: string; label: string; dueDate: string; state: string }>
}) => {
  const events = [
    ...timeline.map((event) => ({ id: event.id, date: event.dueDate, title: event.label, meta: `${projectName(projects, event.projectId)} / ${event.state}` })),
    ...reviews.map((review) => ({ id: review.id, date: review.dueAt, title: review.title, meta: `${projectName(projects, review.projectId)} / ${review.type}` })),
    ...siteWatch.map((update) => ({ id: update.id, date: update.observedAt.slice(0, 10), title: update.title, meta: `${projectName(projects, update.projectId)} / site watch` })),
  ].sort((a, b) => a.date.localeCompare(b.date))

  return (
    <section className="panel">
      <div className="panel-header">
        <h3>Studio operational timeline</h3>
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
    </section>
  )
}

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
