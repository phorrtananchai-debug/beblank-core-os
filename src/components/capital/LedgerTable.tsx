import { useMemo, useState } from 'react'
import type { FinanceLedgerRow } from '../../types/models'

const thb = (value = 0) => `${Math.round(value).toLocaleString()} THB`

const categoryLabels: Record<string, string> = {
  'studio-income': 'Studio Income',
  'project-payment': 'Project Payment',
  subscription: 'Subscription',
  equipment: 'Equipment',
  debt: 'Debt',
  'reserve-transfer': 'Reserve Transfer',
  expense: 'Expense',
}

export interface LedgerTableCallbacks {
  onAdd: () => void
  onEdit: (row: FinanceLedgerRow) => void
  onDelete: (row: FinanceLedgerRow) => void
}

interface Props {
  rows: FinanceLedgerRow[]
  callbacks: LedgerTableCallbacks
}

export const LedgerTable = ({ rows, callbacks }: Props) => {
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [directionFilter, setDirectionFilter] = useState<'all' | 'inflow' | 'outflow'>('all')

  const categories = useMemo(() => {
    const set = new Set(rows.map((r) => r.category))
    return ['all', ...Array.from(set)]
  }, [rows])

  const filtered = useMemo(() => {
    let result = [...rows]

    if (search) {
      const q = search.toLowerCase()
      result = result.filter((r) => r.label.toLowerCase().includes(q) || r.notes.toLowerCase().includes(q))
    }

    if (categoryFilter !== 'all') {
      result = result.filter((r) => r.category === categoryFilter)
    }

    if (directionFilter !== 'all') {
      result = result.filter((r) => r.direction === directionFilter)
    }

    result.sort((a, b) => a.occurredAt.localeCompare(b.occurredAt))

    return result
  }, [rows, search, categoryFilter, directionFilter])

  const statusColor = (status: string) => {
    switch (status) {
      case 'cleared': return 'text-[#59634a]'
      case 'planned': return 'text-[#d4a143]'
      case 'review': return 'text-[#c2410c]'
      default: return 'text-[#777777]'
    }
  }

  if (rows.length === 0) {
    return (
      <div className="panel">
        <div className="panel-header">
          <h3>Ledger / บัญชีรายการ</h3>
          <button className="btn-primary" type="button" onClick={callbacks.onAdd}>เพิ่มรายการ</button>
        </div>
        <p className="text-sm text-[#666666]">ไม่มีรายการเดินบัญชี เพิ่มรายการแรก</p>
      </div>
    )
  }

  return (
    <div className="panel">
      <div className="panel-header">
        <h3>Ledger / บัญชีรายการ</h3>
        <button className="btn-primary" type="button" onClick={callbacks.onAdd}>Add Row</button>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <input
          className="input max-w-xs"
          placeholder="ค้นหารายการ..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select className="input max-w-44" value={directionFilter} onChange={(e) => setDirectionFilter(e.target.value as 'all' | 'inflow' | 'outflow')}>
          <option value="all">All directions</option>
          <option value="inflow">Inflow / รายรับ</option>
          <option value="outflow">Outflow / รายจ่าย</option>
        </select>
        <div className="flex flex-wrap gap-1.5">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategoryFilter(cat)}
              className={`rounded-xl px-3 py-1 text-xs font-semibold transition ${
                categoryFilter === cat ? 'bg-black text-white' : 'bg-black/[0.06] text-[#55504a] hover:bg-black/[0.1]'
              }`}
            >
              {cat === 'all' ? 'All' : categoryLabels[cat] ?? cat}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {filtered.map((row) => (
          <div key={row.id} className="rounded-2xl border border-black/[0.05] bg-[#faf9f8] p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold break-words">{row.label}</p>
                <p className="mt-0.5 text-xs text-[#777777]">{row.occurredAt}</p>
              </div>
              <div className="shrink-0 text-right">
                <span className={`font-semibold ${row.direction === 'inflow' ? 'text-[#59634a]' : 'text-[#c2410c]'}`}>{thb(row.amountTHB)}</span>
                <p className={`text-xs font-semibold ${row.direction === 'inflow' ? 'text-[#59634a]' : 'text-[#c2410c]'}`}>
                  {row.direction === 'inflow' ? 'Inflow' : 'Outflow'}
                </p>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
              <span className="rounded-lg bg-black/[0.06] px-2 py-0.5 font-semibold">{categoryLabels[row.category] ?? row.category}</span>
              <span className={`font-mono font-semibold uppercase ${statusColor(row.status)}`}>{row.status}</span>
            </div>
            {row.notes ? <p className="mt-2 text-xs leading-5 text-[#666666] break-words">{row.notes}</p> : null}
            <div className="mt-3 flex flex-wrap gap-2">
                    <button className="btn-secondary !px-2.5 !py-1 text-xs" type="button" onClick={() => callbacks.onEdit(row)}>แก้ไข</button>
                    <button className="btn-secondary !px-2.5 !py-1 text-xs !text-[#c2410c]" type="button" onClick={() => callbacks.onDelete(row)}>ลบ</button>
            </div>
          </div>
        ))}
      </div>

      <p className="mt-3 text-xs text-[#777777]">{filtered.length} of {rows.length} rows</p>
    </div>
  )
}
