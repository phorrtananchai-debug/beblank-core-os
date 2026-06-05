import { useState } from 'react'
import type { FinanceLedgerRow } from '../../types/models'

interface Props {
  row: FinanceLedgerRow
  onConfirm: () => void
  onCancel: () => void
}

export const DeleteLedgerDialog = ({ row, onConfirm, onCancel }: Props) => {
  const [step, setStep] = useState<'confirm' | 'verify'>('confirm')

  return (
    <div className="modal-scrim" onClick={onCancel}>
      <div className="modal-panel max-w-sm" onClick={(e) => e.stopPropagation()}>
        <div className="panel-header">
          <div>
            <p className="text-[10px] font-semibold text-[#777777]">Delete / ลบ</p>
            <h3>Confirm Delete / ยืนยันการลบ</h3>
          </div>
          <button className="btn-secondary" type="button" onClick={onCancel}>ปิด</button>
        </div>

        <div className="rounded-2xl border border-black/[0.05] bg-[#faf9f8] p-4">
          <p className="font-semibold">{row.label}</p>
          <p className="mt-1 text-xs text-[#777777]">{row.category} / {row.direction === 'inflow' ? 'รายรับ' : 'รายจ่าย'} / {Math.round(row.amountTHB).toLocaleString()} THB / {row.occurredAt}</p>
        </div>

        {step === 'confirm' ? (
          <>
            <p className="mt-4 text-sm leading-6 text-[#666666]">คุณแน่ใจหรือไม่ที่จะลบรายการนี้？ การดำเนินการนี้ต้องผ่านการอนุมัติ</p>
            <div className="mt-5 flex gap-3">
              <button className="btn-secondary flex-1" type="button" onClick={onCancel}>Cancel / ยกเลิก</button>
              <button className="btn-primary flex-1 !bg-[#c2410c]" type="button" onClick={() => setStep('verify')}>Delete / ลบ</button>
            </div>
          </>
        ) : (
          <>
            <p className="mt-4 text-sm leading-6 font-semibold text-[#c2410c]">ยืนยันอีกครั้ง: กด "Confirm" เพื่อส่งคำขอลบ</p>
            <div className="mt-5 flex gap-3">
              <button className="btn-secondary flex-1" type="button" onClick={() => setStep('confirm')}>Back / กลับ</button>
              <button className="btn-primary flex-1 !bg-[#c2410c]" type="button" onClick={onConfirm}>Confirm / ยืนยัน</button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
