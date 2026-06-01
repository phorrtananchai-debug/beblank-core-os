import { ModuleAISummaryPanel } from '../../components/shared/ModuleAISummaryPanel'
import { SourceStatusBadge } from '../../components/shared/SourceStatusBadge'
import { useOs } from '../../core/os/OsContext'

export const FamilyOfficePage = () => {
  const { data, sourceStatuses } = useOs()

  return (
    <section className="space-y-5">
      <header>
        <h2 className="text-3xl font-semibold">Family Office Finance</h2>
        <p className="text-sm text-[#615a50]">Household cashflow, bills, debt, expenses, reserves, back-office bookkeeping.</p>
      </header>

      <SourceStatusBadge status={sourceStatuses.familyOffice} />

      <section className="panel">
        <h3 className="text-lg font-semibold">Finance Records</h3>
        <div className="mt-3 grid gap-2 md:grid-cols-2">
          {data.familyFinanceRecords.map((record) => (
            <div key={record.id} className="rounded-2xl border border-[#e7e2d8] bg-white p-3 text-sm">
              <p className="font-medium">{record.label}</p>
              <p className="text-xs text-[#6f675d]">
                {record.bucket} · {record.amountTHB.toLocaleString()} THB {record.dueDate ? `· due ${record.dueDate}` : ''}
              </p>
            </div>
          ))}
        </div>
      </section>

      <ModuleAISummaryPanel moduleName="Family" suggestions={data.aiSuggestions} />
    </section>
  )
}

