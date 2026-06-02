import { appsScriptBridgeConfig, isKarunBridgeConfigured } from './config'
import { normalizeKarunBridgePayload, type KarunBridgePayload, type NormalizedKarunBridgeResult } from './karunNormalizer'

export interface KarunReadBridgeResponse {
  ok: boolean
  configured: boolean
  result?: NormalizedKarunBridgeResult
  error?: string
}

const fetchWithTimeout = async (url: string, timeoutMs: number) => {
  const controller = new AbortController()
  const timeout = window.setTimeout(() => controller.abort(), timeoutMs)
  try {
    const response = await fetch(url, { method: 'GET', signal: controller.signal })
    return response
  } finally {
    window.clearTimeout(timeout)
  }
}

export const readKarunPhuketBridge = async (): Promise<KarunReadBridgeResponse> => {
  if (!isKarunBridgeConfigured || !appsScriptBridgeConfig.karunEndpoint) {
    return { ok: false, configured: false, error: 'VITE_APPS_SCRIPT_KARUN_ENDPOINT is not configured.' }
  }

  try {
    const response = await fetchWithTimeout(appsScriptBridgeConfig.karunEndpoint, appsScriptBridgeConfig.timeoutMs)
    if (!response.ok) {
      return { ok: false, configured: true, error: `Apps Script bridge returned HTTP ${response.status}.` }
    }
    const payload = await response.json() as KarunBridgePayload
    if (!payload || typeof payload !== 'object') {
      return { ok: false, configured: true, error: 'Apps Script bridge returned malformed JSON.' }
    }
    return { ok: true, configured: true, result: normalizeKarunBridgePayload(payload) }
  } catch (error) {
    return { ok: false, configured: true, error: error instanceof Error ? error.message : 'Unknown Apps Script bridge error.' }
  }
}

export const writeKarunPhuketBridge = async (): Promise<never> => {
  throw new Error('Karun Phuket Apps Script bridge is read-only in PR #11.')
}
