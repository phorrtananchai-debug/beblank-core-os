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

type SortField = 'occurredAt' | 'label' | 'amountTHB' | 'direction' | 'status'
type SortDir = 'asc' | 'desc'

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
  const [sortField, setSortField] = useState<SortField>('occurredAt')
  const [sortDir, setSortDir] = useState<SortDir>('desc')

  const categories = useMemo(() => {
    const set = new Set(rows.map((r) => r.category))
    return ['all', ...Array.from(set)]
  }, [rows])

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortField(field)
      setSortDir('asc')
    }
  }

  const sortArrow = (field: SortField) => {
    if (sortField !== field) return ''
    return sortDir === 'asc' ? ' ▲' : ' ▼'
  }

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

    result.sort((a, b) => {
      let cmp = 0
      if (sortField === 'occurredAt') cmp = a.occurredAt.localeCompare(b.occurredAt)
      else if (sortField === 'label') cmp = a.label.localeCompare(b.label)
      else if (sortField === 'amountTHB') cmp = a.amountTHB - b.amountTHB
      else if (sortField === 'direction') cmp = a.direction.localeCompare(b.direction)
      else if (sortField === 'status') cmp = a.status.localeCompare(b.status)
      return sortDir === 'asc' ? cmp : -cmp
    })

    return result
  }, [rows, search, categoryFilter, directionFilter, sortField, sortDir])

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
          <button className="btn-primary" type="button" onClick={callbacks.onAdd}>Add Row</button>
        </div>
        <p className="text-sm text-[#666666]">ไม่มีรายการเดินบัญชี  เพิ่มรายการแรก</p>
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

      <div className="overflow-x-auto rounded-[24px] border border-black/[0.05] bg-white/75">
        <table className="w-full min-w-[700px] text-left text-sm">
          <thead className="border-b border-black/[0.05] font-mono text-[9px] uppercase tracking-[0.12em] text-[#777777]">
            <tr>
              <th className="cursor-pointer px-4 py-3 hover:text-[#111111]" onClick={() => toggleSort('occurredAt')}>Date{sortArrow('occurredAt')}</th>
              <th className="cursor-pointer px-4 py-3 hover:text-[#111111]" onClick={() => toggleSort('label')}>Label{sortArrow('label')}</th>
              <th className="px-4 py-3">Category</th>
              <th className="cursor-pointer px-4 py-3 hover:text-[#111111]" onClick={() => toggleSort('direction')}>Direction{sortArrow('direction')}</th>
              <th className="cursor-pointer px-4 py-3 hover:text-[#111111]" onClick={() => toggleSort('amountTHB')}>Amount{sortArrow('amountTHB')}</th>
              <th className="cursor-pointer px-4 py-3 hover:text-[#111111]" onClick={() => toggleSort('status')}>Status{sortArrow('status')}</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((row) => (
              <tr key={row.id} className="border-b border-black/[0.04] last:border-b-0 hover:bg-black/[0.02]">
                <td className="px-4 py-3 whitespace-nowrap">{row.occurredAt}</td>
                <td className="px-4 py-3 font-semibold">
                  {row.label}
                  {row.notes ? <p className="mt-0.5 text-xs font-normal text-[#777777] max-w-56 truncate">{row.notes}</p> : null}
                </td>
                <td className="px-4 py-3 text-xs">{categoryLabels[row.category] ?? row.category}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs font-semibold ${row.direction === 'inflow' ? 'text-[#59634a]' : 'text-[#c2410c]'}`}>
                    {row.direction === 'inflow' ? 'In' : 'Out'}
                  </span>
                </td>
                <td className={`px-4 py-3 font-semibold ${row.direction === 'inflow' ? 'text-[#59634a]' : ''}`}>{thb(row.amountTHB)}</td>
                <td className="px-4 py-3">
                  <span className={`font-mono text-[10px] font-semibold uppercase ${statusColor(row.status)}`}>{row.status}</span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-1.5">
                    <button className="btn-secondary !px-2.5 !py-1 text-xs" type="button" onClick={() => callbacks.onEdit(row)}>Edit</button>
                    <button className="btn-secondary !px-2.5 !py-1 text-xs !text-[#c2410c]" type="button" onClick={() => callbacks.onDelete(row)}>Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-3 text-xs text-[#777777]">{filtered.length} of {rows.length} rows</p>
    </div>
  )
}
