import { formatDateTime } from '../../app/utils'
import type { SnapshotRecord } from '../../types/models'

export const SnapshotLog = ({ items }: { items: SnapshotRecord[] }) => {
  const latest = items[0]

  return (
    <section className="panel">
      <div className="panel-header">
        <h3>Snapshot History</h3>
        <span className="pill">{items.length}</span>
      </div>
      {latest ? <p className="mb-3 rounded-2xl border border-[#e7e2d8] bg-[#faf8f4] p-3 text-xs text-[#6e675d]">Latest snapshot: {latest.reason} / {formatDateTime(latest.createdAt)}</p> : null}
      <div className="space-y-2">
        {items.slice(0, 6).map((item) => (
          <div key={item.id} className="rounded-2xl border border-[#e7e2d8] bg-white px-3 py-2">
            <p className="text-sm font-medium text-[#27231e]">{item.reason}</p>
            <p className="text-xs text-[#71695f]">{item.module} / {formatDateTime(item.createdAt)}</p>
          </div>
        ))}
        {items.length === 0 && <p className="text-sm text-[#6e675d]">No snapshots yet. Approve an action to record a new state.</p>}
      </div>
    </section>
  )
}
