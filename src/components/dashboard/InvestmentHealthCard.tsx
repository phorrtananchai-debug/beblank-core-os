import type { Holding, DcaRecord, DividendRecord, TradingWatchlistItem } from '../../types/models'

const thb = (value = 0) => `${Math.round(value).toLocaleString('en-US')} THB`

interface Props {
  holdings: Holding[]
  dcaRecords: DcaRecord[]
  dividendRecords: DividendRecord[]
  tradingWatchlist: TradingWatchlistItem[]
}

export const InvestmentHealthCard = ({ holdings, dcaRecords, dividendRecords, tradingWatchlist }: Props) => {
  const portfolioValue = holdings.reduce((s, h) => s + (h.marketValueTHB ?? h.quantity * h.averageCost), 0)
  const driftCount = holdings.filter((h) => Math.abs((h.allocationPercent ?? 0) - (h.targetAllocationPercent ?? 0)) >= 2).length
  const dcaDue = dcaRecords.filter((r) => r.status === 'planned' || r.status === 'review').length
  const watchlistCount = tradingWatchlist.length
  const expectedDividends = dividendRecords.reduce((s, r) => s + (r.expectedAmountTHB ?? 0), 0)

  return (
    <div className="os-section-card">
      <div className="panel-header">
        <div>
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--bb-text-muted)]">INVESTMENT HEALTH</p>
          <h3>Investment Health</h3>
        </div>
        <span className="pill">{holdings.length} holdings</span>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl bg-white/50 p-3">
          <p className="font-mono text-[10px] font-semibold uppercase text-[var(--bb-text-muted)]">◆ Portfolio Value</p>
          <p className="mt-1 text-xl font-bold">{portfolioValue > 0 ? thb(portfolioValue) : '—'}</p>
          {holdings.length > 0 && (
            <div className="mt-2 flex gap-1">
              {['core', 'growth', 'income', 'reserve'].map((posture) => {
                const count = holdings.filter((h) => h.currentPosture === posture).length
                const pct = holdings.length > 0 ? (count / holdings.length) * 100 : 0
                if (count === 0) return null
                const color = posture === 'core' ? 'bg-[var(--bb-green)]' : posture === 'growth' ? 'bg-[var(--bb-blue)]' : posture === 'income' ? 'bg-[var(--bb-amber)]' : 'bg-purple-400'
                return <span key={posture} className={`inline-block h-1.5 rounded-full ${color}`} style={{ width: `${pct}%` }} title={`${posture}: ${count}`} />
              })}
            </div>
          )}
          <p className="mt-1 text-[10px] text-[var(--bb-text-muted)]">{holdings.length > 0 ? `${holdings.length} positions` : 'No holdings yet'}</p>
        </div>

        <div className="rounded-2xl bg-white/50 p-3">
          <p className="font-mono text-[10px] font-semibold uppercase text-[var(--bb-text-muted)]">◎ Allocation Drift</p>
          <p className={`mt-1 text-xl font-bold ${driftCount > 0 ? 'text-[var(--bb-amber)]' : 'text-[var(--bb-green)]'}`}>{driftCount}</p>
          {holdings.length > 0 && (
            <div className="mt-2 flex gap-1">
              <span className={`inline-block h-1.5 flex-1 rounded-full ${driftCount > 0 ? 'bg-[var(--bb-amber)]/30' : 'bg-[var(--bb-green)]/30'}`} />
              <span className={`inline-block h-1.5 rounded-full ${driftCount > 0 ? 'bg-[var(--bb-amber)]' : 'bg-[var(--bb-green)]'}`} style={{ width: `${holdings.length > 0 ? ((holdings.length - driftCount) / holdings.length) * 100 : 0}%` }} />
            </div>
          )}
          <p className="mt-1 text-[10px] text-[var(--bb-text-muted)]">{driftCount > 0 ? `${driftCount} holdings drifted ≥2%` : 'All within tolerance'}</p>
        </div>

        <div className="rounded-2xl bg-white/50 p-3">
          <p className="font-mono text-[10px] font-semibold uppercase text-[var(--bb-text-muted)]">↓ DCA Due</p>
          <p className={`mt-1 text-xl font-bold ${dcaDue > 0 ? 'text-[var(--bb-amber)]' : ''}`}>{dcaDue}</p>
          <p className="mt-1 text-[10px] text-[var(--bb-text-muted)]">{dcaDue > 0 ? `${dcaDue} DCA items pending` : 'No DCA scheduled'}</p>
        </div>

        <div className="rounded-2xl bg-white/50 p-3">
          <p className="font-mono text-[10px] font-semibold uppercase text-[var(--bb-text-muted)]">◈ Watchlist</p>
          <p className="mt-1 text-xl font-bold">{watchlistCount}</p>
          <p className="mt-1 text-[10px] text-[var(--bb-text-muted)]">{watchlistCount > 0 ? `${watchlistCount} items monitored` : 'Watchlist empty'}</p>
          {expectedDividends > 0 && <p className="mt-1 text-[10px] text-[var(--bb-text-faint)]">Dividends est. {thb(expectedDividends)}/yr</p>}
        </div>
      </div>
    </div>
  )
}
