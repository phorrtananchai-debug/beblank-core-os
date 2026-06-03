import { AIContextExportPanel } from '../../components/shared/AIContextExportPanel'
import { AISuggestionImportPanel } from '../../components/shared/AISuggestionImportPanel'
import { ChangeLogList } from '../../components/shared/ChangeLogList'
import { ModuleAISummaryPanel } from '../../components/shared/ModuleAISummaryPanel'
import { PendingApprovalPanel } from '../../components/shared/PendingApprovalPanel'
import { SnapshotLog } from '../../components/shared/SnapshotLog'
import { SourceStatusBadge } from '../../components/shared/SourceStatusBadge'
import { useOs } from '../../core/os/OsContext'

const thb = (value = 0) => `${Math.round(value).toLocaleString()} THB`

export const FamilyOfficePage = () => {
  const {
    data,
    sourceStatuses,
    pendingApprovals,
    changeLogs,
    snapshots,
    createActionRequest,
    approveActionRequest,
    rejectActionRequest,
    queueSuggestionImport,
  } = useOs()

  const inflow = data.financeLedgerRows.filter((row) => row.direction === 'inflow').reduce((sum, row) => sum + row.amountTHB, 0)
  const outflow = data.financeLedgerRows.filter((row) => row.direction === 'outflow').reduce((sum, row) => sum + row.amountTHB, 0)
  const reserveTotal = data.reserveRows.reduce((sum, row) => sum + row.currentAmountTHB, 0)
  const monthlyBurn = Math.max(outflow + 85000, 1)
  const runwayMonths = Math.round((reserveTotal / monthlyBurn) * 10) / 10
  const debtTotal = data.familyFinanceRecords.filter((record) => record.bucket === 'debt').reduce((sum, record) => sum + record.amountTHB, 0)

  const queueReserveTransfer = () => {
    const reserve = data.reserveRows.find((row) => row.status !== 'healthy') ?? data.reserveRows[0]
    if (!reserve) return
    createActionRequest({
      module: 'finance',
      actionType: 'finance.approveReserveTransfer',
      description: `Approve reserve transfer for ${reserve.label}`,
      payload: { reserveId: reserve.id, amountTHB: 25000 },
    })
  }

  const queueLedgerRecord = () => {
    createActionRequest({
      module: 'finance',
      actionType: 'finance.addFamilyLedgerRecord',
      description: 'Add manual family office ledger row',
      payload: {
        label: 'Manual bill review',
        amountTHB: 12800,
        category: 'expense',
        direction: 'outflow',
        occurredAt: '2026-06-03',
        notes: 'MVP manual bill/ledger input. Review before Sheet write-back exists.',
        risk: 'medium',
      },
    })
  }

  return (
    <section className="space-y-7">
      <header className="command-hero rounded-[36px] border border-black/[0.05] bg-[#faf9f8] p-6 md:p-9">
        <div className="grid gap-6 xl:grid-cols-[1fr_0.42fr]">
          <div>
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-[#777777]">Family Office / cash discipline</p>
            <h2 className="mt-4 max-w-4xl text-5xl font-extrabold leading-[0.92] tracking-tight md:text-7xl">Private operating finance, without ERP noise.</h2>
            <p className="mt-5 max-w-2xl text-sm leading-7 text-[#666666]">Cash reserve, obligations, project collections, debt, expenses, runway, and manual ledger rows for calm back-office control.</p>
          </div>
          <div className="intelligence-card rounded-[30px] border border-black/[0.06] bg-white/92 p-5">
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[#777777]">Reserve risk note</p>
            <p className="mt-4 text-xl font-semibold leading-snug">Studio reserve is on watch.</p>
            <p className="mt-3 text-sm leading-6 text-[#666666]">Runway is healthy overall, but equipment spend should wait until project payment clears.</p>
          </div>
        </div>
        <div className="mt-6 grid gap-3 md:grid-cols-5">
          <SourceStatusBadge status={sourceStatuses.familyOffice} />
          <Metric label="Monthly inflow" value={thb(inflow)} />
          <Metric label="Known outflow" value={thb(outflow)} />
          <Metric label="Reserve" value={thb(reserveTotal)} />
          <Metric label="Runway" value={`${runwayMonths} months`} />
        </div>
      </header>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <main className="space-y-5">
          <div className="grid gap-5 lg:grid-cols-2">
            <div className="panel panel-float">
              <div className="panel-header"><h3>Reserve health</h3><button className="btn-primary" type="button" onClick={queueReserveTransfer}>Queue Reserve Transfer</button></div>
              <div className="space-y-3">
                {data.reserveRows.map((reserve) => {
                  const pct = Math.min(100, Math.round((reserve.currentAmountTHB / reserve.targetAmountTHB) * 100))
                  return (
                    <article key={reserve.id} className="rounded-[24px] border border-black/[0.05] bg-[#faf9f8] p-4">
                      <div className="flex items-start justify-between gap-4"><div><p className="font-semibold">{reserve.label}</p><p className="mt-1 text-xs text-[#777777]">{reserve.notes}</p></div><span className="pill">{reserve.status}</span></div>
                      <div className="mt-4 h-2 rounded-full bg-black/[0.06]"><div className="h-full rounded-full bg-[#111111]" style={{ width: `${pct}%` }} /></div>
                      <p className="mt-2 text-xs text-[#777777]">{thb(reserve.currentAmountTHB)} / target {thb(reserve.targetAmountTHB)}</p>
                    </article>
                  )
                })}
              </div>
            </div>

            <div className="panel panel-float">
              <div className="panel-header"><h3>Obligations</h3><span className="pill">debt {thb(debtTotal)}</span></div>
              <div className="space-y-3">
                {data.familyFinanceRecords.map((record) => <FinanceRow key={record.id} title={record.label} meta={`${record.bucket} / ${thb(record.amountTHB)}${record.dueDate ? ` / due ${record.dueDate}` : ''}`} status={record.risk ?? 'low'} />)}
              </div>
            </div>
          </div>

          <div className="panel">
            <div className="panel-header"><h3>Manual ledger</h3><button className="btn-primary" type="button" onClick={queueLedgerRecord}>Queue Ledger Row</button></div>
            <div className="grid gap-3 lg:grid-cols-2">
              {data.financeLedgerRows.map((row) => <FinanceRow key={row.id} title={row.label} meta={`${row.category} / ${row.direction} / ${thb(row.amountTHB)} / ${row.occurredAt}`} status={row.status} />)}
            </div>
          </div>

          <div className="panel">
            <div className="panel-header"><h3>Snapshot summaries</h3><span className="pill">manual posture</span></div>
            <div className="grid gap-3 md:grid-cols-2">
              {data.financeSnapshots.filter((snapshot) => snapshot.module === 'family-office').map((snapshot) => (
                <article key={snapshot.id} className="rounded-[24px] border border-black/[0.05] bg-[#faf9f8] p-4"><p className="font-semibold">{snapshot.title}</p><p className="mt-2 text-sm text-[#666666]">{snapshot.posture}</p><p className="mt-3 font-mono text-[10px] uppercase tracking-[0.12em] text-[#777777]">{thb(snapshot.valueTHB)} / {snapshot.risk}</p></article>
              ))}
            </div>
          </div>
        </main>

        <aside className="intelligence-rail space-y-5">
          <PendingApprovalPanel items={pendingApprovals} onApprove={approveActionRequest} onReject={rejectActionRequest} />
          <ModuleAISummaryPanel moduleName="Family" suggestions={data.aiSuggestions} />
        </aside>
      </section>

      <section className="grid gap-5 xl:grid-cols-2"><AIContextExportPanel contexts={data.aiContexts} /><AISuggestionImportPanel onImport={queueSuggestionImport} /></section>
      <section className="grid gap-5 xl:grid-cols-2"><ChangeLogList items={changeLogs} /><SnapshotLog items={snapshots} /></section>
    </section>
  )
}

const Metric = ({ label, value }: { label: string; value: number | string }) => (
  <div className="rounded-2xl border border-black/[0.04] bg-white/75 px-4 py-3"><p className="font-mono text-[9px] font-semibold uppercase tracking-[0.14em] text-[#777777]">{label}</p><p className="mt-2 text-lg font-bold">{value}</p></div>
)

const FinanceRow = ({ meta, status, title }: { meta: string; status: string; title: string }) => (
  <div className="rounded-2xl border border-black/[0.05] bg-[#faf9f8] p-4"><div className="flex items-start justify-between gap-4"><div><p className="text-sm font-semibold">{title}</p><p className="mt-1 text-xs text-[#777777]">{meta}</p></div><span className="font-mono text-[10px] font-semibold uppercase text-[#9a6a1f]">{status}</span></div></div>
)
