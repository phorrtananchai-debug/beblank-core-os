import { AIContextExportPanel } from '../../components/shared/AIContextExportPanel'
import { AISuggestionImportPanel } from '../../components/shared/AISuggestionImportPanel'
import { ChangeLogList } from '../../components/shared/ChangeLogList'
import { ModuleAISummaryPanel } from '../../components/shared/ModuleAISummaryPanel'
import { PendingApprovalPanel } from '../../components/shared/PendingApprovalPanel'
import { SnapshotLog } from '../../components/shared/SnapshotLog'
import { SourceStatusBadge } from '../../components/shared/SourceStatusBadge'
import { useOs } from '../../core/os/OsContext'

const thb = (value = 0) => `${Math.round(value).toLocaleString()} THB`

export const TradingLabPage = () => {
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

  const draftPaperTrade = data.paperTradeRecords.find((record) => record.status === 'draft')
  const reviewPosition = data.sandboxPositions.find((position) => position.status === 'review')
  const activeStrategies = data.tradingStrategyNotes.filter((note) => note.status !== 'archived')
  const sandboxExposure = data.sandboxPositions.reduce((sum, position) => sum + position.units * position.entryPriceTHB, 0)

  const queueSignal = () => {
    createActionRequest({
      module: 'trading',
      actionType: 'trading.addSignal',
      description: 'Queue new paper-trading watch signal',
      payload: { symbol: 'DDOG', confidence: 58, note: 'Manual sandbox signal only' },
    })
  }

  const queuePaperApproval = () => {
    if (!draftPaperTrade) return
    createActionRequest({
      module: 'trading',
      actionType: 'trading.approvePaperTradeNote',
      description: `Approve paper trade note for ${draftPaperTrade.symbol}`,
      payload: { paperTradeId: draftPaperTrade.id, positionId: reviewPosition?.id },
    })
  }

  const queueArchiveStrategy = () => {
    const note = activeStrategies[0]
    if (!note) return
    createActionRequest({
      module: 'trading',
      actionType: 'trading.archiveStrategyNote',
      description: `Archive strategy note: ${note.title}`,
      payload: { noteId: note.id },
    })
  }

  const queueStrategyNote = () => {
    createActionRequest({
      module: 'trading',
      actionType: 'trading.addStrategyNote',
      description: 'Add manual paper strategy note',
      payload: {
        title: 'Manual sandbox risk note',
        note: 'Keep the next signal as observation-only until one existing paper thesis is reviewed.',
        riskLevel: 'medium',
      },
    })
  }

  return (
    <section className="space-y-7">
      <header className="command-hero rounded-[36px] border border-black/[0.05] bg-[#faf9f8] p-6 md:p-9">
        <div className="grid gap-6 xl:grid-cols-[1fr_0.42fr]">
          <div>
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--bb-text-muted)]">Trading Lab / sandbox only</p>
            <h2 className="mt-4 max-w-4xl text-5xl font-extrabold leading-[0.92] tracking-tight md:text-7xl">Controlled experiments. No execution.</h2>
            <p className="mt-5 max-w-2xl text-sm leading-7 text-[var(--bb-text-soft)]">Watchlist, paper positions, signal notes, risk rules, and strategy journal for learning without broker connection or auto trading.</p>
          </div>
          <div className="rounded-[30px] border border-black/[0.06] bg-[#111111] p-5 text-white">
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-white/50">Risk rule</p>
            <p className="mt-4 text-xl font-semibold leading-snug">Paper only. Manual approval only.</p>
            <p className="mt-3 text-sm leading-6 text-white/70">No broker execution, no live orders, no auto trading. Every note stays inside the mock Sheet-first pipeline.</p>
          </div>
        </div>
        <div className="mt-6 grid gap-3 md:grid-cols-4">
          <SourceStatusBadge status={sourceStatuses.tradingLab} />
          <Metric label="Watchlist" value={data.tradingWatchlist.length} />
          <Metric label="Sandbox exposure" value={thb(sandboxExposure)} />
          <Metric label="Active strategies" value={activeStrategies.length} />
        </div>
      </header>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <main className="space-y-5">
          <div className="grid gap-5 lg:grid-cols-2">
            <div className="panel panel-float">
              <div className="panel-header"><h3>Watchlist</h3><button className="btn-primary" type="button" onClick={queueSignal}>Queue Signal</button></div>
              <div className="space-y-3">
                {data.tradingWatchlist.map((item) => <TradeRow key={item.id} title={item.symbol} meta={`${item.status} / ${item.thesis}`} status={item.risk} />)}
              </div>
            </div>
            <div className="panel panel-float">
              <div className="panel-header"><h3>Sandbox positions</h3><button className="btn-primary" type="button" onClick={queuePaperApproval}>Queue Paper Approval</button></div>
              <div className="space-y-3">
                {data.sandboxPositions.map((position) => <TradeRow key={position.id} title={position.symbol} meta={`${position.units} units / ${thb(position.units * position.entryPriceTHB)} / ${position.thesis}`} status={position.status} />)}
              </div>
            </div>
          </div>

          <div className="panel">
            <div className="panel-header"><h3>Signal log</h3><span className="pill">manual notes</span></div>
            <div className="grid gap-3 lg:grid-cols-2">
              {data.tradingSignals.map((signal) => {
                const confidenceColor = signal.confidence >= 75 ? 'green' : signal.confidence >= 50 ? 'amber' : 'red'
                const riskDot = signal.risk === 'high' ? 'red' : signal.risk === 'medium' ? 'amber' : 'green'
                return (
                  <div key={signal.id} className="os-list-row">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold">{signal.symbol}</p>
                          <span className={`os-severity-dot os-severity-dot-${riskDot}`} />
                        </div>
                        <p className="mt-0.5 text-xs text-[var(--bb-text-muted)]">{signal.signal} / {signal.note}</p>
                        <div className="os-confidence mt-1.5">
                          <span className="font-mono text-[9px] font-semibold text-[var(--bb-text-muted)]">{signal.confidence}%</span>
                          <div className="os-confidence-rail">
                            <div className={`os-confidence-fill os-confidence-fill-${confidenceColor}`} style={{ width: `${signal.confidence}%` }} />
                          </div>
                        </div>
                      </div>
                      <span className="font-mono text-[10px] font-semibold uppercase text-[var(--bb-amber)]">{signal.risk ?? 'medium'}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            <div className="panel">
              <div className="panel-header"><h3>Strategy journal</h3><div className="flex gap-2"><button className="btn-primary" type="button" onClick={queueStrategyNote}>Queue Strategy Note</button><button className="btn-secondary" type="button" onClick={queueArchiveStrategy}>Queue Archive</button></div></div>
              <div className="space-y-3">
                {data.tradingStrategyNotes.map((item) => <TradeRow key={item.id} title={item.title} meta={item.note} status={`${item.status ?? 'active'} / ${item.riskLevel}`} />)}
              </div>
            </div>
            <div className="panel">
              <div className="panel-header"><h3>Paper trade history</h3><span className="pill">no orders</span></div>
              <div className="space-y-3">
                {data.paperTradeRecords.map((record) => <TradeRow key={record.id} title={`${record.symbol} / ${record.action}`} meta={`${thb(record.amountTHB)} / ${record.occurredAt} / ${record.notes}`} status={record.status} />)}
              </div>
            </div>
          </div>
        </main>

        <aside className="intelligence-rail space-y-5">
          <PendingApprovalPanel items={pendingApprovals} onApprove={approveActionRequest} onReject={rejectActionRequest} />
          <ModuleAISummaryPanel moduleName="Trading" suggestions={data.aiSuggestions} />
          <div className="rounded-[30px] border border-black/[0.05] bg-white/85 p-5"><p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--bb-text-muted)]">AI signal observation</p><p className="mt-3 text-sm leading-6 text-[var(--bb-text-soft)]">DDOG, PLTR, MRVL, and RBRK remain sandbox experiments. The lab should produce notes, not trades.</p></div>
        </aside>
      </section>

      <section className="grid gap-5 xl:grid-cols-2"><AIContextExportPanel contexts={data.aiContexts} /><AISuggestionImportPanel onImport={queueSuggestionImport} /></section>
      <section className="grid gap-5 xl:grid-cols-2"><ChangeLogList items={changeLogs} /><SnapshotLog items={snapshots} /></section>
    </section>
  )
}

const Metric = ({ label, value }: { label: string; value: number | string }) => (
  <div className="rounded-2xl border border-black/[0.04] bg-white/75 px-4 py-3"><p className="font-mono text-[9px] font-semibold uppercase tracking-[0.14em] text-[var(--bb-text-muted)]">{label}</p><p className="mt-2 text-lg font-bold">{value}</p></div>
)

const TradeRow = ({ meta, status, title }: { meta: string; status: string; title: string }) => (
  <div className="os-list-row"><div className="flex items-start justify-between gap-3"><div><p className="text-sm font-semibold">{title}</p><p className="mt-0.5 text-xs text-[var(--bb-text-muted)]">{meta}</p></div><span className="font-mono text-[10px] font-semibold uppercase text-[var(--bb-amber)]">{status}</span></div></div>
)
