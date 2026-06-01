import { useState } from 'react'
import type { AIContext } from '../../types/models'

export const AIContextExportPanel = ({ contexts }: { contexts: AIContext[] }) => {
  const [selectedId, setSelectedId] = useState(contexts[0]?.id ?? '')

  const selected = contexts.find((item) => item.id === selectedId)

  return (
    <section className="panel">
      <div className="panel-header">
        <h3>AI Context Export</h3>
      </div>
      <p className="text-sm text-[#6e675d]">Manual-first: export context and send to Jarvis B yourself.</p>
      <select
        className="mt-3 w-full rounded-xl border border-[#dad3c7] bg-white px-3 py-2 text-sm"
        value={selectedId}
        onChange={(event) => setSelectedId(event.target.value)}
      >
        {contexts.map((item) => (
          <option key={item.id} value={item.id}>
            {item.title}
          </option>
        ))}
      </select>
      <textarea
        readOnly
        value={selected?.body ?? 'No context yet.'}
        className="mt-3 h-28 w-full rounded-xl border border-[#dad3c7] bg-[#fcfbf9] px-3 py-2 text-xs text-[#4a443c]"
      />
    </section>
  )
}

