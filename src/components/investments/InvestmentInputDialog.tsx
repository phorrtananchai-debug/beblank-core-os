import { useState } from 'react'

export type DialogMode = 'edit-transaction-note' | 'adjust-dca-target' | 'add-research-note'

interface Props {
  mode: DialogMode
  initial?: { notes?: string; amountTHB?: number; title?: string; note?: string; riskLevel?: string }
  onConfirm: (payload: Record<string, unknown>) => void
  onCancel: () => void
}

const config: Record<DialogMode, {
  label: string
  title: string
  fields: Array<{
    key: string
    label: string
    type: 'text' | 'number' | 'textarea' | 'select'
    options?: Array<{ value: string; label: string }>
    defaultValue: string | number
    required?: boolean
  }>
}> = {
  'edit-transaction-note': {
    label: 'Edit Note / แก้ไขบันทึก',
    title: 'แก้ไขบันทึกรายการ',
    fields: [
      { key: 'notes', label: 'Notes / หมายเหตุ', type: 'textarea', defaultValue: '' },
    ],
  },
  'adjust-dca-target': {
    label: 'Adjust Target / ปรับเป้า DCA',
    title: 'ปรับเป้าหมาย DCA',
    fields: [
      { key: 'newAmountTHB', label: 'Amount THB / จำนวนเงิน', type: 'number', defaultValue: 0, required: true },
      { key: 'note', label: 'Note / หมายเหตุ', type: 'textarea', defaultValue: '' },
    ],
  },
  'add-research-note': {
    label: 'Research Note / บันทึกวิจัย',
    title: 'เพิ่มบันทึกวิจัย',
    fields: [
      { key: 'title', label: 'Title / หัวข้อ', type: 'text', defaultValue: 'Research note', required: true },
      { key: 'note', label: 'Thesis / บันทึก', type: 'textarea', defaultValue: '', required: true },
      {
        key: 'riskLevel', label: 'Risk / ความเสี่ยง', type: 'select', defaultValue: 'medium',
        options: [
          { value: 'low', label: 'Low / ต่ำ' },
          { value: 'medium', label: 'Medium / ปานกลาง' },
          { value: 'high', label: 'High / สูง' },
        ],
      },
    ],
  },
}

const submitLabels: Record<DialogMode, string> = {
  'edit-transaction-note': 'Queue Edit / ขอแก้ไข',
  'adjust-dca-target': 'Queue Adjustment / ขอปรับ',
  'add-research-note': 'Queue Note / ขอเพิ่ม',
}

export const InvestmentInputDialog = ({ mode, initial, onConfirm, onCancel }: Props) => {
  const cfg = config[mode]
  const [form, setForm] = useState<Record<string, string | number>>(() => {
    const map: Record<string, string | number> = {}
    for (const field of cfg.fields) {
      map[field.key] = initial?.[field.key as keyof typeof initial] ?? field.defaultValue
    }
    return map
  })

  const set = (key: string, value: string | number) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const isValid = cfg.fields.every((field) => {
    if (!field.required) return true
    const value = form[field.key]
    if (field.type === 'number') return typeof value === 'number' && value > 0
    return typeof value === 'string' && value.trim().length > 0
  })

  return (
    <div className="modal-scrim" onClick={onCancel}>
      <div className="modal-panel max-w-lg" onClick={(e) => e.stopPropagation()}>
        <div className="panel-header">
          <div>
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[#777777]">{cfg.label}</p>
            <h3>{cfg.title}</h3>
          </div>
          <button className="btn-secondary" type="button" onClick={onCancel}>Close / ปิด</button>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {cfg.fields.map((field) => {
            const value = form[field.key] ?? ''
            return (
              <label key={field.key} className={field.type === 'textarea' ? 'md:col-span-2 block' : 'block'}>
                <span className="mb-1 block font-mono text-[9px] font-semibold uppercase tracking-[0.14em] text-[#777777]">{field.label}</span>
                {field.type === 'textarea' ? (
                  <textarea
                    className="input min-h-20"
                    value={String(value)}
                    onChange={(e) => set(field.key, e.target.value)}
                  />
                ) : field.type === 'select' ? (
                  <select className="input" value={String(value)} onChange={(e) => set(field.key, e.target.value)}>
                    {field.options?.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                  </select>
                ) : field.type === 'number' ? (
                  <input
                    className="input"
                    type="number"
                    inputMode="decimal"
                    value={value === 0 ? '' : value}
                    onChange={(e) => set(field.key, Number(e.target.value))}
                  />
                ) : (
                  <input
                    className="input"
                    value={String(value)}
                    onChange={(e) => set(field.key, e.target.value)}
                  />
                )}
              </label>
            )
          })}
        </div>

        <div className="mt-6 flex gap-3">
          <button className="btn-secondary flex-1" type="button" onClick={onCancel}>Cancel / ยกเลิก</button>
          <button className="btn-primary flex-1" type="button" disabled={!isValid} onClick={() => onConfirm(form)}>
            {submitLabels[mode]}
          </button>
        </div>
      </div>
    </div>
  )
}
