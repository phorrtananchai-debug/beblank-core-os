import { Link, useParams } from 'react-router-dom'
import { type ReactNode } from 'react'
import { EmptyState } from '../../components/shared/EmptyState'
import { useOs } from '../../core/os/OsContext'
import type {
  ArtworkRecord,
  CreativeBrief,
  DocumentRecord,
  Project,
  SiteIssue,
  SiteWatchUpdate,
  StudioReview,
  StudioTimelinePhase,
  TimelineItem,
  WorkScopeSection,
} from '../../types/models'

const statusClass = (status: string) => {
  if (['blocked', 'high', 'at-risk', 'open'].includes(status)) return 'text-[#c2410c]'
  if (['review', 'needs-review', 'medium', 'active', 'pending'].includes(status)) return 'text-[#9a6a1f]'
  return 'text-[#59634a]'
}

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

const StudioActionButton = ({
  children,
  disabled,
  onClick,
  title,
}: {
  children: ReactNode
  disabled?: boolean
  onClick: () => void
  title?: string
}) => (
  <button
    className="rounded-full border border-black/[0.08] bg-white/80 px-3 py-1.5 font-mono text-[9px] font-semibold uppercase tracking-[0.1em] text-[#555555] transition hover:bg-black/[0.05] disabled:cursor-not-allowed disabled:opacity-30"
    disabled={disabled}
    title={title}
    type="button"
    onClick={onClick}
  >
    {children}
  </button>
)

export const StudioProjectDetailPage = () => {
  const { projectId } = useParams<{ projectId: string }>()
  const { data, createActionRequest } = useOs()

  const project = data.projects.find((p) => p.id === projectId)

  if (!project) {
    return (
      <section className="studio-project-detail">
        <Link
          className="mb-6 inline-block rounded-full bg-white/70 px-4 py-2 font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-[#777777] transition hover:bg-black/[0.05] hover:text-[#111111]"
          to="/os/studio/projects"
        >
          &larr; Back to projects
        </Link>
        <EmptyState title="Project not found" body="The project ID in the URL does not match any known project. Check the route or select a project from the list." />
      </section>
    )
  }

  const workScopeSections = data.workScopeSections.filter((s) => s.projectId === projectId)
  const timelinePhases = data.studioTimelinePhases.filter((p) => p.projectId === projectId)
  const siteWatchUpdates = data.siteWatchUpdates.filter((s) => s.projectId === projectId)
  const siteIssues = data.siteIssues.filter((s) => s.projectId === projectId)
  const documents = data.documents.filter((d) => d.projectId === projectId)
  const reviews = data.studioReviews.filter((r) => r.projectId === projectId)
  const timelineItems = data.timeline.filter((t) => t.projectId === projectId)
  const artworkRecords = data.artworkRecords.filter((a) => a.projectId === projectId)
  const creativeBriefs = data.creativeBriefs.filter((b) => b.projectId === projectId)
  const aiContexts = data.aiContexts.filter((ctx) => ctx.module === 'studio')

  const queueAction = (actionType: string, description: string, payload: Record<string, unknown>) => {
    createActionRequest({ module: 'studio', actionType: actionType, description, payload })
  }

  const queueScopeApproval = (scope: WorkScopeSection) => {
    queueAction('studio.approveWorkScopeRevision', `Approve ${scope.code} WorkScope revision`, { scopeId: scope.id })
  }

  const queueScopeComplete = (scope: WorkScopeSection) => {
    queueAction('studio.markWorkScopeComplete', `Mark ${scope.code} WorkScope complete`, { scopeId: scope.id })
  }

  const queueScopeBlocked = (scope: WorkScopeSection) => {
    queueAction('studio.flagWorkScopeBlocked', `Flag ${scope.code} WorkScope blocked`, { scopeId: scope.id })
  }

  const queueSiteResolution = (siteUpdate: SiteWatchUpdate) => {
    queueAction('studio.resolveSiteWatch', `Resolve site watch: ${siteUpdate.title}`, { siteWatchId: siteUpdate.id, projectId: projectId })
  }

  const queueSiteReview = (siteUpdate: SiteWatchUpdate) => {
    queueAction('studio.requestSiteReview', `Request review for: ${siteUpdate.title}`, { siteWatchId: siteUpdate.id, projectId: projectId })
  }

  const queueIssueEscalation = (issue: SiteIssue) => {
    queueAction('studio.escalateSiteIssue', `Escalate site issue: ${issue.issue}`, { issueId: issue.id, projectId: projectId })
  }

  const queueDocumentIssue = (document: DocumentRecord) => {
    queueAction('studio.issueDocumentPackage', `Issue document package: ${document.title}`, { documentId: document.id })
  }

  const queueDocumentApprove = (document: DocumentRecord) => {
    queueAction('studio.approveDocumentPackage', `Approve document package: ${document.title}`, { documentId: document.id })
  }

  const queueDocumentArchive = (document: DocumentRecord) => {
    queueAction('studio.archiveDocumentPackage', `Archive document package: ${document.title}`, { documentId: document.id })
  }

  const queueReviewApprove = (review: StudioReview) => {
    queueAction('studio.approveReview', `Approve review: ${review.title}`, { reviewId: review.id })
  }

  const queueReviewReject = (review: StudioReview) => {
    queueAction('studio.rejectReview', `Reject review: ${review.title}`, { reviewId: review.id })
  }

  const queueReviewChanges = (review: StudioReview) => {
    queueAction('studio.requestReviewChanges', `Request changes for: ${review.title}`, { reviewId: review.id })
  }

  const queueMilestoneComplete = (milestone: TimelineItem) => {
    queueAction('studio.markMilestoneComplete', `Mark milestone complete: ${milestone.label}`, { milestoneId: milestone.id })
  }

  const queuePhaseReview = (phase: StudioTimelinePhase) => {
    queueAction('studio.movePhaseToReview', `Move ${phase.phase} phase to review`, { phaseId: phase.id })
  }

  return (
    <section className="studio-project-detail space-y-7">
      <header className="command-hero rounded-[36px] border border-black/[0.05] bg-[#faf9f8] p-6 md:p-9">
        <Link
          className="inline-block rounded-full bg-white/70 px-4 py-2 font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-[#777777] transition hover:bg-black/[0.05] hover:text-[#111111]"
          to="/os/studio/projects"
        >
          &larr; Back to projects
        </Link>
        <div className="mt-5 grid gap-6 xl:grid-cols-[1fr_0.4fr]">
          <div>
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-[#777777]">
              {project.client} / {project.location}
            </p>
            <h2 className="mt-4 max-w-4xl text-5xl font-extrabold leading-[0.92] tracking-tight md:text-7xl">
              {project.name}
            </h2>
            <p className="mt-5 max-w-2xl text-sm leading-7 text-[#666666]">{project.operationalNotes}</p>
          </div>
          <div className="intelligence-card space-y-3 rounded-[30px] border border-black/[0.06] bg-white/92 p-5">
            <DetailLabel label="Status" value={project.status} />
            <DetailLabel label="Phase" value={project.phase ?? '—'} />
            <DetailLabel label="Timeline" value={project.timelineStatus ?? 'steady'} tone={statusClass(project.timelineStatus ?? 'steady')} />
            <DetailLabel label="Owner" value={project.owner} />
          </div>
        </div>
      </header>

      <OverviewSection
        artworkRecords={artworkRecords}
        creativeBriefs={creativeBriefs}
        documents={documents}
        project={project}
        reviews={reviews}
        siteIssues={siteIssues}
        siteWatchUpdates={siteWatchUpdates}
        timelinePhases={timelinePhases}
        timelineItems={timelineItems}
        workScopeSections={workScopeSections}
      />

      <WorkScopeSection
        onApprove={queueScopeApproval}
        onBlocked={queueScopeBlocked}
        onComplete={queueScopeComplete}
        workScopeSections={workScopeSections}
      />

      <TimelineSection
        onMilestoneComplete={queueMilestoneComplete}
        onPhaseReview={queuePhaseReview}
        phases={timelinePhases}
        timelineItems={timelineItems}
      />

      <SiteWatchSection
        onEscalate={queueIssueEscalation}
        onRequestReview={queueSiteReview}
        onResolve={queueSiteResolution}
        siteIssues={siteIssues}
        siteWatchUpdates={siteWatchUpdates}
      />

      <DocumentsSection
        onApprove={queueDocumentApprove}
        onArchive={queueDocumentArchive}
        onIssue={queueDocumentIssue}
        documents={documents}
      />

      <ReviewsSection
        onApprove={queueReviewApprove}
        onReject={queueReviewReject}
        onRequestChanges={queueReviewChanges}
        reviews={reviews}
      />

      <section>
        <div className="panel-header">
          <div>
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[#777777]">AI Studio context</p>
            <h3>Operational reading</h3>
          </div>
          <span className="pill">{aiContexts.length} contexts</span>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {aiContexts.length === 0 ? (
            <p className="text-sm text-[#777777]">No AI contexts available for the studio module.</p>
          ) : (
            aiContexts.map((ctx) => (
              <div key={ctx.id} className="panel panel-float">
                <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[#777777]">{ctx.title}</p>
                <p className="mt-3 text-sm leading-6 text-[#666666]">{ctx.body}</p>
              </div>
            ))
          )}
        </div>
      </section>
    </section>
  )
}

const DetailLabel = ({ label, tone, value }: { label: string; tone?: string; value: string }) => (
  <div>
    <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.14em] text-[#777777]">{label}</p>
    <p className={`mt-1 text-sm font-semibold ${tone ?? ''}`}>{value}</p>
  </div>
)

const MetricCard = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-2xl border border-black/[0.04] bg-white/70 px-4 py-3">
    <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.14em] text-[#777777]">{label}</p>
    <p className="mt-2 text-xl font-bold">{value}</p>
  </div>
)

const OverviewSection = ({
  artworkRecords,
  creativeBriefs,
  documents,
  project,
  reviews,
  siteIssues,
  siteWatchUpdates,
  timelinePhases,
  timelineItems,
  workScopeSections,
}: {
  artworkRecords: ArtworkRecord[]
  creativeBriefs: CreativeBrief[]
  documents: DocumentRecord[]
  project: Project
  reviews: StudioReview[]
  siteIssues: SiteIssue[]
  siteWatchUpdates: SiteWatchUpdate[]
  timelinePhases: StudioTimelinePhase[]
  timelineItems: TimelineItem[]
  workScopeSections: WorkScopeSection[]
}) => (
  <section className="panel panel-float">
    <div className="panel-header">
      <div>
        <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[#777777]">Project overview</p>
        <h3>Linked data summary</h3>
      </div>
      <span className="pill">{project.name}</span>
    </div>
    <div className="mt-5 grid gap-4 md:grid-cols-4">
      <MetricCard label="WorkScope sections" value={String(workScopeSections.length)} />
      <MetricCard label="Timeline phases" value={String(timelinePhases.length)} />
      <MetricCard label="Documents" value={String(documents.length)} />
      <MetricCard label="Site watch items" value={String(siteWatchUpdates.length + siteIssues.length)} />
      <MetricCard label="Reviews" value={String(reviews.length)} />
      <MetricCard label="Artwork references" value={String(artworkRecords.length)} />
      <MetricCard label="Creative briefs" value={String(creativeBriefs.length)} />
      <MetricCard label="Timeline milestones" value={String(timelineItems.length)} />
    </div>
  </section>
)

const WorkScopeSection = ({
  onApprove,
  onBlocked,
  onComplete,
  workScopeSections,
}: {
  onApprove: (scope: WorkScopeSection) => void
  onBlocked: (scope: WorkScopeSection) => void
  onComplete: (scope: WorkScopeSection) => void
  workScopeSections: WorkScopeSection[]
}) => (
  <section className="panel panel-float">
    <div className="panel-header">
      <div>
        <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[#777777]">Studio backbone</p>
        <h3>WorkScope sections</h3>
      </div>
      <span className="pill">{workScopeSections.length} sections</span>
    </div>
    {workScopeSections.length === 0 ? (
      <p className="text-sm text-[#777777]">No WorkScope sections linked to this project.</p>
    ) : (
      <div className="space-y-3">
        {workScopeSections.map((scope) => (
          <div key={scope.id} className="rounded-2xl border border-black/[0.05] bg-[#faf9f8] p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[#777777]">{scope.code} / {scope.group}</p>
                <p className="mt-1 text-sm font-semibold">{scope.title}</p>
                <p className="mt-1 text-xs text-[#777777]">Phase: {scope.phase}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className={`font-mono text-[10px] font-semibold uppercase ${statusClass(scope.operationalStatus)}`}>{scope.operationalStatus}</span>
                <span className={`font-mono text-[10px] font-semibold uppercase ${statusClass(scope.reviewStatus)}`}>{scope.reviewStatus}</span>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <StudioActionButton disabled={scope.reviewStatus === 'approved'} onClick={() => onApprove(scope)}>
                อนุมัติ
              </StudioActionButton>
              <StudioActionButton disabled={scope.operationalStatus === 'complete'} onClick={() => onComplete(scope)}>
                เสร็จสมบูรณ์
              </StudioActionButton>
              <StudioActionButton disabled={scope.operationalStatus === 'blocked'} onClick={() => onBlocked(scope)}>
                ติดปัญหา
              </StudioActionButton>
            </div>
          </div>
        ))}
      </div>
    )}
  </section>
)

const TimelineSection = ({
  onMilestoneComplete,
  onPhaseReview,
  phases,
  timelineItems,
}: {
  onMilestoneComplete: (item: TimelineItem) => void
  onPhaseReview: (phase: StudioTimelinePhase) => void
  phases: StudioTimelinePhase[]
  timelineItems: TimelineItem[]
}) => (
  <section className="panel panel-float">
    <div className="panel-header">
      <div>
        <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[#777777]">Project timeline</p>
        <h3>Phases & milestones</h3>
      </div>
      <span className="pill">{phases.length} phases / {timelineItems.length} milestones</span>
    </div>
    {phases.length === 0 && timelineItems.length === 0 ? (
      <p className="text-sm text-[#777777]">No timeline data linked to this project.</p>
    ) : (
      <div className="grid gap-6 lg:grid-cols-2">
        {phases.length > 0 && (
          <div>
            <p className="mb-3 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[#777777]">Phases</p>
            <div className="space-y-3">
              {phases.map((phase) => (
                <div key={phase.id} className="rounded-2xl border border-black/[0.05] bg-[#faf9f8] p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <span className={`inline-block rounded-full px-3 py-1 text-[10px] font-bold ${phaseTone[phase.phase]}`}>{phase.phase}</span>
                      <p className="mt-2 text-xs text-[#777777]">{phase.startDate} &rarr; {phase.endDate}</p>
                      <p className="mt-1 text-xs text-[#777777]">{phase.notes}</p>
                    </div>
                    <div className="text-right">
                      <p className={`font-mono text-[10px] font-semibold uppercase ${statusClass(phase.status)}`}>{phase.status}</p>
                      <p className={`font-mono text-[10px] font-semibold uppercase ${statusClass(phase.risk)}`}>{phase.risk} risk</p>
                    </div>
                  </div>
                  <div className="mt-3">
                    <StudioActionButton disabled={phase.status === 'complete' || phase.status === 'reviewed'} onClick={() => onPhaseReview(phase)}>
                      ส่งตรวจสอบ
                    </StudioActionButton>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        {timelineItems.length > 0 && (
          <div>
            <p className="mb-3 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[#777777]">Milestones</p>
            <div className="space-y-3">
              {timelineItems.map((item) => (
                <div key={item.id} className="rounded-2xl border border-black/[0.05] bg-[#faf9f8] p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold">{item.label}</p>
                      <p className="mt-1 text-xs text-[#777777]">Due: {item.dueDate}</p>
                    </div>
                    <span className={`font-mono text-[10px] font-semibold uppercase ${statusClass(item.state)}`}>{item.state}</span>
                  </div>
                  <div className="mt-3">
                    <StudioActionButton disabled={item.state === 'completed'} onClick={() => onMilestoneComplete(item)}>
                      เสร็จสมบูรณ์
                    </StudioActionButton>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    )}
  </section>
)

const SiteWatchSection = ({
  onEscalate,
  onRequestReview,
  onResolve,
  siteIssues,
  siteWatchUpdates,
}: {
  onEscalate: (issue: SiteIssue) => void
  onRequestReview: (update: SiteWatchUpdate) => void
  onResolve: (update: SiteWatchUpdate) => void
  siteIssues: SiteIssue[]
  siteWatchUpdates: SiteWatchUpdate[]
}) => (
  <section className="panel panel-float">
    <div className="panel-header">
      <div>
        <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[#777777]">Field awareness</p>
        <h3>Site watch & issues</h3>
      </div>
      <span className="pill">{siteWatchUpdates.length} updates / {siteIssues.length} issues</span>
    </div>
    {siteWatchUpdates.length === 0 && siteIssues.length === 0 ? (
      <p className="text-sm text-[#777777]">No site watch data linked to this project.</p>
    ) : (
      <div className="grid gap-5 lg:grid-cols-2">
        {siteWatchUpdates.length > 0 && (
          <div className="space-y-3">
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[#777777]">Watch updates</p>
            {siteWatchUpdates.map((update) => (
              <div key={update.id} className="rounded-2xl border border-black/[0.05] bg-[#faf9f8] p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold">{update.title}</p>
                    <p className="mt-1 text-xs leading-5 text-[#666666]">{update.note}</p>
                    <p className="mt-1 text-xs text-[#777777]">{update.observedAt} / {update.imagePlaceholder}</p>
                  </div>
                  <span className={`font-mono text-[10px] font-semibold uppercase ${statusClass(update.severity)}`}>{update.severity} / {update.status}</span>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <StudioActionButton disabled={update.status === 'resolved'} onClick={() => onResolve(update)}>
                    แก้ไขแล้ว
                  </StudioActionButton>
                  <StudioActionButton disabled={update.status !== 'open'} onClick={() => onRequestReview(update)}>
                    ขอตรวจสอบ
                  </StudioActionButton>
                </div>
              </div>
            ))}
          </div>
        )}
        {siteIssues.length > 0 && (
          <div className="space-y-3">
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[#777777]">Site issues</p>
            {siteIssues.map((issue) => (
              <div key={issue.id} className="rounded-2xl border border-black/[0.05] bg-[#faf9f8] p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold">{issue.issue}</p>
                    <p className="mt-1 text-xs text-[#777777]">Severity: {issue.severity}{issue.status ? ` / ${issue.status}` : ''}</p>
                  </div>
                  <span className={`font-mono text-[10px] font-semibold uppercase ${statusClass(issue.severity)}`}>{issue.severity}</span>
                </div>
                <div className="mt-3">
                  <StudioActionButton disabled={issue.severity === 'high' && issue.status === 'review'} onClick={() => onEscalate(issue)}>
                    แจ้งปัญหา
                  </StudioActionButton>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    )}
  </section>
)

const DocumentsSection = ({
  onApprove,
  onArchive,
  onIssue,
  documents,
}: {
  onApprove: (document: DocumentRecord) => void
  onArchive: (document: DocumentRecord) => void
  onIssue: (document: DocumentRecord) => void
  documents: DocumentRecord[]
}) => (
  <section className="panel panel-float">
    <div className="panel-header">
      <div>
        <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[#777777]">Document operations</p>
        <h3>Linked document packages</h3>
      </div>
      <span className="pill">{documents.length} packages</span>
    </div>
    {documents.length === 0 ? (
      <p className="text-sm text-[#777777]">No documents linked to this project.</p>
    ) : (
      <div className="space-y-3">
        {documents.map((document) => (
          <div key={document.id} className="rounded-2xl border border-black/[0.05] bg-[#faf9f8] p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[#777777]">{document.packageType}</p>
                <p className="mt-1 text-sm font-semibold">{document.title}</p>
                <p className="mt-1 text-xs text-[#777777]">{document.version} / Issued {document.issueDate} / {document.approvalState}</p>
              </div>
              <span className={`font-mono text-[10px] font-semibold uppercase ${statusClass(document.approvalState ?? 'draft')}`}>{document.approvalState}</span>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <StudioActionButton disabled={document.approvalState !== 'draft'} onClick={() => onIssue(document)}>
                ออกเอกสาร
              </StudioActionButton>
              <StudioActionButton disabled={document.approvalState === 'approved' || document.approvalState === 'draft'} onClick={() => onApprove(document)}>
                อนุมัติ
              </StudioActionButton>
              <StudioActionButton disabled={document.approvalState === 'draft'} onClick={() => onArchive(document)}>
                เก็บเข้าแฟ้ม
              </StudioActionButton>
            </div>
          </div>
        ))}
      </div>
    )}
  </section>
)

const ReviewsSection = ({
  onApprove,
  onReject,
  onRequestChanges,
  reviews,
}: {
  onApprove: (review: StudioReview) => void
  onReject: (review: StudioReview) => void
  onRequestChanges: (review: StudioReview) => void
  reviews: StudioReview[]
}) => (
  <section className="panel panel-float">
    <div className="panel-header">
      <div>
        <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[#777777]">Review queue</p>
        <h3>Studio reviews for this project</h3>
      </div>
      <span className="pill">{reviews.length} reviews</span>
    </div>
    {reviews.length === 0 ? (
      <p className="text-sm text-[#777777]">No reviews linked to this project.</p>
    ) : (
      <div className="space-y-3">
        {reviews.map((review) => (
          <div key={review.id} className="rounded-2xl border border-black/[0.05] bg-[#faf9f8] p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[#777777]">{review.type}</p>
                <p className="mt-1 text-sm font-semibold">{review.title}</p>
                <p className="mt-1 text-xs text-[#777777]">Due: {review.dueAt}</p>
              </div>
              <span className={`font-mono text-[10px] font-semibold uppercase ${statusClass(review.status)}`}>{review.status}</span>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <StudioActionButton disabled={review.status !== 'pending'} onClick={() => onApprove(review)}>
                อนุมัติ
              </StudioActionButton>
              <StudioActionButton disabled={review.status !== 'pending'} onClick={() => onReject(review)}>
                ปฏิเสธ
              </StudioActionButton>
              <StudioActionButton disabled={review.status !== 'pending'} onClick={() => onRequestChanges(review)}>
                ขอแก้ไข
              </StudioActionButton>
            </div>
          </div>
        ))}
      </div>
    )}
  </section>
)
