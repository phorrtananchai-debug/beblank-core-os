import { useMemo } from 'react'
import { useOs } from '../../core/os/useOs'

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

const categoryOrder = ['studio-income', 'project-payment', 'expense', 'subscription', 'equipment', 'debt', 'reserve-transfer']

export const CapitalCategoryBreakdown = () => {
  const { data } = useOs()

  const categories = useMemo(() => {
    const map: Record<string, { inflow: number; outflow: number; count: number }> = {}
    data.financeLedgerRows.forEach((row) => {
      if (!map[row.category]) map[row.category] = { inflow: 0, outflow: 0, count: 0 }
      map[row.category][row.direction] += row.amountTHB
      map[row.category].count++
    })
    return Object.entries(map)
      .map(([key, val]) => ({ key, label: categoryLabels[key] ?? key, ...val }))
      .sort((a, b) => categoryOrder.indexOf(a.key) - categoryOrder.indexOf(b.key))
  }, [data])

  const maxTotal = Math.max(...categories.map((c) => c.inflow + c.outflow), 1)

  if (categories.length === 0) {
    return (
      <div className="panel">
        <div className="panel-header"><h3>Category Breakdown / แยกตามหมวดหมู่</h3></div>
        <p className="text-sm text-[#666666]">ไม่มีข้อมูลรายการเดินบัญชี</p>
      </div>
    )
  }

  return (
    <div className="panel panel-float">
      <div className="panel-header"><h3>Category Breakdown / แยกตามหมวดหมู่</h3></div>
      <div className="space-y-4">
        {categories.map((cat) => {
          const total = cat.inflow + cat.outflow
          const inflowPct = (cat.inflow / maxTotal) * 100
          const outflowPct = (cat.outflow / maxTotal) * 100
          return (
            <div key={cat.key}>
              <div className="mb-1 flex items-center justify-between text-sm">
                <span className="font-semibold">{cat.label}</span>
                <span className="text-xs text-[#777777]">{thb(total)} / {cat.count} รายการ</span>
              </div>
              <div className="flex h-4 gap-0.5 rounded-full bg-black/[0.04] overflow-hidden">
                {cat.inflow > 0 ? (
                  <div
                    className="h-full rounded-l-full bg-[#59634a] transition-all"
                    style={{ width: `${inflowPct}%` }}
                    title={`Inflow ${thb(cat.inflow)}`}
                  />
                ) : null}
                {cat.outflow > 0 ? (
                  <div
                    className={`h-full bg-[#c2410c] transition-all ${cat.inflow > 0 ? '' : 'rounded-l-full'}`}
                    style={{ width: `${outflowPct}%` }}
                    title={`Outflow ${thb(cat.outflow)}`}
                  />
                ) : null}
              </div>
              <div className="mt-1 flex gap-4 text-[10px] text-[#777777]">
                {cat.inflow > 0 ? <span className="text-[#59634a]">In {thb(cat.inflow)}</span> : null}
                {cat.outflow > 0 ? <span className="text-[#c2410c]">Out {thb(cat.outflow)}</span> : null}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
