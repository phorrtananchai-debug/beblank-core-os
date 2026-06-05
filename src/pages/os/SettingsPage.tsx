import { useState } from 'react'
import { ChangeLogList } from '../../components/shared/ChangeLogList'
import { EmptyState } from '../../components/shared/EmptyState'
import { MockSheetSyncStatus } from '../../components/shared/MockSheetSyncStatus'
import { PendingApprovalPanel } from '../../components/shared/PendingApprovalPanel'
import { SnapshotLog } from '../../components/shared/SnapshotLog'
import { useOs } from '../../core/os/OsContext'
import { useProfile } from '../../hooks/useProfile'
import type { SyncQueueItem } from '../../types/models'

const ConfigRow = ({ label, value }: { label: string; value: string }) => (
  <div className="os-list-row">
    <div className="flex items-center justify-between gap-3">
      <p className="text-sm font-medium text-[var(--bb-text-muted)]">{label}</p>
      <p className="text-sm font-semibold">{value}</p>
    </div>
  </div>
)

const EditRow = ({ label, value, onChange, maxLength }: { label: string; value: string; onChange: (v: string) => void; maxLength?: number }) => (
  <div className="os-list-row">
    <div className="flex items-center justify-between gap-3">
      <label className="text-sm font-medium text-[var(--bb-text-muted)] whitespace-nowrap">{label}</label>
      <input
        className="w-48 rounded-xl border border-black/[0.08] bg-white/80 px-3 py-1.5 text-sm font-semibold text-right outline-none transition focus:border-[var(--bb-accent-border)] focus:bg-white"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        maxLength={maxLength}
      />
    </div>
  </div>
)

const MiniRow = ({ meta, status, title }: { meta: string; status: string; title: string }) => (
  <div className="rounded-2xl border border-black/[0.05] bg-white/75 p-4">
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="text-sm font-semibold">{title}</p>
        <p className="mt-1 text-xs text-[var(--bb-text-muted)]">{meta}</p>
      </div>
      <span className="font-mono text-[10px] font-semibold uppercase text-[var(--bb-amber)]">{status}</span>
    </div>
  </div>
)

export const SettingsPage = () => {
  const { data, sourceStatuses, providerStatuses, pendingApprovals, changeLogs, snapshots, createActionRequest, approveActionRequest, rejectActionRequest, refreshKarunBridge } = useOs()
  const { profile, saveProfile, resetProfile } = useProfile()
  const [edit, setEdit] = useState({ ...profile })
  const [dirty, setDirty] = useState(false)
  const connectorIsEmpty = data.connectors.length === 0 && data.sheetSources.length === 0 && data.syncQueue.length === 0
  const futureConnectorLabels = data.connectors.filter((connector) => connector.status === 'future').map((connector) => connector.name)

  const updateField = (field: string, value: string) => {
    setEdit((prev) => ({ ...prev, [field]: value }))
    setDirty(true)
  }

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
        <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--bb-text-muted)]">การตั้งค่าระบบ</p>
        <h2 className="mt-2 text-2xl font-extrabold">Settings</h2>
        <p className="mt-1 text-sm leading-6 text-[var(--bb-text-soft)]">Profile, workspace preferences, appearance, and system configuration</p>
      </header>

      {/* PROFILE */}
      <section className="os-card-primary">
        <div className="panel-header">
          <div>
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--bb-text-muted)]">PROFILE</p>
            <h3>Personal Workspace</h3>
          </div>
          <div className="flex gap-2">
            <button className="btn-primary" type="button" onClick={() => { saveProfile(edit); setDirty(false) }} disabled={!dirty}>Save Profile</button>
            <button className="btn-secondary" type="button" onClick={() => { resetProfile(); setEdit({ ...profile }); setDirty(false) }}>Reset to Default</button>
          </div>
        </div>
        <div className="flex items-start gap-5">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-[var(--bb-accent)] text-2xl font-bold text-white">{edit.avatarInitial || profile.avatarInitial}</div>
          <div className="min-w-0 flex-1 space-y-3">
            <EditRow label="ชื่อ" value={edit.displayName} onChange={(v) => updateField('displayName', v)} />
            <EditRow label="ตำแหน่ง" value={edit.role} onChange={(v) => updateField('role', v)} />
            <EditRow label="พื้นที่ทำงาน" value={edit.workspace} onChange={(v) => updateField('workspace', v)} />
            <EditRow label="อักษรย่อ" value={edit.avatarInitial} onChange={(v) => updateField('avatarInitial', v.slice(0, 1))} maxLength={1} />
          </div>
        </div>
      </section>

      {/* WORKSPACE */}
      <section className="os-card-primary">
        <div className="panel-header">
          <div>
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--bb-text-muted)]">WORKSPACE</p>
            <h3>Workspace Preferences</h3>
          </div>
        </div>
        <div className="space-y-3">
          <ConfigRow label="Default Landing" value="Command Center" />
          <ConfigRow label="Studio View" value="Projects" />
          <ConfigRow label="Finance View" value="Capital" />
          <ConfigRow label="Sidebar Behavior" value="Expanded" />
        </div>
      </section>

      {/* APPEARANCE */}
      <section className="os-card-primary">
        <div className="panel-header">
          <div>
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--bb-text-muted)]">APPEARANCE</p>
            <h3>Interface Preferences</h3>
          </div>
        </div>
        <div className="space-y-3">
          <ConfigRow label="Surface Palette" value="Warm Neutral" />
          <ConfigRow label="Accent Color" value="Orange" />
          <ConfigRow label="Card Style" value="Rounded + Shadow" />
          <ConfigRow label="Font Display" value="Prompt (Thai) / Inter (EN)" />
        </div>
      </section>

      {/* SYSTEM */}
      <section className="os-card-primary">
        <div className="panel-header">
          <div>
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--bb-text-muted)]">SYSTEM</p>
            <h3>Connector & Bridge Configuration</h3>
          </div>
          <span className="pill">{data.connectors.length} connectors</span>
        </div>

        <div className="space-y-5">
          <div className="panel panel-float">
            <div className="panel-header">
              <div>
                <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--bb-text-muted)]">Connector definitions</p>
                <h3>Registry</h3>
              </div>
              <span className="pill">{data.connectors.length} connectors</span>
            </div>
            <div className="grid gap-3 lg:grid-cols-2">
              {data.connectors.map((connector) => (
                <article key={connector.id} className="rounded-[24px] border border-black/[0.05] bg-[#faf9f8] p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-semibold">{connector.name}</p>
                      <p className="mt-1 text-xs text-[var(--bb-text-muted)]">{connector.category} / {connector.syncMode}</p>
                    </div>
                    <span className="pill">{connector.health}</span>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-[var(--bb-text-soft)]">{connector.environmentNotes}</p>
                  <div className="mt-3 flex flex-wrap gap-1.5">{connector.capabilities.map((item) => <span key={item} className="rounded-full bg-white/80 px-2 py-1 font-mono text-[9px] uppercase tracking-[0.1em] text-[#6e675d]">{item}</span>)}</div>
                  <p className="mt-3 text-xs text-[var(--bb-text-muted)]">Credential: {connector.credentialStatus} / stale after {connector.staleAfterHours}h</p>
                </article>
              ))}
            </div>
          </div>

          <div className="panel panel-float">
            <div className="panel-header">
              <h3>Sheet source ownership</h3>
              <span className="pill">source-of-truth map</span>
            </div>
            <div className="space-y-4">
              {data.sheetSources.map((source) => (
                <article key={source.id} className="rounded-[26px] border border-black/[0.05] bg-[#faf9f8] p-4">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="font-semibold">{source.name}</p>
                      <p className="mt-1 text-xs text-[var(--bb-text-muted)]">{source.ownerModule} / {source.authority} / {source.syncState}</p>
                    </div>
                    <span className="pill">{source.worksheets.length} worksheets</span>
                  </div>
                  <p className="mt-3 text-sm text-[var(--bb-text-soft)]">{source.notes}</p>
                  <div className="mt-4 grid gap-2 md:grid-cols-2">{source.worksheets.map((sheet) => <MiniRow key={sheet.id} title={sheet.name} meta={`${sheet.ownerModule} / ${sheet.rowOwnership} / key ${sheet.primaryKey}`} status={sheet.isStale ? 'stale' : 'fresh'} />)}</div>
                </article>
              ))}
            </div>
          </div>

          <div className="panel panel-float">
            <div className="panel-header">
              <h3>Sync queue</h3>
              <span className="pill">manual review</span>
            </div>
            <div className="space-y-3">
              {data.syncQueue.map((item) => (
                <article key={item.id} className="rounded-[24px] border border-black/[0.05] bg-[#faf9f8] p-4">
                  <div className="grid gap-4 lg:grid-cols-[1fr_auto]">
                    <div>
                      <p className="font-semibold">{item.operation} / {item.module}</p>
                      <p className="mt-1 text-xs text-[var(--bb-text-muted)]">{item.connectorId} / {item.sourceId} / {item.status} / retries {item.retryCount}</p>
                      <pre className="mt-3 overflow-x-auto rounded-2xl bg-white/85 p-3 text-xs text-[var(--bb-text-soft)]">{item.payloadPreview}</pre>
                      <p className="mt-2 text-xs text-[var(--bb-text-muted)]">{item.notes}</p>
                    </div>
                    <button className="btn-primary self-start" type="button" onClick={() => queueBridgeAction(item)}>{item.status === 'failed' ? 'Queue Retry' : 'Queue Approval'}</button>
                  </div>
                </article>
              ))}
            </div>
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            <div className="panel panel-float">
              <div className="panel-header">
                <h3>Bridge contracts</h3>
                <span className="pill">future adapters</span>
              </div>
              <div className="space-y-3">{data.bridgeContracts.map((contract) => <MiniRow key={contract.id} title={contract.name} meta={`${contract.connectorId} / approval ${contract.approvalRequired ? 'required' : 'optional'}`} status="contract" />)}</div>
            </div>
            <div className="panel panel-float">
              <div className="panel-header">
                <h3>Finnhub symbols</h3>
                <span className="pill">delayed/manual</span>
              </div>
              <div className="space-y-3">{data.marketDataSymbols.map((symbol) => <MiniRow key={symbol.id} title={symbol.symbol} meta={`${symbol.delayedPriceTHB?.toLocaleString('en-US') ?? 'N/A'} THB / updated ${symbol.lastUpdated}`} status={symbol.sourceStatus.isStale ? 'stale' : 'fresh'} />)}</div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <main className="space-y-5">
          <div className="panel panel-float">
            <div className="panel-header">
              <div>
                <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--bb-text-muted)]">Read-only bridge</p>
                <h3>Karun Phuket Apps Script read bridge</h3>
              </div>
              <button className="btn-primary" type="button" onClick={refreshKarunBridge}>Refresh Karun Bridge</button>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <MiniRow title={providerStatuses.karunBridge?.source ?? 'Karun bridge'} meta={`${providerStatuses.karunBridge?.mode ?? 'fallback'} / fallback ${providerStatuses.karunBridge?.fallbackUsed ? 'yes' : 'no'}`} status={providerStatuses.karunBridge?.stale ? 'stale' : 'fresh'} />
              <MiniRow title="Endpoint config" meta={providerStatuses.karunBridge?.error ?? 'Configured endpoint can be refreshed manually.'} status={providerStatuses.karunBridge?.error ? 'unconfigured' : 'configured'} />
            </div>
            <p className="mt-4 text-sm leading-6 text-[var(--bb-text-soft)]">Read-only manual refresh. No polling, no write-back, no credentials committed. Missing env falls back safely to mock provider data.</p>
          </div>

          {connectorIsEmpty ? (
            <EmptyState title="Connector provider has no rows" body="Connector settings can render safely while waiting for live registry rows. Mock fallback can be restored without page-owned data imports." />
          ) : null}
        </main>

        <aside className="intelligence-rail space-y-5">
          <PendingApprovalPanel items={pendingApprovals} onApprove={approveActionRequest} onReject={rejectActionRequest} />
          <div className="rounded-[30px] border border-black/[0.05] bg-white/85 p-5">
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--bb-text-muted)]">No credentials</p>
            <p className="mt-3 text-sm leading-6 text-[var(--bb-text-soft)]">This PR commits no secrets and no deployment URLs. All connector records are architecture scaffolds and mock/fallback states.</p>
          </div>
        </aside>
      </section>

      <section className="panel panel-float">
        <h3 className="text-lg font-semibold">Provider Source Modes</h3>
        <div className="mt-3 grid gap-3 md:grid-cols-4">{Object.entries(providerStatuses).map(([key, status]) => <MiniRow key={key} title={status.source} meta={`${status.mode} / updated ${status.lastUpdated} / fallback ${status.fallbackUsed ? 'yes' : 'no'}`} status={status.stale ? 'stale' : 'fresh'} />)}</div>
      </section>
      <section className="panel panel-float">
        <h3 className="text-lg font-semibold">Future Connector Placeholders</h3>
        <div className="mt-3 flex flex-wrap gap-2">{futureConnectorLabels.map((item) => <span key={item} className="rounded-full border border-[#ddcfbb] bg-[#fff8ed] px-3 py-1 text-xs font-medium">{item}</span>)}</div>
      </section>
      <MockSheetSyncStatus statuses={Object.values(sourceStatuses)} />
      <section className="grid gap-5 xl:grid-cols-2"><ChangeLogList items={changeLogs} /><SnapshotLog items={snapshots} /></section>
    </section>
  )
}
