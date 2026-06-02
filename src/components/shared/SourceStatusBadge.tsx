import { formatDateTime } from '../../app/utils'
import type { SourceStatus } from '../../types/models'

export const SourceStatusBadge = ({ status }: { status: SourceStatus }) => {
  const modeStyle =
    status.mode === 'live'
      ? 'bg-emerald-100 text-emerald-700'
      : status.mode === 'fallback'
        ? 'bg-amber-100 text-amber-700'
        : 'bg-slate-100 text-slate-700'

  return (
    <div className="rounded-2xl border border-[#dfd8cc] bg-white/85 px-4 py-3 text-sm text-[#2c2924]">
      <div className="flex items-center justify-between gap-3">
        <span className="font-semibold">{status.sourceName}</span>
        <span className={`rounded-full px-2 py-1 text-xs font-semibold uppercase tracking-wide ${modeStyle}`}>
          {status.mode}
        </span>
      </div>
      <div className="mt-2 text-xs text-[#6e675d]">Last synced: {formatDateTime(status.lastSyncedAt)}</div>
      <div className={`mt-1 text-xs font-medium ${status.isStale ? 'text-amber-700' : 'text-emerald-700'}`}>
        {status.isStale ? 'Stale data detected' : 'Fresh mock sync'}
      </div>
    </div>
  )
}

