import type { Project, Task, TimelineItem } from '../../types/models'

interface Props {
  projects: Project[]
  tasks: Task[]
  timeline: TimelineItem[]
}

const phaseColors: Record<string, string> = {
  'feasibility': 'bg-black/[0.2]',
  'concept-design': 'bg-[var(--bb-blue)]',
  'schematic-design': 'bg-[var(--bb-accent)]',
  'design-review': 'bg-[var(--bb-amber)]',
  'design': 'bg-[var(--bb-accent)]',
  'drawing': 'bg-[var(--bb-accent)]/70',
  'approval': 'bg-[var(--bb-amber)]',
  'construction': 'bg-[var(--bb-amber)]/80',
  'site-handoff': 'bg-[var(--bb-green)]',
  'operations': 'bg-[var(--bb-green)]/70',
}

const statusDot = (status: Project['timelineStatus']) => {
  if (status === 'steady') return 'bg-[var(--bb-green)]'
  if (status === 'watch') return 'bg-[var(--bb-amber)]'
  if (status === 'at-risk') return 'bg-red'
  return 'bg-black/[0.12]'
}

export const StudioHealthCard = ({ projects, tasks, timeline }: Props) => {
  const activeProjects = projects.filter((p) => p.status !== 'paused')
  const upcomingDeadlines = timeline.filter((t) => t.state !== 'completed').slice(0, 3)
  const pendingTasks = tasks.filter((t) => t.status !== 'done')
  const atRisk = timeline.filter((t) => t.state === 'at-risk')

  const totalTasks = tasks.length
  const completedTasks = tasks.filter((t) => t.status === 'done').length
  const taskProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

  return (
    <div className="os-section-card">
      <div className="panel-header">
        <div>
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--bb-text-muted)]">STUDIO HEALTH</p>
          <h3>Studio Health</h3>
        </div>
        <span className="pill">{activeProjects.length} active</span>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl bg-white/50 p-3">
          <p className="font-mono text-[10px] font-semibold uppercase text-[var(--bb-text-muted)]">◇ Active Projects</p>
          <p className="mt-1 text-xl font-bold">{activeProjects.length}</p>
          {activeProjects.length > 0 ? (
            <>
              <div className="mt-2 flex gap-1">
                {activeProjects.slice(0, 5).map((p) => (
                  <span key={p.id} className={`inline-block h-2 w-2 rounded-full ${statusDot(p.timelineStatus)}`} title={`${p.name}: ${p.timelineStatus ?? 'steady'}`} />
                ))}
              </div>
              <div className="mt-1.5 flex gap-1">
                {activeProjects.slice(0, 5).map((p) => (
                  <span key={p.id} className={`inline-block h-4 flex-1 rounded-sm ${phaseColors[p.phase ?? ''] ?? 'bg-black/[0.08]'}`} title={`${p.name}: ${p.phase ?? 'no phase'}`} />
                ))}
              </div>
            </>
          ) : (
            <p className="mt-1 text-[10px] text-[var(--bb-text-faint)]">No active projects</p>
          )}
        </div>

        <div className="rounded-2xl bg-white/50 p-3">
          <p className="font-mono text-[10px] font-semibold uppercase text-[var(--bb-text-muted)]">⏱ Upcoming Deadlines</p>
          <p className="mt-1 text-xl font-bold">{upcomingDeadlines.length}</p>
          {upcomingDeadlines.length > 0 ? (
            <div className="mt-1 space-y-0.5">
              {upcomingDeadlines.map((d) => (
                <p key={d.id} className="truncate text-[10px] text-[var(--bb-text-muted)]">{d.label} — {d.dueDate}</p>
              ))}
            </div>
          ) : (
            <p className="mt-1 text-[10px] text-[var(--bb-text-faint)]">No upcoming deadlines</p>
          )}
        </div>

        <div className="rounded-2xl bg-white/50 p-3">
          <p className="font-mono text-[10px] font-semibold uppercase text-[var(--bb-text-muted)]">☑ Pending Tasks</p>
          <p className={`mt-1 text-xl font-bold ${pendingTasks.length > 5 ? 'text-[var(--bb-amber)]' : ''}`}>{pendingTasks.length}</p>
          <div className="mt-2 h-1.5 w-full rounded-full bg-black/[0.06]">
            <div className="h-full rounded-full bg-[var(--bb-green)] transition-all" style={{ width: `${taskProgress}%` }} />
          </div>
          <p className="mt-1 text-[10px] text-[var(--bb-text-muted)]">{taskProgress}% complete</p>
        </div>

        <div className="rounded-2xl bg-white/50 p-3">
          <p className="font-mono text-[10px] font-semibold uppercase text-[var(--bb-text-muted)]">⚠ At Risk</p>
          <p className={`mt-1 text-xl font-bold ${atRisk.length > 0 ? 'text-red' : 'text-[var(--bb-green)]'}`}>
            {atRisk.length > 0 ? <span className="inline-flex items-center gap-1">{atRisk.length} <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-red" /></span> : atRisk.length}
          </p>
          <p className="mt-1 text-[10px] text-[var(--bb-text-muted)]">{atRisk.length > 0 ? `${atRisk.length} items flagged` : 'All on track'}</p>
        </div>
      </div>
    </div>
  )
}
