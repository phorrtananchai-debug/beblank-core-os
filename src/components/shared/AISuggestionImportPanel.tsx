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
        <h3>นำเข้าข้อเสนอแนะ AI</h3>
      </div>
      <p className="text-sm text-[#6e675d]">วางสรุปจาก Jarvis B ตรวจสอบ แล้วส่งขออนุมัติ</p>
      <div className="mt-3 space-y-2">
        <input className="input" value={module} onChange={(e) => setModule(e.target.value)} placeholder="โมดูล" />
        <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="หัวข้อ" />
        <textarea
          className="input h-20"
          value={recommendation}
          onChange={(e) => setRecommendation(e.target.value)}
          placeholder="คำแนะนำ"
        />
        <textarea
          className="input h-16"
          value={riskNotes}
          onChange={(e) => setRiskNotes(e.target.value)}
          placeholder="หมายเหตุความเสี่ยง"
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
        นำเข้า
      </button>
    </section>
  )
}

