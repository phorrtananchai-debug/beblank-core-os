import { buildActivityFeedModel } from '../../core/events/buildActivityFeedModel'
import { useCommandEvents } from '../../core/events/useCommandEvents'

type Mood = 'calm' | 'busy' | 'review-needed' | 'offline'

const moodDot: Record<Mood, string> = {
  calm: 'bg-[#16a36a]',
  busy: 'bg-[var(--bb-accent)]',
  'review-needed': 'bg-[#c2410c]',
  offline: 'bg-black/[0.12]',
}

const moodLabel: Record<Mood, string> = {
  calm: 'Calm',
  busy: 'Busy',
  'review-needed': 'Review Needed',
  offline: 'Offline',
}

const severityTone: Record<'INFO' | 'SUCCESS' | 'WARNING' | 'CRITICAL', string> = {
  INFO: 'text-[var(--bb-text-faint)]',
  SUCCESS: 'text-[#4b5563]',
  WARNING: 'text-[#92400e]',
  CRITICAL: 'text-[#7f1d1d]',
}

const severityDot: Record<'INFO' | 'SUCCESS' | 'WARNING' | 'CRITICAL', string> = {
  INFO: 'bg-black/[0.18]',
  SUCCESS: 'bg-[#6b7280]',
  WARNING: 'bg-[#a16207]',
  CRITICAL: 'bg-[#991b1b]',
}

const EventColumn = ({
  title,
  rows,
}: {
  title: string
  rows: ReturnType<typeof buildActivityFeedModel>['rows']
}) => (
  <div className="rounded-[10px] border border-[var(--bb-border)] bg-[var(--bb-surface-2)] p-3">
    <div className="flex items-center justify-between gap-2">
      <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.1em] text-[var(--bb-text-faint)]">{title}</p>
      <span className="pill">{rows.length}</span>
    </div>
    <div className="mt-2 space-y-1.5">
      {rows.length === 0 ? (
        <p className="text-[11px] text-[var(--bb-text-muted)]">No events in this range.</p>
      ) : (
        rows.map((row) => (
          <div key={row.id} className="border-b border-[var(--bb-border)] pb-2 last:border-b-0 last:pb-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className={`inline-block h-1.5 w-1.5 shrink-0 rounded-full ${severityDot[row.severity]}`} />
                  <p className={`font-mono text-[9px] font-semibold uppercase tracking-[0.1em] ${severityTone[row.severity]}`}>{row.severity}</p>
                  <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.1em] text-[var(--bb-text-faint)]">{row.sourceLabel}</p>
                </div>
                <p className="mt-1 text-[11px] font-semibold leading-5 text-[var(--bb-text)]">{row.title}</p>
                <p className="mt-0.5 text-[11px] leading-5 text-[var(--bb-text-muted)]">{row.message}</p>
                <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.1em] text-[var(--bb-text-faint)]">{row.divisionLabel}</p>
              </div>
              <span className="shrink-0 font-mono text-[9px] text-[var(--bb-text-faint)]">{row.timestampLabel}</span>
            </div>
          </div>
        ))
      )}
    </div>
  </div>
)

export const ActivityFeed = ({
  systemMood,
  topPriorities,
  staleSourcesCount,
  runningAgents,
  divisions,
}: {
  systemMood: string
  topPriorities: string[]
  staleSourcesCount: number
  runningAgents: Array<{ id: string; name: string; currentTask: string }>
  divisions: Array<{ id: string; name: string; mood: Mood }>
}) => {
  const { commandEvents } = useCommandEvents()
  const eventModel = buildActivityFeedModel(commandEvents)

  const hasDerivedFeed = topPriorities.length > 0 || staleSourcesCount > 0 || runningAgents.length > 0 || divisions.length > 0

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2 px-0.5">
        <h3 className="text-sm font-semibold text-[var(--bb-text)]">System Activity</h3>
        <span className={`inline-block h-1.5 w-1.5 rounded-full ${systemMood === 'Review Pressure' ? 'bg-[#c2410c] animate-pulse' : systemMood === 'Busy / Controlled' ? 'bg-[var(--bb-accent)] animate-pulse' : 'bg-[#16a36a]'}`} />
        <span className="text-[10px] text-[var(--bb-text-faint)]">Live</span>
      </div>

      {eventModel.hasEvents ? (
        <div className="grid gap-2 xl:grid-cols-3">
          <EventColumn title="Mission Log / 01" rows={eventModel.columns[0]} />
          <EventColumn title="Mission Log / 02" rows={eventModel.columns[1]} />
          <EventColumn title="Mission Log / 03" rows={eventModel.columns[2]} />
        </div>
      ) : hasDerivedFeed ? (
        <div className="grid gap-2 xl:grid-cols-3">
          <div className="rounded-[10px] border border-[var(--bb-border)] bg-[var(--bb-surface-2)] p-3">
            <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.1em] text-[var(--bb-text-faint)]">Priority Alerts</p>
            <div className="mt-2 space-y-1.5">
              {topPriorities.length === 0 ? (
                <p className="text-[11px] text-[var(--bb-text-muted)]">All systems normal</p>
              ) : (
                topPriorities.slice(0, 4).map((priority, i) => (
                  <div key={`${priority}-${i}`} className="flex items-start gap-2 text-[11px] leading-5">
                    <span className="mt-0.5 shrink-0 font-mono text-[9px] text-[#c2410c]">{i + 1}</span>
                    <span className="text-[var(--bb-text)]">{priority}</span>
                  </div>
                ))
              )}
            </div>
            {staleSourcesCount > 0 ? (
              <div className="mt-2 rounded-md bg-[#c2410c]/[0.04] px-2 py-1.5">
                <p className="font-mono text-[8px] font-semibold uppercase tracking-[0.1em] text-[#c2410c]">{staleSourcesCount} stale source(s)</p>
              </div>
            ) : null}
          </div>

          <div className="rounded-[10px] border border-[var(--bb-border)] bg-[var(--bb-surface-2)] p-3">
            <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.1em] text-[var(--bb-text-faint)]">Running Activity</p>
            <div className="mt-2 space-y-1.5">
              {runningAgents.length === 0 ? (
                <p className="text-[11px] text-[var(--bb-text-muted)]">No active agents</p>
              ) : (
                runningAgents.slice(0, 4).map((agent) => (
                  <div key={agent.id} className="flex items-center gap-2 text-[11px]">
                    <span className="inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--bb-accent)] animate-pulse" />
                    <span className="truncate text-[var(--bb-text)]">{agent.name}: {agent.currentTask.slice(0, 50)}{agent.currentTask.length > 50 ? '...' : ''}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="rounded-[10px] border border-[var(--bb-border)] bg-[var(--bb-surface-2)] p-3">
            <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.1em] text-[var(--bb-text-faint)]">Division Status</p>
            <div className="mt-2 space-y-1.5">
              {divisions.map((division) => (
                <div key={division.id} className="flex items-center justify-between gap-2 text-[11px]">
                  <div className="flex min-w-0 items-center gap-2">
                    <span className={`inline-block h-1.5 w-1.5 shrink-0 rounded-full ${moodDot[division.mood]} ${division.mood === 'busy' ? 'animate-pulse' : ''}`} />
                    <span className="truncate text-[var(--bb-text)]">{division.name}</span>
                  </div>
                  <span className="shrink-0 font-mono text-[9px] text-[var(--bb-text-faint)]">{moodLabel[division.mood]}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-[10px] border border-[var(--bb-border)] bg-[var(--bb-surface-2)] p-4">
          <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.1em] text-[var(--bb-text-faint)]">Mission Log</p>
          <p className="mt-2 text-[11px] leading-5 text-[var(--bb-text-muted)]">No command events have been recorded yet, and no derived activity is available.</p>
        </div>
      )}
    </div>
  )
}
