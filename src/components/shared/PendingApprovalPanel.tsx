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
        <h3>Pending Approvals</h3>
        <span className="pill">{items.length}</span>
      </div>
      {items.length === 0 ? (
        <p className="text-sm text-[#6e675d]">No pending actions. Manual-first safety is active.</p>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <article key={item.id} className="rounded-2xl border border-[#e2ddd3] bg-[#faf8f4] p-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-[#1f1c17]">{item.description}</p>
                  <p className="text-xs text-[#6e675d]">
                    {item.module} · {item.actionType} · {formatDateTime(item.requestedAt)}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button className="btn-secondary" onClick={() => onReject(item.id)}>
                    Reject
                  </button>
                  <button className="btn-primary" onClick={() => onApprove(item.id)}>
                    Approve
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}

