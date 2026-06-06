import type { ActionRequest, SiteIssue, Task, TimelineItem } from '../../types/models'

interface Props {
  tasks: Task[]
  timeline: TimelineItem[]
  pendingApprovals: ActionRequest[]
  siteIssues: SiteIssue[]
  onNavigate: (path: string) => void
}

export const DailyFocusCard = ({ tasks, timeline, pendingApprovals, siteIssues, onNavigate }: Props) => {
  const todayTasks = tasks.filter((t) => t.status !== 'done').slice(0, 5)
  const upcomingTimeline = timeline.filter((t) => t.state !== 'completed').slice(0, 3)
  const openRisks = siteIssues.filter((i) => i.severity !== 'low').slice(0, 3)
  const hasContent = todayTasks.length > 0 || pendingApprovals.length > 0 || openRisks.length > 0

  return (
    <div className="os-card-primary">
      <div className="panel-header">
        <div>
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--bb-text-muted)]">DAILY FOCUS</p>
          <h3>Today's Priorities</h3>
        </div>
        <span className="pill">{todayTasks.length + pendingApprovals.length} items</span>
      </div>

      {!hasContent ? (
        <div className="rounded-2xl border border-dashed border-black/[0.08] bg-white/50 p-5 text-center">
          <p className="text-sm font-semibold text-[var(--bb-text-muted)]">No focus items today</p>
          <p className="mt-1 text-xs text-[var(--bb-text-faint)]">Add tasks or create approvals to populate this view.</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl bg-white/50 p-3">
            <p className="font-mono text-[10px] font-semibold uppercase text-[var(--bb-text-muted)]">Today's Tasks</p>
            <p className="mt-1 text-xl font-bold">{todayTasks.length}</p>
            {todayTasks.length > 0 ? (
              <div className="mt-1 space-y-0.5">
                {todayTasks.map((t) => (
                  <p key={t.id} className="truncate text-[10px] text-[var(--bb-text-muted)]">{t.title}</p>
                ))}
              </div>
            ) : (
              <p className="mt-1 text-[10px] text-[var(--bb-text-faint)]">No tasks today</p>
            )}
          </div>

          <div className="rounded-2xl bg-white/50 p-3">
            <p className="font-mono text-[10px] font-semibold uppercase text-[var(--bb-text-muted)]">Timeline</p>
            <p className="mt-1 text-xl font-bold">{upcomingTimeline.length}</p>
            {upcomingTimeline.length > 0 ? (
              <div className="mt-1 space-y-0.5">
                {upcomingTimeline.map((t) => (
                  <p key={t.id} className="truncate text-[10px] text-[var(--bb-text-muted)]">{t.label} / {t.state}</p>
                ))}
              </div>
            ) : (
              <p className="mt-1 text-[10px] text-[var(--bb-text-faint)]">No timeline items</p>
            )}
          </div>

          <div className="rounded-2xl bg-white/50 p-3">
            <p className="font-mono text-[10px] font-semibold uppercase text-[var(--bb-text-muted)]">Pending Approvals</p>
            <p className={`mt-1 text-xl font-bold ${pendingApprovals.length > 0 ? 'text-[var(--bb-amber)]' : ''}`}>{pendingApprovals.length}</p>
            {pendingApprovals.length > 0 ? (
              <div className="mt-1 space-y-0.5">
                {pendingApprovals.slice(0, 2).map((a) => (
                  <p key={a.id} className="truncate text-[10px] text-[var(--bb-text-muted)]" title={a.description}>{a.description}</p>
                ))}
              </div>
            ) : (
              <p className="mt-1 text-[10px] text-[var(--bb-text-faint)]">No pending approvals</p>
            )}
            {pendingApprovals.length > 0 && (
              <button className="mt-2 text-[10px] font-semibold text-[var(--bb-accent)] underline" type="button" onClick={() => onNavigate('/os/studio')}>Review approvals →</button>
            )}
          </div>

          <div className="rounded-2xl border border-black/[0.04] bg-white/75 p-3">
            <p className="font-mono text-[10px] font-semibold uppercase text-[var(--bb-text-muted)]">Open Risks</p>
            <p className={`mt-1 text-xl font-bold ${openRisks.length > 0 ? 'text-red' : 'text-[var(--bb-green)]'}`}>{openRisks.length}</p>
            {openRisks.length > 0 ? (
              <div className="mt-1 space-y-0.5">
                {openRisks.map((r) => (
                  <p key={r.id} className="truncate text-[10px] text-[var(--bb-text-muted)]">{r.issue} / {r.severity}</p>
                ))}
              </div>
            ) : (
              <p className="mt-1 text-[10px] text-[var(--bb-text-faint)]">No open risks</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
