import type { ReserveRow, FamilyFinanceRecord, FinanceLedgerRow } from '../../types/models'
import { computeCapitalCriticalPath } from './capitalCriticalPathUtils'

interface Props {
  reserveRows: ReserveRow[]
  familyFinanceRecords: FamilyFinanceRecord[]
  financeLedgerRows: FinanceLedgerRow[]
}

export const CapitalCriticalPath = ({ reserveRows, familyFinanceRecords, financeLedgerRows }: Props) => {
  const cp = computeCapitalCriticalPath(reserveRows, familyFinanceRecords, financeLedgerRows)
  const dotColor = cp.severity === 'risk' ? 'bg-red' : cp.severity === 'watch' ? 'bg-[var(--bb-amber)]' : 'bg-[var(--bb-green)]'

  return (
    <div className="rounded-xl border border-black/[0.04] bg-white/60 p-3">
      <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.1em] text-[var(--bb-text-muted)]">Capital Critical Path</p>
      <div className="mt-2 flex items-center gap-2">
        <span className={`inline-block h-1.5 w-1.5 shrink-0 rounded-full ${dotColor}`} />
        <div>
          <p className="text-sm font-semibold">{cp.label}</p>
          <p className="text-xs text-[var(--bb-text-muted)]">{cp.reason}</p>
        </div>
      </div>
    </div>
  )
}
