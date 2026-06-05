import { useState } from 'react'
import { DeleteLedgerDialog } from '../../components/capital/DeleteLedgerDialog'
import { LedgerForm } from '../../components/capital/LedgerForm'
import type { LedgerFormData } from '../../components/capital/LedgerForm'
import { LedgerTable } from '../../components/capital/LedgerTable'
import type { LedgerTableCallbacks } from '../../components/capital/LedgerTable'
import { useOs } from '../../core/os/OsContext'
import type { FinanceLedgerRow } from '../../types/models'

const thb = (value = 0) => `${Math.round(value).toLocaleString()} THB`

export const FamilyPage = () => {
  const { data, createActionRequest } = useOs()
  const [showAdd, setShowAdd] = useState(false)
  const [editingRow, setEditingRow] = useState<FinanceLedgerRow | null>(null)
  const [deletingRow, setDeletingRow] = useState<FinanceLedgerRow | null>(null)

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

  const debtTotal = data.familyFinanceRecords.filter((record) => record.bucket === 'debt').reduce((sum, record) => sum + record.amountTHB, 0)

  const ledgerCallbacks: LedgerTableCallbacks = {
    onAdd: () => setShowAdd(true),
    onEdit: (row) => setEditingRow(row),
    onDelete: (row) => setDeletingRow(row),
  }

  const handleAddLedger = (form: LedgerFormData) => {
    createActionRequest({
      module: 'finance',
      actionType: 'finance.addLedgerRow',
      description: `Add ledger row: ${form.label}`,
      payload: { ...form, accountId: 'acct-family-core' },
    })
    setShowAdd(false)
  }

  const handleEditLedger = (form: LedgerFormData) => {
    if (!editingRow) return
    createActionRequest({
      module: 'finance',
      actionType: 'finance.editLedgerRow',
      description: `Edit ledger row: ${form.label}`,
      payload: { id: editingRow.id, ...form, accountId: 'acct-family-core' },
    })
    setEditingRow(null)
  }

  const handleDeleteLedger = () => {
    if (!deletingRow) return
    createActionRequest({
      module: 'finance',
      actionType: 'finance.deleteLedgerRow',
      description: `Delete ledger row: ${deletingRow.label}`,
      payload: { id: deletingRow.id },
    })
    setDeletingRow(null)
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-5 lg:grid-cols-2">
        <div className="panel panel-float">
          <div className="panel-header">
            <h3 className="os-level-1-title">Reserve health / สถานะสำรอง</h3>
            <button className="btn-primary" type="button" onClick={queueReserveTransfer}>โอนเข้า</button>
          </div>
          <div className="space-y-3">
            {data.reserveRows.length === 0 ? (
              <p className="text-sm text-[var(--bb-text-soft)]">ไม่มีกองทุนสำรอง  สร้างกองทุนแรก</p>
            ) : data.reserveRows.map((reserve) => {
              const pct = Math.min(100, Math.round((reserve.currentAmountTHB / reserve.targetAmountTHB) * 100))
              return (
                <article key={reserve.id} className="rounded-[24px] border border-black/[0.05] bg-[#faf9f8] p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div><p className="font-semibold">{reserve.label}</p><p className="mt-1 text-xs text-[var(--bb-text-muted)]">{reserve.notes}</p></div>
                    <span className="pill">{reserve.status}</span>
                  </div>
                  <div className="mt-4 h-2 rounded-full bg-black/[0.06]">
                    <div
                      className={`h-full rounded-full ${pct >= 80 ? 'bg-[var(--bb-text)]' : pct >= 60 ? 'bg-[var(--bb-amber)]' : 'bg-[var(--bb-red)]'}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <p className="mt-2 text-xs text-[var(--bb-text-muted)]">{thb(reserve.currentAmountTHB)} / target {thb(reserve.targetAmountTHB)}</p>
                </article>
              )
            })}
          </div>
        </div>

        <div className="os-level-2">
          <div className="panel-header"><h3 className="os-level-2-title">Obligations / ภาระผูกพัน</h3><span className="pill">หนี้ {thb(debtTotal)}</span></div>
          <div className="space-y-3">
            {data.familyFinanceRecords.length === 0 ? (
              <p className="text-sm text-[var(--bb-text-soft)]">ไม่มีภาระผูกพัน</p>
            ) : data.familyFinanceRecords.map((record) => (
              <div key={record.id} className="rounded-2xl border border-black/[0.05] bg-[#faf9f8] p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold">{record.label}</p>
                    <p className="mt-1 text-xs text-[var(--bb-text-muted)]">{record.bucket} / {thb(record.amountTHB)}{record.dueDate ? ` / due ${record.dueDate}` : ''}</p>
                  </div>
                  <span className="font-mono text-[10px] font-semibold uppercase text-[var(--bb-amber)]">{record.risk ?? 'low'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <LedgerTable rows={data.financeLedgerRows} callbacks={ledgerCallbacks} />

      {showAdd ? (
        <LedgerForm
          title="Add Ledger Row / เพิ่มรายการบัญชี"
          onSubmit={handleAddLedger}
          onCancel={() => setShowAdd(false)}
          initial={{ category: 'expense', direction: 'outflow' }}
        />
      ) : null}

      {editingRow ? (
        <LedgerForm
          title="Edit Ledger Row / แก้ไขรายการบัญชี"
          onSubmit={handleEditLedger}
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
        <DeleteLedgerDialog row={deletingRow} onConfirm={handleDeleteLedger} onCancel={() => setDeletingRow(null)} />
      ) : null}

      <div className="panel">
        <div className="panel-header"><h3>Snapshot summaries / สรุปสถานะ</h3><span className="pill">สถานะปัจจุบัน</span></div>
        {data.financeSnapshots.filter((snapshot) => snapshot.module === 'family-office').length === 0 ? (
          <p className="text-sm text-[var(--bb-text-soft)]">ไม่มี snapshot</p>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {data.financeSnapshots.filter((snapshot) => snapshot.module === 'family-office').map((snapshot) => (
              <article key={snapshot.id} className="rounded-[24px] border border-black/[0.05] bg-[#faf9f8] p-4">
                <p className="font-semibold">{snapshot.title}</p>
                <p className="mt-2 text-sm text-[var(--bb-text-soft)]">{snapshot.posture}</p>
                <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--bb-text-muted)]">{thb(snapshot.valueTHB)} / {snapshot.risk}</p>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
