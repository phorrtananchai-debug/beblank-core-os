import type { ReserveRow, FamilyFinanceRecord, FinanceLedgerRow } from '../../types/models'

export interface CapitalPulseResult {
  score: number
  band: 'healthy' | 'watch' | 'risk'
  drivers: string[]
}

export function computeCapitalPulse(
  reserveRows: ReserveRow[],
  familyFinanceRecords: FamilyFinanceRecord[],
  financeLedgerRows: FinanceLedgerRow[],
): CapitalPulseResult {
  let score = 100
  const drivers: string[] = []

  const cashPosition = reserveRows.reduce((s, r) => s + (r.currentAmountTHB ?? 0), 0)
  const monthlyBurn = familyFinanceRecords
    .filter((r) => r.bucket === 'bill' || r.bucket === 'expense')
    .reduce((s, r) => s + r.amountTHB, 0)
  const runway = monthlyBurn > 0 ? cashPosition / monthlyBurn : 0
  const overdueReceivables = financeLedgerRows.filter((r) => r.direction === 'inflow' && r.status === 'planned').reduce((s, r) => s + r.amountTHB, 0)
  const overdueLiabilities = financeLedgerRows.filter((r) => r.direction === 'outflow' && r.status === 'planned').reduce((s, r) => s + r.amountTHB, 0)

  if (runway <= 0 && cashPosition <= 0) { score -= 40; drivers.push('No cash reserve data') }
  else if (runway < 3) { score -= 30; drivers.push(`Runway ${runway.toFixed(1)}mo — critical`) }
  else if (runway < 6) { score -= 15; drivers.push(`Runway ${runway.toFixed(1)}mo — watch`) }
  else { drivers.push(`Runway ${runway.toFixed(1)}mo`) }

  if (overdueReceivables > 0) { score -= 15; drivers.push(`Overdue receivables: ~${Math.round(overdueReceivables / 1000)}k THB`) }
  if (overdueLiabilities > 0) { score -= 15; drivers.push(`Overdue liabilities: ~${Math.round(overdueLiabilities / 1000)}k THB`) }

  const reserveCount = reserveRows.length
  if (reserveCount === 0) { score -= 10; drivers.push('No reserve buckets configured') }
  else if (reserveCount < 2) { score -= 5; drivers.push('Only 1 reserve bucket') }

  const incomeSources = new Set(financeLedgerRows.filter((r) => r.direction === 'inflow').map((r) => r.category))
  const expenseCategories = new Set(financeLedgerRows.filter((r) => r.direction === 'outflow').map((r) => r.category))

  if (incomeSources.size <= 1 && financeLedgerRows.length > 0) { score -= 5; drivers.push('Single income source') }
  if (expenseCategories.size === 0 && financeLedgerRows.length > 0) { score -= 5; drivers.push('No expense categories tracked') }

  score = Math.max(0, Math.min(100, score))
  const band: CapitalPulseResult['band'] = score >= 80 ? 'healthy' : score >= 60 ? 'watch' : 'risk'

  return { score, band, drivers }
}
