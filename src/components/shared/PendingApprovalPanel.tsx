import { formatDateTime } from '../../app/utils'
import type { ActionRequest } from '../../types/models'

interface Props {
  items: ActionRequest[]
  onApprove: (requestId: string) => void
  onReject: (requestId: string) => void
}

export const PendingApprovalPanel = ({ items, onApprove, onReject }: Props) => {
  return (
    <section className="panel">
      <div className="panel-header">
        <h3>คิวอนุมัติ</h3>
        <span className="pill">{items.length}</span>
      </div>
      {items.length === 0 ? (
        <p className="text-sm text-[#6e675d]">ไม่มีรายการรออนุมัติ สร้าง Action จากหน้าใดก็ได้เพื่อทดสอบขั้นตอนการอนุมัติ</p>
      ) : (
        <div className="space-y-3">
            <p className="rounded-2xl border border-[#e7e2d8] bg-white/80 p-3 text-xs text-[#6e675d]">
              กำลังรอสถานะ การอนุมัติจะทำงานผ่าน mock adapter การปฏิเสธจะบันทึก audit row โดยไม่เปลี่ยนข้อมูล
            </p>
          {items.map((item) => (
            <article key={item.id} className="rounded-2xl border border-[#e2ddd3] bg-[#faf8f4] p-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-[#1f1c17]">{item.description}</p>
                  <p className="text-xs text-[#6e675d]">{item.module} / {item.actionType} / {formatDateTime(item.requestedAt)}</p>
                </div>
                <div className="flex gap-2">
                  <button className="btn-secondary" onClick={() => onReject(item.id)}>ปฏิเสธ</button>
                  <button className="btn-primary" onClick={() => onApprove(item.id)}>อนุมัติ</button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}
