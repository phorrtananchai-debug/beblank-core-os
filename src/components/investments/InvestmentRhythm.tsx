import type { Holding, DcaRecord, DividendRecord, TradingWatchlistItem } from '../../types/models'
import { computeInvestmentPulse } from './InvestmentPulse'

interface Props {
  holdings: Holding[]
  dcaRecords: DcaRecord[]
  dividendRecords: DividendRecord[]
  tradingWatchlist: TradingWatchlistItem[]
}

const SectionCard = ({ label, children, color }: { label: string; children: React.ReactNode; color?: string }) => (
  <div className="rounded-xl border border-black/[0.04] bg-white/60 p-3">
    <p className={`font-mono text-[9px] font-semibold uppercase tracking-[0.1em] ${color ?? 'text-[var(--bb-text-muted)]'}`}>{label}</p>
    <div className="mt-2 space-y-1.5">{children}</div>
  </div>
)

export const InvestmentRhythm = ({ holdings, dcaRecords, dividendRecords, tradingWatchlist }: Props) => {
  const pulse = computeInvestmentPulse(holdings, dcaRecords)
  const portfolioValue = holdings.reduce((s, h) => s + (h.marketValueTHB ?? h.quantity * h.averageCost), 0)
  const portfolioValueUSD = portfolioValue / 36.5
  const driftCount = holdings.filter((h) => Math.abs((h.allocationPercent ?? 0) - (h.targetAllocationPercent ?? 0)) >= 2).length
  const dcaDue = dcaRecords.filter((r) => r.status === 'planned' || r.status === 'review').length
  const watchlistCount = tradingWatchlist.length
  const expectedDividends = dividendRecords.reduce((s, r) => s + (r.expectedAmountTHB ?? 0), 0)
  const highRisk = holdings.filter((h) => h.risk === 'high').length
  const hasData = holdings.length > 0 || dcaRecords.length > 0

  const thb = (v: number) => `${Math.round(v).toLocaleString()} THB`
  const thbShort = (v: number) => `${Math.round(v / 1000).toLocaleString()}k`
  const usd = (v: number) => `$${Math.round(v).toLocaleString()}`

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2">
        <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--bb-text-muted)]">Investment Rhythm</p>
        <span className={`inline-flex items-center justify-center rounded-full px-2 py-0.5 font-mono text-[9px] font-bold leading-none ${
          !hasData ? 'bg-black/[0.05] text-[var(--bb-text-muted)]' :
          pulse.band === 'risk' ? 'bg-red/10 text-red' :
          pulse.band === 'watch' ? 'bg-[var(--bb-amber)]/10 text-[var(--bb-amber)]' :
          'bg-[var(--bb-green)]/10 text-[var(--bb-green)]'
        }`}>{!hasData ? '—' : pulse.score}</span>
      </div>

      {hasData ? (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <SectionCard label="Portfolio Value" color="text-[var(--bb-text)]">
              <p className="text-lg font-bold">{portfolioValue > 0 ? thb(portfolioValue) : '—'}</p>
              {portfolioValueUSD > 0 && <p className="text-[10px] text-[var(--bb-text-faint)]">{usd(portfolioValueUSD)} secondary</p>}
              <p className="text-[10px] text-[var(--bb-text-muted)]">{holdings.length} position{holdings.length !== 1 ? 's' : ''}</p>
            </SectionCard>
            <SectionCard label="Drift" color={driftCount > 0 ? 'text-[var(--bb-amber)]/80' : 'text-[var(--bb-text-muted)]'}>
              <p className={`text-lg font-bold ${driftCount > 0 ? 'text-[var(--bb-amber)]' : ''}`}>{driftCount}</p>
              <p className="text-[10px] text-[var(--bb-text-muted)]">{driftCount > 0 ? 'Holdings drifted ≥2%' : 'All on target'}</p>
            </SectionCard>
            <SectionCard label="DCA Due" color={dcaDue > 0 ? 'text-[var(--bb-amber)]/60' : 'text-[var(--bb-text-muted)]'}>
              <p className={`text-lg font-bold ${dcaDue > 0 ? 'text-[var(--bb-amber)]' : ''}`}>{dcaDue}</p>
              <p className="text-[10px] text-[var(--bb-text-muted)]">{dcaDue > 0 ? 'Items pending' : 'No DCA scheduled'}</p>
            </SectionCard>
            <SectionCard label="Watchlist" color="text-[var(--bb-text-muted)]">
              <p className="text-lg font-bold">{watchlistCount}</p>
              <p className="text-[10px] text-[var(--bb-text-muted)]">{watchlistCount > 0 ? `${watchlistCount} monitored` : 'Empty'}</p>
            </SectionCard>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <SectionCard label="Needs Attention" color="text-red/80">
              {pulse.drivers.length > 0 ? pulse.drivers.map((d, i) => (
                <div key={i} className="flex items-start gap-2 text-sm">
                  <span className="mt-0.5 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-red" />
                  <div className="min-w-0"><p className="text-[var(--bb-text)]">{d}</p></div>
                </div>
              )) : <p className="text-[10px] text-[var(--bb-text-faint)]">All investments on track</p>}
              {expectedDividends > 0 && <p className="mt-1 text-[10px] text-[var(--bb-text-faint)]">Dividends est. {thbShort(expectedDividends)}/yr · {thbShort(expectedDividends / 12)}/mo</p>}
              {highRisk > 0 && <p className="mt-1 text-[10px] text-red/80">{highRisk} high-risk position{highRisk > 1 ? 's' : ''}</p>}
            </SectionCard>
            <SectionCard label="Sandbox & Watchlist" color="text-[var(--bb-text-muted)]">
              {tradingWatchlist.length > 0 ? tradingWatchlist.slice(0, 4).map((w) => (
                <div key={w.id} className="flex items-center justify-between text-sm">
                <span className="truncate text-[var(--bb-text)]">{w.symbol}</span>
                <span className="text-[10px] text-[var(--bb-text-muted)]">{w.thesis.slice(0, 30)}</span>
                </div>
              )) : <p className="text-[10px] text-[var(--bb-text-faint)]">No sandbox positions</p>}
            </SectionCard>
          </div>
        </>
      ) : (
        <div className="rounded-xl border border-dashed border-black/[0.06] bg-white/40 p-5">
          <p className="text-sm font-semibold text-[var(--bb-text-muted)]">Investment setup required</p>
          <p className="mt-1 text-xs text-[var(--bb-text-faint)]">Add holdings or configure DCA to enable the Investment operating system.</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-dashed border-black/[0.06] bg-white/50 p-3 text-center">
              <p className="font-mono text-[9px] font-semibold uppercase text-[var(--bb-text-muted)]">Holdings</p>
              <p className="mt-1 text-xs text-[var(--bb-text-faint)]">Add positions via sheet bridge</p>
            </div>
            <div className="rounded-xl border border-dashed border-black/[0.06] bg-white/50 p-3 text-center">
              <p className="font-mono text-[9px] font-semibold uppercase text-[var(--bb-text-muted)]">DCA Plans</p>
              <p className="mt-1 text-xs text-[var(--bb-text-faint)]">Configure recurring buys</p>
            </div>
            <div className="rounded-xl border border-dashed border-black/[0.06] bg-white/50 p-3 text-center">
              <p className="font-mono text-[9px] font-semibold uppercase text-[var(--bb-text-muted)]">Target Allocation</p>
              <p className="mt-1 text-xs text-[var(--bb-text-faint)]">Set per-holding targets</p>
            </div>
            <div className="rounded-xl border border-dashed border-black/[0.06] bg-white/50 p-3 text-center">
              <p className="font-mono text-[9px] font-semibold uppercase text-[var(--bb-text-muted)]">Dividends</p>
              <p className="mt-1 text-xs text-[var(--bb-text-faint)]">Track expected payouts</p>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
