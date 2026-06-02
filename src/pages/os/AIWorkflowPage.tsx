import { NavLink } from 'react-router-dom'
import { AISuggestionImportPanel } from '../../components/shared/AISuggestionImportPanel'
import { ChangeLogList } from '../../components/shared/ChangeLogList'
import { PendingApprovalPanel } from '../../components/shared/PendingApprovalPanel'
import { SnapshotLog } from '../../components/shared/SnapshotLog'
import { SourceStatusBadge } from '../../components/shared/SourceStatusBadge'
import { useOs } from '../../core/os/OsContext'
import type { AIDigestRecord, AIExportRecord, AIImportRecord, AIMemoryRecord, AIObservationRecord } from '../../types/models'

export type AIWorkflowView = 'overview' | 'context' | 'reviews' | 'memory' | 'exports' | 'imports'

const aiTabs: Array<{ to: string; label: string; view: AIWorkflowView }> = [
  { to: '/os/ai', label: 'overview', view: 'overview' },
  { to: '/os/ai/context', label: 'context', view: 'context' },
  { to: '/os/ai/reviews', label: 'reviews', view: 'reviews' },
  { to: '/os/ai/memory', label: 'memory', view: 'memory' },
  { to: '/os/ai/exports', label: 'exports', view: 'exports' },
  { to: '/os/ai/imports', label: 'imports', view: 'imports' },
]

const statusTone = (status: string) => {
  if (['pending', 'open', 'draft'].includes(status)) return 'text-[#9a6a1f]'
  if (['rejected', 'archived', 'high'].includes(status)) return 'text-[#c2410c]'
  return 'text-[#59634a]'
}

export const AIWorkflowPage = ({ view = 'overview' }: { view?: AIWorkflowView }) => {
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

  const pendingImports = data.aiImports.filter((item) => item.reviewStatus === 'pending')
  const openObservations = data.aiObservations.filter((item) => item.reviewStatus === 'open')
  const activeMemories = data.aiMemories.filter((item) => item.reviewStatus === 'active')

  const queueApproveImport = (item: AIImportRecord) => createActionRequest({ module: 'ai', actionType: 'ai.approveImportReview', description: `Approve AI import review: ${item.title}`, payload: { importId: item.id } })
  const queueRejectImport = (item: AIImportRecord) => createActionRequest({ module: 'ai', actionType: 'ai.rejectImportReview', description: `Reject AI import review: ${item.title}`, payload: { importId: item.id } })
  const queueBriefRefinement = (item: AIImportRecord) => createActionRequest({ module: 'ai', actionType: 'ai.applyBriefRefinement', description: `Apply AI brief refinement: ${item.title}`, payload: { importId: item.id } })
  const queueArchiveMemory = (item: AIMemoryRecord) => createActionRequest({ module: 'ai', actionType: 'ai.archiveMemory', description: `Archive AI memory: ${item.title}`, payload: { memoryId: item.id } })
  const queueApproveDigest = (item: AIDigestRecord) => createActionRequest({ module: 'ai', actionType: 'ai.approveDigest', description: `Approve AI operational digest: ${item.title}`, payload: { digestId: item.id } })
  const queueArchiveObservation = (item: AIObservationRecord) => createActionRequest({ module: 'ai', actionType: 'ai.archiveObservation', description: `Archive AI observation: ${item.title}`, payload: { observationId: item.id } })

  return (
    <section className="space-y-7">
      <header className="command-hero rounded-[36px] border border-black/[0.05] bg-[#faf9f8] p-6 md:p-9">
        <div className="grid gap-6 xl:grid-cols-[1fr_0.42fr]">
          <div>
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-[#777777]">AI Workflow / operational co-pilot layer</p>
            <h2 className="mt-4 max-w-4xl text-5xl font-extrabold leading-[0.92] tracking-tight md:text-7xl">Context first. Review always.</h2>
            <p className="mt-5 max-w-2xl text-sm leading-7 text-[#666666]">Manual AI context exports, imported suggestions, review queues, memory scaffolding, and cross-module observations. No autonomous agents, no direct LLM calls, no hidden automation.</p>
          </div>
          <div className="rounded-[30px] border border-black/[0.06] bg-[#111111] p-5 text-white">
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-white/50">Operating principle</p>
            <p className="mt-4 text-xl font-semibold leading-snug">AI prepares judgment. Por approves action.</p>
            <p className="mt-3 text-sm leading-6 text-white/70">Every AI result is a context row, review row, memory row, or ActionRequest. Nothing writes directly.</p>
          </div>
        </div>
        <nav className="mt-8 flex flex-wrap gap-2">
          {aiTabs.map((tab) => (
            <NavLink key={tab.to} to={tab.to} end={tab.view === 'overview'} className={({ isActive }) => `rounded-full px-4 py-2 font-mono text-[10px] font-semibold uppercase tracking-[0.12em] transition ${isActive ? 'bg-black text-white' : 'bg-white/70 text-[#777777] hover:bg-black/[0.05] hover:text-[#111111]'}`}>{tab.label}</NavLink>
          ))}
        </nav>
        <div className="mt-5 grid gap-3 md:grid-cols-5"><SourceStatusBadge status={sourceStatuses.aiWorkflow} /><Metric label="exports" value={data.aiExports.length} /><Metric label="pending imports" value={pendingImports.length} /><Metric label="memories" value={activeMemories.length} /><Metric label="observations" value={openObservations.length} /></div>
      </header>

      {view === 'overview' ? <Overview digests={data.aiDigests} observations={data.aiObservations} exports={data.aiExports} imports={data.aiImports} onApproveDigest={queueApproveDigest} onArchiveObservation={queueArchiveObservation} /> : null}
      {view === 'context' ? <ContextView exports={data.aiExports} observations={data.aiObservations} /> : null}
      {view === 'reviews' ? <ReviewsView imports={data.aiImports} pendingApprovals={pendingApprovals} onApprove={approveActionRequest} onApproveImport={queueApproveImport} onBriefRefinement={queueBriefRefinement} onReject={rejectActionRequest} onRejectImport={queueRejectImport} /> : null}
      {view === 'memory' ? <MemoryView memories={data.aiMemories} reviews={data.aiReviews} onArchiveMemory={queueArchiveMemory} /> : null}
      {view === 'exports' ? <ExportsView exports={data.aiExports} /> : null}
      {view === 'imports' ? <ImportsView imports={data.aiImports} onApproveImport={queueApproveImport} onBriefRefinement={queueBriefRefinement} onRejectImport={queueRejectImport} /> : null}

      <section className="grid gap-5 xl:grid-cols-2"><AISuggestionImportPanel onImport={queueSuggestionImport} /><ChangeLogList items={changeLogs} /></section>
      <section className="grid gap-5 xl:grid-cols-2"><PendingApprovalPanel items={pendingApprovals} onApprove={approveActionRequest} onReject={rejectActionRequest} /><SnapshotLog items={snapshots} /></section>
    </section>
  )
}

const Overview = ({ digests, exports, imports, observations, onApproveDigest, onArchiveObservation }: { digests: AIDigestRecord[]; exports: AIExportRecord[]; imports: AIImportRecord[]; observations: AIObservationRecord[]; onApproveDigest: (item: AIDigestRecord) => void; onArchiveObservation: (item: AIObservationRecord) => void }) => (
  <div className="grid gap-7 xl:grid-cols-[minmax(0,1fr)_360px]">
    <main className="space-y-5">
      <div className="panel panel-float"><div className="panel-header"><div><p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[#777777]">Operational digests</p><h3>Quiet daily intelligence</h3></div><span className="pill">{digests.length} digests</span></div><div className="grid gap-3 lg:grid-cols-2">{digests.map((digest) => <DigestCard key={digest.id} digest={digest} onApproveDigest={onApproveDigest} />)}</div></div>
      <div className="panel"><div className="panel-header"><h3>Cross-module awareness</h3><span className="pill">Studio + Finance + Timeline + Trading</span></div><div className="grid gap-3 lg:grid-cols-2">{observations.map((item) => <ObservationCard key={item.id} item={item} onArchiveObservation={onArchiveObservation} />)}</div></div>
    </main>
    <aside className="intelligence-rail space-y-5"><InfoCard label="Context exports" value={exports.length} body="Structured packages prepared for manual Jarvis B handoff." /><InfoCard label="Import reviews" value={imports.filter((item) => item.reviewStatus === 'pending').length} body="Imported suggestions waiting for human review." /><InfoCard label="No autonomous execution" value="0" body="No direct AI API calls, no background loops, no hidden writes." /></aside>
  </div>
)

const ContextView = ({ exports, observations }: { exports: AIExportRecord[]; observations: AIObservationRecord[] }) => (
  <section className="grid gap-5 xl:grid-cols-[1fr_0.9fr]"><ExportsView exports={exports} /><div className="panel"><div className="panel-header"><h3>Context awareness map</h3><span className="pill">linked IDs</span></div><div className="space-y-3">{observations.map((item) => <CompactRow key={item.id} title={item.title} meta={`${item.module} / ${item.sourceIds.join(', ')}`} status={item.severity} />)}</div></div></section>
)

const ReviewsView = ({ imports, onApprove, onApproveImport, onBriefRefinement, onReject, onRejectImport, pendingApprovals }: { imports: AIImportRecord[]; onApprove: (requestId: string) => void; onApproveImport: (item: AIImportRecord) => void; onBriefRefinement: (item: AIImportRecord) => void; onReject: (requestId: string) => void; onRejectImport: (item: AIImportRecord) => void; pendingApprovals: Parameters<typeof PendingApprovalPanel>[0]['items'] }) => (
  <section className="grid gap-5 xl:grid-cols-[1fr_0.9fr]"><ImportsView imports={imports} onApproveImport={onApproveImport} onBriefRefinement={onBriefRefinement} onRejectImport={onRejectImport} /><PendingApprovalPanel items={pendingApprovals} onApprove={onApprove} onReject={onReject} /></section>
)

const MemoryView = ({ memories, onArchiveMemory, reviews }: { memories: AIMemoryRecord[]; onArchiveMemory: (item: AIMemoryRecord) => void; reviews: Array<{ id: string; title: string; module: string; reviewStatus: string; confidence: number }> }) => (
  <section className="grid gap-5 xl:grid-cols-[1fr_0.9fr]"><div className="panel panel-float"><div className="panel-header"><h3>AI memory scaffold</h3><span className="pill">no vector DB yet</span></div><div className="space-y-3">{memories.map((item) => <article key={item.id} className="rounded-[24px] border border-black/[0.05] bg-[#faf9f8] p-4"><div className="flex items-start justify-between gap-4"><div><p className="font-semibold">{item.title}</p><p className="mt-2 text-sm leading-6 text-[#666666]">{item.body}</p><p className="mt-2 font-mono text-[10px] uppercase tracking-[0.12em] text-[#777777]">{item.module} / {item.memoryType} / {item.confidence}%</p></div><button className="btn-secondary" type="button" onClick={() => onArchiveMemory(item)}>Queue Archive</button></div></article>)}</div></div><div className="panel"><div className="panel-header"><h3>Review history</h3><span className="pill">audit trail</span></div><div className="space-y-3">{reviews.map((item) => <CompactRow key={item.id} title={item.title} meta={`${item.module} / ${item.confidence}% confidence`} status={item.reviewStatus} />)}</div></div></section>
)

const ExportsView = ({ exports }: { exports: AIExportRecord[] }) => (
  <div className="panel"><div className="panel-header"><h3>Context export history</h3><span className="pill">manual handoff</span></div><div className="space-y-4">{exports.map((item) => <article key={item.id} className="rounded-[24px] border border-black/[0.05] bg-[#faf9f8] p-4"><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="font-semibold">{item.title}</p><p className="mt-2 text-sm leading-6 text-[#666666]">{item.summary}</p><p className="mt-2 font-mono text-[10px] uppercase tracking-[0.12em] text-[#777777]">{item.module} / {item.createdAt} / {item.reviewStatus}</p></div><span className="pill">{item.confidence}%</span></div><pre className="mt-4 overflow-x-auto rounded-2xl bg-white/85 p-3 text-xs text-[#4a443c]">{item.jsonPreview}</pre><p className="mt-3 text-xs text-[#777777]">Snapshot: {item.snapshotId} / Sources: {item.sourceIds.join(', ')}</p></article>)}</div></div>
)

const ImportsView = ({ imports, onApproveImport, onBriefRefinement, onRejectImport }: { imports: AIImportRecord[]; onApproveImport: (item: AIImportRecord) => void; onBriefRefinement: (item: AIImportRecord) => void; onRejectImport: (item: AIImportRecord) => void }) => (
  <div className="panel"><div className="panel-header"><h3>AI import review</h3><span className="pill">preview before apply</span></div><div className="space-y-4">{imports.map((item) => <article key={item.id} className="rounded-[24px] border border-black/[0.05] bg-[#faf9f8] p-4"><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="font-semibold">{item.title}</p><p className="mt-2 font-mono text-[10px] uppercase tracking-[0.12em] text-[#777777]">{item.module} / {item.reviewStatus} / {item.confidence}% confidence</p></div><span className={`font-mono text-[10px] font-semibold uppercase ${statusTone(item.reviewStatus)}`}>{item.reviewStatus}</span></div><pre className="mt-4 overflow-x-auto rounded-2xl bg-white/85 p-3 text-xs text-[#4a443c]">{item.suggestionJson}</pre><pre className="mt-3 overflow-x-auto rounded-2xl border border-black/[0.04] bg-[#111111] p-3 text-xs text-white/80">{item.diffPreview}</pre><div className="mt-4 flex flex-wrap gap-2"><button className="btn-primary" type="button" onClick={() => onApproveImport(item)}>Queue Approve</button><button className="btn-secondary" type="button" onClick={() => onRejectImport(item)}>Queue Reject</button><button className="btn-secondary" type="button" onClick={() => onBriefRefinement(item)}>Queue Apply Refinement</button></div></article>)}</div></div>
)

const DigestCard = ({ digest, onApproveDigest }: { digest: AIDigestRecord; onApproveDigest: (item: AIDigestRecord) => void }) => <article className="surface-hover rounded-[24px] border border-black/[0.05] bg-[#faf9f8] p-4"><div className="flex items-start justify-between gap-4"><div><p className="font-semibold">{digest.title}</p><p className="mt-2 text-sm leading-6 text-[#666666]">{digest.summary}</p><p className="mt-3 font-mono text-[10px] uppercase tracking-[0.12em] text-[#777777]">{digest.module} / {digest.confidence}% / {digest.reviewStatus}</p></div><button className="btn-secondary" type="button" onClick={() => onApproveDigest(digest)}>Queue Approve</button></div></article>
const ObservationCard = ({ item, onArchiveObservation }: { item: AIObservationRecord; onArchiveObservation: (item: AIObservationRecord) => void }) => <article className="surface-hover rounded-[24px] border border-black/[0.05] bg-white/80 p-4"><p className={`font-mono text-[10px] font-semibold uppercase ${statusTone(item.severity)}`}>{item.severity}</p><p className="mt-2 font-semibold">{item.title}</p><p className="mt-2 text-sm leading-6 text-[#666666]">{item.observation}</p><button className="btn-secondary mt-4" type="button" onClick={() => onArchiveObservation(item)}>Queue Archive</button></article>
const InfoCard = ({ body, label, value }: { body: string; label: string; value: number | string }) => <div className="rounded-[28px] border border-black/[0.05] bg-white/85 p-5"><p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[#777777]">{label}</p><p className="mt-3 text-3xl font-bold">{value}</p><p className="mt-3 text-sm leading-6 text-[#666666]">{body}</p></div>
const Metric = ({ label, value }: { label: string; value: number | string }) => <div className="rounded-2xl border border-black/[0.04] bg-white/75 px-4 py-3"><p className="font-mono text-[9px] font-semibold uppercase tracking-[0.14em] text-[#777777]">{label}</p><p className="mt-2 text-lg font-bold">{value}</p></div>
const CompactRow = ({ meta, status, title }: { meta: string; status: string; title: string }) => <div className="rounded-2xl border border-black/[0.05] bg-[#faf9f8] p-4"><div className="flex items-start justify-between gap-4"><div><p className="text-sm font-semibold">{title}</p><p className="mt-1 text-xs text-[#777777]">{meta}</p></div><span className={`font-mono text-[10px] font-semibold uppercase ${statusTone(status)}`}>{status}</span></div></div>
