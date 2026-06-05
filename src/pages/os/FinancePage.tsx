import { Link } from 'react-router-dom'
import { EmptyState } from '../../components/shared/EmptyState'
import { ModuleAISummaryPanel } from '../../components/shared/ModuleAISummaryPanel'
import { SourceStatusBadge } from '../../components/shared/SourceStatusBadge'
import { useOs } from '../../core/os/OsContext'

const thb = (value = 0) => `${Math.round(value).toLocaleString()} THB`

export const FinancePage = () => {
  const { data, sourceStatuses } = useOs()

  const portfolioValue = data.holdings.reduce((sum, holding) => sum + (holding.marketValueTHB ?? 0), 0)
  const reserveValue = data.reserveRows.reduce((sum, reserve) => sum + reserve.currentAmountTHB, 0)
  const sandboxExposure = data.sandboxPositions.reduce((sum, position) => sum + position.units * position.entryPriceTHB, 0)
  const driftCount = data.holdings.filter((holding) => Math.abs((holding.allocationPercent ?? 0) - (holding.targetAllocationPercent ?? 0)) >= 2).length
  const financeIsEmpty = data.holdings.length === 0 && data.reserveRows.length === 0 && data.tradingWatchlist.length === 0

  const cards = [
    { title: 'Investments', to: '/os/finance/investments', detail: 'Long-term allocation, DCA, dividends, holdings.', metric: thb(portfolioValue), note: `${driftCount} allocation reviews` },
    { title: 'Capital', to: '/os/capital', detail: 'Overview, studio office ledger, family finance, reserves.', metric: thb(reserveValue), note: `${data.financeLedgerRows.length} ledger rows` },
    { title: 'Trading Lab', to: '/os/finance/trading-lab', detail: 'Paper-only signals, watchlist, sandbox strategy notes.', metric: thb(sandboxExposure), note: 'no broker execution' },
  ]

  return (
    <section className="space-y-7">
      <header className="command-hero rounded-[36px] border border-black/[0.05] bg-[#faf9f8] p-6 md:p-9">
        <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--bb-text-muted)]">Finance OS / human-controlled wealth operations</p>
        <h2 className="mt-4 max-w-4xl text-5xl font-extrabold leading-[0.92] tracking-tight md:text-7xl">Calm money systems, Sheet-first.</h2>
        <p className="mt-5 max-w-2xl text-sm leading-7 text-[var(--bb-text-soft)]">Investments, family-office finance, and a paper-only trading lab. No realtime terminal, no broker execution, no auto trading.</p>
        <div className="mt-6 grid gap-3 md:grid-cols-3"><SourceStatusBadge status={sourceStatuses.investments} /><SourceStatusBadge status={sourceStatuses.familyOffice} /><SourceStatusBadge status={sourceStatuses.tradingLab} /></div>
      </header>

      {financeIsEmpty ? (
        <EmptyState title="Finance provider has no rows" body="Finance routes stay stable with empty provider data. Live Finnhub and Sheet adapters can be introduced later while mock fallback remains available." />
      ) : null}

      <div className="grid gap-5 md:grid-cols-3">
        {cards.map((card) => (
          <Link key={card.to} to={card.to} className="panel panel-float block transition duration-300 hover:-translate-y-1">
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--bb-text-muted)]">{card.note}</p>
            <h3 className="mt-4 text-2xl font-bold tracking-tight">{card.title}</h3>
            <p className="mt-3 text-sm leading-6 text-[var(--bb-text-soft)]">{card.detail}</p>
            <p className="mt-6 text-3xl font-extrabold tracking-tight">{card.metric}</p>
          </Link>
        ))}
      </div>

      <section className="grid gap-5 xl:grid-cols-[1fr_0.9fr]">
        <div className="panel"><div className="panel-header"><h3>Foundation posture</h3><span className="pill">manual-first</span></div><div className="grid gap-3 md:grid-cols-3"><Mini label="DCA rows" value={data.dcaRecords.length} /><Mini label="Dividend rows" value={data.dividendRecords.length} /><Mini label="Reserve rows" value={data.reserveRows.length} /><Mini label="Watchlist" value={data.tradingWatchlist.length} /><Mini label="Paper records" value={data.paperTradeRecords.length} /><Mini label="Snapshots" value={data.financeSnapshots.length} /></div></div>
        <ModuleAISummaryPanel moduleName="Finance" suggestions={data.aiSuggestions} />
      </section>
    </section>
  )
}

const Mini = ({ label, value }: { label: string; value: number | string }) => (
  <div className="rounded-2xl border border-black/[0.04] bg-[#faf9f8] p-4"><p className="font-mono text-[9px] font-semibold uppercase tracking-[0.14em] text-[var(--bb-text-muted)]">{label}</p><p className="mt-2 text-xl font-bold">{value}</p></div>
)
