import type { AISuggestion } from '../../types/models'

export const ModuleAISummaryPanel = ({ moduleName, suggestions }: { moduleName: string; suggestions: AISuggestion[] }) => {
  const scoped = suggestions.filter((item) => item.module.toLowerCase().includes(moduleName.toLowerCase()))

  return (
    <section className="panel">
      <div className="panel-header">
        <h3>{moduleName} AI Summary</h3>
        <span className="pill">{scoped.length}</span>
      </div>
      {scoped.length === 0 ? (
        <p className="text-sm text-[#6e675d]">No imported suggestions yet.</p>
      ) : (
        <div className="space-y-2">
          {scoped.map((item) => (
            <div key={item.id} className="rounded-2xl border border-[#e5dfd4] bg-white p-3">
              <p className="text-sm font-semibold text-[#26221c]">{item.title}</p>
              <p className="mt-1 text-xs text-[#6f675d]">{item.recommendation}</p>
              <p className="mt-1 text-xs text-[#8a806f]">Risk: {item.riskNotes || 'N/A'}</p>
              <p className="mt-1 text-xs font-medium text-[#b45f2f] uppercase">{item.status}</p>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

