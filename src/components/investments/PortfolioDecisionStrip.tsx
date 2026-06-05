import type { ReactNode } from 'react'
import type { DcaRecord, DividendRecord, Holding } from '../../types/models'

const thb = (value = 0) => `${Math.round(value).toLocaleString()} THB`

export type PortfolioDecisionStripProps = {
  holdings: Holding[]
  dcaRecords: DcaRecord[]
  dividendRecords: DividendRecord[]
  totalValue: number
  assetName: (id: string) => string
}

type DecisionItem = {
  label: string
  detail: string
  tone: 'action' | 'review' | 'info' | 'warning'
}

export const PortfolioDecisionStrip = ({
  holdings,
  dcaRecords,
  dividendRecords,
  totalValue,
  assetName,
}: PortfolioDecisionStripProps): ReactNode => {
  const decisions: DecisionItem[] = []

  const dcaReview = dcaRecords.filter((r) => r.status === 'review')
  if (dcaReview.length > 0) {
    decisions.push({
      label: 'DCA needs review',
      detail: `${dcaReview.length} plan(s) pending before next cycle: ${dcaReview.map((r) => assetName(r.assetId)).join(', ')}`,
      tone: 'action',
    })
  }

  const overWeight = holdings.filter((h) => ((h.allocationPercent ?? 0) - (h.targetAllocationPercent ?? 0)) > 2)
  if (overWeight.length > 0) {
    decisions.push({
      label: 'Overweight positions',
      detail: `${overWeight.length} asset(s) above target — ${overWeight.map((h) => assetName(h.assetId)).join(', ')}`,
      tone: 'warning',
    })
  }

  const underTarget = holdings.filter((h) => ((h.allocationPercent ?? 0) - (h.targetAllocationPercent ?? 0)) < -2)
  if (underTarget.length > 0) {
    decisions.push({
      label: 'Under target positions',
      detail: `${underTarget.length} asset(s) below target — may need DCA: ${underTarget.slice(0, 3).map((h) => assetName(h.assetId)).join(', ')}${underTarget.length > 3 ? ` +${underTarget.length - 3} more` : ''}`,
      tone: 'info',
    })
  }

  const highRisk = holdings.filter((h) => h.risk === 'high')
  if (highRisk.length > 0) {
    decisions.push({
      label: 'Sandbox risk review',
      detail: `${highRisk.length} high-risk position(s): ${highRisk.map((h) => assetName(h.assetId)).join(', ')}`,
      tone: 'warning',
    })
  }

  const dividendReview = dividendRecords.filter((r) => r.status === 'review')
  if (dividendReview.length > 0) {
    decisions.push({
      label: 'Dividend review needed',
      detail: `${dividendReview.length} record(s) pending statement check: ${dividendReview.map((r) => assetName(r.assetId)).join(', ')}`,
      tone: 'review',
    })
  }

  const cashPct = holdings.filter((h) => h.currentPosture === 'reserve').reduce((s, h) => s + (h.marketValueTHB ?? 0), 0)
  if (cashPct > 0 && totalValue > 0) {
    const pct = ((cashPct / totalValue) * 100).toFixed(0)
    decisions.push({
      label: 'Cash reserve',
      detail: `${thb(cashPct)} (${pct}% of portfolio) — deploy if above target`,
      tone: 'info',
    })
  }

  if (decisions.length === 0) {
    return null
  }

  const toneStyles: Record<string, string> = {
    action: 'border-[#ff8800] bg-[#fff0d9] text-[#e66f00]',
    review: 'border-[#d99100] bg-[#fff4d8] text-[#9a6a1f]',
    info: 'border-[#2f7deb] bg-[#eaf2ff] text-[#1a5fc7]',
    warning: 'border-[#c2410c] bg-[#fdeae7] text-[#c2410c]',
  }

  return (
    <div className="rounded-[28px] border border-black/[0.05] bg-[#faf9f8] p-4">
      <p className="mb-3 font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-[#777777]">Next Portfolio Decisions</p>
      <div className="flex flex-wrap gap-2">
        {decisions.map((item, index) => (
          <div
            key={index}
            className={`rounded-2xl border px-3.5 py-2 text-xs leading-5 ${toneStyles[item.tone]}`}
          >
            <span className="font-semibold">{item.label}</span>
            <span className="opacity-80">: {item.detail}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
