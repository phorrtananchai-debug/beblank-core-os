import { Link } from 'react-router-dom'
import { ModuleAISummaryPanel } from '../../components/shared/ModuleAISummaryPanel'
import { SourceStatusBadge } from '../../components/shared/SourceStatusBadge'
import { useOs } from '../../core/os/OsContext'

export const FinancePage = () => {
  const { data, sourceStatuses } = useOs()

  const cards = [
    { title: 'Investments / Stocks', to: '/os/finance/investments', detail: `${data.holdings.length} holdings` },
    { title: 'Family Office Finance', to: '/os/finance/family-office', detail: `${data.familyFinanceRecords.length} records` },
    { title: 'Trading Lab', to: '/os/finance/trading-lab', detail: `${data.tradingSignals.length} signals` },
  ]

  return (
    <section className="space-y-5">
      <header>
        <h2 className="text-3xl font-semibold">Finance</h2>
        <p className="text-sm text-[#615a50]">THB-first investments, family-office back office, and paper-only trading lab.</p>
      </header>

      <div className="grid gap-3 md:grid-cols-3">
        <SourceStatusBadge status={sourceStatuses.investments} />
        <SourceStatusBadge status={sourceStatuses.familyOffice} />
        <SourceStatusBadge status={sourceStatuses.tradingLab} />
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        {cards.map((card) => (
          <Link key={card.to} to={card.to} className="rounded-3xl border border-[#e1d8cb] bg-[#fffaf1] p-4">
            <h3 className="text-lg font-semibold">{card.title}</h3>
            <p className="mt-2 text-sm text-[#625b52]">{card.detail}</p>
          </Link>
        ))}
      </div>

      <ModuleAISummaryPanel moduleName="Finance" suggestions={data.aiSuggestions} />
    </section>
  )
}

