import type { ReserveRow, FamilyFinanceRecord, FinanceLedgerRow } from '../../types/models'
import { computeCapitalPulse } from './CapitalPulse'

interface Props {
  reserveRows: ReserveRow[]
  familyFinanceRecords: FamilyFinanceRecord[]
  financeLedgerRows: FinanceLedgerRow[]
}

const SectionCard = ({ label, children, color }: { label: string; children: React.ReactNode; color?: string }) => (
  <div className="rounded-xl border border-black/[0.04] bg-white/60 p-3">
    <p className={`font-mono text-[9px] font-semibold uppercase tracking-[0.1em] ${color ?? 'text-[var(--bb-text-muted)]'}`}>{label}</p>
    <div className="mt-2 space-y-1.5">{children}</div>
  </div>
)

export const CapitalRhythm = ({ reserveRows, familyFinanceRecords, financeLedgerRows }: Props) => {
  const pulse = computeCapitalPulse(reserveRows, familyFinanceRecords, financeLedgerRows)
  const cashPosition = reserveRows.reduce((s, r) => s + (r.currentAmountTHB ?? 0), 0)
  const monthlyBurn = familyFinanceRecords
    .filter((r) => r.bucket === 'bill' || r.bucket === 'expense')
    .reduce((s, r) => s + r.amountTHB, 0)
  const runway = monthlyBurn > 0 ? (cashPosition / monthlyBurn) : 0
  const pendingInflow = financeLedgerRows.filter((r) => r.direction === 'inflow' && r.status === 'planned')
  const pendingOutflow = financeLedgerRows.filter((r) => r.direction === 'outflow' && r.status === 'planned')
  const recentActivity = financeLedgerRows.slice(-5).reverse()
  const hasData = financeLedgerRows.length > 0 || reserveRows.length > 0

  const missingItems: string[] = []
  if (reserveRows.length === 0) missingItems.push('cash reserve')
  if (!familyFinanceRecords.some((r) => r.bucket === 'bill' || r.bucket === 'expense')) missingItems.push('monthly burn')
  if (!financeLedgerRows.some((r) => r.direction === 'inflow')) missingItems.push('receivables')
  if (!financeLedgerRows.some((r) => r.direction === 'outflow')) missingItems.push('liabilities/payables')

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2">
        <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--bb-text-muted)]">Capital Rhythm</p>
        <span className={`inline-flex items-center justify-center rounded-full px-2 py-0.5 font-mono text-[9px] font-bold leading-none ${
          !hasData ? 'bg-black/[0.05] text-[var(--bb-text-muted)]' :
          pulse.band === 'risk' ? 'bg-red/10 text-red' :
          pulse.band === 'watch' ? 'bg-[var(--bb-amber)]/10 text-[var(--bb-amber)]' :
          'bg-[var(--bb-green)]/10 text-[var(--bb-green)]'
        }`}>{!hasData ? '—' : pulse.score}</span>
      </div>

      {hasData ? (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <SectionCard label="Cash Position" color="text-[var(--bb-text)]">
              <p className="text-lg font-bold">{cashPosition > 0 ? `${Math.round(cashPosition / 1000).toLocaleString()}k THB` : '—'}</p>
              <p className="text-[10px] text-[var(--bb-text-muted)]">{reserveRows.length} reserve bucket{reserveRows.length !== 1 ? 's' : ''}</p>
            </SectionCard>
            <SectionCard label="Monthly Burn" color="text-[var(--bb-amber)]/80">
              <p className="text-lg font-bold">{monthlyBurn > 0 ? `${Math.round(monthlyBurn / 1000).toLocaleString()}k THB` : '—'}</p>
              <p className="text-[10px] text-[var(--bb-text-muted)]">{monthlyBurn > 0 ? 'Bills + expenses' : 'No expense data'}</p>
            </SectionCard>
            <SectionCard label="Runway" color={runway < 6 ? 'text-red/80' : 'text-[var(--bb-text)]'}>
              <p className={`text-lg font-bold ${runway > 0 && runway < 3 ? 'text-red' : runway > 0 && runway < 6 ? 'text-[var(--bb-amber)]' : ''}`}>
                {runway > 0 ? `${runway.toFixed(1)}mo` : '—'}
              </p>
              <p className="text-[10px] text-[var(--bb-text-muted)]">{runway >= 12 ? 'Strong' : runway >= 6 ? 'Adequate' : runway > 0 ? 'Monitor' : 'No data'}</p>
            </SectionCard>
            <SectionCard label="Pending" color="text-[var(--bb-amber)]/60">
              <p className="text-lg font-bold">{pendingInflow.length + pendingOutflow.length}</p>
              <p className="text-[10px] text-[var(--bb-text-muted)]">{pendingInflow.length} receivable · {pendingOutflow.length} payable</p>
            </SectionCard>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <SectionCard label="Needs Attention" color="text-red/80">
              {pulse.drivers.length > 0 ? pulse.drivers.map((d, i) => (
                <div key={i} className="flex items-start gap-2 text-sm">
                  <span className="mt-0.5 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-red" />
                  <div className="min-w-0"><p className="text-[var(--bb-text)]">{d}</p></div>
                </div>
              )) : <p className="text-[10px] text-[var(--bb-text-faint)]">No financial alerts</p>}
            </SectionCard>
            <SectionCard label="Recent Activity" color="text-[var(--bb-text-muted)]">
              {recentActivity.length > 0 ? recentActivity.slice(0, 4).map((r) => (
                <div key={r.id} className="flex items-center justify-between text-sm">
                  <span className="truncate text-[var(--bb-text)]">{r.label}</span>
                  <span className={`shrink-0 text-[10px] ${r.direction === 'inflow' ? 'text-[var(--bb-green)]' : 'text-red'}`}>
                    {r.direction === 'inflow' ? '+' : '−'}{Math.round(r.amountTHB / 1000)}k
                  </span>
                </div>
              )) : <p className="text-[10px] text-[var(--bb-text-faint)]">No recent activity</p>}
            </SectionCard>
          </div>
        </>
      ) : (
        /* Setup operating state — no data yet */
        <div className="rounded-xl border border-dashed border-black/[0.06] bg-white/40 p-5">
          <p className="text-sm font-semibold text-[var(--bb-text-muted)]">Capital setup required</p>
          <p className="mt-1 text-xs text-[var(--bb-text-faint)]">Add financial data to enable the Capital operating system. The following data is needed:</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-dashed border-black/[0.06] bg-white/50 p-3 text-center">
              <p className="font-mono text-[9px] font-semibold uppercase text-[var(--bb-text-muted)]">Cash Reserve</p>
              <p className="mt-1 text-xs text-[var(--bb-text-faint)]">Set up reserve buckets in sheet</p>
            </div>
            <div className="rounded-xl border border-dashed border-black/[0.06] bg-white/50 p-3 text-center">
              <p className="font-mono text-[9px] font-semibold uppercase text-[var(--bb-text-muted)]">Monthly Burn</p>
              <p className="mt-1 text-xs text-[var(--bb-text-faint)]">Track bills & expenses</p>
            </div>
            <div className="rounded-xl border border-dashed border-black/[0.06] bg-white/50 p-3 text-center">
              <p className="font-mono text-[9px] font-semibold uppercase text-[var(--bb-text-muted)]">Receivables</p>
              <p className="mt-1 text-xs text-[var(--bb-text-faint)]">Record incoming payments</p>
            </div>
            <div className="rounded-xl border border-dashed border-black/[0.06] bg-white/50 p-3 text-center">
              <p className="font-mono text-[9px] font-semibold uppercase text-[var(--bb-text-muted)]">Payables</p>
              <p className="mt-1 text-xs text-[var(--bb-text-faint)]">Record outgoing payments</p>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
