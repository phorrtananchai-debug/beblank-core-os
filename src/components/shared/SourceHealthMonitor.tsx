import { useMemo } from 'react'
import { SHEET_RESOURCES } from '../../core/sheetBridge/resources'
import { loadWriteHistory } from '../../core/sheetBridge/writeback'
import { OperationalStatusChip } from './OperationalStatusChip'
import type { OperationalStatus } from '../../core/status/status'

const CONFIG_KEY = 'beblank_os_bridge_config_v1'

interface ResourceHealth {
  id: string
  name: string
  label: string
  importEnabled: boolean
  status: 'healthy' | 'warning' | 'disconnected'
  lastWriteAt: string | null
  lastSuccessAt: string | null
  message: string
}

function loadBridgeConfig(): { appsScriptEndpoint?: string } {
  try {
    const stored = localStorage.getItem(CONFIG_KEY)
    if (stored) {
      const parsed = JSON.parse(stored)
      const envEndpoint = import.meta.env?.VITE_APPS_SCRIPT_KARUN_ENDPOINT as string | undefined
      if (!parsed.appsScriptEndpoint && envEndpoint?.startsWith('https://')) {
        parsed.appsScriptEndpoint = envEndpoint
      }
      return parsed
    }
  } catch { /* ignore */ }
  const envEndpoint = import.meta.env?.VITE_APPS_SCRIPT_KARUN_ENDPOINT as string | undefined
  if (envEndpoint?.startsWith('https://')) {
    return { appsScriptEndpoint: envEndpoint }
  }
  return {}
}

export const SourceHealthMonitor = () => {
  const config = useMemo(() => loadBridgeConfig(), [])
  const history = useMemo(() => loadWriteHistory(), [])

  const resources: ResourceHealth[] = useMemo(() => {
    const endpointConfigured = !!(config.appsScriptEndpoint)

    return SHEET_RESOURCES.map((resource) => {
      const resourceHistory = history.filter((h) => h.resourceId === resource.id)
      const lastWrite = resourceHistory.length > 0 ? resourceHistory[0] : null
      const lastSuccess = resourceHistory.find((h) => h.status === 'success')
      const lastFailed = resourceHistory.find((h) => h.status === 'failed')

      let status: ResourceHealth['status']
      let message: string

      if (!endpointConfigured && resourceHistory.length === 0) {
        status = 'disconnected'
        message = 'Endpoint not configured. No write history.'
      } else if (endpointConfigured && resourceHistory.length === 0) {
        status = 'warning'
        message = 'Endpoint configured but no writes yet.'
      } else if (lastWrite?.status === 'success') {
        status = 'healthy'
        message = 'Last write succeeded.'
      } else if (lastFailed && (!lastSuccess || lastFailed.writtenAt > lastSuccess.writtenAt)) {
        status = 'warning'
        message = `Last write failed: ${lastFailed.errorMessage ?? 'Unknown error'}`
      } else {
        status = 'warning'
        message = 'Write history available but needs attention.'
      }

      return {
        id: resource.id,
        name: resource.name,
        label: resource.label,
        importEnabled: resource.importEnabled !== false,
        status,
        lastWriteAt: lastWrite?.writtenAt ?? null,
        lastSuccessAt: lastSuccess?.writtenAt ?? null,
        message,
      }
    })
  }, [config, history])

  const healthCounts = useMemo(() => ({
    healthy: resources.filter((r) => r.status === 'healthy').length,
    warning: resources.filter((r) => r.status === 'warning').length,
    disconnected: resources.filter((r) => r.status === 'disconnected').length,
  }), [resources])

  return (
    <section className="os-reference-card">
      <div className="panel-header">
        <h3>Source Health</h3>
        <div className="flex gap-1.5">
          {healthCounts.healthy > 0 && <span className="pill text-[var(--bb-green)]">{healthCounts.healthy} ok</span>}
          {healthCounts.warning > 0 && <span className="pill text-[var(--bb-amber)]">{healthCounts.warning} warn</span>}
          {healthCounts.disconnected > 0 && <span className="pill text-[var(--bb-text-muted)]">{healthCounts.disconnected} off</span>}
        </div>
      </div>

      <div className="mt-2 space-y-1.5">
        {resources.map((resource) => (
          <div key={resource.id} className="flex items-center justify-between rounded-xl bg-white/50 px-3 py-2">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className={`inline-block h-1.5 w-1.5 shrink-0 rounded-full ${
                  resource.status === 'healthy' ? 'bg-[var(--bb-green)]' :
                  resource.status === 'warning' ? 'bg-[var(--bb-amber)]' :
                  'bg-black/[0.15]'
                }`} />
                <p className="truncate text-xs font-semibold">{resource.name}</p>
                {!resource.importEnabled && (
                  <span className="rounded bg-black/[0.05] px-1.5 py-0.5 font-mono text-[8px] uppercase tracking-[0.08em] text-[var(--bb-text-muted)]">preview</span>
                )}
              </div>
              <p className="mt-0.5 truncate text-[10px] text-[var(--bb-text-muted)]">{resource.message}</p>
              {resource.lastSuccessAt && (
                <p className="text-[9px] text-[var(--bb-text-faint)]">Last success: {new Date(resource.lastSuccessAt).toLocaleString()}</p>
              )}
            </div>
            <span className="shrink-0 ml-2">
              <OperationalStatusChip
                status={
                  resource.status === 'healthy' ? 'healthy' :
                  resource.status === 'warning' ? 'watch' :
                  'blocked' as OperationalStatus
                }
                size="sm"
              />
            </span>
          </div>
        ))}
      </div>
    </section>
  )
}

export const SourceHealthMonitorFull = () => {
  const config = useMemo(() => loadBridgeConfig(), [])
  const history = useMemo(() => loadWriteHistory(), [])

  const resources: ResourceHealth[] = useMemo(() => {
    const endpointConfigured = !!(config.appsScriptEndpoint)
    return SHEET_RESOURCES.map((resource) => {
      const resourceHistory = history.filter((h) => h.resourceId === resource.id)
      const lastWrite = resourceHistory.length > 0 ? resourceHistory[0] : null
      const lastSuccess = resourceHistory.find((h) => h.status === 'success')
      const lastFailed = resourceHistory.find((h) => h.status === 'failed')

      let status: ResourceHealth['status']
      let message: string

      if (!endpointConfigured && resourceHistory.length === 0) {
        status = 'disconnected'
        message = 'Endpoint not configured. No write history.'
      } else if (endpointConfigured && resourceHistory.length === 0) {
        status = 'warning'
        message = 'Endpoint configured but no writes yet.'
      } else if (lastWrite?.status === 'success') {
        status = 'healthy'
        message = 'Last write succeeded.'
      } else if (lastFailed && (!lastSuccess || lastFailed.writtenAt > lastSuccess.writtenAt)) {
        status = 'warning'
        message = `Last write failed: ${lastFailed.errorMessage ?? 'Unknown error'}`
      } else {
        status = 'warning'
        message = 'Write history available but needs attention.'
      }

      return {
        id: resource.id,
        name: resource.name,
        label: resource.label,
        importEnabled: resource.importEnabled !== false,
        status,
        lastWriteAt: lastWrite?.writtenAt ?? null,
        lastSuccessAt: lastSuccess?.writtenAt ?? null,
        message,
      }
    })
  }, [config, history])

  return (
    <section className="os-card-primary">
      <div className="panel-header">
        <div>
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--bb-text-muted)]">SOURCE HEALTH</p>
          <h3>Resource Availability</h3>
        </div>
        <div className="flex gap-2">
          <span className="pill">{resources.length} resources</span>
        </div>
      </div>

      <div className="space-y-3">
        {resources.map((resource) => (
          <div key={resource.id} className="rounded-2xl border border-black/[0.05] bg-[#faf9f8] p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className={`inline-block h-2 w-2 shrink-0 rounded-full ${
                    resource.status === 'healthy' ? 'bg-[var(--bb-green)]' :
                    resource.status === 'warning' ? 'bg-[var(--bb-amber)]' :
                    'bg-black/[0.15]'
                  }`} />
                  <p className="text-sm font-semibold">{resource.name}</p>
                  {!resource.importEnabled && (
                    <span className="rounded bg-[var(--bb-amber)]/10 px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.1em] text-[var(--bb-amber)]">preview only</span>
                  )}
                </div>
                <p className="mt-1 text-xs text-[var(--bb-text-muted)]">{resource.message}</p>
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-[var(--bb-text-faint)]">
                  {resource.lastWriteAt && <span>Last write: {new Date(resource.lastWriteAt).toLocaleString()}</span>}
                  {resource.lastSuccessAt && <span>Last success: {new Date(resource.lastSuccessAt).toLocaleString()}</span>}
                </div>
              </div>
              <span className={`shrink-0 pill ${
                resource.status === 'healthy' ? 'text-[var(--bb-green)]' :
                resource.status === 'warning' ? 'text-[var(--bb-amber)]' :
                'text-[var(--bb-text-muted)]'
              }`}>{resource.status}</span>
            </div>
          </div>
        ))}
      </div>

      <p className="mt-4 text-xs leading-5 text-[var(--bb-text-soft)]">
        Source health is derived from configuration and write history. No network requests are made.
        {!config.appsScriptEndpoint && ' Configure an Apps Script endpoint at Bridge Settings to enable live writes.'}
      </p>
    </section>
  )
}
