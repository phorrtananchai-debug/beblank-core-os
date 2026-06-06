import type { Holding, DcaRecord } from '../../types/models'

export interface InvestmentPulseResult {
  score: number
  band: 'healthy' | 'watch' | 'risk'
  drivers: string[]
}

export function computeInvestmentPulse(
  holdings: Holding[],
  dcaRecords: DcaRecord[],
): InvestmentPulseResult {
  let score = 100
  const drivers: string[] = []

  const fundedHoldings = holdings.filter((h) => h.quantity > 0 || (h.marketValueTHB ?? 0) > 0)
  if (holdings.length > 0 && fundedHoldings.length === 0) { score -= 25; drivers.push('Holdings configured but no positions funded') }
  else if (holdings.length === 0) { score -= 20; drivers.push('No holdings configured') }

  const totalTarget = holdings.reduce((s, h) => s + (h.targetAllocationPercent ?? 0), 0)
  if (holdings.length > 0 && Math.abs(totalTarget - 100) > 1) {
    score -= 15
    drivers.push(`Target allocation totals ${totalTarget.toFixed(0)}% — needs review`)
  }

  if (fundedHoldings.length > 0) {
    const driftCount = fundedHoldings.filter((h) => Math.abs((h.allocationPercent ?? 0) - (h.targetAllocationPercent ?? 0)) >= 2).length
    if (driftCount > 0) {
      const penalty = Math.min(driftCount * 10, 20)
      score -= penalty
      drivers.push(`${driftCount} holding${driftCount > 1 ? 's' : ''} drifted ≥2%`)
    }

    const maxAlloc = Math.max(...fundedHoldings.map((h) => h.targetAllocationPercent ?? 0), 0)
    if (maxAlloc > 40) { score -= 10; drivers.push(`Highest allocation ${maxAlloc}% — concentration risk`) }
    else if (maxAlloc > 30) { score -= 5; drivers.push(`Highest allocation ${maxAlloc}%`) }

    const cashPositions = fundedHoldings.filter((h) => h.currentPosture === 'reserve')
    const cashPct = cashPositions.reduce((s, h) => s + (h.targetAllocationPercent ?? 0), 0)
    if (cashPct < 10 && fundedHoldings.length > 0) { score -= 5; drivers.push(`Cash reserve ${cashPct}% — below 10% target`) }
  }

  const unfundedCount = holdings.length - fundedHoldings.length
  if (unfundedCount > 0) { score -= 5; drivers.push(`${unfundedCount} position${unfundedCount > 1 ? 's' : ''} awaiting funding`) }

  const dcaActive = dcaRecords.filter((r) => r.status === 'planned').length
  const dcaReview = dcaRecords.filter((r) => r.status === 'review').length
  if (dcaReview > 0) { score -= 10; drivers.push(`${dcaReview} DCA item${dcaReview > 1 ? 's' : ''} needing review`) }
  else if (dcaActive === 0 && holdings.length > 0) { score -= 5; drivers.push('No active DCA plan') }

  const highRiskHoldings = holdings.filter((h) => h.risk === 'high').length
  if (highRiskHoldings > 0) {
    const penalty = Math.min(highRiskHoldings * 10, 20)
    score -= penalty
    drivers.push(`${highRiskHoldings} high-risk position${highRiskHoldings > 1 ? 's' : ''}`)
  }

  score = Math.max(0, Math.min(100, score))
  const band: InvestmentPulseResult['band'] = score >= 80 ? 'healthy' : score >= 60 ? 'watch' : 'risk'
  return { score, band, drivers }
}
