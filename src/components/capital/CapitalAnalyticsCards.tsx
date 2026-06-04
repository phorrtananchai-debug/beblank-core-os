import { useMemo } from 'react'
import { useOs } from '../../core/os/OsContext'

const thb = (value = 0) => `${Math.round(value).toLocaleString()} THB`

interface AnalyticsResult {
  inflow: number
  outflow: number
  netCashFlow: number
  burnRate: number
  runwayMonths: number
  reserveTotal: number
  reserveTarget: number
  reserveHealthPct: number
  riskCounts: { low: number; medium: number; high: number }
  statusCounts: { cleared: number; planned: number; review: number }
  directionBreakdown: { inflow: number; outflow: number; transfer: number }
}

const computeAnalytics = (data: ReturnType<typeof useOs>['data']): AnalyticsResult => {
  const inflow = data.financeLedgerRows.filter((r) => r.direction === 'inflow').reduce((s, r) => s + r.amountTHB, 0)
  const outflow = data.financeLedgerRows.filter((r) => r.direction === 'outflow').reduce((s, r) => s + r.amountTHB, 0)
  const transfer = data.financeLedgerRows.filter((r) => r.category === 'reserve-transfer').reduce((s, r) => s + r.amountTHB, 0)
  const netCashFlow = inflow - outflow
  const burnRate = Math.max(outflow, 1)
  const reserveTotal = data.reserveRows.reduce((s, r) => s + r.currentAmountTHB, 0)
  const reserveTarget = data.reserveRows.reduce((s, r) => s + r.targetAmountTHB, 0)
  const runwayMonths = Math.round((reserveTotal / burnRate) * 10) / 10
  const reserveHealthPct = reserveTarget > 0 ? Math.min(100, Math.round((reserveTotal / reserveTarget) * 100)) : 0

  const riskCounts = { low: 0, medium: 0, high: 0 }
  data.financeLedgerRows.forEach((r) => { riskCounts[r.risk]++ })

  const statusCounts = { cleared: 0, planned: 0, review: 0 }
  data.financeLedgerRows.forEach((r) => { statusCounts[r.status]++ })

  return { inflow, outflow, netCashFlow, burnRate, runwayMonths, reserveTotal, reserveTarget, reserveHealthPct, riskCounts, statusCounts, directionBreakdown: { inflow, outflow, transfer } }
}

export const CapitalAnalyticsCards = () => {
  const { data } = useOs()
  const a = useMemo(() => computeAnalytics(data), [data])

  const netColor = a.netCashFlow >= 0 ? 'text-[#59634a]' : 'text-[#c2410c]'

  return (
    <div className="panel panel-float">
      <div className="panel-header"><h3>Analytics Summary / สรุปวิเคราะห์</h3></div>
      <div className="grid gap-3 md:grid-cols-5">
        <MetricCard label="Net Cash Flow / กระแสเงินสดสุทธิ" value={thb(Math.abs(a.netCashFlow))} note={a.netCashFlow >= 0 ? 'positive / บวก' : 'negative / ลบ'} valueClass={netColor} />
        <MetricCard label="Burn Rate / อัตราการใช้จ่าย" value={thb(a.burnRate)} note="Monthly / ต่อเดือน" />
        <MetricCard label="Runway / ระยะเวลาสำรอง" value={`${a.runwayMonths} months`} note={`Reserve ${thb(a.reserveTotal)}`} />
        <MetricCard label="Reserve Health / สถานะสำรอง" value={`${a.reserveHealthPct}%`} note={`Target ${thb(a.reserveTarget)}`} />
        <div className="rounded-2xl border border-black/[0.04] bg-white/75 p-3">
          <p className="font-mono text-[8px] font-semibold uppercase tracking-[0.12em] text-[#777777]">Direction / ทิศทาง</p>
          <div className="mt-2 space-y-1 text-xs">
            <div className="flex items-center justify-between"><span className="text-[#59634a]">Inflow</span><span className="font-semibold">{((a.inflow / Math.max(a.inflow + a.outflow, 1)) * 100).toFixed(0)}%</span></div>
            <div className="flex items-center justify-between"><span className="text-[#c2410c]">Outflow</span><span className="font-semibold">{((a.outflow / Math.max(a.inflow + a.outflow, 1)) * 100).toFixed(0)}%</span></div>
            {a.directionBreakdown.transfer > 0 ? <div className="flex items-center justify-between"><span className="text-[#d4a143]">Transfer</span><span className="font-semibold">{thb(a.directionBreakdown.transfer)}</span></div> : null}
          </div>
        </div>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <MiniGrid label="Risk / ความเสี่ยง" items={[
          { label: 'Low / ต่ำ', value: String(a.riskCounts.low), color: 'text-[#59634a]' },
          { label: 'Medium / ปานกลาง', value: String(a.riskCounts.medium), color: 'text-[#d4a143]' },
          { label: 'High / สูง', value: String(a.riskCounts.high), color: 'text-[#c2410c]' },
        ]} />
        <MiniGrid label="Status / สถานะ" items={[
          { label: 'Cleared / สำเร็จ', value: String(a.statusCounts.cleared), color: 'text-[#59634a]' },
          { label: 'Planned / วางแผน', value: String(a.statusCounts.planned), color: 'text-[#d4a143]' },
          { label: 'Review / ทบทวน', value: String(a.statusCounts.review), color: 'text-[#c2410c]' },
        ]} />
        <MiniGrid label="Summary / สรุป" items={[
          { label: 'Total rows', value: String(data.financeLedgerRows.length) },
          { label: 'Reserve buckets', value: String(data.reserveRows.length) },
          { label: 'Obligations', value: String(data.familyFinanceRecords.length) },
        ]} />
      </div>
    </div>
  )
}

const MetricCard = ({ label, value, note, valueClass }: { label: string; value: string; note?: string; valueClass?: string }) => (
  <div className="rounded-2xl border border-black/[0.04] bg-white/75 p-3">
    <p className="font-mono text-[8px] font-semibold uppercase tracking-[0.12em] text-[#777777]">{label}</p>
    <p className={`mt-1 text-lg font-bold ${valueClass ?? ''}`}>{value}</p>
    {note ? <p className="mt-0.5 text-[10px] text-[#777777]">{note}</p> : null}
  </div>
)

const MiniGrid = ({ label, items }: { label: string; items: { label: string; value: string; color?: string }[] }) => (
  <div className="rounded-2xl border border-black/[0.04] bg-white/75 p-3">
    <p className="font-mono text-[8px] font-semibold uppercase tracking-[0.12em] text-[#777777]">{label}</p>
    <div className="mt-2 space-y-1 text-xs">
      {items.map((item) => (
        <div key={item.label} className="flex items-center justify-between">
          <span>{item.label}</span>
          <span className={`font-semibold ${item.color ?? ''}`}>{item.value}</span>
        </div>
      ))}
    </div>
  </div>
)
