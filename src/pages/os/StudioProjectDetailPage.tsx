import { Link, useParams } from 'react-router-dom'
import { type ReactNode, useState } from 'react'
import { EmptyState } from '../../components/shared/EmptyState'
import { useOs } from '../../core/os/useOs'
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
  if (['blocked', 'high', 'at-risk', 'open'].includes(status)) return 'text-[var(--bb-red)]'
  if (['review', 'needs-review', 'medium', 'active', 'pending'].includes(status)) return 'text-[var(--bb-amber)]'
  return 'text-[var(--bb-green)]'
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
    className="rounded-full border border-black/[0.06] bg-white/80 px-3 py-1.5 text-[11px] font-medium text-[var(--bb-text-muted)] transition hover:bg-black/[0.04] disabled:cursor-not-allowed disabled:opacity-30"
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
  const [activeSection, setActiveSection] = useState('overview')

  const project = data.projects.find((p) => p.id === projectId)

  if (!project) {
    return (
      <section className="studio-project-detail">
        <Link
          className="mb-6 inline-block rounded-full bg-white/70 px-4 py-2 font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--bb-text-muted)] transition hover:bg-black/[0.05] hover:text-[var(--bb-text)]"
          to="/os/studio/projects"
        >
          &larr; กลับไปหน้ารวมโปรเจค
        </Link>
        <EmptyState title="ไม่พบโปรเจค" body="ID โปรเจคใน URL ไม่ตรงกับโปรเจคที่มี ตรวจสอบเส้นทางหรือเลือกโปรเจคจากรายการ" />
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

  const pendingReviewCount = reviews.filter((r) => r.status === 'pending').length
  const openSiteIssueCount = siteIssues.filter((i) => i.status === 'open').length
  const inspectionTotal = pendingReviewCount + openSiteIssueCount

  return (
    <section className="mx-auto max-w-5xl space-y-6 px-4 py-6">
      {/* BUILD DEBUG: commit e9bf16f — StudioProjectDetailPage */}

      <div className="rounded-lg border border-black/[0.08] bg-yellow-50 px-3 py-1.5 text-[10px] font-mono text-black">
        Route: /os/studio/projects/:projectId · Component: StudioProjectDetailPage · Project: {project?.id ?? 'not found'} · Projects in data: {data.projects.length}
      </div>
      <header className="space-y-4">
        <Link
          className="inline-flex items-center gap-1.5 text-xs text-[var(--bb-text-muted)] hover:text-[var(--bb-text)]"
          to="/os/studio/projects"
        >
          &larr; กลับไปหน้ารวมโปรเจค
        </Link>
        <div>
          <p className="text-xs text-[var(--bb-text-muted)]">{project.client ?? 'Studio client'} / {project.location ?? '—'}</p>
          <h2 className="mt-1 text-2xl font-bold tracking-tight text-[var(--bb-text)]">{project.name}</h2>
          {project.operationalNotes && (
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--bb-text-soft)]">{project.operationalNotes}</p>
          )}
        </div>
        <div className="flex flex-wrap gap-2 text-xs">
          <span className="rounded-md bg-black/[0.04] px-2 py-1"><strong>สถานะ</strong> {project.status}</span>
          <span className="rounded-md bg-black/[0.04] px-2 py-1"><strong>เฟส</strong> {project.phase ?? '—'}</span>
          <span className="rounded-md bg-black/[0.04] px-2 py-1"><strong>ไทม์ไลน์</strong> {project.timelineStatus ?? 'steady'}</span>
          <span className="rounded-md bg-black/[0.04] px-2 py-1"><strong>ตรวจสอบ</strong> {inspectionTotal} รายการ</span>
          <span className="rounded-md bg-black/[0.04] px-2 py-1"><strong>WorkScope</strong> {workScopeSections.length} หมวด</span>
        </div>
      </header>

      {/* Section navigation */}
      <nav className="sticky top-0 z-10 -mx-4 flex gap-1 overflow-x-auto border-b border-black/[0.04] bg-white/90 px-4 py-2 backdrop-blur-sm">
        {(['overview', 'tasks', 'timeline', 'site', 'documents', 'reviews', 'ai'] as const).map((id) => (
          <button
            key={id}
            type="button"
            onClick={() => setActiveSection(id)}
            className={`shrink-0 rounded-md px-3 py-1 text-xs font-medium transition ${
              activeSection === id
                ? 'bg-black/[0.06] text-[var(--bb-text)]'
                : 'text-[var(--bb-text-muted)] hover:text-[var(--bb-text)]'
            }`}
          >
            {id === 'overview' ? 'Overview' : id === 'tasks' ? 'Tasks' : id === 'timeline' ? 'Timeline' : id === 'site' ? 'Site' : id === 'documents' ? 'Documents' : id === 'reviews' ? 'Reviews' : 'AI Context'}
          </button>
        ))}
      </nav>

      {activeSection === 'overview' && (
        <>
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
          <section className="rounded-2xl border border-black/[0.04] bg-white/60 p-4">
            <p className="text-xs font-semibold text-[var(--bb-text-muted)]">Today / This Week</p>
            <div className="mt-2 grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-black/[0.04] bg-white/70 p-3">
                <p className="text-[11px] text-[var(--bb-text-muted)]">Pending Reviews</p>
                <p className="mt-0.5 text-lg font-semibold">{pendingReviewCount}</p>
              </div>
              <div className="rounded-xl border border-black/[0.04] bg-white/70 p-3">
                <p className="text-[11px] text-[var(--bb-text-muted)]">Open Site Issues</p>
                <p className="mt-0.5 text-lg font-semibold">{openSiteIssueCount}</p>
              </div>
            </div>
          </section>
        </>
      )}

      {activeSection === 'tasks' && (
        <WorkScopeSection
          onApprove={queueScopeApproval}
          onBlocked={queueScopeBlocked}
          onComplete={queueScopeComplete}
          workScopeSections={workScopeSections}
        />
      )}

      {activeSection === 'timeline' && (
        <TimelineSection
          onMilestoneComplete={queueMilestoneComplete}
          onPhaseReview={queuePhaseReview}
          phases={timelinePhases}
          timelineItems={timelineItems}
        />
      )}

      {activeSection === 'site' && (
        <>
          <SiteWatchSection
            onEscalate={queueIssueEscalation}
            onRequestReview={queueSiteReview}
            onResolve={queueSiteResolution}
            siteIssues={siteIssues}
            siteWatchUpdates={siteWatchUpdates}
          />
          <section className="rounded-2xl border border-dashed border-black/[0.06] bg-white/40 p-4">
            <p className="text-xs font-semibold text-[var(--bb-text-muted)]">Billing Gates</p>
            <p className="mt-1 text-xs text-[var(--bb-text-faint)]">วางแผนการเรียกเก็บเงินตามเฟส</p>
          </section>
        </>
      )}

      {activeSection === 'documents' && (
        <DocumentsSection
          onApprove={queueDocumentApprove}
          onArchive={queueDocumentArchive}
          onIssue={queueDocumentIssue}
          documents={documents}
        />
      )}

      {activeSection === 'reviews' && (
        <ReviewsSection
          onApprove={queueReviewApprove}
          onReject={queueReviewReject}
          onRequestChanges={queueReviewChanges}
          reviews={reviews}
        />
      )}

      {activeSection === 'ai' && (
        <section className="rounded-2xl border border-black/[0.04] bg-white/60 p-4">
          <p className="text-xs font-semibold text-[var(--bb-text-muted)]">AI Context</p>
          <div className="mt-3 grid gap-4 md:grid-cols-2">
            {aiContexts.length === 0 ? (
              <p className="text-sm text-[var(--bb-text-muted)]">ไม่มีบริบท AI สำหรับโมดูลสตูดิโอ</p>
            ) : (
              aiContexts.map((ctx) => (
                <div key={ctx.id} className="rounded-xl border border-black/[0.04] bg-white/70 p-3">
                  <p className="text-xs font-semibold">{ctx.title}</p>
                  <p className="mt-1 text-sm leading-6 text-[var(--bb-text-soft)]">{ctx.body}</p>
                </div>
              ))
            )}
          </div>
        </section>
      )}
    </section>
  )
}

const MetricCard = ({
  label,
  value,
  icon,
  color,
  helper,
}: {
  label: string
  value: string
  icon?: string
  color?: string
  helper?: string
}) => {
  const toneClass = color?.replace('text-[', '').replace(']', '') ?? ''
  const glowColor =
    toneClass === 'var(--bb-red)' ? 'red' :
    toneClass === 'var(--bb-amber)' ? 'amber' :
    toneClass === 'var(--bb-green)' ? 'green' : 'neutral'
  return (
    <div className={`os-hero-metric os-hero-metric-${glowColor}`}>
      {icon && <span className={`os-icon-badge os-icon-badge-${glowColor}`}>{icon}</span>}
      <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.14em] text-[var(--bb-text-muted)]">{label}</p>
      <p className={`os-hero-value ${color ?? ''}`}>{value}</p>
      {helper && <p className="os-hero-sub">{helper}</p>}
    </div>
  )
}

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
        <p className="text-[10px] font-semibold text-[var(--bb-text-muted)]">ภาพรวมโปรเจค</p>
        <h3>สรุปข้อมูลที่เชื่อมโยง</h3>
      </div>
      <span className="pill">{project.name}</span>
    </div>
    <div className="mt-5 grid gap-4 md:grid-cols-4">
      {project.operationalNotes && (
        <div className="md:col-span-4 rounded-2xl border border-black/[0.05] bg-[#faf9f8] p-3.5">
          <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.12em] text-[var(--bb-text-muted)]">บันทึกการดำเนินงาน</p>
          <p className="mt-1 text-sm leading-6 text-[var(--bb-text-soft)]">{project.operationalNotes}</p>
        </div>
      )}
      <MetricCard label="WorkScope" value={String(workScopeSections.length)} />
      <MetricCard label="ไทม์ไลน์เฟส" value={String(timelinePhases.length)} />
      <MetricCard label="เอกสาร" value={String(documents.length)} />
      <MetricCard label="ไซต์หน้างาน" value={String(siteWatchUpdates.length + siteIssues.length)} />
      <MetricCard label="รีวิว" value={String(reviews.length)} />
      <MetricCard label="อาร์ตเวิร์ก" value={String(artworkRecords.length)} />
      <MetricCard label="บรีฟ" value={String(creativeBriefs.length)} />
      <MetricCard label="เหตุการณ์สำคัญ" value={String(timelineItems.length)} />
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
        <p className="text-[10px] font-semibold text-[var(--bb-text-muted)]">โครงสร้างสตูดิโอ</p>
        <h3>หมวดงาน</h3>
      </div>
      <span className="pill">{workScopeSections.length} หมวด</span>
    </div>
    {workScopeSections.length === 0 ? (
      <p className="text-sm text-[var(--bb-text-muted)]">ไม่มีหมวดงานที่เชื่อมโยงกับโปรเจคนี้</p>
    ) : (
      <div className="space-y-3">
        {workScopeSections.map((scope) => (
          <div key={scope.id} className="rounded-2xl border border-black/[0.05] bg-[#faf9f8] p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--bb-text-muted)]">{scope.code} / {scope.group}</p>
                <p className="mt-1 text-sm font-semibold">{scope.title}</p>
                <p className="mt-1 text-xs text-[var(--bb-text-muted)]">เฟส: {scope.phase}</p>
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
        <p className="text-[10px] font-semibold text-[var(--bb-text-muted)]">ไทม์ไลน์โปรเจค</p>
        <h3>เฟสและเหตุการณ์สำคัญ</h3>
      </div>
      <span className="pill">{phases.length} เฟส / {timelineItems.length} เหตุการณ์</span>
    </div>
    {phases.length === 0 && timelineItems.length === 0 ? (
      <p className="text-sm text-[var(--bb-text-muted)]">ไม่มีข้อมูลไทม์ไลน์สำหรับโปรเจคนี้</p>
    ) : (
      <div className="grid gap-6 lg:grid-cols-2">
        {phases.length > 0 && (
          <div>
            <p className="mb-3 text-[10px] font-semibold text-[var(--bb-text-muted)]">เฟส</p>
            <div className="space-y-3">
              {phases.map((phase) => (
                <div key={phase.id} className="rounded-2xl border border-black/[0.05] bg-[#faf9f8] p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <span className={`inline-block rounded-full px-3 py-1 text-[10px] font-bold ${phaseTone[phase.phase]}`}>{phase.phase}</span>
                      <p className="mt-2 text-xs text-[var(--bb-text-muted)]">{phase.startDate} &rarr; {phase.endDate}</p>
                      <p className="mt-1 text-xs text-[var(--bb-text-muted)]">{phase.notes}</p>
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
            <p className="mb-3 text-[10px] font-semibold text-[var(--bb-text-muted)]">เหตุการณ์สำคัญ</p>
            <div className="space-y-3">
              {timelineItems.map((item) => (
                <div key={item.id} className="rounded-2xl border border-black/[0.05] bg-[#faf9f8] p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold">{item.label}</p>
                      <p className="mt-1 text-xs text-[var(--bb-text-muted)]">Due: {item.dueDate}</p>
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
        <p className="text-[10px] font-semibold text-[var(--bb-text-muted)]">ข้อมูลหน้างาน</p>
        <h3>ไซต์และการแจ้งปัญหา</h3>
      </div>
      <span className="pill">{siteWatchUpdates.length} อัพเดต / {siteIssues.length} ปัญหา</span>
    </div>
    {siteWatchUpdates.length === 0 && siteIssues.length === 0 ? (
      <p className="text-sm text-[var(--bb-text-muted)]">ไม่มีข้อมูลหน้างานสำหรับโปรเจคนี้</p>
    ) : (
      <div className="grid gap-5 lg:grid-cols-2">
        {siteWatchUpdates.length > 0 && (
          <div className="space-y-3">
            <p className="text-[10px] font-semibold text-[var(--bb-text-muted)]">อัพเดตหน้างาน</p>
            {siteWatchUpdates.map((update) => (
              <div key={update.id} className="rounded-2xl border border-black/[0.05] bg-[#faf9f8] p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold">{update.title}</p>
                    <p className="mt-1 text-xs leading-5 text-[var(--bb-text-soft)]">{update.note}</p>
                    <p className="mt-1 text-xs text-[var(--bb-text-muted)]">{update.observedAt} / {update.imagePlaceholder}</p>
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
            <p className="text-[10px] font-semibold text-[var(--bb-text-muted)]">ปัญหาหน้างาน</p>
            {siteIssues.map((issue) => (
              <div key={issue.id} className="rounded-2xl border border-black/[0.05] bg-[#faf9f8] p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold">{issue.issue}</p>
                    <p className="mt-1 text-xs text-[var(--bb-text-muted)]">Severity: {issue.severity}{issue.status ? ` / ${issue.status}` : ''}</p>
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
        <p className="text-[10px] font-semibold text-[var(--bb-text-muted)]">จัดการเอกสาร</p>
        <h3>ชุดเอกสารที่เชื่อมโยง</h3>
      </div>
      <span className="pill">{documents.length} ชุด</span>
    </div>
    {documents.length === 0 ? (
      <p className="text-sm text-[var(--bb-text-muted)]">ไม่มีเอกสารที่เชื่อมโยงกับโปรเจคนี้</p>
    ) : (
      <div className="space-y-3">
        {documents.map((document) => (
          <div key={document.id} className="rounded-2xl border border-black/[0.05] bg-[#faf9f8] p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--bb-text-muted)]">{document.packageType}</p>
                <p className="mt-1 text-sm font-semibold">{document.title}</p>
                <p className="mt-1 text-xs text-[var(--bb-text-muted)]">{document.version} / Issued {document.issueDate} / {document.approvalState}</p>
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
        <p className="text-[10px] font-semibold text-[var(--bb-text-muted)]">คิวรีวิว</p>
        <h3>รีวิวของโปรเจคนี้</h3>
      </div>
      <span className="pill">{reviews.length} รายการ</span>
    </div>
    {reviews.length === 0 ? (
      <p className="text-sm text-[var(--bb-text-muted)]">ไม่มีรีวิวที่เชื่อมโยงกับโปรเจคนี้</p>
    ) : (
      <div className="space-y-3">
        {reviews.map((review) => (
          <div key={review.id} className="rounded-2xl border border-black/[0.05] bg-[#faf9f8] p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--bb-text-muted)]">{review.type}</p>
                <p className="mt-1 text-sm font-semibold">{review.title}</p>
                <p className="mt-1 text-xs text-[var(--bb-text-muted)]">Due: {review.dueAt}</p>
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
