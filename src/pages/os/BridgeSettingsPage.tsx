import { useState } from 'react'
import { ImportPreviewPanel } from '../../components/shared/ImportPreviewPanel'
import { SHEET_RESOURCES } from '../../core/sheetBridge/resources'
import { useSheetBridge } from '../../hooks/useSheetBridge'
import { useOs } from '../../core/os/OsContext'
import { loadBackup, removeBackup } from '../../core/sheetBridge/backup'

const ResourceCard = ({
  resource,
  onSimulateImport,
  onBuildExport,
}: {
  resource: typeof SHEET_RESOURCES[number]
  onSimulateImport: () => void
  onBuildExport: () => void
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
  const { data, bulkMergeData, restoreField } = useOs()
  const {
    config,
    importPreview,
    exportPreview,
    testing,
    importError,
    updateConfig,
    testConnection,
    simulateImport,
    confirmImport,
    cancelImport,
    buildExportPreview,
    cancelExport,
    resetConfig,
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

  const sheetUrlWarning = config.sheetUrl && !isValidUrl(config.sheetUrl) ? 'Not a valid URL.' : null
  const endpointWarning = config.appsScriptEndpoint && !isValidUrl(config.appsScriptEndpoint) ? 'Not a valid URL.' : null

  return (
    <section className="space-y-7">
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
              disabled={testing || (!config.sheetUrl && !config.appsScriptEndpoint)}
            >
              {testing ? 'Testing...' : 'Test Connection'}
            </button>

            <div className="flex items-center gap-2">
              <span className={`inline-block h-2.5 w-2.5 rounded-full ${
                config.lastSyncStatus === 'success' ? 'bg-[var(--bb-green)]' :
                config.lastSyncStatus === 'error' ? 'bg-red' :
                config.lastSyncStatus === 'connecting' ? 'bg-[var(--bb-amber)]' :
                'bg-black/[0.12]'
              }`} />
              <span className="text-xs text-[var(--bb-text-muted)]">
                {config.lastSyncStatus === 'idle' ? 'Not tested' :
                 config.lastSyncStatus === 'connecting' ? 'Connecting...' :
                 config.lastSyncStatus === 'success' ? `Connected${config.lastSyncAt ? ` — ${new Date(config.lastSyncAt).toLocaleString()}` : ''}` :
                 `Error: ${config.lastErrorMessage}`}
              </span>
            </div>
          </div>
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
              onBuildExport={() => handleBuildExport(resource.id)}
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
            {config.appsScriptEndpoint && (
              <a
                className="btn-primary"
                href={config.appsScriptEndpoint}
                target="_blank"
                rel="noreferrer"
              >
                Open Endpoint
              </a>
            )}
          </div>
        </div>
      )}

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
