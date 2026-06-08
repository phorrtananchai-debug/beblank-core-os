import type { Holding } from '../../types/models'

const FX_STORAGE_KEY = 'beblank_os_fx_rate_v1'
const DEFAULT_FX_RATE = 32.42

export interface FxConfig {
  rate: number
  source: 'manual' | 'config' | 'fallback'
}

export function loadFxRate(): FxConfig {
  try {
    const stored = localStorage.getItem(FX_STORAGE_KEY)
    if (stored) {
      const rate = Number(stored)
      if (rate > 0 && rate < 100) return { rate, source: 'manual' }
    }
  } catch { /* ignore */ }
  try {
    const env = import.meta.env?.VITE_FX_RATE as string | undefined
    if (env) {
      const rate = Number(env)
      if (rate > 0 && rate < 100) return { rate, source: 'config' }
    }
  } catch { /* ignore */ }
  return { rate: DEFAULT_FX_RATE, source: 'fallback' }
}

export function saveFxRate(rate: number): void {
  try {
    localStorage.setItem(FX_STORAGE_KEY, String(rate))
  } catch { /* ignore */ }
}

export function convertUsdToThb(usd: number, fxRate: number): number {
  return Math.round(usd * fxRate)
}

export interface NormalizedHolding extends Holding {
  currencyMode?: string
  averageCostUSD?: number
  currentPriceUSD?: number
  marketValueUSD?: number
  costBasisUSD?: number
  costBasisTHB?: number
  unrealizedGainTHB?: number
  unrealizedGainPercent?: number
}

export function normalizeHoldingValue(holding: Holding, fxRate: number): NormalizedHolding {
  const h = holding as unknown as Record<string, unknown>
  const mode = h.currencyMode as string | undefined

  if (mode === 'multi') {
    const qty = holding.quantity
    const avgUSD = h.averageCostUSD as number ?? 0
    const priceUSD = h.currentPriceUSD as number ?? 0
    const mvUSD = h.marketValueUSD as number ?? (qty * priceUSD)
    const cbUSD = h.costBasisUSD as number ?? (qty * avgUSD)
    const mvTHB = convertUsdToThb(mvUSD, fxRate)
    const cbTHB = convertUsdToThb(cbUSD, fxRate)
    const gainTHB = mvTHB - cbTHB
    const gainPct = cbTHB > 0 ? Math.round((gainTHB / cbTHB) * 100) : 0

    return {
      ...holding,
      currencyMode: 'multi',
      averageCostUSD: avgUSD,
      currentPriceUSD: priceUSD,
      marketValueUSD: mvUSD,
      costBasisUSD: cbUSD,
      marketValueTHB: mvTHB,
      costBasisTHB: cbTHB,
      unrealizedGainTHB: gainTHB,
      unrealizedGainPercent: gainPct,
    }
  }

  return { ...holding, currencyMode: 'legacy' }
}

export function normalizePortfolioValues(holdings: Holding[], fxRate: number): NormalizedHolding[] {
  return holdings.map((h) => normalizeHoldingValue(h, fxRate))
}

export function computeDynamicAllocation(holdings: NormalizedHolding[]): NormalizedHolding[] {
  const funded = holdings.filter((h) => h.quantity > 0)
  const total = funded.reduce((s, h) => s + (h.marketValueTHB ?? 0), 0)
  return holdings.map((h) => ({
    ...h,
    allocationPercent: h.quantity > 0 && total > 0
      ? Math.round(((h.marketValueTHB ?? 0) / total) * 100)
      : 0,
  }))
}
