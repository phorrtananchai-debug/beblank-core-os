import { useMemo } from 'react'
import { useOs } from '../../core/os/useOs'
import { getActiveAppsScriptEndpoint } from '../../core/sheetBridge/config'
import { SHEET_RESOURCES } from '../../core/sheetBridge/resources'
import { loadWriteHistory } from '../../core/sheetBridge/writeback'
import { OperationalStatusChip } from './OperationalStatusChip'
import type { OperationalStatus } from '../../core/status/status'

interface ResourceHealth {
  id: string
  name: string
  label: string
  importEnabled: boolean
  status: OperationalStatus
  statusLabel: string
  lastWriteAt: string | null
  lastSuccessAt: string | null
  message: string
}

export const SourceHealthMonitor = () => {
  const { bootstrapDiagnostics } = useOs()
  const activeEndpoint = getActiveAppsScriptEndpoint()
  const history = useMemo(() => loadWriteHistory(), [])

  const resources: ResourceHealth[] = useMemo(() => {
    const endpointConfigured = !!activeEndpoint.url

    return SHEET_RESOURCES.map((resource) => {
      const bootstrap = bootstrapDiagnostics.find((entry) => entry.resourceId === resource.id)
      const resourceHistory = history.filter((h) => h.resourceId === resource.id)
      const lastWrite = resourceHistory.length > 0 ? resourceHistory[0] : null
      const lastSuccess = resourceHistory.find((h) => h.status === 'success')

      let status: ResourceHealth['status']
      let statusLabel: ResourceHealth['statusLabel']
      let message: string

      if (!endpointConfigured) {
        status = 'blocked'
        statusLabel = 'blocked'
        message = 'Endpoint not configured.'
      } else if (bootstrap?.status === 'imported') {
        status = 'healthy'
        statusLabel = 'imported'
        message = bootstrap.invalidCount > 0
          ? `Imported ${bootstrap.rowCount} valid rows. ${bootstrap.invalidCount} invalid rows skipped.`
          : `Imported ${bootstrap.rowCount} row${bootstrap.rowCount !== 1 ? 's' : ''} successfully.`
      } else if (bootstrap?.status === 'empty') {
        status = 'complete'
        statusLabel = 'empty'
        message = 'Endpoint reachable. No rows returned for this resource.'
      } else if (bootstrap?.status === 'failed') {
        status = 'atRisk'
        statusLabel = 'failed'
        message = bootstrap.error ?? 'Resource read failed.'
      } else {
        status = 'watch'
        statusLabel = 'watch'
        message = 'Endpoint configured, but no successful read has completed for this resource yet.'
      }

      return {
        id: resource.id,
        name: resource.name,
        label: resource.label,
        importEnabled: resource.importEnabled !== false,
        status,
        statusLabel,
        lastWriteAt: lastWrite?.writtenAt ?? null,
        lastSuccessAt: lastSuccess?.writtenAt ?? null,
        message,
      }
    })
  }, [activeEndpoint.url, bootstrapDiagnostics, history])

  const healthCounts = useMemo(() => ({
    healthy: resources.filter((r) => r.status === 'healthy').length,
    warning: resources.filter((r) => r.status === 'watch' || r.status === 'atRisk').length,
    disconnected: resources.filter((r) => r.status === 'blocked').length,
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
                  resource.status === 'watch' ? 'bg-[var(--bb-amber)]' :
                  resource.status === 'atRisk' ? 'bg-red' :
                  resource.status === 'complete' ? 'bg-[var(--bb-text-faint)]' :
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
                status={resource.status}
                label={resource.statusLabel}
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
  const { bootstrapDiagnostics } = useOs()
  const activeEndpoint = getActiveAppsScriptEndpoint()
  const history = useMemo(() => loadWriteHistory(), [])

  const resources: ResourceHealth[] = useMemo(() => {
    const endpointConfigured = !!activeEndpoint.url
    return SHEET_RESOURCES.map((resource) => {
      const bootstrap = bootstrapDiagnostics.find((entry) => entry.resourceId === resource.id)
      const resourceHistory = history.filter((h) => h.resourceId === resource.id)
      const lastWrite = resourceHistory.length > 0 ? resourceHistory[0] : null
      const lastSuccess = resourceHistory.find((h) => h.status === 'success')

      let status: ResourceHealth['status']
      let statusLabel: ResourceHealth['statusLabel']
      let message: string

      if (!endpointConfigured) {
        status = 'blocked'
        statusLabel = 'blocked'
        message = 'Endpoint not configured.'
      } else if (bootstrap?.status === 'imported') {
        status = 'healthy'
        statusLabel = 'imported'
        message = bootstrap.invalidCount > 0
          ? `Imported ${bootstrap.rowCount} valid rows. ${bootstrap.invalidCount} invalid rows skipped.`
          : `Imported ${bootstrap.rowCount} row${bootstrap.rowCount !== 1 ? 's' : ''} successfully.`
      } else if (bootstrap?.status === 'empty') {
        status = 'complete'
        statusLabel = 'empty'
        message = 'Endpoint reachable. No rows returned for this resource.'
      } else if (bootstrap?.status === 'failed') {
        status = 'atRisk'
        statusLabel = 'failed'
        message = bootstrap.error ?? 'Resource read failed.'
      } else {
        status = 'watch'
        statusLabel = 'watch'
        message = 'Endpoint configured, but no successful read has completed for this resource yet.'
      }

      return {
        id: resource.id,
        name: resource.name,
        label: resource.label,
        importEnabled: resource.importEnabled !== false,
        status,
        statusLabel,
        lastWriteAt: lastWrite?.writtenAt ?? null,
        lastSuccessAt: lastSuccess?.writtenAt ?? null,
        message,
      }
    })
  }, [activeEndpoint.url, bootstrapDiagnostics, history])

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
                    resource.status === 'watch' ? 'bg-[var(--bb-amber)]' :
                    resource.status === 'atRisk' ? 'bg-red' :
                    resource.status === 'complete' ? 'bg-[var(--bb-text-faint)]' :
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
                resource.status === 'watch' ? 'text-[var(--bb-amber)]' :
                resource.status === 'atRisk' ? 'text-red' :
                'text-[var(--bb-text-muted)]'
              }`}>{resource.statusLabel}</span>
            </div>
          </div>
        ))}
      </div>

      <p className="mt-4 text-xs leading-5 text-[var(--bb-text-soft)]">
        Source health is derived from endpoint configuration, bridge read diagnostics, and optional write history. No network requests are made here.
        {!activeEndpoint.url && ' Configure an Apps Script endpoint at Bridge Settings to enable live reads.'}
      </p>
    </section>
  )
}
