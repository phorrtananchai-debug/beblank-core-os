import type { ReserveRow, FamilyFinanceRecord, FinanceLedgerRow } from '../../types/models'

export interface CriticalPathResult {
  label: string
  reason: string
  severity: 'healthy' | 'watch' | 'risk'
}

export function computeCapitalCriticalPath(
  reserveRows: ReserveRow[],
  familyFinanceRecords: FamilyFinanceRecord[],
  financeLedgerRows: FinanceLedgerRow[],
): CriticalPathResult {
  const cashPosition = reserveRows.reduce((s, r) => s + (r.currentAmountTHB ?? 0), 0)
  const monthlyBurn = familyFinanceRecords
    .filter((r) => r.bucket === 'bill' || r.bucket === 'expense')
    .reduce((s, r) => s + r.amountTHB, 0)
  const runway = monthlyBurn > 0 ? cashPosition / monthlyBurn : 0
  const overdueInflow = financeLedgerRows.filter((r) => r.direction === 'inflow' && r.status === 'planned')
  const overdueOutflow = financeLedgerRows.filter((r) => r.direction === 'outflow' && r.status === 'planned')

  if (overdueInflow.length > 0) {
    const total = overdueInflow.reduce((s, r) => s + r.amountTHB, 0)
    return { label: `Waiting for ${Math.round(total / 1000)}k THB in receivables`, reason: `${overdueInflow.length} pending inflows`, severity: 'risk' }
  }
  if (overdueOutflow.length > 0) {
    const total = overdueOutflow.reduce((s, r) => s + r.amountTHB, 0)
    return { label: `${Math.round(total / 1000)}k THB in payments due`, reason: `${overdueOutflow.length} pending outflows`, severity: 'risk' }
  }
  if (runway > 0 && runway < 3) {
    return { label: `Runway under 3 months (${runway.toFixed(1)}mo)`, reason: 'Cash reserve critically low', severity: 'risk' }
  }
  if (runway > 0 && runway < 6) {
    return { label: `Runway ${runway.toFixed(1)}mo — review expenses`, reason: 'Below 6-month target', severity: 'watch' }
  }
  if (cashPosition <= 0 && reserveRows.length === 0) {
    return { label: 'No cash reserve configured', reason: 'Set up reserve buckets in sheet', severity: 'watch' }
  }
  if (financeLedgerRows.length === 0) {
    return { label: 'No financial data recorded', reason: 'Add ledger rows to begin tracking', severity: 'watch' }
  }
  return { label: 'Capital position stable', reason: runway > 0 ? `${runway.toFixed(1)}mo runway` : 'No immediate constraints', severity: 'healthy' }
}
