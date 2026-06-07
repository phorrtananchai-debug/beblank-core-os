const STORAGE_KEY = 'beblank_os_bridge_config_v1'

export const getEnvAppsScriptEndpoint = (): string => {
  const endpoint = import.meta.env?.VITE_APPS_SCRIPT_KARUN_ENDPOINT as string | undefined
  return endpoint?.startsWith('https://') ? endpoint : ''
}

export const getStoredAppsScriptEndpoint = (): string => {
  if (typeof window === 'undefined') return ''

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    if (!stored) return ''

    const parsed = JSON.parse(stored) as { appsScriptEndpoint?: string }
    return parsed.appsScriptEndpoint?.startsWith('https://') ? parsed.appsScriptEndpoint : ''
  } catch {
    return ''
  }
}

export const getActiveAppsScriptEndpoint = (): { url: string; source: 'manual' | 'env' | 'none' } => {
  const stored = getStoredAppsScriptEndpoint()
  if (stored) {
    return { url: stored, source: 'manual' }
  }

  const env = getEnvAppsScriptEndpoint()
  if (env) {
    return { url: env, source: 'env' }
  }

  return { url: '', source: 'none' }
}

export { STORAGE_KEY }
