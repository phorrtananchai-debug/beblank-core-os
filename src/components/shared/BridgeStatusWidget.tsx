import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { loadWriteHistory, loadWriteStatusSummary } from '../../core/sheetBridge/writeback'

export const BridgeStatusWidget = () => {
  const navigate = useNavigate()

  const history = useMemo(() => loadWriteHistory(), [])
  const statusSummary = useMemo(() => loadWriteStatusSummary(), [])

  const today = new Date().toISOString().slice(0, 10)
  const todaySuccess = history.filter((h) => h.status === 'success' && h.writtenAt.startsWith(today)).length
  const todayFailed = history.filter((h) => h.status === 'failed' && h.writtenAt.startsWith(today)).length
  const lastWrite = history.length > 0 ? history[0] : null

  return (
    <section className="os-reference-card">
      <div className="panel-header">
        <h3>Sheet Bridge</h3>
        <span className="pill">{history.length} writes</span>
      </div>

      {history.length === 0 && statusSummary.pending === 0 ? (
        <div className="rounded-2xl border border-dashed border-black/[0.08] bg-white/50 p-3 text-center">
          <p className="text-xs font-semibold text-[var(--bb-text-muted)]">No bridge activity yet</p>
          <p className="mt-0.5 text-[10px] text-[var(--bb-text-faint)]">
            Configure the sheet bridge at{' '}
            <button className="underline hover:text-[var(--bb-accent)]" type="button" onClick={() => navigate('/os/bridge')}>
              Bridge Settings
            </button>
          </p>
        </div>
      ) : (
        <div className="mt-2 space-y-3">
          {/* Quick stats */}
          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-xl bg-white/60 p-2 text-center">
              <p className="font-mono text-[10px] font-semibold uppercase text-[var(--bb-text-muted)]">Today</p>
              <p className="text-sm font-bold text-[var(--bb-green)]">{todaySuccess}</p>
            </div>
            <div className="rounded-xl bg-white/60 p-2 text-center">
              <p className="font-mono text-[10px] font-semibold uppercase text-[var(--bb-text-muted)]">Failed</p>
              <p className={`text-sm font-bold ${todayFailed > 0 ? 'text-red' : 'text-[var(--bb-text-muted)]'}`}>{todayFailed}</p>
            </div>
            <div className="rounded-xl bg-white/60 p-2 text-center">
              <p className="font-mono text-[10px] font-semibold uppercase text-[var(--bb-text-muted)]">Pending</p>
              <p className={`text-sm font-bold ${statusSummary.pending > 0 ? 'text-[var(--bb-amber)]' : 'text-[var(--bb-text-muted)]'}`}>{statusSummary.pending}</p>
            </div>
          </div>

          {/* Pending breakdown */}
          {(statusSummary.approved > 0 || statusSummary.failed > 0) && (
            <div className="flex gap-3 text-[10px] text-[var(--bb-text-muted)]">
              {statusSummary.approved > 0 && <span>{statusSummary.approved} approved</span>}
              {statusSummary.failed > 0 && <span className="text-red/70">{statusSummary.failed} failed to write</span>}
            </div>
          )}

          {/* Last write */}
          {lastWrite && (
            <div className="rounded-xl bg-white/60 p-2">
              <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.1em] text-[var(--bb-text-muted)]">Last write</p>
              <div className="mt-1 flex items-center justify-between">
                <div className="min-w-0">
                  <p className="truncate text-xs font-semibold">{lastWrite.resourceName} / {lastWrite.payloadSummary}</p>
                  <p className="text-[10px] text-[var(--bb-text-faint)]">{new Date(lastWrite.writtenAt).toLocaleString()}</p>
                </div>
                <span className={`shrink-0 pill ${lastWrite.status === 'success' ? 'text-[var(--bb-green)]' : 'text-red bg-red/5'}`}>
                  {lastWrite.status}
                </span>
              </div>
            </div>
          )}

          {/* CTA */}
          <button
            className="w-full rounded-xl bg-white/50 py-2 text-xs font-semibold text-[var(--bb-text-muted)] transition hover:bg-black/[0.04] hover:text-[var(--bb-text)]"
            type="button"
            onClick={() => navigate('/os/bridge')}
          >
            Bridge Settings →
          </button>
        </div>
      )}
    </section>
  )
}
