import { NavLink } from 'react-router-dom'
import { AISuggestionImportPanel } from '../../components/shared/AISuggestionImportPanel'
import { ChangeLogList } from '../../components/shared/ChangeLogList'
import { EmptyState } from '../../components/shared/EmptyState'
import { PendingApprovalPanel } from '../../components/shared/PendingApprovalPanel'
import { SnapshotLog } from '../../components/shared/SnapshotLog'
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
  if (['pending', 'open', 'draft'].includes(status)) return 'text-[var(--bb-amber)]'
  if (['rejected', 'high'].includes(status)) return 'text-[var(--bb-red)]'
  if (['archived'].includes(status)) return 'text-[var(--bb-green)]'
  return 'text-[var(--bb-green)]'
}

export const AIWorkflowPage = ({ view = 'overview' }: { view?: AIWorkflowView }) => {
  const {
    data, pendingApprovals, changeLogs, snapshots,
    createActionRequest, approveActionRequest, rejectActionRequest, queueSuggestionImport,
  } = useOs()

  const pendingImports = data.aiImports.filter((item) => item.reviewStatus === 'pending')
  const openObservations = data.aiObservations.filter((item) => item.reviewStatus === 'open')
  const activeMemories = data.aiMemories.filter((item) => item.reviewStatus === 'active')
  const aiIsEmpty = data.aiExports.length === 0 && data.aiImports.length === 0 && data.aiMemories.length === 0 && data.aiDigests.length === 0

  const queueApproveImport = (item: AIImportRecord) => createActionRequest({ module: 'ai', actionType: 'ai.approveImportReview', description: `Approve AI import review: ${item.title}`, payload: { importId: item.id } })
  const queueRejectImport = (item: AIImportRecord) => createActionRequest({ module: 'ai', actionType: 'ai.rejectImportReview', description: `Reject AI import review: ${item.title}`, payload: { importId: item.id } })
  const queueBriefRefinement = (item: AIImportRecord) => createActionRequest({ module: 'ai', actionType: 'ai.applyBriefRefinement', description: `Apply AI brief refinement: ${item.title}`, payload: { importId: item.id } })
  const queueArchiveMemory = (item: AIMemoryRecord) => createActionRequest({ module: 'ai', actionType: 'ai.archiveMemory', description: `Archive AI memory: ${item.title}`, payload: { memoryId: item.id } })
  const queueApproveDigest = (item: AIDigestRecord) => createActionRequest({ module: 'ai', actionType: 'ai.approveDigest', description: `Approve AI operational digest: ${item.title}`, payload: { digestId: item.id } })
  const queueArchiveObservation = (item: AIObservationRecord) => createActionRequest({ module: 'ai', actionType: 'ai.archiveObservation', description: `Archive AI observation: ${item.title}`, payload: { observationId: item.id } })
  const queueContextExport = () => createActionRequest({
    module: 'ai', actionType: 'ai.exportContext',
    description: 'Export combined MVP context for Jarvis B',
    payload: { moduleName: 'combined', title: 'Export MVP operating context', sourceIds: ['studio', 'finance', 'timeline', 'trading-lab'], summary: 'Manual MVP context export covering routed pages, pending approvals, and source status.' },
  })

  return (
    <section className="space-y-7">
      <header className="command-hero rounded-[36px] border border-black/[0.05] bg-[#faf9f8] p-6 md:p-9">
        <div className="grid gap-6 xl:grid-cols-[1fr_0.42fr]">
          <div>
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--bb-text-muted)]">AI Workspace / operational co-pilot layer</p>
            <h2 className="mt-4 max-w-4xl text-5xl font-extrabold leading-[0.92] tracking-tight md:text-7xl">Context first. Review always.</h2>
            <p className="mt-5 max-w-2xl text-sm leading-7 text-[var(--bb-text-soft)]">Manual AI context exports, imported suggestions, review queues, memory scaffolding, and cross-module observations. No autonomous agents, no direct LLM calls, no hidden automation.</p>
          </div>
          <div className="rounded-[30px] border border-black/[0.06] bg-[#111111] p-5 text-white">
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-white/50">Operating principle</p>
            <p className="mt-4 text-xl font-semibold leading-snug">AI prepares judgment. Por approves action.</p>
            <p className="mt-3 text-sm leading-6 text-white/70">Every AI result is a context row, review row, memory row, or ActionRequest. Nothing writes directly.</p>
          </div>
        </div>

        {/* Hero KPI Grid */}
        <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
          <div className="os-hero-metric os-hero-metric-amber">
            <div className="flex items-center gap-3">
              <span className="os-icon-badge os-icon-badge-amber">✦</span>
              <div className="min-w-0 flex-1">
                <p className="os-hero-value">{pendingImports.length}</p>
                <p className="mt-0.5 truncate font-mono text-[9px] font-semibold uppercase tracking-[0.12em] text-[var(--bb-text-muted)]">Pending Imports</p>
              </div>
            </div>
            <p className="os-hero-sub">{data.aiImports.length} total suggestions</p>
          </div>
          <div className="os-hero-metric os-hero-metric-blue">
            <div className="flex items-center gap-3">
              <span className="os-icon-badge os-icon-badge-blue">◎</span>
              <div className="min-w-0 flex-1">
                <p className="os-hero-value">{data.aiExports.length}</p>
                <p className="mt-0.5 truncate font-mono text-[9px] font-semibold uppercase tracking-[0.12em] text-[var(--bb-text-muted)]">Context Exports</p>
              </div>
            </div>
            <p className="os-hero-sub">manual Jarvis B handoff</p>
          </div>
          <div className="os-hero-metric os-hero-metric-purple">
            <div className="flex items-center gap-3">
              <span className="os-icon-badge os-icon-badge-purple">◇</span>
              <div className="min-w-0 flex-1">
                <p className="os-hero-value">{activeMemories.length}</p>
                <p className="mt-0.5 truncate font-mono text-[9px] font-semibold uppercase tracking-[0.12em] text-[var(--bb-text-muted)]">Memory Items</p>
              </div>
            </div>
            <p className="os-hero-sub">{data.aiMemories.length} total records</p>
          </div>
          <div className="os-hero-metric os-hero-metric-green">
            <div className="flex items-center gap-3">
              <span className="os-icon-badge os-icon-badge-green">!</span>
              <div className="min-w-0 flex-1">
                <p className="os-hero-value">{openObservations.length}</p>
                <p className="mt-0.5 truncate font-mono text-[9px] font-semibold uppercase tracking-[0.12em] text-[var(--bb-text-muted)]">Observations</p>
              </div>
            </div>
            <p className="os-hero-sub">{data.aiObservations.length} total</p>
          </div>
        </div>

        <nav className="mt-6 flex flex-wrap gap-2">
          {aiTabs.map((tab) => (
            <NavLink key={tab.to} to={tab.to} end={tab.view === 'overview'} className={({ isActive }) => `rounded-full px-4 py-2 font-mono text-[10px] font-semibold uppercase tracking-[0.12em] transition ${isActive ? 'bg-black text-white' : 'bg-white/70 text-[var(--bb-text-muted)] hover:bg-black/[0.05] hover:text-[var(--bb-text)]'}`}>{tab.label}</NavLink>
          ))}
        </nav>
        <button className="btn-primary mt-5" type="button" onClick={queueContextExport}>Queue Context Export</button>
      </header>

      {aiIsEmpty ? (
        <EmptyState title="AI provider has no rows" body="AI workflow routes can render safely without mock or live AI rows. Future Apps Script/Sheet imports can hydrate this provider without changing page ownership." />
      ) : null}

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
      <div className="os-card-primary">
        <div className="panel-header">
          <div>
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--bb-text-muted)]">Daily AI Brief</p>
            <h3>Quiet daily intelligence</h3>
          </div>
          <span className="pill">{digests.length} digests</span>
        </div>
        <div className="grid gap-3 lg:grid-cols-2">{digests.map((digest) => <DigestCard key={digest.id} digest={digest} onApproveDigest={onApproveDigest} />)}</div>
        {digests.length === 0 && <p className="text-sm text-[var(--bb-text-muted)]">No operational digests yet</p>}
      </div>
      <div className="os-card-primary">
        <div className="panel-header">
          <div>
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--bb-text-muted)]">Cross-module awareness</p>
            <h3>Observations</h3>
          </div>
          <span className="pill">{observations.length} observations</span>
        </div>
        <div className="grid gap-3 lg:grid-cols-2">{observations.map((item) => <ObservationCard key={item.id} item={item} onArchiveObservation={onArchiveObservation} />)}</div>
        {observations.length === 0 && <p className="text-sm text-[var(--bb-text-muted)]">No observations recorded</p>}
      </div>
    </main>
    <aside className="intelligence-rail space-y-5">
      <div className="rounded-[28px] border border-black/[0.05] bg-white/85 p-5">
        <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--bb-text-muted)]">Context exports</p>
        <p className="mt-3 text-3xl font-bold">{exports.length}</p>
        <p className="mt-3 text-sm leading-6 text-[var(--bb-text-soft)]">Structured packages prepared for manual Jarvis B handoff.</p>
      </div>
      <div className="rounded-[28px] border border-black/[0.05] bg-white/85 p-5">
        <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--bb-text-muted)]">Import reviews</p>
        <p className="mt-3 text-3xl font-bold">{imports.filter((item) => item.reviewStatus === 'pending').length}</p>
        <p className="mt-3 text-sm leading-6 text-[var(--bb-text-soft)]">Imported suggestions waiting for human review.</p>
      </div>
      <div className="rounded-[28px] border border-black/[0.05] bg-white/85 p-5">
        <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--bb-text-muted)]">No autonomous execution</p>
        <p className="mt-3 text-3xl font-bold">0</p>
        <p className="mt-3 text-sm leading-6 text-[var(--bb-text-soft)]">No direct AI API calls, no background loops, no hidden writes.</p>
      </div>
    </aside>
  </div>
)

const ContextView = ({ exports, observations }: { exports: AIExportRecord[]; observations: AIObservationRecord[] }) => (
  <section className="grid gap-5 xl:grid-cols-[1fr_0.9fr]"><ExportsView exports={exports} /><div className="os-card-primary"><div className="panel-header"><h3>Context awareness map</h3><span className="pill">linked IDs</span></div><div className="space-y-3">{observations.map((item) => <CompactRow key={item.id} title={item.title} meta={`${item.module} / ${item.sourceIds.join(', ')}`} status={item.severity} />)}</div></div></section>
)

const ReviewsView = ({ imports, onApprove, onApproveImport, onBriefRefinement, onReject, onRejectImport, pendingApprovals }: { imports: AIImportRecord[]; onApprove: (requestId: string) => void; onApproveImport: (item: AIImportRecord) => void; onBriefRefinement: (item: AIImportRecord) => void; onReject: (requestId: string) => void; onRejectImport: (item: AIImportRecord) => void; pendingApprovals: Parameters<typeof PendingApprovalPanel>[0]['items'] }) => (
  <section className="grid gap-5 xl:grid-cols-[1fr_0.9fr]"><ImportsView imports={imports} onApproveImport={onApproveImport} onBriefRefinement={onBriefRefinement} onRejectImport={onRejectImport} /><PendingApprovalPanel items={pendingApprovals} onApprove={onApprove} onReject={onReject} /></section>
)

const MemoryView = ({ memories, onArchiveMemory, reviews }: { memories: AIMemoryRecord[]; onArchiveMemory: (item: AIMemoryRecord) => void; reviews: Array<{ id: string; title: string; module: string; reviewStatus: string; confidence: number }> }) => (
  <section className="grid gap-5 xl:grid-cols-[1fr_0.9fr]">
    <div className="os-card-primary">
      <div className="panel-header">
        <div>
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--bb-text-muted)]">Memory</p>
          <h3>AI memory scaffold</h3>
        </div>
        <span className="pill">no vector DB yet</span>
      </div>
      <div className="space-y-3">{memories.map((item) => {
        const confidenceColor = item.confidence >= 75 ? 'green' : item.confidence >= 50 ? 'amber' : 'red'
        return <article key={item.id} className="rounded-[20px] border border-black/[0.05] bg-[#faf9f8] p-3.5"><div className="flex items-start justify-between gap-3"><div className="min-w-0 flex-1"><p className="font-semibold">{item.title}</p><p className="mt-1.5 text-sm leading-5 text-[var(--bb-text-soft)]">{item.body}</p><div className="mt-2 flex items-center gap-3"><span className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--bb-text-muted)]">{item.module} / {item.memoryType}</span><div className="os-confidence ml-auto"><span className="font-mono text-[9px] font-semibold text-[var(--bb-text-muted)]">{item.confidence}%</span><div className="os-confidence-rail"><div className={`os-confidence-fill os-confidence-fill-${confidenceColor}`} style={{ width: `${item.confidence}%` }} /></div></div></div></div><button className="btn-secondary shrink-0" type="button" onClick={() => onArchiveMemory(item)}>Queue Archive</button></div></article>
      })}</div>
    </div>
    <div className="os-card-primary">
      <div className="panel-header">
        <h3>Review history</h3>
        <span className="pill">audit trail</span>
      </div>
      <div className="space-y-3">{reviews.map((item) => <CompactRow key={item.id} title={item.title} meta={`${item.module} / ${item.confidence}% confidence`} status={item.reviewStatus} />)}</div>
    </div>
  </section>
)

const ExportsView = ({ exports }: { exports: AIExportRecord[] }) => (
  <div className="os-card-primary">
    <div className="panel-header">
      <div>
        <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--bb-text-muted)]">Context Export</p>
        <h3>Context export history</h3>
      </div>
      <span className="pill">manual handoff</span>
    </div>
    <div className="space-y-4">{exports.map((item) => {
      const confidenceColor = item.confidence >= 75 ? 'green' : item.confidence >= 50 ? 'amber' : 'red'
      return <article key={item.id} className="rounded-[20px] border border-black/[0.05] bg-[#faf9f8] p-3.5"><div className="flex flex-wrap items-start justify-between gap-3"><div className="min-w-0 flex-1"><p className="font-semibold">{item.title}</p><p className="mt-1.5 text-sm leading-5 text-[var(--bb-text-soft)]">{item.summary}</p><div className="mt-2 flex items-center gap-3"><span className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--bb-text-muted)]">{item.module} / {item.createdAt} / {item.reviewStatus}</span><div className="os-confidence ml-auto"><span className="font-mono text-[9px] font-semibold text-[var(--bb-text-muted)]">{item.confidence}%</span><div className="os-confidence-rail"><div className={`os-confidence-fill os-confidence-fill-${confidenceColor}`} style={{ width: `${item.confidence}%` }} /></div></div></div></div></div><pre className="mt-3 overflow-x-auto rounded-2xl bg-white/85 p-2.5 text-xs text-[var(--bb-text-soft)]">{item.jsonPreview}</pre><p className="mt-2 text-xs text-[var(--bb-text-muted)]">Snapshot: {item.snapshotId} / Sources: {item.sourceIds.join(', ')}</p></article>
    })}</div>
  </div>
)

const ImportsView = ({ imports, onApproveImport, onBriefRefinement, onRejectImport }: { imports: AIImportRecord[]; onApproveImport: (item: AIImportRecord) => void; onBriefRefinement: (item: AIImportRecord) => void; onRejectImport: (item: AIImportRecord) => void }) => (
  <div className="os-card-primary">
    <div className="panel-header">
      <div>
        <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--bb-text-muted)]">Import Queue</p>
        <h3>AI import review</h3>
      </div>
      <span className="pill">preview before apply</span>
    </div>
    <div className="space-y-4">{imports.map((item) => {
      const confidenceColor = item.confidence >= 75 ? 'green' : item.confidence >= 50 ? 'amber' : 'red'
      return <article key={item.id} className="rounded-[20px] border border-black/[0.05] bg-[#faf9f8] p-3.5"><div className="flex flex-wrap items-start justify-between gap-3"><div className="min-w-0 flex-1"><p className="font-semibold">{item.title}</p><div className="mt-2 flex items-center gap-3"><span className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--bb-text-muted)]">{item.module} / {item.reviewStatus}</span><div className="os-confidence"><span className="font-mono text-[9px] font-semibold text-[var(--bb-text-muted)]">{item.confidence}%</span><div className="os-confidence-rail"><div className={`os-confidence-fill os-confidence-fill-${confidenceColor}`} style={{ width: `${item.confidence}%` }} /></div></div></div></div><span className={`font-mono text-[10px] font-semibold uppercase shrink-0 ${statusTone(item.reviewStatus)}`}>{item.reviewStatus}</span></div><pre className="mt-3 overflow-x-auto rounded-2xl bg-white/85 p-2.5 text-xs text-[var(--bb-text-soft)]">{item.suggestionJson}</pre><pre className="mt-2 overflow-x-auto rounded-2xl border border-black/[0.04] bg-[#111111] p-2.5 text-xs text-white/80">{item.diffPreview}</pre><div className="mt-3 flex flex-wrap gap-2"><button className="btn-primary" type="button" onClick={() => onApproveImport(item)}>Queue Approve</button><button className="btn-secondary" type="button" onClick={() => onRejectImport(item)}>Queue Reject</button><button className="btn-secondary" type="button" onClick={() => onBriefRefinement(item)}>Queue Apply Refinement</button></div></article>
    })}</div>
  </div>
)

const DigestCard = ({ digest, onApproveDigest }: { digest: AIDigestRecord; onApproveDigest: (item: AIDigestRecord) => void }) => {
  const confidenceColor = digest.confidence >= 75 ? 'green' : digest.confidence >= 50 ? 'amber' : 'red'
  return <article className="surface-hover rounded-[24px] border border-black/[0.05] bg-[#faf9f8] p-4"><div className="flex items-start justify-between gap-4"><div className="min-w-0 flex-1"><p className="font-semibold">{digest.title}</p><p className="mt-2 text-sm leading-6 text-[var(--bb-text-soft)]">{digest.summary}</p><div className="mt-3 flex items-center gap-3"><span className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--bb-text-muted)]">{digest.module} / {digest.reviewStatus}</span><div className="os-confidence ml-auto"><span className="font-mono text-[9px] font-semibold text-[var(--bb-text-muted)]">{digest.confidence}%</span><div className="os-confidence-rail"><div className={`os-confidence-fill os-confidence-fill-${confidenceColor}`} style={{ width: `${digest.confidence}%` }} /></div></div></div></div><button className="btn-secondary shrink-0" type="button" onClick={() => onApproveDigest(digest)}>Queue Approve</button></div></article>
}
const ObservationCard = ({ item, onArchiveObservation }: { item: AIObservationRecord; onArchiveObservation: (item: AIObservationRecord) => void }) => <article className="surface-hover rounded-[24px] border border-black/[0.05] bg-white/80 p-4"><div className="flex items-center gap-2"><span className={`os-severity-dot os-severity-dot-${item.severity === 'high' ? 'red' : item.severity === 'medium' ? 'amber' : 'blue'}`} /><p className={`font-mono text-[10px] font-semibold uppercase ${statusTone(item.severity)}`}>{item.severity}</p></div><p className="mt-2 font-semibold">{item.title}</p><p className="mt-2 text-sm leading-6 text-[var(--bb-text-soft)]">{item.observation}</p><button className="btn-secondary mt-4" type="button" onClick={() => onArchiveObservation(item)}>Queue Archive</button></article>
const CompactRow = ({ meta, status, title }: { meta: string; status: string; title: string }) => {
  const dotColor = status === 'high' ? 'red' : status === 'medium' ? 'amber' : 'blue'
  return <div className="os-list-row"><div className="flex items-start justify-between gap-3"><div className="flex items-center gap-2 min-w-0"><span className={`os-severity-dot os-severity-dot-${dotColor} shrink-0`} /><div><p className="text-sm font-semibold">{title}</p><p className="mt-0.5 text-xs text-[var(--bb-text-muted)]">{meta}</p></div></div><span className={`font-mono text-[10px] font-semibold uppercase shrink-0 ${statusTone(status)}`}>{status}</span></div></div>
}
