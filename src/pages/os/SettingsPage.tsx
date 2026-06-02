import { ChangeLogList } from '../../components/shared/ChangeLogList'
import { EmptyState } from '../../components/shared/EmptyState'
import { MockSheetSyncStatus } from '../../components/shared/MockSheetSyncStatus'
import { PendingApprovalPanel } from '../../components/shared/PendingApprovalPanel'
import { SnapshotLog } from '../../components/shared/SnapshotLog'
import { SourceStatusBadge } from '../../components/shared/SourceStatusBadge'
import { useOs } from '../../core/os/OsContext'
import type { SyncQueueItem } from '../../types/models'

export const SettingsPage = () => {
  const { data, sourceStatuses, providerStatuses, pendingApprovals, changeLogs, snapshots, createActionRequest, approveActionRequest, rejectActionRequest, refreshKarunBridge } = useOs()
  const connectorIsEmpty = data.connectors.length === 0 && data.sheetSources.length === 0 && data.syncQueue.length === 0
  const futureConnectorLabels = data.connectors.filter((connector) => connector.status === 'future').map((connector) => connector.name)

  const queueBridgeAction = (item: SyncQueueItem) => {
    const actionType =
      item.id === 'sync-001'
        ? 'bridge.approveTimelineSync'
        : item.id === 'sync-002'
          ? 'bridge.approveFinanceRefresh'
          : item.id === 'sync-003'
            ? 'bridge.approveSheetExport'
            : 'bridge.retryStaleSourceSync'

    createActionRequest({
      module: 'settings',
      actionType,
      description: `${item.operation}: ${item.module} via ${item.connectorId}`,
      payload: { syncId: item.id },
    })
  }

  return (
    <section className="space-y-7">
      <header className="command-hero rounded-[36px] border border-black/[0.05] bg-[#faf9f8] p-6 md:p-9">
        <div className="grid gap-6 xl:grid-cols-[1fr_0.42fr]">
          <div>
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-[#777777]">Connector registry / Sheet bridge foundation</p>
            <h2 className="mt-4 max-w-4xl text-5xl font-extrabold leading-[0.92] tracking-tight md:text-7xl">Bridge-ready, not auto-syncing.</h2>
            <p className="mt-5 max-w-2xl text-sm leading-7 text-[#666666]">Apps Script bridge scaffolding, Google Sheet source ownership, Finnhub delayed market data foundation, and reviewable sync queue architecture.</p>
          </div>
          <div className="rounded-[30px] border border-black/[0.06] bg-[#111111] p-5 text-white">
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-white/50">Bridge rule</p>
            <p className="mt-4 text-xl font-semibold leading-snug">No silent external writes.</p>
            <p className="mt-3 text-sm leading-6 text-white/70">Future connector writes must pass ActionRequest, approval, bridge adapter, ChangeLog, Snapshot, and refresh.</p>
          </div>
        </div>
        <div className="mt-6 grid gap-3 md:grid-cols-3"><SourceStatusBadge status={sourceStatuses.settings} /><SourceStatusBadge status={sourceStatuses.appsScriptBridge} /><SourceStatusBadge status={sourceStatuses.finnhub} /></div>
      </header>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <main className="space-y-5">
          <div className="panel panel-float">
            <div className="panel-header"><div><p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[#777777]">Connector definitions</p><h3>Registry</h3></div><span className="pill">{data.connectors.length} connectors</span></div>
            <div className="grid gap-3 lg:grid-cols-2">
              {data.connectors.map((connector) => (
                <article key={connector.id} className="rounded-[24px] border border-black/[0.05] bg-[#faf9f8] p-4">
                  <div className="flex items-start justify-between gap-4"><div><p className="font-semibold">{connector.name}</p><p className="mt-1 text-xs text-[#777777]">{connector.category} / {connector.syncMode}</p></div><span className="pill">{connector.health}</span></div>
                  <p className="mt-3 text-sm leading-6 text-[#666666]">{connector.environmentNotes}</p>
                  <div className="mt-3 flex flex-wrap gap-1.5">{connector.capabilities.map((item) => <span key={item} className="rounded-full bg-white/80 px-2 py-1 font-mono text-[9px] uppercase tracking-[0.1em] text-[#6e675d]">{item}</span>)}</div>
                  <p className="mt-3 text-xs text-[#777777]">Credential: {connector.credentialStatus} / stale after {connector.staleAfterHours}h</p>
                </article>
              ))}
            </div>
          </div>

          <div className="panel">
            <div className="panel-header"><h3>Sheet source ownership</h3><span className="pill">source-of-truth map</span></div>
            <div className="space-y-4">
              {data.sheetSources.map((source) => (
                <article key={source.id} className="rounded-[26px] border border-black/[0.05] bg-[#faf9f8] p-4">
                  <div className="flex flex-wrap items-start justify-between gap-4"><div><p className="font-semibold">{source.name}</p><p className="mt-1 text-xs text-[#777777]">{source.ownerModule} / {source.authority} / {source.syncState}</p></div><span className="pill">{source.worksheets.length} worksheets</span></div>
                  <p className="mt-3 text-sm text-[#666666]">{source.notes}</p>
                  <div className="mt-4 grid gap-2 md:grid-cols-2">{source.worksheets.map((sheet) => <MiniRow key={sheet.id} title={sheet.name} meta={`${sheet.ownerModule} / ${sheet.rowOwnership} / key ${sheet.primaryKey}`} status={sheet.isStale ? 'stale' : 'fresh'} />)}</div>
                </article>
              ))}
            </div>
          </div>

          <div className="panel">
            <div className="panel-header"><h3>Sync queue</h3><span className="pill">manual review</span></div>
            <div className="space-y-3">
              {data.syncQueue.map((item) => (
                <article key={item.id} className="rounded-[24px] border border-black/[0.05] bg-[#faf9f8] p-4">
                  <div className="grid gap-4 lg:grid-cols-[1fr_auto]">
                    <div><p className="font-semibold">{item.operation} / {item.module}</p><p className="mt-1 text-xs text-[#777777]">{item.connectorId} / {item.sourceId} / {item.status} / retries {item.retryCount}</p><pre className="mt-3 overflow-x-auto rounded-2xl bg-white/85 p-3 text-xs text-[#4a443c]">{item.payloadPreview}</pre><p className="mt-2 text-xs text-[#777777]">{item.notes}</p></div>
                    <button className="btn-primary self-start" type="button" onClick={() => queueBridgeAction(item)}>{item.status === 'failed' ? 'Queue Retry' : 'Queue Approval'}</button>
                  </div>
                </article>
              ))}
            </div>
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            <div className="panel"><div className="panel-header"><h3>Bridge contracts</h3><span className="pill">future adapters</span></div><div className="space-y-3">{data.bridgeContracts.map((contract) => <MiniRow key={contract.id} title={contract.name} meta={`${contract.connectorId} / approval ${contract.approvalRequired ? 'required' : 'optional'}`} status="contract" />)}</div></div>
            <div className="panel"><div className="panel-header"><h3>Finnhub symbols</h3><span className="pill">delayed/manual</span></div><div className="space-y-3">{data.marketDataSymbols.map((symbol) => <MiniRow key={symbol.id} title={symbol.symbol} meta={`${symbol.delayedPriceTHB?.toLocaleString() ?? 'N/A'} THB / updated ${symbol.lastUpdated}`} status={symbol.sourceStatus.isStale ? 'stale' : 'fresh'} />)}</div></div>
          </div>
        </main>

        <aside className="intelligence-rail space-y-5"><PendingApprovalPanel items={pendingApprovals} onApprove={approveActionRequest} onReject={rejectActionRequest} /><div className="rounded-[30px] border border-black/[0.05] bg-white/85 p-5"><p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[#777777]">No credentials</p><p className="mt-3 text-sm leading-6 text-[#666666]">This PR commits no secrets and no deployment URLs. All connector records are architecture scaffolds and mock/fallback states.</p></div></aside>
      </section>

      <section className="panel panel-float">
        <div className="panel-header">
          <div>
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[#777777]">Read-only bridge</p>
            <h3>Karun Phuket Apps Script read bridge</h3>
          </div>
          <button className="btn-primary" type="button" onClick={refreshKarunBridge}>Refresh Karun Bridge</button>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <MiniRow title={providerStatuses.karunBridge?.source ?? 'Karun bridge'} meta={`${providerStatuses.karunBridge?.mode ?? 'fallback'} / fallback ${providerStatuses.karunBridge?.fallbackUsed ? 'yes' : 'no'}`} status={providerStatuses.karunBridge?.stale ? 'stale' : 'fresh'} />
          <MiniRow title="Endpoint config" meta={providerStatuses.karunBridge?.error ?? 'Configured endpoint can be refreshed manually.'} status={providerStatuses.karunBridge?.error ? 'unconfigured' : 'configured'} />
        </div>
        <p className="mt-4 text-sm leading-6 text-[#666666]">Read-only manual refresh. No polling, no write-back, no credentials committed. Missing env falls back safely to mock provider data.</p>
      </section>

      {connectorIsEmpty ? (
        <EmptyState title="Connector provider has no rows" body="Connector settings can render safely while waiting for live registry rows. Mock fallback can be restored without page-owned data imports." />
      ) : null}

      <section className="panel"><h3 className="text-lg font-semibold">Provider Source Modes</h3><div className="mt-3 grid gap-3 md:grid-cols-4">{Object.entries(providerStatuses).map(([key, status]) => <MiniRow key={key} title={status.source} meta={`${status.mode} / updated ${status.lastUpdated} / fallback ${status.fallbackUsed ? 'yes' : 'no'}`} status={status.stale ? 'stale' : 'fresh'} />)}</div></section>
      <section className="panel"><h3 className="text-lg font-semibold">Future Connector Placeholders</h3><div className="mt-3 flex flex-wrap gap-2">{futureConnectorLabels.map((item) => <span key={item} className="rounded-full border border-[#ddcfbb] bg-[#fff8ed] px-3 py-1 text-xs font-medium">{item}</span>)}</div></section>
      <MockSheetSyncStatus statuses={Object.values(sourceStatuses)} />
      <section className="grid gap-5 xl:grid-cols-2"><ChangeLogList items={changeLogs} /><SnapshotLog items={snapshots} /></section>
    </section>
  )
}

const MiniRow = ({ meta, status, title }: { meta: string; status: string; title: string }) => (
  <div className="rounded-2xl border border-black/[0.05] bg-white/75 p-4"><div className="flex items-start justify-between gap-4"><div><p className="text-sm font-semibold">{title}</p><p className="mt-1 text-xs text-[#777777]">{meta}</p></div><span className="font-mono text-[10px] font-semibold uppercase text-[#9a6a1f]">{status}</span></div></div>
)
