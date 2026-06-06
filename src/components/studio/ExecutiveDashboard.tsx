import type { Project, StudioTimelinePhase, TimelineItem, ActionRequest, ApprovalRecord } from '../../types/models'
import { mapPhase, PHASES } from './timelineUtils'
import { computeCriticalPath } from './criticalPath'
import { computeProjectPulse } from './projectPulse'

interface Props {
  projects: Project[]
  phases: StudioTimelinePhase[]
  timeline: TimelineItem[]
  pendingApprovals: ActionRequest[]
  projectApprovals: ApprovalRecord[]
}

function daysUntil(dateStr: string): number {
  return Math.round((new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
}

const MetricCard = ({ label, value, sub, color }: { label: string; value: string; sub: string; color?: string }) => (
  <div className="rounded-xl border border-black/[0.04] bg-white/60 p-3">
    <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.1em] text-[var(--bb-text-muted)]">{label}</p>
    <p className={`mt-1 text-2xl font-extrabold tracking-tight ${color ?? ''}`}>{value}</p>
    <p className="mt-0.5 text-[10px] text-[var(--bb-text-muted)]">{sub}</p>
  </div>
)

export const ExecutiveDashboard = ({ projects, phases, timeline, pendingApprovals, projectApprovals }: Props) => {
  const activeProjects = projects.filter((p) => p.status !== 'paused')
  const atRiskProjects = projects.filter((p) => p.timelineStatus === 'at-risk')
  const watchProjects = projects.filter((p) => p.timelineStatus === 'watch')
  const healthyProjects = activeProjects.filter((p) => p.timelineStatus !== 'at-risk' && p.timelineStatus !== 'watch')

  const upcomingOpenings = phases.filter((p) => (p.phase === 'handover' || p.phase === 'opening') && p.status !== 'complete')
  const next30 = upcomingOpenings.filter((p) => { const d = daysUntil(p.endDate); return d >= 0 && d <= 30 })
  const next60 = upcomingOpenings.filter((p) => { const d = daysUntil(p.endDate); return d > 30 && d <= 60 })
  const overdue = upcomingOpenings.filter((p) => daysUntil(p.endDate) < 0)

  const atRiskTimeline = timeline.filter((t) => t.state === 'at-risk')
  const blockedPhases = phases.filter((p) => p.status === 'blocked')
  const totalPhases = phases.filter((p) => p.projectId !== '')
  const completedPhases = phases.filter((p) => p.status === 'complete')
  const avgProgress = activeProjects.length > 0
    ? Math.round(activeProjects.reduce((sum, p) => {
        const idx = PHASES.findIndex((ph) => ph.id === mapPhase(p.phase ?? ''))
        return sum + (idx >= 0 ? ((idx + 1) / PHASES.length) * 100 : 0)
      }, 0) / activeProjects.length)
    : 0

  const upcomingDeadlines = timeline.filter((t) => {
    const d = daysUntil(t.dueDate)
    return d >= 0 && d <= 7 && t.state !== 'completed'
  })

  const approvalsByProject = projects.map((p) => ({
    project: p,
    count: pendingApprovals.filter((a) => String(a.payload?.projectId ?? '') === p.id || a.description.includes(p.name)).length,
  })).filter((a) => a.count > 0)

  const attentionItems: string[] = []
  if (overdue.length > 0) attentionItems.push(`${overdue.length} overdue opening${overdue.length > 1 ? 's' : ''}`)
  if (atRiskTimeline.length > 0) attentionItems.push(`${atRiskTimeline.length} at-risk timeline item${atRiskTimeline.length > 1 ? 's' : ''}`)
  if (blockedPhases.length > 0) attentionItems.push(`${blockedPhases.length} blocked phase${blockedPhases.length > 1 ? 's' : ''}`)
  const pendingProjectApprovals = projectApprovals.filter((a) => a.status === 'submitted' || a.status === 'waiting')
  const totalApprovalCount = pendingApprovals.length + pendingProjectApprovals.length
  if (totalApprovalCount > 0) attentionItems.push(`${totalApprovalCount} pending approval${totalApprovalCount > 1 ? 's' : ''}`)

  if (activeProjects.length === 0 && totalApprovalCount === 0) return null

  return (
    <section className="space-y-4">
      {/* Executive Summary — top attention items */}
      {attentionItems.length > 0 && (
        <div className="rounded-2xl border border-black/[0.05] bg-[#faf9f8] p-4">
          <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.1em] text-[var(--bb-text-muted)]">Requires Attention</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {attentionItems.map((item, i) => (
              <span key={i} className="inline-flex items-center gap-1.5 rounded-full bg-red/[0.06] px-3 py-1 text-[11px] font-medium text-red/90">{item}</span>
            ))}
          </div>
        </div>
      )}

      {/* Operational KPIs */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <MetricCard label="Active Projects" value={String(activeProjects.length)} sub={`${(activeProjects.length > 0 ? Math.round((healthyProjects.length / activeProjects.length) * 100) : 0)}% healthy`} />
        <MetricCard label="Avg Progress" value={`${avgProgress}%`} sub={`${completedPhases.length}/${totalPhases.length} phases done`} />
        <MetricCard label="At Risk" value={String(atRiskProjects.length + atRiskTimeline.length)} sub={`${blockedPhases.length} blocked phases`} color={atRiskProjects.length + atRiskTimeline.length > 0 ? 'text-red' : ''} />
        <MetricCard label="Pending Action" value={String(totalApprovalCount + upcomingDeadlines.length)} sub={`${upcomingDeadlines.length} due this week`} color={totalApprovalCount + upcomingDeadlines.length > 0 ? 'text-[var(--bb-amber)]' : ''} />
      </div>

      {/* Project Pulse Scores */}
      {activeProjects.length > 0 && (
        <div className="rounded-xl border border-black/[0.04] bg-white/60 p-3">
          <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.1em] text-[var(--bb-text-muted)]">Project Pulse</p>
          <div className="mt-2 space-y-1">
            {activeProjects.map((p) => {
              const pulse = computeProjectPulse(p, phases, timeline, projectApprovals)
              return (
                <div key={p.id} className="flex items-center gap-2 text-sm">
                  <span className={`inline-flex items-center justify-center h-5 w-8 rounded-full font-mono text-[9px] font-bold leading-none ${
                    pulse.band === 'risk' ? 'bg-red/10 text-red' :
                    pulse.band === 'watch' ? 'bg-[var(--bb-amber)]/10 text-[var(--bb-amber)]' :
                    'bg-[var(--bb-green)]/10 text-[var(--bb-green)]'
                  }`}>{pulse.score}</span>
                  <span className="font-semibold">{p.name}</span>
                  {pulse.drivers.length > 0 && <span className="text-[10px] text-[var(--bb-text-muted)]">— {pulse.drivers.join(', ')}</span>}
                </div>
              )
            })}
          </div>
        </div>
      )}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* Studio Health */}
        <div className="rounded-xl border border-black/[0.04] bg-white/60 p-3">
          <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.1em] text-[var(--bb-text-muted)]">Studio Health</p>
          <div className="mt-2 flex gap-3">
            <div className="flex items-center gap-1.5 text-sm">
              <span className="inline-block h-2 w-2 rounded-full bg-[var(--bb-green)]" />
              <span className="font-semibold">{healthyProjects.length}</span>
              <span className="text-[var(--bb-text-muted)]">healthy</span>
            </div>
            <div className="flex items-center gap-1.5 text-sm">
              <span className="inline-block h-2 w-2 rounded-full bg-[var(--bb-amber)]" />
              <span className="font-semibold">{watchProjects.length}</span>
              <span className="text-[var(--bb-text-muted)]">watch</span>
            </div>
            <div className="flex items-center gap-1.5 text-sm">
              <span className="inline-block h-2 w-2 rounded-full bg-red" />
              <span className="font-semibold">{atRiskProjects.length}</span>
              <span className="text-[var(--bb-text-muted)]">risk</span>
            </div>
          </div>
          {activeProjects.length === 0 && <p className="mt-2 text-[10px] text-[var(--bb-text-faint)]">No active projects</p>}
        </div>

        {/* Upcoming Openings */}
        <div className="rounded-xl border border-black/[0.04] bg-white/60 p-3">
          <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.1em] text-[var(--bb-text-muted)]">Upcoming Openings</p>
          <div className="mt-2 space-y-1">
            {overdue.length > 0 && <p className="text-sm"><span className="font-semibold text-red">{overdue.length} overdue</span> <span className="text-[var(--bb-text-muted)]">— past due date</span></p>}
            {next30.length > 0 && <p className="text-sm"><span className="font-semibold text-[var(--bb-amber)]">{next30.length} within 30d</span></p>}
            {next60.length > 0 && <p className="text-sm"><span className="font-semibold">{next60.length} within 60d</span></p>}
            {upcomingOpenings.length === 0 && <p className="text-[10px] text-[var(--bb-text-faint)]">No upcoming openings</p>}
          </div>
        </div>

        {/* Critical This Week */}
        <div className="rounded-xl border border-black/[0.04] bg-white/60 p-3">
          <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.1em] text-[var(--bb-text-muted)]">Critical This Week</p>
          <div className="mt-2 space-y-1">
            {upcomingDeadlines.length > 0 && (
              <div>
                <p className="text-sm font-semibold text-[var(--bb-amber)]">{upcomingDeadlines.length} deadlines due</p>
                {upcomingDeadlines.slice(0, 2).map((t) => (
                  <p key={t.id} className="text-[10px] text-[var(--bb-text-muted)] truncate">{t.label} — {t.dueDate}</p>
                ))}
              </div>
            )}
            {next30.length > 0 && <p className="text-sm"><span className="font-semibold text-[var(--bb-amber)]">{next30.length} opening{next30.length > 1 ? 's' : ''} within 30d</span></p>}
            {overdue.length > 0 && <p className="text-sm font-semibold text-red">{overdue.length} overdue action{overdue.length > 1 ? 's' : ''}</p>}
            {upcomingDeadlines.length === 0 && next30.length === 0 && overdue.length === 0 && <p className="text-[10px] text-[var(--bb-text-faint)]">No critical items this week</p>}
          </div>
        </div>
      </div>

      {/* Projects At Risk */}
      {(atRiskProjects.length > 0 || atRiskTimeline.length > 0 || watchProjects.length > 0 || blockedPhases.length > 0) && (
        <div className="rounded-xl border border-red/10 bg-red/[0.03] p-3">
          <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.1em] text-red">Projects at Risk</p>
          <div className="mt-2 space-y-1.5">
            {atRiskProjects.map((p) => (
              <div key={p.id} className="flex items-center gap-2 text-sm">
                <span className="inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-red" />
                <span className="font-semibold">{p.name}</span>
                <span className="text-[var(--bb-text-muted)]">risk</span>
              </div>
            ))}
            {watchProjects.filter((p) => !atRiskProjects.includes(p)).map((p) => (
              <div key={p.id} className="flex items-center gap-2 text-sm">
                <span className="inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--bb-amber)]" />
                <span className="font-semibold">{p.name}</span>
                <span className="text-[var(--bb-text-muted)]">watch</span>
              </div>
            ))}
            {blockedPhases.slice(0, 3).map((p) => {
              const proj = projects.find((pr) => pr.id === p.projectId)
              return (
                <div key={p.id} className="flex items-center gap-2 text-sm">
                  <span className="inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-red" />
                  <span>{proj?.name ?? 'Unknown'} — blocked: {p.phase}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

        {/* Critical Path — next blocking item per project */}
      {activeProjects.length > 0 && (
        <div className="rounded-xl border border-black/[0.04] bg-white/60 p-3">
          <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.1em] text-[var(--bb-text-muted)]">Critical Path</p>
          <div className="mt-2 space-y-1.5">
            {activeProjects.map((p) => {
              const cp = computeCriticalPath(p, phases, timeline, projectApprovals)
              const dotColor = cp.severity === 'risk' ? 'bg-red' : cp.severity === 'watch' ? 'bg-[var(--bb-amber)]' : 'bg-[var(--bb-green)]'
              return (
                <div key={p.id} className="flex items-center gap-2 text-sm">
                  <span className={`inline-block h-1.5 w-1.5 shrink-0 rounded-full ${dotColor}`} />
                  <span className="font-semibold">{p.name}:</span>
                  <span className="text-[var(--bb-text-muted)]">{cp.label}</span>
                  {cp.dueDate && <span className="text-[10px] text-[var(--bb-text-faint)]">{cp.dueDate}</span>}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Pending Approvals grouped */}
      {approvalsByProject.length > 0 || pendingProjectApprovals.length > 0 && (
        <div className="rounded-xl border border-black/[0.04] bg-white/60 p-3">
          <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.1em] text-[var(--bb-text-muted)]">Pending Approvals</p>
          <div className="mt-2 space-y-1">
            {approvalsByProject.map((a) => (
              <p key={a.project.id} className="text-sm"><span className="font-semibold">{a.project.name}</span>: {a.count} approval{a.count > 1 ? 's' : ''}</p>
            ))}
            {pendingProjectApprovals.length > 0 && <p className="text-sm"><span className="font-semibold">Sheet-backed</span>: {pendingProjectApprovals.length} pending</p>}
            {totalApprovalCount > 0 && (
              <p className="mt-1 text-[10px] text-[var(--bb-text-faint)]">{totalApprovalCount} total pending</p>
            )}
          </div>
        </div>
      )}
    </section>
  )
}
