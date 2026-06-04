import { AIContextExportPanel } from '../../components/shared/AIContextExportPanel'
import { AISuggestionImportPanel } from '../../components/shared/AISuggestionImportPanel'
import { ChangeLogList } from '../../components/shared/ChangeLogList'
import { ModuleAISummaryPanel } from '../../components/shared/ModuleAISummaryPanel'
import { PendingApprovalPanel } from '../../components/shared/PendingApprovalPanel'
import { SnapshotLog } from '../../components/shared/SnapshotLog'
import { SourceStatusBadge } from '../../components/shared/SourceStatusBadge'
import { useOs } from '../../core/os/OsContext'
import { FamilyPage } from './FamilyPage'

const thb = (value = 0) => `${Math.round(value).toLocaleString()} THB`

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

  const inflow = data.financeLedgerRows.filter((row) => row.direction === 'inflow').reduce((sum, row) => sum + row.amountTHB, 0)
  const outflow = data.financeLedgerRows.filter((row) => row.direction === 'outflow').reduce((sum, row) => sum + row.amountTHB, 0)
  const reserveTotal = data.reserveRows.reduce((sum, row) => sum + row.currentAmountTHB, 0)
  const monthlyBurn = Math.max(outflow + 85000, 1)
  const runwayMonths = Math.round((reserveTotal / monthlyBurn) * 10) / 10

  return (
    <section className="space-y-7">
      <header className="command-hero rounded-[36px] border border-black/[0.05] bg-[#faf9f8] p-6 md:p-9">
        <div className="grid gap-6 xl:grid-cols-[1fr_0.42fr]">
          <div>
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-[#777777]">ครอบครัว / วินัยการเงิน</p>
            <h2 className="mt-4 max-w-4xl text-5xl font-extrabold leading-[0.92] tracking-tight md:text-7xl">การเงินส่วนตัวของสตูดิโอ ไม่มี ERP</h2>
            <p className="mt-5 max-w-2xl text-sm leading-7 text-[#666666]">เงินสำรอง ภาระผูกพัน รายรับจากโปรเจค หนี้สิน ค่าใช้จ่าย สภาพคล่อง และรายการเดินบัญชี สำหรับควบคุมการเงินแบบไม่ซับซ้อน</p>
          </div>
          <div className="intelligence-card rounded-[30px] border border-black/[0.06] bg-white/92 p-5">
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[#777777]">ความเสี่ยงเงินสำรอง</p>
            <p className="mt-4 text-xl font-semibold leading-snug">เงินสำรองสตูดิโออยู่ในระดับเฝ้าระวัง</p>
            <p className="mt-3 text-sm leading-6 text-[#666666]">สภาพคล่องโดยรวมยังดี แต่อุปกรณ์ควรชะลอจนกว่าเงินโปรเจคจะชำระ</p>
          </div>
        </div>
        <div className="mt-6 grid gap-3 md:grid-cols-5">
          <SourceStatusBadge status={sourceStatuses.familyOffice} />
          <Metric label="รายรับ/เดือน" value={thb(inflow)} />
          <Metric label="รายจ่าย/เดือน" value={thb(outflow)} />
          <Metric label="เงินสำรอง" value={thb(reserveTotal)} />
          <Metric label="สภาพคล่อง" value={`${runwayMonths} เดือน`} />
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

      <section className="grid gap-5 xl:grid-cols-2"><AIContextExportPanel contexts={data.aiContexts} /><AISuggestionImportPanel onImport={queueSuggestionImport} /></section>
      <section className="grid gap-5 xl:grid-cols-2"><ChangeLogList items={changeLogs} /><SnapshotLog items={snapshots} /></section>
    </section>
  )
}

const Metric = ({ label, value }: { label: string; value: number | string }) => (
  <div className="rounded-2xl border border-black/[0.04] bg-white/75 px-4 py-3"><p className="font-mono text-[9px] font-semibold uppercase tracking-[0.14em] text-[#777777]">{label}</p><p className="mt-2 text-lg font-bold">{value}</p></div>
)
