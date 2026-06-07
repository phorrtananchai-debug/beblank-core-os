import { useState } from 'react'
import { WorkspaceDrawer } from '../../components/shared/WorkspaceDrawer'
import { AIContextExportPanel } from '../../components/shared/AIContextExportPanel'
import { AISuggestionImportPanel } from '../../components/shared/AISuggestionImportPanel'
import { ChangeLogList } from '../../components/shared/ChangeLogList'
import { ModuleAISummaryPanel } from '../../components/shared/ModuleAISummaryPanel'
import { PendingApprovalPanel } from '../../components/shared/PendingApprovalPanel'
import { SnapshotLog } from '../../components/shared/SnapshotLog'
import { SourceStatusBadge } from '../../components/shared/SourceStatusBadge'
import { useOs } from '../../core/os/useOs'
import { FamilyPage } from './FamilyPage'

const thb = (value = 0) => `${Math.round(value).toLocaleString('en-US')} THB`

export const FamilyOfficePage = () => {
  const {
    data,
    sourceStatuses,
    pendingApprovals,
    changeLogs,
    snapshots,
    approveActionRequest,
    rejectActionRequest,
    queueSuggestionImport,
  } = useOs()
  const [showAiDrawer, setShowAiDrawer] = useState(false)
  const [showHistoryDrawer, setShowHistoryDrawer] = useState(false)

  const inflow = data.financeLedgerRows.filter((row) => row.direction === 'inflow').reduce((sum, row) => sum + row.amountTHB, 0)
  const outflow = data.financeLedgerRows.filter((row) => row.direction === 'outflow').reduce((sum, row) => sum + row.amountTHB, 0)
  const reserveTotal = data.reserveRows.reduce((sum, row) => sum + row.currentAmountTHB, 0)
  const monthlyBurn = Math.max(outflow + 85000, 1)
  const runwayMonths = Math.round((reserveTotal / monthlyBurn) * 10) / 10

  return (
    <section className="space-y-5">
      <header className="command-hero rounded-[36px] border border-black/[0.05] bg-[#faf9f8] p-6 md:p-9">
        <div className="grid gap-6 xl:grid-cols-[1fr_0.42fr]">
          <div>
            <p className="text-[10px] font-semibold text-[var(--bb-text-muted)]">???????? / ????????????</p>
            <h2 className="mt-4 max-w-4xl text-5xl font-extrabold leading-[0.92] md:text-7xl">???????????????????????? ????? ERP</h2>
            <p className="mt-5 max-w-2xl text-sm leading-7 text-[var(--bb-text-soft)]">????????? ?????????? ??????????????? ??????? ?????????? ????????? ?????????????????? ????????????????????????????????</p>
          </div>
          <div className="intelligence-card rounded-[30px] border border-black/[0.06] bg-white/92 p-5">
            <p className="text-[10px] font-semibold text-[var(--bb-text-muted)]">???????????????????</p>
            <p className="mt-4 text-xl font-semibold leading-snug">????????????????????????????????????</p>
            <p className="mt-3 text-sm leading-6 text-[var(--bb-text-soft)]">???????????????????? ???????????????????????????????????????</p>
          </div>
        </div>
        <div className="mt-6 grid gap-3 md:grid-cols-5">
          <SourceStatusBadge status={sourceStatuses.familyOffice} />
          <Metric label="??????/?????" value={thb(inflow)} />
          <Metric label="???????/?????" value={thb(outflow)} />
          <Metric label="?????????" value={thb(reserveTotal)} />
          <Metric label="?????????" value={`${runwayMonths} ?????`} />
        </div>
      </header>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <main className="space-y-5">
          <FamilyPage />
        </main>
        <aside className="intelligence-rail space-y-5">
          <PendingApprovalPanel items={pendingApprovals} onApprove={approveActionRequest} onReject={rejectActionRequest} />
          <ModuleAISummaryPanel moduleName="Family" suggestions={data.aiSuggestions} />
        </aside>
      </section>

      <div className="grid gap-4 xl:grid-cols-2">
        <button className="rounded-2xl border border-black/[0.05] bg-white/60 p-4 text-left transition hover:bg-black/[0.03]" type="button" onClick={() => setShowAiDrawer(true)}>
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--bb-text-muted)]">AI Workspace</p>
          <p className="mt-1 text-sm font-semibold">{data.aiContexts.length} contexts</p>
          <p className="mt-0.5 text-xs text-[var(--bb-text-faint)]">Open AI Workspace →</p>
        </button>
        <button className="rounded-2xl border border-black/[0.05] bg-white/60 p-4 text-left transition hover:bg-black/[0.03]" type="button" onClick={() => setShowHistoryDrawer(true)}>
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--bb-text-muted)]">History</p>
          <p className="mt-1 text-sm font-semibold">{changeLogs.length} changes</p>
          <p className="mt-0.5 text-xs text-[var(--bb-text-faint)]">Open History →</p>
        </button>
      </div>
      <WorkspaceDrawer open={showAiDrawer} onClose={() => setShowAiDrawer(false)} title="AI Workspace">
        <AIContextExportPanel contexts={data.aiContexts} />
        <AISuggestionImportPanel onImport={queueSuggestionImport} />
      </WorkspaceDrawer>
      <WorkspaceDrawer open={showHistoryDrawer} onClose={() => setShowHistoryDrawer(false)} title="System History">
        <ChangeLogList items={changeLogs} />
        <SnapshotLog items={snapshots} />
      </WorkspaceDrawer>
    </section>
  )
}

const Metric = ({ label, value }: { label: string; value: number | string }) => (
  <div className="rounded-2xl border border-black/[0.04] bg-white/75 px-4 py-3"><p className="font-mono text-[9px] font-semibold uppercase tracking-[0.14em] text-[var(--bb-text-muted)]">{label}</p><p className="mt-2 text-lg font-bold">{value}</p></div>
)
