import { useState } from 'react'

interface Props {
  onImport: (module: string, title: string, recommendation: string, riskNotes: string) => void
}

export const AISuggestionImportPanel = ({ onImport }: Props) => {
  const [module, setModule] = useState('Finance')
  const [title, setTitle] = useState('')
  const [recommendation, setRecommendation] = useState('')
  const [riskNotes, setRiskNotes] = useState('')

  return (
    <section className="panel">
      <div className="panel-header">
        <h3>AI Suggestion Import</h3>
      </div>
      <p className="text-sm text-[#6e675d]">Paste Jarvis B summary, preview, then queue approval.</p>
      <div className="mt-3 space-y-2">
        <input className="input" value={module} onChange={(e) => setModule(e.target.value)} placeholder="Module" />
        <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" />
        <textarea
          className="input h-20"
          value={recommendation}
          onChange={(e) => setRecommendation(e.target.value)}
          placeholder="Recommendation"
        />
        <textarea
          className="input h-16"
          value={riskNotes}
          onChange={(e) => setRiskNotes(e.target.value)}
          placeholder="Risk notes"
        />
      </div>
      <button
        className="btn-primary mt-3"
        onClick={() => {
          if (!title || !recommendation) return
          onImport(module, title, recommendation, riskNotes)
          setTitle('')
          setRecommendation('')
          setRiskNotes('')
        }}
      >
        Import Suggestion
      </button>
    </section>
  )
}

