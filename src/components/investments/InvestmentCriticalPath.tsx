import type { Holding, DcaRecord } from '../../types/models'

export interface InvestmentCriticalPathResult {
  label: string
  reason: string
  severity: 'healthy' | 'watch' | 'risk'
}

function computeInvestmentCriticalPath(
  holdings: Holding[],
  dcaRecords: DcaRecord[],
): InvestmentCriticalPathResult {
  if (holdings.length === 0) return { label: 'No holdings configured', reason: 'Add positions to begin tracking', severity: 'watch' }

  const fundedHoldings = holdings.filter((h) => h.quantity > 0 || (h.marketValueTHB ?? 0) > 0)
  if (holdings.length > 0 && fundedHoldings.length === 0) return { label: 'Holdings configured but unfunded', reason: 'Set quantity or market value to begin tracking', severity: 'watch' }

  const totalTarget = holdings.reduce((s, h) => s + (h.targetAllocationPercent ?? 0), 0)
  if (holdings.length > 0 && Math.abs(totalTarget - 100) > 1) return { label: `Target allocation ${totalTarget.toFixed(0)}% — review targets`, reason: `Total should be 100%, currently ${totalTarget.toFixed(0)}%`, severity: 'watch' }

  const highRisk = fundedHoldings.filter((h) => h.risk === 'high')
  if (highRisk.length > 0) return { label: `${highRisk[0].assetId} flagged high risk`, reason: `${highRisk.length} high-risk position${highRisk.length > 1 ? 's' : ''}`, severity: 'risk' }

  const maxHolding = fundedHoldings.reduce((max, h) => ((h.targetAllocationPercent ?? 0) > (max.targetAllocationPercent ?? 0) ? h : max), fundedHoldings[0])
  if (maxHolding && (maxHolding.targetAllocationPercent ?? 0) > 40) return { label: `${maxHolding.assetId} at ${maxHolding.targetAllocationPercent}% — concentration risk`, reason: 'Single position exceeds 40% target', severity: 'risk' }

  const driftCount = fundedHoldings.filter((h) => Math.abs((h.allocationPercent ?? 0) - (h.targetAllocationPercent ?? 0)) >= 5)
  if (driftCount.length > 0) return { label: `${driftCount[0].assetId} drifted ${Math.abs((driftCount[0].allocationPercent ?? 0) - (driftCount[0].targetAllocationPercent ?? 0)).toFixed(1)}%`, reason: 'Exceeds 5% drift threshold', severity: 'watch' }

  const dcaReview = dcaRecords.filter((r) => r.status === 'review')
  if (dcaReview.length > 0) return { label: `${dcaReview.length} DCA item${dcaReview.length > 1 ? 's' : ''} need${dcaReview.length === 1 ? 's' : ''} review`, reason: 'DCA plan requires attention', severity: 'watch' }

  const dcaDue = dcaRecords.filter((r) => r.status === 'planned').length
  if (dcaDue > 0) return { label: `${dcaDue} DCA${dcaDue > 1 ? 's' : ''} due this month`, reason: 'Recurring buys pending', severity: 'watch' }

  const cashAlloc = fundedHoldings.filter((h) => h.currentPosture === 'reserve').reduce((s, h) => s + (h.targetAllocationPercent ?? 0), 0)
  if (cashAlloc < 10 && fundedHoldings.length > 0) return { label: `Cash reserve ${cashAlloc}% — below target`, reason: 'Target 10% minimum', severity: 'watch' }

  return { label: 'Portfolio on track', reason: `${holdings.length} position${holdings.length > 1 ? 's' : ''}, ${driftCount.length} drifted`, severity: 'healthy' }
}

interface Props {
  holdings: Holding[]
  dcaRecords: DcaRecord[]
}

export const InvestmentCriticalPath = ({ holdings, dcaRecords }: Props) => {
  const cp = computeInvestmentCriticalPath(holdings, dcaRecords)
  const dotColor = cp.severity === 'risk' ? 'bg-red' : cp.severity === 'watch' ? 'bg-[var(--bb-amber)]' : 'bg-[var(--bb-green)]'

  return (
    <div className="rounded-xl border border-black/[0.04] bg-white/60 p-3">
      <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.1em] text-[var(--bb-text-muted)]">Investment Critical Path</p>
      <div className="mt-2 flex items-center gap-2">
        <span className={`inline-block h-1.5 w-1.5 shrink-0 rounded-full ${dotColor}`} />
        <div>
          <p className="text-sm font-semibold">{cp.label}</p>
          <p className="text-xs text-[var(--bb-text-muted)]">{cp.reason}</p>
        </div>
      </div>
    </div>
  )
}
