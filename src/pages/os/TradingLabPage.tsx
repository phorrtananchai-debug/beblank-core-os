import { ModuleAISummaryPanel } from '../../components/shared/ModuleAISummaryPanel'
import { SourceStatusBadge } from '../../components/shared/SourceStatusBadge'
import { useOs } from '../../core/os/OsContext'

export const TradingLabPage = () => {
  const { data, sourceStatuses, createActionRequest } = useOs()

  return (
    <section className="space-y-5">
      <header>
        <h2 className="text-3xl font-semibold">Trading Lab</h2>
        <p className="text-sm text-[#615a50]">
          High-risk sandbox for paper trading only. No broker execution, no auto trading, no real orders.
        </p>
      </header>

      <SourceStatusBadge status={sourceStatuses.tradingLab} />

      <section className="panel">
        <div className="panel-header">
          <h3>Signal Log</h3>
          <button
            className="btn-primary"
            onClick={() =>
              createActionRequest({
                module: 'trading',
                actionType: 'trading.addSignal',
                description: 'Queue new paper-trading watch signal',
                payload: { symbol: 'ADVANC', confidence: 58, note: 'Manual chart read only' },
              })
            }
          >
            Queue Signal
          </button>
        </div>
        <div className="space-y-2">
          {data.tradingSignals.map((signal) => (
            <div key={signal.id} className="rounded-2xl border border-[#e7e2d8] bg-white p-3 text-sm">
              <p className="font-medium">{signal.symbol}</p>
              <p className="text-xs text-[#6f675d]">
                {signal.signal} · {signal.confidence}% · {signal.note}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="panel">
        <h3 className="text-lg font-semibold">Strategy Notes</h3>
        <div className="mt-3 grid gap-2 md:grid-cols-2">
          {data.tradingStrategyNotes.map((item) => (
            <div key={item.id} className="rounded-2xl border border-[#e7e2d8] bg-white p-3 text-sm">
              <p className="font-medium">{item.title}</p>
              <p className="text-xs text-[#6f675d]">{item.note}</p>
              <p className="mt-1 text-xs uppercase tracking-wide text-[#a0693f]">Risk {item.riskLevel}</p>
            </div>
          ))}
        </div>
      </section>

      <ModuleAISummaryPanel moduleName="Trading" suggestions={data.aiSuggestions} />
    </section>
  )
}

