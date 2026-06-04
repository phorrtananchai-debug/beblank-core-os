import { useOs } from '../../core/os/OsContext'

const thb = (value = 0) => `${Math.round(value).toLocaleString()} THB`

export const FamilyPage = () => {
  const { data, createActionRequest } = useOs()

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

  const debtTotal = data.familyFinanceRecords.filter((record) => record.bucket === 'debt').reduce((sum, record) => sum + record.amountTHB, 0)

  return (
    <div className="space-y-5">
      <div className="grid gap-5 lg:grid-cols-2">
        <div className="panel panel-float">
          <div className="panel-header">
            <h3>Reserve health / สถานะสำรอง</h3>
            <button className="btn-primary" type="button" onClick={queueReserveTransfer}>Queue Reserve Transfer</button>
          </div>
          <div className="space-y-3">
            {data.reserveRows.length === 0 ? (
              <p className="text-sm text-[#666666]">ไม่มีกองทุนสำรอง  สร้างกองทุนแรก</p>
            ) : data.reserveRows.map((reserve) => {
              const pct = Math.min(100, Math.round((reserve.currentAmountTHB / reserve.targetAmountTHB) * 100))
              return (
                <article key={reserve.id} className="rounded-[24px] border border-black/[0.05] bg-[#faf9f8] p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div><p className="font-semibold">{reserve.label}</p><p className="mt-1 text-xs text-[#777777]">{reserve.notes}</p></div>
                    <span className="pill">{reserve.status}</span>
                  </div>
                  <div className="mt-4 h-2 rounded-full bg-black/[0.06]">
                    <div
                      className={`h-full rounded-full ${pct >= 80 ? 'bg-[#111111]' : pct >= 60 ? 'bg-[#d4a143]' : 'bg-[#c2410c]'}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <p className="mt-2 text-xs text-[#777777]">{thb(reserve.currentAmountTHB)} / target {thb(reserve.targetAmountTHB)}</p>
                </article>
              )
            })}
          </div>
        </div>

        <div className="panel panel-float">
          <div className="panel-header"><h3>Obligations / ภาระผูกพัน</h3><span className="pill">debt {thb(debtTotal)}</span></div>
          <div className="space-y-3">
            {data.familyFinanceRecords.length === 0 ? (
              <p className="text-sm text-[#666666]">ไม่มีภาระผูกพัน</p>
            ) : data.familyFinanceRecords.map((record) => <FinanceRow key={record.id} title={record.label} meta={`${record.bucket} / ${thb(record.amountTHB)}${record.dueDate ? ` / due ${record.dueDate}` : ''}`} status={record.risk ?? 'low'} />)}
          </div>
        </div>
      </div>

      <div className="panel">
        <div className="panel-header">
          <h3>Manual ledger / บัญชีรายการ</h3>
          <button className="btn-primary" type="button" onClick={queueLedgerRecord}>Queue Ledger Row</button>
        </div>
        <div className="grid gap-3 lg:grid-cols-2">
          {data.financeLedgerRows.length === 0 ? (
            <p className="text-sm text-[#666666]">ไม่มีรายการเดินบัญชี  เพิ่มรายการแรก</p>
          ) : data.financeLedgerRows.map((row) => <FinanceRow key={row.id} title={row.label} meta={`${row.category} / ${row.direction} / ${thb(row.amountTHB)} / ${row.occurredAt}`} status={row.status} />)}
        </div>
      </div>

      <div className="panel">
        <div className="panel-header"><h3>Snapshot summaries / สรุปสถานะ</h3><span className="pill">manual posture</span></div>
        {data.financeSnapshots.filter((snapshot) => snapshot.module === 'family-office').length === 0 ? (
          <p className="text-sm text-[#666666]">ไม่มี snapshot</p>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {data.financeSnapshots.filter((snapshot) => snapshot.module === 'family-office').map((snapshot) => (
              <article key={snapshot.id} className="rounded-[24px] border border-black/[0.05] bg-[#faf9f8] p-4">
                <p className="font-semibold">{snapshot.title}</p>
                <p className="mt-2 text-sm text-[#666666]">{snapshot.posture}</p>
                <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.12em] text-[#777777]">{thb(snapshot.valueTHB)} / {snapshot.risk}</p>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

const FinanceRow = ({ meta, status, title }: { meta: string; status: string; title: string }) => (
  <div className="rounded-2xl border border-black/[0.05] bg-[#faf9f8] p-4">
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="text-sm font-semibold">{title}</p>
        <p className="mt-1 text-xs text-[#777777]">{meta}</p>
      </div>
      <span className="font-mono text-[10px] font-semibold uppercase text-[#9a6a1f]">{status}</span>
    </div>
  </div>
)
