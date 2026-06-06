import type { FinanceLedgerRow, ReserveRow, FamilyFinanceRecord } from '../../types/models'

const thb = (value = 0) => `${Math.round(value).toLocaleString('en-US')} THB`

interface Props {
  financeLedgerRows: FinanceLedgerRow[]
  reserveRows: ReserveRow[]
  familyFinanceRecords: FamilyFinanceRecord[]
}

export const CapitalHealthCard = ({ financeLedgerRows, reserveRows, familyFinanceRecords }: Props) => {
  const cashPosition = reserveRows.reduce((s, r) => s + (r.currentAmountTHB ?? 0), 0)
  const monthlyBurn = familyFinanceRecords
    .filter((r) => r.bucket === 'bill' || r.bucket === 'expense')
    .reduce((s, r) => s + r.amountTHB, 0)
  const recentActivity = financeLedgerRows.slice(0, 3)
  const runway = monthlyBurn > 0 && cashPosition > 0 ? Math.round(cashPosition / monthlyBurn) : 0

  return (
    <div className="os-section-card">
      <div className="panel-header">
        <div>
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--bb-text-muted)]">CAPITAL HEALTH</p>
          <h3>Capital Health</h3>
        </div>
        <span className="pill">{financeLedgerRows.length} records</span>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl bg-white/50 p-3">
          <p className="font-mono text-[10px] font-semibold uppercase text-[var(--bb-text-muted)]">◎ Cash Position</p>
          <p className="mt-1 text-xl font-bold">{cashPosition > 0 ? thb(cashPosition) : '—'}</p>
          {reserveRows.length > 0 && (
            <div className="mt-2 h-1.5 w-full rounded-full bg-black/[0.06]">
              <div className="h-full rounded-full bg-[var(--bb-green)] transition-all" style={{ width: `${Math.min(100, reserveRows.length * 20)}%` }} />
            </div>
          )}
          <p className="mt-1 text-[10px] text-[var(--bb-text-muted)]">{cashPosition > 0 ? `${reserveRows.length} reserve buckets` : 'No reserve data'}</p>
        </div>

        <div className="rounded-2xl bg-white/50 p-3">
          <p className="font-mono text-[10px] font-semibold uppercase text-[var(--bb-text-muted)]">Monthly Burn</p>
          <p className="mt-1 text-xl font-bold">{monthlyBurn > 0 ? thb(monthlyBurn) : '—'}</p>
          <p className="mt-1 text-[10px] text-[var(--bb-text-muted)]">{monthlyBurn > 0 ? 'Bills + expenses' : 'No expense data'}</p>
        </div>

        <div className="rounded-2xl bg-white/50 p-3">
          <p className="font-mono text-[10px] font-semibold uppercase text-[var(--bb-text-muted)]">Runway</p>
          <p className={`mt-1 text-xl font-bold ${runway > 0 && runway < 6 ? 'text-[var(--bb-amber)]' : ''}`}>{runway > 0 ? `${runway} months` : '—'}</p>
          {runway > 0 && (
            <div className="mt-2 h-1.5 w-full rounded-full bg-black/[0.06]">
              <div className={`h-full rounded-full transition-all ${runway < 6 ? 'bg-[var(--bb-amber)]' : 'bg-[var(--bb-green)]'}`} style={{ width: `${Math.min(100, (runway / 12) * 100)}%` }} />
            </div>
          )}
          <p className="mt-1 text-[10px] text-[var(--bb-text-muted)]">{runway > 0 ? `${runway >= 12 ? 'Strong position' : runway >= 6 ? 'Adequate' : 'Monitor closely'}` : 'Calculate with expense data'}</p>
        </div>

        <div className="rounded-2xl bg-white/50 p-3">
          <p className="font-mono text-[10px] font-semibold uppercase text-[var(--bb-text-muted)]">Recent Activity</p>
          <p className="mt-1 text-xl font-bold">{recentActivity.length}</p>
          {recentActivity.length > 0 ? (
            <div className="mt-1 space-y-0.5">
              {recentActivity.map((r) => (
                <p key={r.id} className="truncate text-[10px] text-[var(--bb-text-muted)]">{r.label} / {thb(r.amountTHB)}</p>
              ))}
            </div>
          ) : (
            <p className="mt-1 text-[10px] text-[var(--bb-text-faint)]">No recent activity</p>
          )}
        </div>
      </div>
    </div>
  )
}
