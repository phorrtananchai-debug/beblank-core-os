import { useState } from 'react'
import { CapitalAnalyticsCards } from '../../components/capital/CapitalAnalyticsCards'
import { CapitalCategoryBreakdown } from '../../components/capital/CapitalCategoryBreakdown'
import { DeleteLedgerDialog } from '../../components/capital/DeleteLedgerDialog'
import { LedgerForm } from '../../components/capital/LedgerForm'
import type { LedgerFormData } from '../../components/capital/LedgerForm'
import { LedgerTable } from '../../components/capital/LedgerTable'
import type { LedgerTableCallbacks } from '../../components/capital/LedgerTable'
import { AIContextExportPanel } from '../../components/shared/AIContextExportPanel'
import { AISuggestionImportPanel } from '../../components/shared/AISuggestionImportPanel'
import { ChangeLogList } from '../../components/shared/ChangeLogList'
import { ModuleAISummaryPanel } from '../../components/shared/ModuleAISummaryPanel'
import { PendingApprovalPanel } from '../../components/shared/PendingApprovalPanel'
import { SnapshotLog } from '../../components/shared/SnapshotLog'
import { SourceStatusBadge } from '../../components/shared/SourceStatusBadge'
import { useOs } from '../../core/os/OsContext'
import type { FinanceLedgerRow } from '../../types/models'
import { FamilyPage } from './FamilyPage'

const thb = (value = 0) => `${Math.round(value).toLocaleString()} THB`

const tabs = [
  { key: 'overview', label: 'Overview' },
  { key: 'studio-office', label: 'Studio Office' },
  { key: 'family', label: 'Family' },
] as const

type TabKey = (typeof tabs)[number]['key']

export const CapitalPage = () => {
  const [activeTab, setActiveTab] = useState<TabKey>('overview')
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
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-[#777777]">Capital / cash discipline</p>
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

      <div className="flex gap-2 border-b border-black/[0.06] pb-3">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={`rounded-2xl px-5 py-2 text-sm font-semibold transition ${
              activeTab === tab.key
                ? 'bg-black text-white shadow-[0_8px_20px_-12px_rgba(0,0,0,0.5)]'
                : 'text-[#55504a] hover:bg-black/[0.04]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <main className="space-y-5">
          {activeTab === 'overview' && <OverviewTab />}
          {activeTab === 'studio-office' && <StudioOfficeTab />}
          {activeTab === 'family' && <FamilyPage />}
        </main>
        <aside className="intelligence-rail space-y-5">
          <PendingApprovalPanel items={pendingApprovals} onApprove={approveActionRequest} onReject={rejectActionRequest} />
          <ModuleAISummaryPanel moduleName="Capital" suggestions={data.aiSuggestions} />
        </aside>
      </section>

      <section className="grid gap-5 xl:grid-cols-2">
        <AIContextExportPanel contexts={data.aiContexts} />
        <AISuggestionImportPanel onImport={queueSuggestionImport} />
      </section>
      <section className="grid gap-5 xl:grid-cols-2">
        <ChangeLogList items={changeLogs} />
        <SnapshotLog items={snapshots} />
      </section>
    </section>
  )
}

const OverviewTab = () => {
  const { data } = useOs()
  const inflow = data.financeLedgerRows.filter((r) => r.direction === 'inflow').reduce((s, r) => s + r.amountTHB, 0)
  const outflow = data.financeLedgerRows.filter((r) => r.direction === 'outflow').reduce((s, r) => s + r.amountTHB, 0)
  const maxFlow = Math.max(inflow, outflow, 1)
  const reserveTotal = data.reserveRows.reduce((s, r) => s + r.currentAmountTHB, 0)
  const monthlyBurn = Math.max(outflow + 85000, 1)
  const runwayMonths = Math.round((reserveTotal / monthlyBurn) * 10) / 10
  const debtTotal = data.familyFinanceRecords.filter((r) => r.bucket === 'debt').reduce((s, r) => s + r.amountTHB, 0)

  return (
    <div className="space-y-5">
      <div className="grid gap-5 lg:grid-cols-3">
        <CashFlowBar inflow={inflow} outflow={outflow} maxFlow={maxFlow} />
        <RunwayGauge months={runwayMonths} />
        <div className="panel panel-float">
          <div className="panel-header"><h3>Reserve Health / สถานะสำรอง</h3></div>
          <div className="space-y-3">
            {data.reserveRows.length === 0 ? (
              <p className="text-sm text-[#666666]">ไม่มีกองทุนสำรอง  เพิ่มกองทุนแรก</p>
            ) : data.reserveRows.map((reserve) => {
              const pct = Math.min(100, Math.round((reserve.currentAmountTHB / reserve.targetAmountTHB) * 100))
              return (
                <div key={reserve.id}>
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold">{reserve.label}</span>
                    <span>{pct}%</span>
                  </div>
                  <div className="mt-1 h-2 rounded-full bg-black/[0.06]">
                    <div
                      className={`h-full rounded-full ${pct >= 80 ? 'bg-[#59634a]' : pct >= 60 ? 'bg-[#d4a143]' : 'bg-[#c2410c]'}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <p className="mt-0.5 text-xs text-[#777777]">{thb(reserve.currentAmountTHB)} / {thb(reserve.targetAmountTHB)}</p>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <CapitalAnalyticsCards />

      <CapitalCategoryBreakdown />

      <div className="grid gap-5 lg:grid-cols-2">
        <div className="panel panel-float">
          <div className="panel-header"><h3>Obligations / ภาระผูกพัน</h3><span className="pill">debt {thb(debtTotal)}</span></div>
          <div className="space-y-3">
            {data.familyFinanceRecords.length === 0 ? (
              <p className="text-sm text-[#666666]">ไม่มีภาระผูกพัน</p>
            ) : data.familyFinanceRecords.map((record) => (
              <div key={record.id} className="rounded-2xl border border-black/[0.05] bg-[#faf9f8] p-3">
                <p className="text-sm font-semibold">{record.label}</p>
                <p className="mt-1 text-xs text-[#777777]">{record.bucket} / {thb(record.amountTHB)}{record.dueDate ? ` / due ${record.dueDate}` : ''}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="panel panel-float">
          <div className="panel-header"><h3>Pending Items / รายการรอดำเนินการ</h3></div>
          <div className="space-y-2 text-sm text-[#666666]">
            <p>{data.financeLedgerRows.length} รายการเดินบัญชี</p>
            <p>{data.reserveRows.length} กองทุนสำรอง</p>
            <p>{data.familyFinanceRecords.length} ภาระผูกพัน</p>
          </div>
        </div>
      </div>
    </div>
  )
}

const CashFlowBar = ({ inflow, outflow, maxFlow }: { inflow: number; outflow: number; maxFlow: number }) => (
  <div className="panel panel-float">
    <div className="panel-header"><h3>Cash Flow / กระแสเงินสด</h3></div>
    <div className="space-y-4">
      <div>
        <div className="flex items-center justify-between text-sm">
          <span className="font-semibold text-[#59634a]">Inflow / รายรับ</span>
          <span>{thb(inflow)}</span>
        </div>
        <div className="mt-1 h-3 rounded-full bg-black/[0.06]">
          <div className="h-full rounded-full bg-[#59634a]" style={{ width: `${(inflow / maxFlow) * 100}%` }} />
        </div>
      </div>
      <div>
        <div className="flex items-center justify-between text-sm">
          <span className="font-semibold text-[#c2410c]">Outflow / รายจ่าย</span>
          <span>{thb(outflow)}</span>
        </div>
        <div className="mt-1 h-3 rounded-full bg-black/[0.06]">
          <div className="h-full rounded-full bg-[#c2410c]" style={{ width: `${(outflow / maxFlow) * 100}%` }} />
        </div>
      </div>
    </div>
  </div>
)

const RunwayGauge = ({ months }: { months: number }) => {
  const pct = Math.min(100, Math.max(0, Math.round((months / 24) * 100)))
  const color = months >= 12 ? 'bg-[#59634a]' : months >= 6 ? 'bg-[#d4a143]' : 'bg-[#c2410c]'
  return (
    <div className="panel panel-float">
      <div className="panel-header"><h3>Runway / ระยะเวลาสำรอง</h3></div>
      <div className="text-center">
        <p className="text-4xl font-extrabold tracking-tight">{months}</p>
        <p className="text-sm text-[#777777]">months / เดือน</p>
      </div>
      <div className="mt-4 h-3 rounded-full bg-black/[0.06]">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

const StudioOfficeTab = () => {
  const { data, createActionRequest } = useOs()
  const [showAdd, setShowAdd] = useState(false)
  const [editingRow, setEditingRow] = useState<FinanceLedgerRow | null>(null)
  const [deletingRow, setDeletingRow] = useState<FinanceLedgerRow | null>(null)

  const studioRows = data.financeLedgerRows.filter((r) => r.category.startsWith('studio-'))

  const callbacks: LedgerTableCallbacks = {
    onAdd: () => setShowAdd(true),
    onEdit: (row) => setEditingRow(row),
    onDelete: (row) => setDeletingRow(row),
  }

  const handleAdd = (form: LedgerFormData) => {
    createActionRequest({
      module: 'finance',
      actionType: 'finance.addLedgerRow',
      description: `Add studio ledger row: ${form.label}`,
      payload: { ...form, accountId: 'acct-studio-core' },
    })
    setShowAdd(false)
  }

  const handleEdit = (form: LedgerFormData) => {
    if (!editingRow) return
    createActionRequest({
      module: 'finance',
      actionType: 'finance.editLedgerRow',
      description: `Edit studio ledger row: ${form.label}`,
      payload: { id: editingRow.id, ...form, accountId: 'acct-studio-core' },
    })
    setEditingRow(null)
  }

  const handleDelete = () => {
    if (!deletingRow) return
    createActionRequest({
      module: 'finance',
      actionType: 'finance.deleteLedgerRow',
      description: `Delete studio ledger row: ${deletingRow.label}`,
      payload: { id: deletingRow.id },
    })
    setDeletingRow(null)
  }

  return (
    <div className="space-y-5">
      <LedgerTable rows={studioRows} callbacks={callbacks} />

      {showAdd ? (
        <LedgerForm
          title="Add Studio Ledger Row / เพิ่มรายการสตูดิโอ"
          onSubmit={handleAdd}
          onCancel={() => setShowAdd(false)}
          initial={{ category: 'expense', direction: 'outflow' }}
        />
      ) : null}

      {editingRow ? (
        <LedgerForm
          title="Edit Studio Ledger Row / แก้ไขรายการสตูดิโอ"
          onSubmit={handleEdit}
          onCancel={() => setEditingRow(null)}
          initial={{
            label: editingRow.label,
            amountTHB: editingRow.amountTHB,
            direction: editingRow.direction,
            category: editingRow.category,
            occurredAt: editingRow.occurredAt,
            notes: editingRow.notes,
            risk: editingRow.risk,
            tags: editingRow.tags.join(', '),
          }}
        />
      ) : null}

      {deletingRow ? (
        <DeleteLedgerDialog row={deletingRow} onConfirm={handleDelete} onCancel={() => setDeletingRow(null)} />
      ) : null}
    </div>
  )
}

const Metric = ({ label, value }: { label: string; value: number | string }) => (
  <div className="rounded-2xl border border-black/[0.04] bg-white/75 px-4 py-3">
    <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.14em] text-[#777777]">{label}</p>
    <p className="mt-2 text-lg font-bold">{value}</p>
  </div>
)
