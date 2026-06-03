import { formatDateTime } from '../../app/utils'
import type { ChangeLogRecord } from '../../types/models'

export const ChangeLogList = ({ items }: { items: ChangeLogRecord[] }) => {
  const latest = items[0]

  return (
    <section className="panel editorial-thai">
      <div className="panel-header">
        <h3>ChangeLog / ?????????????????????</h3>
        <span className="pill">{items.length}</span>
      </div>
      {latest ? <p className="mb-3 rounded-2xl border border-[#e7e2d8] bg-[#faf8f4] p-3 text-xs text-[#6e675d]">??????: {latest.summary} / {formatDateTime(latest.changedAt)}</p> : null}
      <div className="space-y-2">
        {items.slice(0, 6).map((item) => (
          <div key={item.id} className="rounded-2xl border border-[#e7e2d8] bg-white px-3 py-2">
            <p className="text-sm font-medium text-[#27231e]">{item.summary}</p>
            <p className="text-xs text-[#71695f]">{item.module} / {item.actionType} / {formatDateTime(item.changedAt)}</p>
          </div>
        ))}
        {items.length === 0 && <p className="text-sm text-[#6e675d]">???????? write activity approve ???? reject action ?????????? audit feedback</p>}
      </div>
    </section>
  )
}
