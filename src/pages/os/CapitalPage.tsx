import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { WorkspaceDrawer } from '../../components/shared/WorkspaceDrawer'
import { CapitalAnalyticsCards } from '../../components/capital/CapitalAnalyticsCards'
import { CapitalCategoryBreakdown } from '../../components/capital/CapitalCategoryBreakdown'
import { CapitalRhythm } from '../../components/capital/CapitalRhythm'
import { CapitalCriticalPath } from '../../components/capital/CapitalCriticalPath'
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
import { useOs } from '../../core/os/useOs'
import type { FinanceLedgerRow } from '../../types/models'
import { FamilyPage } from './FamilyPage'

const thb = (value = 0) => `${Math.round(value).toLocaleString('en-US')} THB`

const tabs = [
  { key: 'overview', label: 'ภาพรวม' },
  { key: 'studio-office', label: 'สตูดิโอ' },
  { key: 'family', label: 'ครอบครัว' },
] as const

type TabKey = (typeof tabs)[number]['key']

const EmptyFinanceState = () => {
  const navigate = useNavigate()
  return (
    <div className="rounded-[28px] border border-dashed border-black/[0.12] bg-[#faf9f8] p-6 text-center">
      <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[#777777]">Empty finance state</p>
      <h3 className="mt-3 text-2xl font-bold tracking-tight">ยังไม่มีข้อมูลทางการเงิน</h3>
      <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-[#666666]">
        เพิ่มรายการเดินบัญชีแรกของคุณ หรือเชื่อมต่อข้อมูลจาก Investments
      </p>
      <div className="mt-5 flex items-center justify-center gap-3">
        <button className="btn-primary" type="button" onClick={() => navigate('/os/finance/investments')}>ไปที่ Investments</button>
      </div>
    </div>
  )
}

export const CapitalPage = () => {
  const [activeTab, setActiveTab] = useState<TabKey>('overview')
  const {
    data,
    pendingApprovals,
    changeLogs,
    snapshots,
    approveActionRequest,
    rejectActionRequest,
    queueSuggestionImport,
  } = useOs()

  const inflow = data.financeLedgerRows.filter((row) => row.direction === 'inflow').reduce((sum, row) => sum + row.amountTHB, 0)
  const outflow = data.financeLedgerRows.filter((row) => row.direction === 'outflow').reduce((sum, row) => sum + row.amountTHB, 0)
  const maxFlow = Math.max(inflow, outflow, 1)
  const reserveTotal = data.reserveRows.reduce((sum, row) => sum + row.currentAmountTHB, 0)
  const monthlyBurn = Math.max(outflow + 85000, 1)
  const runwayMonths = Math.round((reserveTotal / monthlyBurn) * 10) / 10
  const hasFinanceData = data.financeLedgerRows.length > 0 || data.reserveRows.length > 0 || data.familyFinanceRecords.length > 0
  const navigate = useNavigate()
  const [showAiDrawer, setShowAiDrawer] = useState(false)
  const [showHistoryDrawer, setShowHistoryDrawer] = useState(false)

  return (
    <section className="space-y-5">
      <header className="command-hero rounded-[36px] border border-black/[0.05] bg-[#faf9f8] p-6 md:p-9">
        <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--bb-text-muted)]">Capital / financial discipline</p>
        <h2 className="mt-2 text-2xl font-extrabold">เงินทุน / วินัยการเงิน</h2>

        {hasFinanceData ? (
        <div className="mt-6 grid gap-4 md:grid-cols-4">
          <div className="os-hero-metric os-hero-metric-green">
            <div className="os-icon-badge os-icon-badge-green">↓</div>
            <p className="os-level-1-value">{Math.round(inflow).toLocaleString('en-US')}</p>
            <p className="os-level-1-unit">THB</p>
            <p className="text-xs text-[var(--bb-text-muted)]">รายรับ / เดือน</p>
            <div className="os-progress-rail">
              <div className="os-progress-fill-green" style={{ width: `${(inflow / maxFlow) * 100}%` }} />
            </div>
          </div>
          <div className="os-hero-metric os-hero-metric-red">
            <div className="os-icon-badge os-icon-badge-red">↑</div>
            <p className="os-level-1-value">{Math.round(outflow).toLocaleString('en-US')}</p>
            <p className="os-level-1-unit">THB</p>
            <p className="text-xs text-[var(--bb-text-muted)]">รายจ่าย / เดือน</p>
            <div className="os-progress-rail">
              <div className="os-progress-fill-red" style={{ width: `${(outflow / maxFlow) * 100}%` }} />
            </div>
          </div>
          <div className="os-hero-metric os-hero-metric-blue">
            <div className="os-icon-badge os-icon-badge-blue">○</div>
            <p className="os-level-1-value">{Math.round(reserveTotal).toLocaleString('en-US')}</p>
            <p className="os-level-1-unit">THB</p>
            <p className="text-xs text-[var(--bb-text-muted)]">เงินสำรอง</p>
            <p className="text-[10px] text-[var(--bb-text-faint)]">กองทุนสำรอง</p>
          </div>
          <div className="os-hero-metric os-hero-metric-amber">
            <div className="os-icon-badge os-icon-badge-amber">◈</div>
            <p className="os-level-1-value">{runwayMonths} เดือน</p>
            <p className="text-xs text-[var(--bb-text-muted)]">สภาพคล่อง</p>
            <div className="os-progress-rail">
              <div className="os-progress-fill-amber" style={{ width: `${(runwayMonths / 24) * 100}%` }} />
            </div>
          </div>
        </div>
        ) : (
          <div className="mt-6 rounded-[28px] border border-dashed border-black/[0.12] bg-white/60 p-6 text-center">
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[#777777]">ยังไม่มีข้อมูลทางการเงิน</p>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-[#666666]">
              เพิ่มรายการเดินบัญชีแรก หรือเพิ่มสินทรัพย์การลงทุนเพื่อดูภาพรวมทางการเงิน
            </p>
            <button className="btn-primary mt-5" type="button" onClick={() => navigate('/os/finance/investments')}>ไปที่ Investments</button>
          </div>
        )}
      </header>

      {/* CAPITAL OPERATING SYSTEM */}
      <CapitalRhythm reserveRows={data.reserveRows} familyFinanceRecords={data.familyFinanceRecords} financeLedgerRows={data.financeLedgerRows} />
      <CapitalCriticalPath reserveRows={data.reserveRows} familyFinanceRecords={data.familyFinanceRecords} financeLedgerRows={data.financeLedgerRows} />

      <div className="flex gap-2 border-b border-black/[0.06] pb-3">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={`rounded-2xl px-5 py-2 text-sm font-semibold transition ${
              activeTab === tab.key
                ? 'bg-accent text-white shadow-[0_8px_20px_-12px_var(--bb-accent)]'
                : 'text-[var(--bb-text-soft)] hover:bg-black/[0.04]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <main className="space-y-5">
          {activeTab === 'overview' && (hasFinanceData ? <OverviewTab /> : <EmptyFinanceState />)}
          {activeTab === 'studio-office' && <StudioOfficeTab />}
          {activeTab === 'family' && <FamilyPage />}
        </main>
        <aside className="intelligence-rail space-y-5">
          <PendingApprovalPanel items={pendingApprovals} onApprove={approveActionRequest} onReject={rejectActionRequest} />
          <ModuleAISummaryPanel moduleName="Capital" suggestions={data.aiSuggestions} />
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
        <div className="os-card-primary">
          <div className="panel-header"><h3 className="text-base font-bold">Reserve Health / สถานะสำรอง</h3></div>
          <div className="space-y-3">
            {data.reserveRows.length === 0 ? (
              <p className="text-sm text-[var(--bb-text-soft)]">ไม่มีกองทุนสำรอง  เพิ่มกองทุนแรก</p>
            ) : data.reserveRows.map((reserve) => {
              const pct = Math.min(100, Math.round((reserve.currentAmountTHB / reserve.targetAmountTHB) * 100))
              return (
                <div key={reserve.id}>
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      <span className={`os-severity-dot os-severity-dot-${pct >= 80 ? 'green' : pct >= 60 ? 'amber' : 'red'}`} />
                      <span className="font-semibold">{reserve.label}</span>
                    </div>
                    <span>{pct}%</span>
                  </div>
                  <div className="os-progress-rail">
                    <div
                      className={`os-progress-fill-${pct >= 80 ? 'green' : pct >= 60 ? 'amber' : 'red'}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <p className="mt-0.5 text-xs text-[var(--bb-text-muted)]">{thb(reserve.currentAmountTHB)} / {thb(reserve.targetAmountTHB)}</p>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <div className="os-section-card">
          <div className="panel-header"><h3 className="text-base font-bold">Obligations / ภาระผูกพัน</h3><span className="pill">หนี้ {thb(debtTotal)}</span></div>
          <div className="space-y-2">
            {data.familyFinanceRecords.length === 0 ? (
              <p className="text-sm text-[var(--bb-text-soft)]">ไม่มีภาระผูกพัน</p>
            ) : data.familyFinanceRecords.map((record) => (
              <div key={record.id} className="os-list-row">
                <p className="text-sm font-semibold">{record.label}</p>
                <p className="mt-0.5 text-xs text-[var(--bb-text-muted)]">{record.bucket} / {thb(record.amountTHB)}{record.dueDate ? ` / due ${record.dueDate}` : ''}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="os-reference-card">
          <div className="panel-header"><h3>Pending Items / รายการรอดำเนินการ</h3></div>
          <div className="space-y-1.5 text-sm text-[var(--bb-text-soft)]">
            <p>{data.financeLedgerRows.length} รายการเดินบัญชี</p>
            <p>{data.reserveRows.length} กองทุนสำรอง</p>
            <p>{data.familyFinanceRecords.length} ภาระผูกพัน</p>
          </div>
        </div>
      </div>

      <CapitalAnalyticsCards />

      <CapitalCategoryBreakdown />
    </div>
  )
}

const CashFlowBar = ({ inflow, outflow, maxFlow }: { inflow: number; outflow: number; maxFlow: number }) => {
  const inflowPct = (inflow / maxFlow) * 100
  const outflowPct = (outflow / maxFlow) * 100
  const net = inflow - outflow
  return (
  <div className="os-section-card">
    <div className="panel-header"><h3 className="text-base font-bold">Cash Flow / กระแสเงินสด</h3></div>
    <div className="space-y-3">
      <div>
        <div className="flex items-center justify-between text-sm">
          <span className="font-semibold text-green">Inflow / รายรับ</span>
          <span>{thb(inflow)}</span>
        </div>
        <div className="mt-1 os-progress-rail">
          <div className="os-progress-fill-green" style={{ width: `${inflowPct}%` }} />
        </div>
      </div>
      <div>
        <div className="flex items-center justify-between text-sm">
          <span className="font-semibold text-red">Outflow / รายจ่าย</span>
          <span>{thb(outflow)}</span>
        </div>
        <div className="mt-1 os-progress-rail">
          <div className="os-progress-fill-red" style={{ width: `${outflowPct}%` }} />
        </div>
      </div>
      <div className="flex items-center gap-2 border-t border-black/[0.04] pt-2">
        <div className="os-stacked-bar flex-1">
          <div className="os-stacked-bar-segment" style={{ width: `${inflowPct}%`, background: 'var(--bb-green)' }} />
          <div className="os-stacked-bar-segment" style={{ width: `${outflowPct}%`, background: 'var(--bb-red)' }} />
        </div>
        <span className={net >= 0 ? 'os-trend os-trend-up' : 'os-trend os-trend-down'}>
          {net >= 0 ? '+' : ''}{Math.round(net).toLocaleString()}
        </span>
      </div>
    </div>
  </div>
  )
}

const RunwayGauge = ({ months }: { months: number }) => {
  const pct = Math.min(100, Math.max(0, Math.round((months / 24) * 100)))
  const color = months >= 12 ? 'green' : months >= 6 ? 'amber' : 'red'
  return (
    <div className="os-card-primary">
      <div className="panel-header"><h3 className="text-base font-bold">Runway / สภาพคล่องคงเหลือ</h3></div>
      <div className="flex items-center gap-5">
        <div className={`os-gauge-ring os-gauge-ring-${color}`}>
          <div
            className="os-gauge-ring-fill"
            style={{
              background: `conic-gradient(var(--bb-${color}) ${pct}%, transparent ${pct}%)`,
            }}
          />
          <div className="os-gauge-ring-inner">
            <span className="os-gauge-value">{months}</span>
            <span className="os-gauge-label">mo</span>
          </div>
        </div>
        <div className="flex-1">
          <div className="os-progress-rail">
            <div className={`os-progress-fill-${color}`} style={{ width: `${pct}%` }} />
          </div>
          <p className="mt-1 text-xs text-[var(--bb-text-muted)]">{months >= 12 ? 'Stable' : months >= 6 ? 'Adequate' : 'Low'} runway</p>
        </div>
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

