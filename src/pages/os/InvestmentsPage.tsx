import { ModuleAISummaryPanel } from '../../components/shared/ModuleAISummaryPanel'
import { SourceStatusBadge } from '../../components/shared/SourceStatusBadge'
import { useOs } from '../../core/os/OsContext'

export const InvestmentsPage = () => {
  const { data, sourceStatuses, createActionRequest } = useOs()

  return (
    <section className="space-y-5">
      <header>
        <h2 className="text-3xl font-semibold">Investments / Stocks</h2>
        <p className="text-sm text-[#615a50]">
          Aequitas workflow, THB-first portfolio, DCA planning, dividend estimates, Thai NAV assets, manual approval only.
        </p>
      </header>

      <SourceStatusBadge status={sourceStatuses.investments} />

      <section className="panel">
        <div className="panel-header">
          <h3>Portfolio Holdings</h3>
          <button
            className="btn-primary"
            onClick={() =>
              createActionRequest({
                module: 'finance',
                actionType: 'finance.addTransaction',
                description: 'Queue mock DCA transaction update',
                payload: { description: 'DCA rebalance', amountTHB: 4000, occurredAt: '2026-06-02' },
              })
            }
          >
            Queue DCA Update
          </button>
        </div>
        <div className="grid gap-2 md:grid-cols-2">
          {data.holdings.map((holding) => {
            const asset = data.financeAssets.find((item) => item.id === holding.assetId)
            return (
              <div key={holding.id} className="rounded-2xl border border-[#e7e2d8] bg-white p-3 text-sm">
                <p className="font-medium">{asset?.name}</p>
                <p className="text-xs text-[#6f675d]">Qty: {holding.quantity} · Avg cost: {holding.averageCost} THB</p>
              </div>
            )
          })}
        </div>
      </section>

      <section className="panel">
        <h3 className="text-lg font-semibold">Thai NAV 3 Assets</h3>
        <div className="mt-3 grid gap-2 md:grid-cols-3">
          {data.thaiNavAssets.map((asset) => (
            <div key={asset.id} className="rounded-2xl border border-[#e7e2d8] bg-white p-3 text-sm">
              <p className="font-medium">{asset.symbol}</p>
              <p className="text-xs text-[#6f675d]">NAV {asset.nav} · {asset.updatedAt}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="panel">
        <h3 className="text-lg font-semibold">Imported AI Suggestions</h3>
        <div className="mt-3 space-y-2">
          {data.aiSuggestions
            .filter((item) => item.module.toLowerCase().includes('finance'))
            .map((item) => (
              <div key={item.id} className="rounded-2xl border border-[#e7e2d8] bg-white p-3">
                <p className="text-sm font-semibold">{item.title}</p>
                <p className="text-xs text-[#6f675d]">{item.recommendation}</p>
                <button
                  className="btn-secondary mt-2"
                  onClick={() =>
                    createActionRequest({
                      module: 'ai',
                      actionType: 'ai.applySuggestion',
                      description: `Apply AI suggestion: ${item.title}`,
                      payload: { suggestionId: item.id },
                    })
                  }
                >
                  Queue Apply Suggestion
                </button>
              </div>
            ))}
        </div>
      </section>

      <ModuleAISummaryPanel moduleName="Finance" suggestions={data.aiSuggestions} />
    </section>
  )
}

