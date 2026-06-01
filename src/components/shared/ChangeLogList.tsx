import { formatDateTime } from '../../app/utils'
import type { ChangeLogRecord } from '../../types/models'

export const ChangeLogList = ({ items }: { items: ChangeLogRecord[] }) => {
  return (
    <section className="panel">
      <div className="panel-header">
        <h3>Change Log</h3>
        <span className="pill">{items.length}</span>
      </div>
      <div className="space-y-2">
        {items.slice(0, 6).map((item) => (
          <div key={item.id} className="rounded-2xl border border-[#e7e2d8] bg-white px-3 py-2">
            <p className="text-sm font-medium text-[#27231e]">{item.summary}</p>
            <p className="text-xs text-[#71695f]">
              {item.module} · {formatDateTime(item.changedAt)}
            </p>
          </div>
        ))}
        {items.length === 0 && <p className="text-sm text-[#6e675d]">No write activity yet.</p>}
      </div>
    </section>
  )
}

