import { useState, useMemo } from 'react'
import { ImportPreviewPanel } from '../../components/shared/ImportPreviewPanel'
import { SHEET_RESOURCES } from '../../core/sheetBridge/resources'
import { useSheetBridge } from '../../hooks/useSheetBridge'
import { useOs } from '../../core/os/OsContext'
import { loadBackup, removeBackup } from '../../core/sheetBridge/backup'
import { SourceHealthMonitorFull } from '../../components/shared/SourceHealthMonitor'

const ResourceCard = ({
  resource,
  onSimulateImport,
  onFetchFromEndpoint,
  onBuildExport,
  fetching,
  hasEndpoint,
}: {
  resource: typeof SHEET_RESOURCES[number]
  onSimulateImport: () => void
  onFetchFromEndpoint: () => void
  onBuildExport: () => void
  fetching: boolean
  hasEndpoint: boolean
}) => (
  <div className="rounded-[24px] border border-black/[0.05] bg-[#faf9f8] p-4">
    <div className="flex items-start justify-between gap-3">
      <div>
        <p className="font-semibold">{resource.name}</p>
        <p className="mt-0.5 text-xs text-[var(--bb-text-muted)]">{resource.description}</p>
      </div>
      <div className="flex items-center gap-2">
        {resource.importEnabled === false && (
          <span className="rounded-full bg-[var(--bb-amber)]/10 px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.1em] text-[var(--bb-amber)]">Preview / Export Only</span>
        )}
        <span className="pill">{resource.columns.length} fields</span>
      </div>
    </div>
    <div className="mt-3 flex flex-wrap gap-1.5">
      {resource.columns.map((col) => (
        <span
          key={col.key}
          className={`rounded-full px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.1em] ${col.required ? 'bg-[var(--bb-accent)]/10 text-[var(--bb-accent)]' : 'bg-white/80 text-[#6e675d]'}`}
        >
          {col.label}{col.required ? ' *' : ''}
        </span>
      ))}
    </div>
    <div className="mt-4 flex gap-2">
      <button className="btn-primary" type="button" onClick={onSimulateImport}>Simulate Import</button>
      {resource.importEnabled !== false && hasEndpoint && (
        <button className="btn-secondary" type="button" onClick={onFetchFromEndpoint} disabled={fetching}>
          {fetching ? 'Fetching...' : 'Fetch from Endpoint'}
        </button>
      )}
      <button className="btn-secondary" type="button" onClick={onBuildExport}>Build Export</button>
    </div>
  </div>
)

const DummyRawRows: Record<string, Record<string, unknown>[]> = {
  'studio-projects': [
    { id: 'p1', slug: 'sample-project', name: 'Sample Project', status: 'active', owner: 'Por', client: 'Client A', location: 'Phuket', phase: 'design' },
  ],
  'capital-records': [
    { id: 'c1', label: 'Sample Income', amountTHB: 50000, direction: 'inflow', category: 'studio-income', occurredAt: new Date().toISOString().slice(0, 10), status: 'cleared' },
  ],
  'investment-holdings': [
    { id: 'h1', assetId: 'a1', quantity: 100, averageCost: 150, allocationPercent: 25 },
  ],
  'allocation-buckets': [
    { id: 'b1', bucket: 'Core Equity', targetPercent: 50, currentPercent: 45, posture: 'core' },
  ],
  'ai-context-logs': [
    { id: 'ctx1', module: 'studio', title: 'Weekly Briefing', body: 'Context body placeholder', createdAt: new Date().toISOString() },
  ],
}

export const BridgeSettingsPage = () => {
  const { data, bulkMergeData, restoreField, createActionRequest } = useOs()
  const {
    config,
    importPreview,
    exportPreview,
    testing,
    importError,
    fetchError,
    fetchingResource,
    envEndpointStatus,
    activeEndpointUrl,
    activeEndpointSource,
    updateConfig,
    testConnection,
    simulateImport,
    fetchFromEndpoint,
    confirmImport,
    cancelImport,
    buildExportPreview,
    cancelExport,
    resetConfig,
    pendingWrites,
    addPendingWrite,
    approvePendingWrite,
    removePendingWrite,
    exportPendingWrite,
    writePendingWrite,
    writeHistory,
  } = useSheetBridge()

  const [importResult, setImportResult] = useState<{ resourceName: string; appended: number; updated: number; skipped: number } | null>(null)
  const [restoreConfirm, setRestoreConfirm] = useState<string | null>(null)

  const isValidUrl = (value: string): boolean => {
    if (!value) return true
    try {
      new URL(value)
      return true
    } catch {
      return value.length > 0
    }
  }

  const handleSimulateImport = (resourceId: string) => {
    setImportResult(null)
    const raw = DummyRawRows[resourceId]
    if (raw) {
      simulateImport(resourceId, raw)
    }
  }

  const handleFetchFromEndpoint = async (resourceId: string) => {
    setImportResult(null)
    await fetchFromEndpoint(resourceId)
  }

  const handleConfirmImport = () => {
    if (!importPreview) return
    const resource = SHEET_RESOURCES.find((r) => r.id === importPreview.resourceId)
    if (!resource) return

    const currentRows = (data as unknown as Record<string, unknown>)[resource.osField]
    const currentArray = Array.isArray(currentRows) ? currentRows : []

    confirmImport(
      importPreview.resourceId,
      currentArray,
      importPreview.rows,
      () => {
        const result = bulkMergeData(resource.osField, importPreview.rows)
        setImportResult({
          resourceName: resource.name,
          appended: result.appended,
          updated: result.updated,
          skipped: result.skipped,
        })
      },
    )
  }

  const handleBuildExport = (resourceId: string) => {
    const resource = SHEET_RESOURCES.find((r) => r.id === resourceId)
    if (!resource) return

    const rows = (data as unknown as Record<string, unknown>)[resource.osField]
    if (Array.isArray(rows)) {
      buildExportPreview(resourceId, rows as Record<string, unknown>[])
    }
  }

  const handleRestore = (resourceId: string) => {
    const backup = loadBackup(resourceId)
    if (!backup) return

    const resource = SHEET_RESOURCES.find((r) => r.id === resourceId)
    const field = resource?.osField ?? resourceId

    restoreField(field, backup.data)
    setRestoreConfirm(null)
  }

  const handleDeleteBackup = (resourceId: string) => {
    removeBackup(resourceId)
  }

  const [writeResourceId, setWriteResourceId] = useState('studio-projects')
  const [writeFields, setWriteFields] = useState<Record<string, string>>({})
  const writeResource = SHEET_RESOURCES.find((r) => r.id === writeResourceId)

  const writeResourceColumns = useMemo(() => {
    return writeResource?.columns ?? []
  }, [writeResource])

  const handleWriteFieldChange = (key: string, value: string) => {
    setWriteFields((prev) => ({ ...prev, [key]: value }))
  }

  const handleCreateWriteRow = () => {
    if (!writeResource) return
    const fields: Record<string, unknown> = {}
    for (const col of writeResource.columns) {
      const val = writeFields[col.key]
      if (val !== undefined && val !== '') {
        fields[col.key] = col.type === 'number' ? Number(val) : val
      }
    }
    addPendingWrite(writeResourceId, fields)
    setWriteFields({})
    createActionRequest({
      module: 'settings',
      actionType: 'bridge.createSheetRow',
      description: `Create ${writeResource.name} row for sheet write-back`,
      payload: { resourceId: writeResourceId, fields },
    })
  }

  const handleApproveWrite = (writeId: string) => {
    approvePendingWrite(writeId)
    createActionRequest({
      module: 'settings',
      actionType: 'bridge.approveSheetRow',
      description: 'Approve sheet write-back row for export',
      payload: { writeId },
    })
  }

  const handleExportWrite = (writeId: string) => {
    const row = exportPendingWrite(writeId)
    if (row) {
      const json = JSON.stringify(row.row, null, 2)
      navigator.clipboard.writeText(json)
      buildExportPreview(row.resourceId, [row.row])
    }
  }

  const handleWriteToSheet = async (writeId: string) => {
    await writePendingWrite(writeId)
  }

  const sheetUrlWarning = config.sheetUrl && !isValidUrl(config.sheetUrl) ? 'Not a valid URL.' : null
  const endpointWarning = config.appsScriptEndpoint && !isValidUrl(config.appsScriptEndpoint) ? 'Not a valid URL.' : null
  const hasLiveEndpoint = !!activeEndpointUrl && activeEndpointUrl.startsWith('https://')

  const sourceBadge = activeEndpointSource === 'manual'
    ? { label: 'Manual Endpoint', style: 'text-[var(--bb-accent)] border-[var(--bb-accent)]/20 bg-[var(--bb-accent)]/5' as const }
    : activeEndpointSource === 'env'
      ? { label: 'Environment Endpoint', style: 'text-[var(--bb-blue)] border-blue/20 bg-blue/5' as const }
      : { label: 'Not Configured', style: 'text-[var(--bb-text-muted)] border-black/[0.08] bg-black/[0.03]' as const }

  const connectionLabel = activeEndpointSource === 'none'
    ? { status: 'unconfigured' as const, label: 'Not configured', color: 'bg-black/[0.12]' as const }
    : config.lastSyncStatus === 'success'
      ? { status: 'connected' as const, label: `Connected — Last tested ${config.lastSyncAt ? new Date(config.lastSyncAt).toLocaleString() : ''}`, color: 'bg-[var(--bb-green)]' as const }
      : config.lastSyncStatus === 'error'
        ? { status: 'error' as const, label: `Failed — ${config.lastErrorMessage}`, color: 'bg-red' as const }
        : config.lastSyncStatus === 'connecting'
          ? { status: 'connecting' as const, label: 'Testing connection...', color: 'bg-[var(--bb-amber)]' as const }
          : { status: 'ready' as const, label: 'Ready to connect — Click Test', color: 'bg-black/[0.12]' as const }

  return (
    <section className="space-y-5">
      <header className="command-hero rounded-[36px] border border-black/[0.05] bg-[#faf9f8] p-6 md:p-9">
        <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--bb-text-muted)]">Google Sheet Bridge</p>
        <h2 className="mt-2 text-2xl font-extrabold">Bridge Settings</h2>
        <p className="mt-1 text-sm leading-6 text-[var(--bb-text-soft)]">
          Configure manual Google Sheet connection. No autosync. No silent overwrite.
        </p>
      </header>

      {/* CONNECTION */}
      <section className="os-card-primary">
        <div className="panel-header">
          <div>
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--bb-text-muted)]">CONNECTION</p>
            <h3>Sheet Connection</h3>
          </div>
          <div className="flex gap-2">
            <span className={`pill ${connectionLabel.color === 'bg-[var(--bb-green)]' ? 'text-[var(--bb-green)]' : connectionLabel.color === 'bg-red' ? 'text-red' : ''}`}>
              {connectionLabel.label}
            </span>
            <button className="btn-secondary" type="button" onClick={resetConfig}>Reset</button>
          </div>
        </div>

        <div className="space-y-4">
          <div className="os-list-row">
            <label className="text-sm font-medium text-[var(--bb-text-muted)]">Sheet URL / ID</label>
            <div className="flex-1">
              <input
                className={`w-full max-w-md rounded-xl border px-3 py-1.5 text-sm outline-none transition focus:bg-white ${sheetUrlWarning ? 'border-red/50 bg-red/5' : 'border-black/[0.08] bg-white/80 focus:border-[var(--bb-accent-border)]'}`}
                value={config.sheetUrl}
                onChange={(e) => updateConfig({ sheetUrl: e.target.value })}
                placeholder="https://docs.google.com/spreadsheets/d/..."
              />
              {sheetUrlWarning && <p className="mt-1 text-[11px] text-red/70">{sheetUrlWarning}</p>}
            </div>
          </div>

          <div className="os-list-row">
            <label className="text-sm font-medium text-[var(--bb-text-muted)]">Apps Script Endpoint</label>
            <div className="flex-1">
              <input
                className={`w-full max-w-md rounded-xl border px-3 py-1.5 text-sm outline-none transition focus:bg-white ${endpointWarning ? 'border-red/50 bg-red/5' : 'border-black/[0.08] bg-white/80 focus:border-[var(--bb-accent-border)]'}`}
                value={config.appsScriptEndpoint}
                onChange={(e) => updateConfig({ appsScriptEndpoint: e.target.value })}
                placeholder="https://script.google.com/macros/s/..."
              />
              {endpointWarning && <p className="mt-1 text-[11px] text-red/70">{endpointWarning}</p>}
            </div>
          </div>

          <div className="os-list-row">
            <label className="text-sm font-medium text-[var(--bb-text-muted)]">Sync Mode</label>
            <div className="flex gap-3">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="syncMode"
                  checked={config.syncMode === 'manual'}
                  onChange={() => updateConfig({ syncMode: 'manual' })}
                />
                Manual
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="syncMode"
                  checked={config.syncMode === 'readonly'}
                  onChange={() => updateConfig({ syncMode: 'readonly' })}
                />
                Read-only
              </label>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              className="btn-primary"
              type="button"
              onClick={testConnection}
              disabled={testing || !activeEndpointUrl}
            >
              {testing ? 'Testing...' : 'Test Connection'}
            </button>

            <div className="flex items-center gap-2">
              <span className={`inline-block h-2.5 w-2.5 rounded-full ${connectionLabel.color}`} />
              <span className="text-xs text-[var(--bb-text-muted)]">{connectionLabel.label}</span>
            </div>

            <span className={`rounded-full border px-2.5 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-[0.08em] ${sourceBadge.style}`}>
              {sourceBadge.label}
            </span>
          </div>
        </div>
      </section>

      {/* ENVIRONMENT VARIABLE SETUP */}
      <section className="rounded-[28px] border border-black/[0.05] bg-[#faf9f8] p-5">
        <div className="panel-header">
          <div>
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--bb-text-muted)]">ENVIRONMENT</p>
            <h3>Apps Script Endpoint Setup</h3>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-full border px-2.5 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-[0.08em] text-[var(--bb-text-muted)] border-black/[0.08] bg-black/[0.03]">
              Active: {activeEndpointSource === 'manual' ? 'Manual' : activeEndpointSource === 'env' ? 'Environment' : 'None'}
            </span>
            <span className={`pill ${envEndpointStatus === 'configured' ? 'text-[var(--bb-green)]' : envEndpointStatus === 'invalid' ? 'text-red' : 'text-[var(--bb-amber)]'}`}>
              {envEndpointStatus === 'configured' ? 'Env Var Ready' : envEndpointStatus === 'invalid' ? 'Invalid Env Var' : 'No Env Var'}
            </span>
          </div>
        </div>
        <div className="mt-3 space-y-3 text-sm leading-6 text-[var(--bb-text-soft)]">
          <p>
            The bridge connects to a Google Sheet via an <strong>Apps Script Web App</strong> endpoint.
            Priority: Manual entry (highest) → Environment variable → Not configured.
            You can configure the endpoint URL in two ways:
          </p>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-2xl border border-black/[0.05] bg-white p-3">
              <p className="font-semibold text-[var(--bb-text)]">1. Environment Variable</p>
              <p className="mt-1 text-xs">Set <code className="rounded bg-black/[0.05] px-1 py-0.5 font-mono text-[11px]">VITE_APPS_SCRIPT_KARUN_ENDPOINT</code> in <code className="rounded bg-black/[0.05] px-1 py-0.5 font-mono text-[11px]">.env.local</code> or Vercel Environment Variables.</p>
            </div>
            <div className="rounded-2xl border border-black/[0.05] bg-white p-3">
              <p className="font-semibold text-[var(--bb-text)]">2. Manual Entry</p>
              <p className="mt-1 text-xs">Paste any <strong>HTTPS</strong> endpoint URL into the field above. Stored in browser localStorage only. Not committed.</p>
            </div>
          </div>
          <div className="rounded-2xl border border-[var(--bb-amber)]/20 bg-[var(--bb-amber)]/5 p-3">
            <p className="text-xs font-semibold text-[var(--bb-amber)]">⚠ Never commit private endpoint URLs to git.</p>
            <p className="mt-1 text-xs">Use <code className="rounded bg-black/[0.05] px-1 py-0.5 font-mono text-[11px]">.env.local</code> (gitignored) or enter manually in this UI.</p>
          </div>
          <details className="rounded-2xl border border-black/[0.05] bg-white p-3">
            <summary className="cursor-pointer text-xs font-semibold text-[var(--bb-text-muted)]">Expected Response Shape</summary>
            <pre className="mt-2 overflow-x-auto text-[11px] leading-5 text-[var(--bb-text-soft)]">{`{
  "ok": true,
  "resource": "studio-projects",
  "rows": [
    {
      "id": "record-1",
      "slug": "example",
      "name": "Example Record",
      ...
    }
  ],
  "updatedAt": "2026-06-06T00:00:00.000Z"
}`}</pre>
            <ul className="mt-2 list-inside list-disc space-y-1 text-[11px] text-[var(--bb-text-muted)]">
              <li><code className="rounded bg-black/[0.05] px-1 font-mono">ok</code> — must be <code className="rounded bg-black/[0.05] px-1 font-mono">true</code></li>
              <li><code className="rounded bg-black/[0.05] px-1 font-mono">resource</code> — string ID matching one of the defined tabs above</li>
              <li><code className="rounded bg-black/[0.05] px-1 font-mono">rows</code> — array of objects with column keys from the resource definition</li>
              <li><code className="rounded bg-black/[0.05] px-1 font-mono">updatedAt</code> — optional ISO timestamp</li>
            </ul>
          </details>
        </div>
      </section>

      {/* SHEET RESOURCES */}
      <section className="os-card-primary">
        <div className="panel-header">
          <div>
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--bb-text-muted)]">SHEET RESOURCES</p>
            <h3>Defined Tabs</h3>
          </div>
          <span className="pill">{SHEET_RESOURCES.length} resources</span>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          {SHEET_RESOURCES.map((resource) => (
            <ResourceCard
              key={resource.id}
              resource={resource}
              onSimulateImport={() => handleSimulateImport(resource.id)}
              onFetchFromEndpoint={() => handleFetchFromEndpoint(resource.id)}
              onBuildExport={() => handleBuildExport(resource.id)}
              fetching={fetchingResource === resource.id}
              hasEndpoint={hasLiveEndpoint}
            />
          ))}
        </div>
      </section>

      {/* IMPORT PREVIEW */}
      {importError && (
        <div className="rounded-2xl border border-red/20 bg-red/5 p-4 text-sm text-red">
          {importError}
        </div>
      )}

      {fetchError && !importPreview && (
        <div className="rounded-2xl border border-[var(--bb-amber)]/20 bg-[var(--bb-amber)]/5 p-4 text-sm text-[var(--bb-amber)]">
          {fetchError}
        </div>
      )}

      {importResult && (
        <div className="os-card-primary">
          <div className="panel-header">
            <div>
              <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--bb-text-muted)]">IMPORT RESULT</p>
              <h3>{importResult.resourceName}</h3>
            </div>
          </div>
          <div className="mt-2 flex gap-4 text-sm">
            <span><strong>{importResult.appended}</strong> rows appended</span>
            <span><strong>{importResult.updated}</strong> rows updated</span>
            {importResult.skipped > 0 && <span className="text-[var(--bb-amber)]"><strong>{importResult.skipped}</strong> rows skipped</span>}
          </div>
        </div>
      )}

      {importPreview && config.syncMode !== 'readonly' && (
        <ImportPreviewPanel
          preview={importPreview}
          onConfirm={handleConfirmImport}
          onCancel={cancelImport}
        />
      )}

      {importPreview && config.syncMode === 'readonly' && (
        <div className="rounded-2xl border border-[var(--bb-amber)]/20 bg-[var(--bb-amber)]/5 p-4 text-sm text-[var(--bb-amber)]">
          Import preview is available but import is disabled in read-only mode. Switch to Manual mode to confirm.
        </div>
      )}

      {/* EXPORT PREVIEW */}
      {exportPreview && (
        <div className="rounded-[28px] border border-black/[0.05] bg-[#faf9f8] p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--bb-text-muted)]">Export Preview</p>
              <h3 className="mt-1 text-lg font-bold">{exportPreview.resourceName}</h3>
            </div>
            <span className="pill">{exportPreview.rows.length} rows</span>
          </div>

          <div className="mt-4 max-h-64 overflow-auto rounded-2xl border border-black/[0.06] bg-white p-3">
            <pre className="text-[11px] leading-5">{exportPreview.jsonPayload}</pre>
          </div>

          <div className="mt-5 flex items-center justify-end gap-3">
            <button
              className="btn-secondary"
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(exportPreview.jsonPayload)
              }}
            >
              Copy Payload
            </button>
            <button className="btn-secondary" type="button" onClick={cancelExport}>Close</button>
            {activeEndpointUrl && (
              <a
                className="btn-primary"
                href={activeEndpointUrl}
                target="_blank"
                rel="noreferrer"
              >
                Open Endpoint
              </a>
            )}
          </div>
        </div>
      )}

      {/* WRITE BACK */}
      <section className="os-card-primary">
        <div className="panel-header">
          <div>
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--bb-text-muted)]">WRITE BACK</p>
            <h3>Create Sheet Row</h3>
          </div>
          <span className="pill">{pendingWrites.length} pending</span>
        </div>

        <div className="space-y-4">
          <div className="os-list-row">
            <label className="text-sm font-medium text-[var(--bb-text-muted)]">Resource</label>
            <select
              className="w-full max-w-xs rounded-xl border border-black/[0.08] bg-white/80 px-3 py-1.5 text-sm outline-none"
              value={writeResourceId}
              onChange={(e) => { setWriteResourceId(e.target.value); setWriteFields({}) }}
            >
              {SHEET_RESOURCES.filter((r) => r.importEnabled !== false).map((r) => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
          </div>

          {writeResourceColumns.map((col) => (
            <div key={col.key} className="os-list-row">
              <label className="text-sm font-medium text-[var(--bb-text-muted)]">
                {col.label}{col.required ? ' *' : ''}
              </label>
              <input
                className="w-full max-w-xs rounded-xl border border-black/[0.08] bg-white/80 px-3 py-1.5 text-sm outline-none transition focus:border-[var(--bb-accent-border)] focus:bg-white"
                value={writeFields[col.key] ?? ''}
                onChange={(e) => handleWriteFieldChange(col.key, e.target.value)}
                placeholder={col.type === 'date' ? '2026-06-06' : col.type === 'number' ? '0' : ''}
              />
            </div>
          ))}

          <div className="flex justify-end">
            <button className="btn-primary" type="button" onClick={handleCreateWriteRow}>
              Create Row
            </button>
          </div>
        </div>

        {pendingWrites.length > 0 && (
          <div className="mt-6 space-y-2 border-t border-black/[0.05] pt-4">
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--bb-text-muted)]">Pending Rows</p>
            {pendingWrites.map((write) => (
              <div key={write.id} className="rounded-2xl border border-black/[0.05] bg-[#faf9f8] p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold">{write.resourceName}</p>
                    <pre className="mt-1 max-h-24 overflow-auto text-[10px] leading-4 text-[var(--bb-text-muted)]">{JSON.stringify(write.row, null, 2)}</pre>
                  </div>
                  <div className="flex shrink-0 flex-col gap-1.5">
                    <span className={`pill ${
                      write.status === 'written' ? 'text-[var(--bb-green)]' :
                      write.status === 'failed' ? 'text-red' :
                      write.status === 'approved' ? 'text-[var(--bb-green)]' :
                      write.status === 'exported' ? 'text-[var(--bb-blue)]' : 'text-[var(--bb-amber)]'
                    }`}>{write.status}</span>
                    {write.status === 'written' && write.writtenAt && (
                      <span className="text-[10px] text-[var(--bb-text-muted)]">Written {new Date(write.writtenAt).toLocaleString()}</span>
                    )}
                    {write.status === 'failed' && write.writeError && (
                      <span className="text-[10px] text-red/80">{write.writeError}</span>
                    )}
                    {write.status === 'draft' && (
                      <button className="rounded-xl bg-[var(--bb-green)]/10 px-3 py-1 text-xs font-medium text-[var(--bb-green)]" type="button" onClick={() => handleApproveWrite(write.id)}>Approve</button>
                    )}
                    {write.status === 'approved' && (
                      <>
                        <button className="rounded-xl bg-[var(--bb-accent)]/10 px-3 py-1 text-xs font-medium text-[var(--bb-accent)]" type="button" onClick={() => handleWriteToSheet(write.id)}>Write to Sheet</button>
                        <button className="rounded-xl bg-black/[0.05] px-3 py-1 text-xs font-medium" type="button" onClick={() => handleExportWrite(write.id)}>Export & Copy</button>
                      </>
                    )}
                    {(write.status === 'draft') && (
                      <button className="rounded-xl bg-black/[0.05] px-3 py-1 text-xs font-medium" type="button" onClick={() => handleExportWrite(write.id)}>Export & Copy</button>
                    )}
                    {write.status !== 'written' && (
                      <button className="rounded-xl bg-red/10 px-3 py-1 text-xs font-medium text-red" type="button" onClick={() => removePendingWrite(write.id)}>Remove</button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <p className="mt-4 text-xs leading-5 text-[var(--bb-text-muted)]">
          Rows are created locally and stored in memory. No data is written to the Google Sheet.
          Approve a row to mark it ready, then export the JSON payload and paste it into your sheet manually.
        </p>
      </section>

      {/* BACKUPS */}
      <section className="os-card-primary">
        <div className="panel-header">
          <div>
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--bb-text-muted)]">BACKUPS</p>
            <h3>Restore from Backup</h3>
          </div>
        </div>
        <div className="space-y-3">
          {SHEET_RESOURCES.map((resource) => {
            const backup = loadBackup(resource.id)
            return (
              <div key={resource.id} className="os-list-row">
                <div className="flex flex-1 items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{resource.name}</p>
                    {backup ? (
                      <p className="text-[11px] text-[var(--bb-text-muted)]">
                        Backup from {new Date(backup.createdAt).toLocaleString()} — {backup.data.length} rows — {backup.reason}
                      </p>
                    ) : (
                      <p className="text-[11px] text-[var(--bb-text-faint)]">No backup available</p>
                    )}
                  </div>
                  {backup && (
                    <div className="flex gap-2">
                      {restoreConfirm === resource.id ? (
                        <>
                          <span className="text-xs text-[var(--bb-amber)]">Restore this backup?</span>
                          <button className="rounded-xl bg-[var(--bb-green)]/10 px-3 py-1 text-xs font-medium text-[var(--bb-green)]" type="button" onClick={() => handleRestore(resource.id)}>Confirm</button>
                          <button className="rounded-xl bg-black/[0.05] px-3 py-1 text-xs font-medium" type="button" onClick={() => setRestoreConfirm(null)}>Cancel</button>
                        </>
                      ) : (
                        <>
                          <button className="rounded-xl bg-black/[0.05] px-3 py-1 text-xs font-medium" type="button" onClick={() => setRestoreConfirm(resource.id)}>Restore</button>
                          <button className="rounded-xl bg-red/10 px-3 py-1 text-xs font-medium text-red" type="button" onClick={() => handleDeleteBackup(resource.id)}>Delete</button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* SOURCE HEALTH FULL */}
      <SourceHealthMonitorFull />

      {/* WRITE-BACK HISTORY */}
      <section className="os-card-primary">
        <div className="panel-header">
          <div>
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--bb-text-muted)]">WRITE-BACK HISTORY</p>
            <h3>Sheet Write Audit Log</h3>
          </div>
          <div className="flex gap-2">
            <span className="pill">{writeHistory.length} writes</span>
            {writeHistory.length > 0 && (
              <button
                className="btn-secondary"
                type="button"
                onClick={() => {
                  const json = JSON.stringify(writeHistory, null, 2)
                  navigator.clipboard.writeText(json)
                  const blob = new Blob([json], { type: 'application/json' })
                  const url = URL.createObjectURL(blob)
                  const a = document.createElement('a')
                  a.href = url
                  a.download = `bridge-write-history-${new Date().toISOString().slice(0, 10)}.json`
                  a.click()
                  URL.revokeObjectURL(url)
                }}
              >
                Export History JSON
              </button>
            )}
          </div>
        </div>
        {writeHistory.length === 0 ? (
          <p className="text-sm text-[var(--bb-text-muted)]">No write-back history yet. Create, approve, and write a row to see history here.</p>
        ) : (
          <div className="space-y-2">
            {writeHistory.map((entry) => (
              <div key={entry.id} className="os-list-row">
                <div className="flex flex-1 items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold">{entry.resourceName}</p>
                    <p className="mt-0.5 text-xs text-[var(--bb-text-muted)]">Record: {entry.recordId} — {entry.payloadSummary}</p>
                    <p className="text-[10px] text-[var(--bb-text-faint)]">{new Date(entry.writtenAt).toLocaleString()}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <span className={`pill ${entry.status === 'success' ? 'text-[var(--bb-green)]' : 'text-red bg-red/5'}`}>{entry.status}</span>
                    {entry.status === 'failed' && entry.errorMessage && (
                      <p className="mt-1 max-w-48 text-right text-[10px] leading-tight text-red/80">{entry.errorMessage}</p>
                    )}
                    {entry.status === 'failed' && entry.errorCode && (
                      <p className="text-[9px] font-mono uppercase tracking-[0.08em] text-[var(--bb-text-faint)]">{entry.errorCode}</p>
                    )}
                    <p className="mt-1 text-[10px] text-[var(--bb-text-faint)]">{entry.endpointLabel}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* SAFETY SECTION */}
      <section className="rounded-[28px] border border-black/[0.05] bg-[#faf9f8] p-5">
        <div className="panel-header">
          <div>
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--bb-text-muted)]">SAFETY</p>
            <h3>Bridge Safety Rules</h3>
          </div>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {[
            { label: 'No autosync', desc: 'Bridge never polls or syncs automatically.' },
            { label: 'No silent overwrite', desc: 'Every import requires user preview + confirm.' },
            { label: 'Id-based merge', desc: 'Existing rows with matching ID are updated; new rows are appended. Existing rows not in the import are preserved.' },
            { label: 'Local backup', desc: 'A snapshot is saved to localStorage before each import. Restore from the Backups section.' },
            { label: 'Read-only mode', desc: 'When enabled, import is blocked at both UI and hook level.' },
            { label: 'Backup failure blocks import', desc: 'If localStorage backup fails, the import is cancelled to protect your data.' },
          ].map((rule) => (
            <div key={rule.label} className="rounded-2xl border border-black/[0.05] bg-white p-3">
              <p className="text-sm font-semibold">{rule.label}</p>
              <p className="mt-0.5 text-xs text-[var(--bb-text-muted)]">{rule.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </section>
  )
}
