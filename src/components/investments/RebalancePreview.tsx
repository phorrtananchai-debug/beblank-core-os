import type { RebalanceSuggestion } from '../../core/investments/allocationUtils'

interface Props {
  suggestions: RebalanceSuggestion[]
  onQueueRebalance: (suggestion: RebalanceSuggestion[]) => void
}

const thb = (value = 0) => `${Math.round(value).toLocaleString('en-US')} THB`

export const RebalancePreview = ({ suggestions, onQueueRebalance }: Props) => {
  const buys = suggestions.filter((s) => s.direction === 'buy')
  const sells = suggestions.filter((s) => s.direction === 'sell')
  const totalBuyTHB = buys.reduce((s, item) => s + item.suggestedAdjustmentTHB, 0)
  const totalSellTHB = sells.reduce((s, item) => s + item.suggestedAdjustmentTHB, 0)
  const netCashRequired = totalBuyTHB - totalSellTHB

  if (suggestions.length === 0) {
    return (
      <div className="rounded-2xl border border-black/[0.05] bg-[#faf9f8] p-5 text-center">
        <p className="text-sm font-semibold text-[var(--bb-green)]">No rebalance needed</p>
        <p className="mt-1 text-xs text-[var(--bb-text-muted)]">All holdings are within tolerance.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-[var(--bb-green)]/20 bg-[var(--bb-green)]/5 p-3">
          <p className="font-mono text-[9px] font-semibold uppercase text-[var(--bb-green)]">Total to Add</p>
          <p className="mt-1 text-lg font-bold text-[var(--bb-green)]">{thb(totalBuyTHB)}</p>
          <p className="text-[10px] text-[var(--bb-text-muted)]">{buys.length} holdings</p>
        </div>
        <div className="rounded-2xl border border-[var(--bb-amber)]/20 bg-[var(--bb-amber)]/5 p-3">
          <p className="font-mono text-[9px] font-semibold uppercase text-[var(--bb-amber)]">Total to Trim</p>
          <p className="mt-1 text-lg font-bold text-[var(--bb-amber)]">{thb(totalSellTHB)}</p>
          <p className="text-[10px] text-[var(--bb-text-muted)]">{sells.length} holdings</p>
        </div>
        <div className="rounded-2xl border border-black/[0.05] bg-[#faf9f8] p-3">
          <p className="font-mono text-[9px] font-semibold uppercase text-[var(--bb-text-muted)]">Net Cash Required</p>
          <p className={`mt-1 text-lg font-bold ${netCashRequired > 0 ? 'text-[var(--bb-green)]' : netCashRequired < 0 ? 'text-[var(--bb-amber)]' : ''}`}>
            {netCashRequired >= 0 ? thb(netCashRequired) : `−${thb(Math.abs(netCashRequired))}`}
          </p>
          <p className="text-[10px] text-[var(--bb-text-muted)]">{netCashRequired >= 0 ? 'Need to deploy' : 'Will free up'}</p>
        </div>
      </div>

      {/* Suggestion rows */}
      <div className="space-y-2">
        {suggestions.map((s) => (
          <div
            key={s.assetId}
            className={`rounded-2xl border p-3 ${
              s.direction === 'buy'
                ? 'border-[var(--bb-green)]/10 bg-[var(--bb-green)]/5'
                : s.direction === 'sell'
                  ? 'border-[var(--bb-amber)]/10 bg-[var(--bb-amber)]/5'
                  : 'border-black/[0.03] bg-white/60'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold">{s.symbol}</p>
                <p className="mt-0.5 text-xs text-[var(--bb-text-muted)]">{s.reason}</p>
              </div>
              <div className="shrink-0 text-right">
                <span className={`font-mono text-xs font-bold ${s.direction === 'buy' ? 'text-[var(--bb-green)]' : s.direction === 'sell' ? 'text-[var(--bb-amber)]' : 'text-[var(--bb-text-muted)]'}`}>
                  {s.direction === 'buy' ? '+' : s.direction === 'sell' ? '−' : ''}{thb(s.suggestedAdjustmentTHB)}
                </span>
                <p className="font-mono text-[10px] text-[var(--bb-text-muted)]">
                  {s.currentPercent.toFixed(1)}% → {s.targetPercent.toFixed(1)}%
                </p>
              </div>
            </div>

            <div className="mt-2 flex items-center gap-2">
              <span className="pill">{s.direction === 'buy' ? 'Add' : s.direction === 'sell' ? 'Trim' : 'Hold'}</span>
              <span className="text-[10px] text-[var(--bb-text-faint)]">
                {thb(s.currentValueTHB)} current
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Safety notice */}
      <div className="rounded-2xl border border-black/[0.05] bg-[#faf9f8] p-3">
        <p className="text-[11px] leading-5 text-[var(--bb-text-muted)]">
          This is a planning estimate only. No trades are executed.
        </p>
      </div>

      {/* Action */}
      <button
        className="btn-primary w-full"
        type="button"
        onClick={() => onQueueRebalance(suggestions)}
      >
        Queue Plan for Review
      </button>
    </div>
  )
}
