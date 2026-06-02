export const appsScriptBridgeConfig = {
  karunEndpoint: import.meta.env.VITE_APPS_SCRIPT_KARUN_ENDPOINT as string | undefined,
  timeoutMs: 8000,
}

export const isKarunBridgeConfigured = Boolean(appsScriptBridgeConfig.karunEndpoint)
