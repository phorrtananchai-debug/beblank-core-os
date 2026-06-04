import { useState } from 'react'
import type { FinanceLedgerRow } from '../../types/models'

export interface LedgerFormData {
  label: string
  amountTHB: number
  direction: 'inflow' | 'outflow'
  category: FinanceLedgerRow['category']
  occurredAt: string
  notes: string
  risk: 'low' | 'medium' | 'high'
  tags: string
}

interface Props {
  initial?: Partial<LedgerFormData>
  onSubmit: (data: LedgerFormData) => void
  onCancel: () => void
  title: string
}

const empty: LedgerFormData = {
  label: '',
  amountTHB: 0,
  direction: 'outflow',
  category: 'expense',
  occurredAt: new Date().toISOString().slice(0, 10),
  notes: '',
  risk: 'low',
  tags: '',
}

const categories: { value: FinanceLedgerRow['category']; label: string }[] = [
  { value: 'studio-income', label: 'Studio Income' },
  { value: 'project-payment', label: 'Project Payment' },
  { value: 'subscription', label: 'Subscription' },
  { value: 'equipment', label: 'Equipment' },
  { value: 'debt', label: 'Debt' },
  { value: 'reserve-transfer', label: 'Reserve Transfer' },
  { value: 'expense', label: 'Expense' },
]

export const LedgerForm = ({ initial, onSubmit, onCancel, title }: Props) => {
  const [form, setForm] = useState<LedgerFormData>({ ...empty, ...initial })

  const set = (field: keyof LedgerFormData, value: string | number) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = () => {
    if (!form.label.trim()) return
    if (form.amountTHB <= 0) return
    onSubmit(form)
  }

  const isValid = form.label.trim().length > 0 && form.amountTHB > 0

  return (
    <div className="modal-scrim" onClick={onCancel}>
      <div className="modal-panel max-w-lg" onClick={(e) => e.stopPropagation()}>
        <div className="panel-header">
          <div>
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[#777777]">Ledger / บัญชีรายการ</p>
            <h3>{title}</h3>
          </div>
          <button className="btn-secondary" type="button" onClick={onCancel}>Close</button>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="block">
            <span className="mb-1 block font-mono text-[9px] font-semibold uppercase tracking-[0.14em] text-[#777777]">Label / รายการ</span>
            <input className="input" value={form.label} onChange={(e) => set('label', e.target.value)} placeholder="เช่น ค่าเช่าสตูดิโอ" />
          </label>
          <label className="block">
            <span className="mb-1 block font-mono text-[9px] font-semibold uppercase tracking-[0.14em] text-[#777777]">Amount THB / จำนวนเงิน</span>
            <input className="input" type="number" inputMode="decimal" value={form.amountTHB || ''} onChange={(e) => set('amountTHB', Number(e.target.value))} placeholder="0" />
          </label>
          <label className="block">
            <span className="mb-1 block font-mono text-[9px] font-semibold uppercase tracking-[0.14em] text-[#777777]">Direction / ทิศทาง</span>
            <select className="input" value={form.direction} onChange={(e) => set('direction', e.target.value)}>
              <option value="inflow">Inflow / รายรับ</option>
              <option value="outflow">Outflow / รายจ่าย</option>
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block font-mono text-[9px] font-semibold uppercase tracking-[0.14em] text-[#777777]">Category / หมวดหมู่</span>
            <select className="input" value={form.category} onChange={(e) => set('category', e.target.value)}>
              {categories.map((cat) => <option key={cat.value} value={cat.value}>{cat.label}</option>)}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block font-mono text-[9px] font-semibold uppercase tracking-[0.14em] text-[#777777]">Date / วันที่</span>
            <input className="input" type="date" value={form.occurredAt} onChange={(e) => set('occurredAt', e.target.value)} />
          </label>
          <label className="block">
            <span className="mb-1 block font-mono text-[9px] font-semibold uppercase tracking-[0.14em] text-[#777777]">Risk / ความเสี่ยง</span>
            <select className="input" value={form.risk} onChange={(e) => set('risk', e.target.value)}>
              <option value="low">Low / ต่ำ</option>
              <option value="medium">Medium / ปานกลาง</option>
              <option value="high">High / สูง</option>
            </select>
          </label>
          <label className="block md:col-span-2">
            <span className="mb-1 block font-mono text-[9px] font-semibold uppercase tracking-[0.14em] text-[#777777]">Notes / หมายเหตุ</span>
            <textarea className="input min-h-16" value={form.notes} onChange={(e) => set('notes', e.target.value)} placeholder="บันทึกเพิ่มเติม..." />
          </label>
          <label className="block md:col-span-2">
            <span className="mb-1 block font-mono text-[9px] font-semibold uppercase tracking-[0.14em] text-[#777777]">Tags / แท็ก</span>
            <input className="input" value={form.tags} onChange={(e) => set('tags', e.target.value)} placeholder="เช่น studio, recurring" />
          </label>
        </div>

        <div className="mt-6 flex gap-3">
          <button className="btn-secondary flex-1" type="button" onClick={onCancel}>Cancel / ยกเลิก</button>
          <button className="btn-primary flex-1" type="button" disabled={!isValid} onClick={handleSubmit}>
            {initial ? 'Queue Edit / ขอแก้ไข' : 'Queue for Approval / ขออนุมัติ'}
          </button>
        </div>
      </div>
    </div>
  )
}
