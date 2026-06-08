import type { Holding } from '../../types/models'
import { findFinanceAssetByAssetId } from './assetIdentity'

export interface PostureBucket {
  id: string
  label: string
  color: string
  currentPercent: number
  targetPercent: number
  valueTHB: number
  holdings: Holding[]
  drift: number
  holdingCount: number
}

export interface RebalanceSuggestion {
  assetId: string
  symbol: string
  currentPercent: number
  targetPercent: number
  drift: number
  currentValueTHB: number
  suggestedAdjustmentTHB: number
  direction: 'buy' | 'sell' | 'hold'
  reason: string
}

const POSTURE_CONFIG: Array<{ id: string; label: string; color: string; postureValues: (string | undefined)[] }> = [
  { id: 'core', label: 'Core Wealth', color: '#16a36a', postureValues: ['core'] },
  { id: 'growth', label: 'Growth Engine', color: '#3b82f6', postureValues: ['growth'] },
  { id: 'income', label: 'Income Layer', color: '#f59e0b', postureValues: ['income'] },
  { id: 'reserve', label: 'Cash Reserve', color: '#8b5cf6', postureValues: ['reserve'] },
  { id: 'watch', label: 'Legacy / Review', color: '#6b7280', postureValues: ['watch', undefined] },
]

function bucketForPosture(posture: string | undefined): string {
  const match = POSTURE_CONFIG.find((c) => c.postureValues.includes(posture))
  return match?.id ?? 'watch'
}

export function computePostureBuckets(holdings: Holding[]): PostureBucket[] {
  const totalValue = holdings.reduce((s, h) => s + (h.marketValueTHB ?? 0), 0)

  const grouped = new Map<string, Holding[]>()
  for (const cfg of POSTURE_CONFIG) grouped.set(cfg.id, [])

  for (const h of holdings) {
    const bucketId = bucketForPosture(h.currentPosture)
    grouped.get(bucketId)?.push(h)
  }

  const buckets: PostureBucket[] = []
  for (const cfg of POSTURE_CONFIG) {
    const bucketHoldings = grouped.get(cfg.id) ?? []
    if (bucketHoldings.length === 0) continue

    const valueTHB = bucketHoldings.reduce((s, h) => s + (h.marketValueTHB ?? 0), 0)
    const currentPercent = totalValue > 0 ? (valueTHB / totalValue) * 100 : 0
    const targetPercent = bucketHoldings.reduce((s, h) => s + (h.targetAllocationPercent ?? 0), 0)

    buckets.push({
      id: cfg.id,
      label: cfg.label,
      color: cfg.color,
      currentPercent,
      targetPercent,
      valueTHB,
      holdings: bucketHoldings,
      drift: currentPercent - targetPercent,
      holdingCount: bucketHoldings.length,
    })
  }

  return buckets.sort((a, b) => b.currentPercent - a.currentPercent)
}

export function computeHoldingsDrift(holdings: Holding[]): Array<Holding & { drift: number }> {
  return holdings.map((h) => ({
    ...h,
    drift: (h.allocationPercent ?? 0) - (h.targetAllocationPercent ?? 0),
  }))
}

export function computeRebalanceSuggestions(
  holdings: Holding[],
  financeAssets: Array<{ id: string; symbol?: string }>,
): RebalanceSuggestion[] {
  const totalValue = holdings.reduce((s, h) => s + (h.marketValueTHB ?? 0), 0)
  if (totalValue <= 0) return []

  const suggestions: RebalanceSuggestion[] = []

  for (const h of holdings) {
    const currentPct = h.allocationPercent ?? 0
    const targetPct = h.targetAllocationPercent ?? 0
    const drift = currentPct - targetPct
    if (Math.abs(drift) < 0.5) continue

    const adjustmentTHB = (targetPct - currentPct) * totalValue / 100
    const asset = findFinanceAssetByAssetId(financeAssets, h.assetId)
    const symbol = asset?.symbol ?? h.assetId

    suggestions.push({
      assetId: h.assetId,
      symbol,
      currentPercent: currentPct,
      targetPercent: targetPct,
      drift,
      currentValueTHB: h.marketValueTHB ?? 0,
      suggestedAdjustmentTHB: Math.round(Math.abs(adjustmentTHB)),
      direction: adjustmentTHB > 1 ? 'buy' : adjustmentTHB < -1 ? 'sell' : 'hold',
      reason: adjustmentTHB > 1 ? `Underweight by ${Math.abs(drift).toFixed(1)}%` : `Overweight by ${Math.abs(drift).toFixed(1)}%`,
    })
  }

  return suggestions.sort((a, b) => Math.abs(b.drift) - Math.abs(a.drift))
}
