import type { OsData } from '../../types/models'

interface Props {
  data: OsData
  activeEndpointUrl: string
  activeEndpointSource: string
  lastSyncStatus: string
  lastSyncAt: string | null
}

export const BridgeDiagnostics = ({ data, activeEndpointUrl, activeEndpointSource, lastSyncStatus, lastSyncAt }: Props) => {
  const resources = [
    { label: 'Projects', count: data.projects.length, field: 'projects' },
    { label: 'Holdings', count: data.holdings.length, field: 'holdings' },
    { label: 'DCA Plans', count: data.dcaRecords.length, field: 'dcaRecords' },
    { label: 'Dividends', count: data.dividendRecords.length, field: 'dividendRecords' },
    { label: 'Approvals', count: data.approvals.length, field: 'approvals' },
    { label: 'Capital Records', count: data.financeLedgerRows.length, field: 'financeLedgerRows' },
    { label: 'AI Contexts', count: data.aiContexts.length, field: 'aiContexts' },
    { label: 'Reserve Rows', count: data.reserveRows.length, field: 'reserveRows' },
  ]

  const totalRows = resources.reduce((s, r) => s + r.count, 0)

  return (
    <section className="os-card-primary">
      <div className="panel-header">
        <div>
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--bb-text-muted)]">BRIDGE DIAGNOSTICS</p>
          <h3>Data Source Status</h3>
        </div>
        <div className="flex gap-2">
          <span className="pill">{totalRows} total rows</span>
        </div>
      </div>

      <div className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-black/[0.04] bg-white/60 p-3">
            <p className="font-mono text-[9px] font-semibold uppercase text-[var(--bb-text-muted)]">Endpoint</p>
            <p className="mt-1 break-all text-xs font-semibold">
              {activeEndpointUrl ? (
                <span className="text-[var(--bb-green)]">Connected</span>
              ) : (
                <span className="text-[var(--bb-amber)]">Not configured</span>
              )}
            </p>
            <p className="text-[10px] text-[var(--bb-text-faint)]">Source: {activeEndpointSource || 'none'}</p>
          </div>
          <div className="rounded-xl border border-black/[0.04] bg-white/60 p-3">
            <p className="font-mono text-[9px] font-semibold uppercase text-[var(--bb-text-muted)]">Last Sync</p>
            <p className="mt-1 text-xs font-semibold">
              {lastSyncAt ? new Date(lastSyncAt).toLocaleString() : 'Never'}
            </p>
            <p className="text-[10px] text-[var(--bb-text-faint)]">Status: {lastSyncStatus}</p>
          </div>
          <div className="rounded-xl border border-black/[0.04] bg-white/60 p-3">
            <p className="font-mono text-[9px] font-semibold uppercase text-[var(--bb-text-muted)]">Rows Imported</p>
            <p className="mt-1 text-lg font-bold">{totalRows}</p>
            <p className="text-[10px] text-[var(--bb-text-faint)]">Across {resources.filter((r) => r.count > 0).length} resources</p>
          </div>
          <div className="rounded-xl border border-black/[0.04] bg-white/60 p-3">
            <p className="font-mono text-[9px] font-semibold uppercase text-[var(--bb-text-muted)]">Source Mode</p>
            <p className={`mt-1 text-xs font-semibold ${activeEndpointUrl ? 'text-[var(--bb-green)]' : 'text-[var(--bb-amber)]'}`}>
              {activeEndpointUrl ? 'Live (Google Sheet)' : 'Fallback (empty start)'}
            </p>
            <p className="text-[10px] text-[var(--bb-text-faint)]">{activeEndpointUrl ? 'Sheet-backed' : 'No data source configured'}</p>
          </div>
        </div>

        <div className="rounded-xl border border-black/[0.04] bg-white/60 p-3">
          <p className="font-mono text-[9px] font-semibold uppercase text-[var(--bb-text-muted)]">Resource Inventory</p>
          <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 sm:grid-cols-3 lg:grid-cols-4">
            {resources.map((r) => (
              <div key={r.field} className="flex items-center gap-2 text-sm">
                <span className={`inline-block h-1.5 w-1.5 shrink-0 rounded-full ${r.count > 0 ? 'bg-[var(--bb-green)]' : 'bg-black/[0.12]'}`} />
                <span className="font-medium">{r.label}:</span>
                <span className={r.count > 0 ? '' : 'text-[var(--bb-text-muted)]'}>{r.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
