export const finnhubConfig = {
  apiKey: import.meta.env.VITE_FINNHUB_API_KEY as string | undefined,
  timeoutMs: 8000,
  supportedSymbols: ['VOO', 'SCHD', 'MSFT', 'GOOGL', 'AMZN', 'NVDA', 'AVGO', 'PLTR', 'MRVL', 'RBRK', 'ABBV', 'JEPQ'],
  thbPerUsd: 36.5,
}

export const isFinnhubConfigured = Boolean(finnhubConfig.apiKey)
export const getSupportedFinnhubSymbols = () => [...finnhubConfig.supportedSymbols]
export const isSupportedFinnhubSymbol = (symbol: string) => finnhubConfig.supportedSymbols.includes(symbol.toUpperCase())
