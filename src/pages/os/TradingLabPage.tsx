import { useNavigate } from 'react-router-dom'
import { AIContextExportPanel } from '../../components/shared/AIContextExportPanel'
import { AISuggestionImportPanel } from '../../components/shared/AISuggestionImportPanel'
import { ChangeLogList } from '../../components/shared/ChangeLogList'
import { ModuleAISummaryPanel } from '../../components/shared/ModuleAISummaryPanel'
import { PendingApprovalPanel } from '../../components/shared/PendingApprovalPanel'
import { SnapshotLog } from '../../components/shared/SnapshotLog'
import { SourceStatusBadge } from '../../components/shared/SourceStatusBadge'
import { useOs } from '../../core/os/OsContext'

const thb = (value = 0) => `${Math.round(value).toLocaleString('en-US')} THB`

const activeClass = (status: string) => {
  if (['high', 'blocked', 'critical'].includes(status)) return 'text-[var(--bb-red)]'
  if (['medium', 'review', 'pending'].includes(status)) return 'text-[var(--bb-amber)]'
  return 'text-[var(--bb-green)]'
}

const severityDot = (level: string) => {
  if (level === 'high' || level === 'critical') return 'os-severity-dot-red'
  if (level === 'medium') return 'os-severity-dot-amber'
  return 'os-severity-dot-green'
}

export const TradingLabPage = () => {
  const navigate = useNavigate()
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
  const highConviction = data.tradingSignals.filter((s) => s.confidence >= 70)

  const queueSignal = () => {
    createActionRequest({
      module: 'trading', actionType: 'trading.addSignal',
      description: 'Queue new paper-trading watch signal',
      payload: { symbol: 'DDOG', confidence: 58, note: 'Manual sandbox signal only' },
    })
  }

  const queuePaperApproval = () => {
    if (!draftPaperTrade) return
    createActionRequest({
      module: 'trading', actionType: 'trading.approvePaperTradeNote',
      description: `Approve paper trade note for ${draftPaperTrade.symbol}`,
      payload: { paperTradeId: draftPaperTrade.id, positionId: reviewPosition?.id },
    })
  }

  const queueArchiveStrategy = () => {
    const note = activeStrategies[0]
    if (!note) return
    createActionRequest({
      module: 'trading', actionType: 'trading.archiveStrategyNote',
      description: `Archive strategy note: ${note.title}`,
      payload: { noteId: note.id },
    })
  }

  const queueStrategyNote = () => {
    createActionRequest({
      module: 'trading', actionType: 'trading.addStrategyNote',
      description: 'Add manual paper strategy note',
      payload: { title: 'Manual sandbox risk note', note: 'Keep the next signal as observation-only until one existing paper thesis is reviewed.', riskLevel: 'medium' },
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
      </header>

      {/* Hero KPI Grid */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <div className="os-hero-metric os-hero-metric-amber">
          <div className="flex items-center gap-3">
            <span className="os-icon-badge os-icon-badge-amber">△</span>
            <div className="min-w-0 flex-1">
              <p className="os-hero-value">{data.tradingSignals.length}</p>
              <p className="mt-0.5 truncate font-mono text-[9px] font-semibold uppercase tracking-[0.12em] text-[var(--bb-text-muted)]">Active Signals</p>
            </div>
          </div>
          <p className="os-hero-sub">{highConviction.length} high conviction</p>
        </div>
        <div className="os-hero-metric os-hero-metric-green">
          <div className="flex items-center gap-3">
            <span className="os-icon-badge os-icon-badge-green">◆</span>
            <div className="min-w-0 flex-1">
              <p className="os-hero-value">{highConviction.length}</p>
              <p className="mt-0.5 truncate font-mono text-[9px] font-semibold uppercase tracking-[0.12em] text-[var(--bb-text-muted)]">High Conviction</p>
            </div>
          </div>
          <p className="os-hero-sub">confidence ≥ 70%</p>
        </div>
        <div className="os-hero-metric os-hero-metric-red">
          <div className="flex items-center gap-3">
            <span className="os-icon-badge os-icon-badge-red">!</span>
            <div className="min-w-0 flex-1">
              <p className="os-hero-value">{data.paperTradeRecords.length}</p>
              <p className="mt-0.5 truncate font-mono text-[9px] font-semibold uppercase tracking-[0.12em] text-[var(--bb-text-muted)]">Pending Reviews</p>
            </div>
          </div>
          <p className="os-hero-sub">{draftPaperTrade ? '1 draft pending' : 'no drafts'}</p>
        </div>
        <div className="os-hero-metric os-hero-metric-neutral">
          <div className="flex items-center gap-3">
            <span className="os-icon-badge os-icon-badge-neutral">◎</span>
            <div className="min-w-0 flex-1">
              <p className="os-hero-value">{thb(sandboxExposure)}</p>
              <p className="mt-0.5 truncate font-mono text-[9px] font-semibold uppercase tracking-[0.12em] text-[var(--bb-text-muted)]">Risk Exposure</p>
            </div>
          </div>
          <p className="os-hero-sub">{activeStrategies.length} active strategies</p>
        </div>
      </div>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <main className="space-y-5">
          {/* Signal Queue */}
          <div className="os-card-primary">
            <div className="panel-header">
              <div>
                <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--bb-text-muted)]">Signal Queue</p>
                <h3>Manual signal notes</h3>
              </div>
              <button className="btn-primary" type="button" onClick={queueSignal}>Queue Signal</button>
            </div>
            <div className="grid gap-3 lg:grid-cols-2">
              {data.tradingSignals.map((signal) => {
                const confidenceColor = signal.confidence >= 75 ? 'green' : signal.confidence >= 50 ? 'amber' : 'red'
                return (
                  <div key={signal.id} className="os-list-row cursor-pointer transition-all duration-200 hover:border-[var(--bb-border)]" onClick={() => navigate('/os/studio')} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') navigate('/os/studio') }}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className={`os-severity-dot ${severityDot(signal.risk ?? 'low')}`} />
                          <p className="text-sm font-semibold">{signal.symbol}</p>
                        </div>
                        <p className="mt-0.5 text-xs text-[var(--bb-text-muted)]">{signal.signal} / {signal.note}</p>
                        <div className="os-confidence mt-1.5">
                          <span className="font-mono text-[9px] font-semibold text-[var(--bb-text-muted)]">{signal.confidence}%</span>
                          <div className="os-confidence-rail">
                            <div className={`os-confidence-fill os-confidence-fill-${confidenceColor}`} style={{ width: `${signal.confidence}%` }} />
                          </div>
                        </div>
                      </div>
                      <span className={`font-mono text-[10px] font-semibold uppercase ${activeClass(signal.risk ?? 'low')}`}>{signal.risk ?? 'low'}</span>
                    </div>
                  </div>
                )
              })}
              {data.tradingSignals.length === 0 && <p className="text-sm text-[var(--bb-text-muted)]">No signals queued</p>}
            </div>
          </div>

          {/* Watch Items + Positions */}
          <div className="grid gap-5 lg:grid-cols-2">
            <div className="os-section-card">
              <div className="panel-header">
                <div>
                  <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--bb-text-muted)]">Watchlist</p>
                  <h3>Watch Items</h3>
                </div>
                <span className="pill">{data.tradingWatchlist.length} items</span>
              </div>
              <div className="space-y-2">
                {data.tradingWatchlist.map((item) => (
                  <div key={item.id} className="os-list-row cursor-pointer transition-all duration-200 hover:border-[var(--bb-border)]" onClick={() => navigate('/os/studio')} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') navigate('/os/studio') }}>
                    <div className="flex items-center gap-2">
                      <span className={`os-severity-dot ${severityDot(item.risk)}`} />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold">{item.symbol}</p>
                        <p className="mt-0.5 text-xs text-[var(--bb-text-muted)]">{item.thesis}</p>
                      </div>
                      <span className={`font-mono text-[10px] font-semibold uppercase ${activeClass(item.status)}`}>{item.status}</span>
                    </div>
                  </div>
                ))}
                {data.tradingWatchlist.length === 0 && <p className="text-sm text-[var(--bb-text-muted)]">No watch items</p>}
              </div>
            </div>
            <div className="os-section-card">
              <div className="panel-header">
                <div>
                  <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--bb-text-muted)]">Sandbox</p>
                  <h3>Positions</h3>
                </div>
                <button className="btn-primary" type="button" onClick={queuePaperApproval}>Queue Approval</button>
              </div>
              <div className="space-y-2">
                {data.sandboxPositions.map((position) => (
                  <div key={position.id} className="os-list-row">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold">{position.symbol}</p>
                        <p className="mt-0.5 text-xs text-[var(--bb-text-muted)]">{position.units} units / {thb(position.units * position.entryPriceTHB)}</p>
                        <p className="text-xs text-[var(--bb-text-muted)]">{position.thesis}</p>
                      </div>
                      <span className={`font-mono text-[10px] font-semibold uppercase ${activeClass(position.status)}`}>{position.status}</span>
                    </div>
                  </div>
                ))}
                {data.sandboxPositions.length === 0 && <p className="text-sm text-[var(--bb-text-muted)]">No positions</p>}
              </div>
            </div>
          </div>

          {/* Trade Notes + Strategy */}
          <div className="grid gap-5 lg:grid-cols-2">
            <div className="os-card-primary">
              <div className="panel-header">
                <div>
                  <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--bb-text-muted)]">Trade Notes</p>
                  <h3>Paper trade history</h3>
                </div>
                <span className="pill">no orders</span>
              </div>
              <div className="space-y-2">
                {data.paperTradeRecords.map((record) => (
                  <div key={record.id} className="os-list-row">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold">{record.symbol} / {record.action}</p>
                        <p className="mt-0.5 text-xs text-[var(--bb-text-muted)]">{thb(record.amountTHB)} / {record.occurredAt}</p>
                        <p className="text-xs text-[var(--bb-text-muted)]">{record.notes}</p>
                      </div>
                      <span className={`font-mono text-[10px] font-semibold uppercase ${activeClass(record.status)}`}>{record.status}</span>
                    </div>
                  </div>
                ))}
                {data.paperTradeRecords.length === 0 && <p className="text-sm text-[var(--bb-text-muted)]">No trade history</p>}
              </div>
            </div>
            <div className="os-card-primary">
              <div className="panel-header">
                <div>
                  <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--bb-text-muted)]">Strategy</p>
                  <h3>Strategy journal</h3>
                </div>
                <div className="flex gap-2">
                  <button className="btn-primary" type="button" onClick={queueStrategyNote}>Queue Note</button>
                  <button className="btn-secondary" type="button" onClick={queueArchiveStrategy}>Queue Archive</button>
                </div>
              </div>
              <div className="space-y-2">
                {data.tradingStrategyNotes.map((item) => (
                  <div key={item.id} className="os-list-row">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold">{item.title}</p>
                        <p className="mt-0.5 text-xs text-[var(--bb-text-muted)]">{item.note}</p>
                      </div>
                      <span className={`font-mono text-[10px] font-semibold uppercase ${activeClass(item.riskLevel)}`}>{item.riskLevel}</span>
                    </div>
                  </div>
                ))}
                {data.tradingStrategyNotes.length === 0 && <p className="text-sm text-[var(--bb-text-muted)]">No strategy notes</p>}
              </div>
            </div>
          </div>
        </main>

        <aside className="intelligence-rail space-y-5">
          <PendingApprovalPanel items={pendingApprovals} onApprove={approveActionRequest} onReject={rejectActionRequest} />
          <ModuleAISummaryPanel moduleName="Trading" suggestions={data.aiSuggestions} />
          <SourceStatusBadge status={sourceStatuses.tradingLab} />
          <div className="rounded-[30px] border border-black/[0.05] bg-white/85 p-5">
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--bb-text-muted)]">AI signal observation</p>
            <p className="mt-3 text-sm leading-6 text-[var(--bb-text-soft)]">DDOG, PLTR, MRVL, and RBRK remain sandbox experiments. The lab should produce notes, not trades.</p>
          </div>
        </aside>
      </section>

      <section className="grid gap-5 xl:grid-cols-2"><AIContextExportPanel contexts={data.aiContexts} /><AISuggestionImportPanel onImport={queueSuggestionImport} /></section>
      <section className="grid gap-5 xl:grid-cols-2"><ChangeLogList items={changeLogs} /><SnapshotLog items={snapshots} /></section>
    </section>
  )
}
