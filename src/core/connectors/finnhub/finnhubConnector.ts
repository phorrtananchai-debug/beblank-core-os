import { finnhubConfig, isFinnhubConfigured, isSupportedFinnhubSymbol } from './config'
import { loadFxRate } from '../../../components/investments/fxEngine'

const fx = () => loadFxRate().rate

export interface FinnhubQuoteResult {
  symbol: string
  priceUSD?: number
  delayedPriceTHB?: number
  refreshedAt: string
  staleAfterHours: number
  error?: string
}

export interface FinnhubRefreshResponse {
  ok: boolean
  configured: boolean
  refreshedAt: string
  results: FinnhubQuoteResult[]
  error?: string
}

const fetchWithTimeout = async (url: string, timeoutMs: number) => {
  const controller = new AbortController()
  const timeout = window.setTimeout(() => controller.abort(), timeoutMs)
  try {
    return await fetch(url, { method: 'GET', signal: controller.signal })
  } finally {
    window.clearTimeout(timeout)
  }
}

const parseQuote = (symbol: string, payload: unknown): FinnhubQuoteResult => {
  const refreshedAt = new Date().toISOString()
  if (!payload || typeof payload !== 'object') {
    return { symbol, refreshedAt, staleAfterHours: 24, error: 'Malformed quote payload.' }
  }
  const current = (payload as { c?: unknown }).c
  if (typeof current !== 'number' || Number.isNaN(current) || current <= 0) {
    return { symbol, refreshedAt, staleAfterHours: 24, error: 'Missing current quote price.' }
  }
  return {
    symbol,
    priceUSD: current,
    delayedPriceTHB: Math.round(current * fx()),
    refreshedAt,
    staleAfterHours: 24,
  }
}

export const refreshFinnhubQuotes = async (symbols = finnhubConfig.supportedSymbols): Promise<FinnhubRefreshResponse> => {
  const refreshedAt = new Date().toISOString()
  const supportedSymbols = symbols.map((symbol) => symbol.toUpperCase()).filter(isSupportedFinnhubSymbol)
  if (!supportedSymbols.length) {
    return { ok: false, configured: isFinnhubConfigured, refreshedAt, results: [], error: 'No supported Finnhub symbols were requested.' }
  }

  if (!isFinnhubConfigured || !finnhubConfig.apiKey) {
    return { ok: false, configured: false, refreshedAt, results: [], error: 'VITE_FINNHUB_API_KEY is not configured.' }
  }

  const results: FinnhubQuoteResult[] = []
  for (const symbol of supportedSymbols) {
    try {
      const url = `https://finnhub.io/api/v1/quote?symbol=${encodeURIComponent(symbol)}&token=${encodeURIComponent(finnhubConfig.apiKey)}`
      const response = await fetchWithTimeout(url, finnhubConfig.timeoutMs)
      if (!response.ok) {
        results.push({ symbol, refreshedAt, staleAfterHours: 24, error: `HTTP ${response.status}` })
        continue
      }
      results.push(parseQuote(symbol, await response.json()))
    } catch (error) {
      results.push({ symbol, refreshedAt, staleAfterHours: 24, error: error instanceof Error ? error.message : 'Unknown Finnhub error.' })
    }
  }

  const failures = results.filter((result) => result.error)
  return {
    ok: failures.length < results.length,
    configured: true,
    refreshedAt,
    results,
    error: failures.length ? `${failures.length} Finnhub symbols failed to refresh.` : undefined,
  }
}


