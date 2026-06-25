import type { ReactNode } from 'react'
import { MiniLegend, OperatingMarker, StatusMark } from '../shared/workspace/marks'

type Mood = 'calm' | 'busy' | 'review-needed' | 'offline'

const moodStatusColor: Record<string, string> = {
  'Review Pressure': 'bg-[#c2410c]',
  'Busy / Controlled': 'bg-[var(--bb-accent)]',
  Calm: 'bg-[#16a36a]',
}

const moodStatus: Record<Mood, string> = {
  calm: 'LIVE',
  busy: 'ACTIVE',
  'review-needed': 'WATCH',
  offline: 'ARCHIVED',
}

export const CommandHeader = ({
  title,
  subtitle,
  systemMood,
  systemMoodSource,
  divisionsCount,
  agentsCount,
  statusStrip,
  viewToggle,
  modeLabel = 'Command View',
}: {
  title: string
  subtitle: string
  systemMood: string
  systemMoodSource: Mood
  divisionsCount: number
  agentsCount: number
  statusStrip: Array<{ label: string; value: string | number }>
  viewToggle?: ReactNode
  modeLabel?: string
}) => (
  <>
    <header className="relative overflow-hidden rounded-[12px] border border-[var(--bb-border)] bg-[var(--bb-surface-2)] p-5">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <OperatingMarker index="01">Command Center / Operational Matrix</OperatingMarker>
            {systemMood !== 'Calm' ? (
              <span className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 font-mono text-[8px] font-bold uppercase tracking-[0.12em] text-white ${moodStatusColor[systemMood] ?? ''}`}>
                <span className="inline-block h-1 w-1 rounded-full bg-white animate-pulse" />
                {systemMood === 'Review Pressure' ? 'Attention' : 'Active'}
              </span>
            ) : null}
          </div>
          <div>
            <h2 className="text-[1.9rem] font-semibold leading-none tracking-[-0.04em] md:text-[2.4rem]">{title}</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--bb-text-muted)]">{subtitle}</p>
          </div>
        </div>
        <div className="flex flex-col items-start gap-2 xl:items-end">
          <MiniLegend
            items={[
              { label: `${divisionsCount} divisions`, mark: <StatusMark status="ACTIVE" label="DV" /> },
              { label: `${agentsCount} agents`, mark: <StatusMark status="LIVE" label="AG" /> },
              { label: modeLabel, mark: <StatusMark status="WATCH" label="MX" /> },
            ]}
          />
          {viewToggle ? <div>{viewToggle}</div> : null}
        </div>
      </div>
    </header>

    <div className="grid border-y border-[var(--bb-border)] sm:grid-cols-3 lg:grid-cols-6">
      {statusStrip.map((item) => {
        const isMood = item.label === 'System Mood'
        return (
          <div key={item.label} className="border-b border-r border-[var(--bb-border)] bg-transparent px-3.5 py-2.5 last:border-r-0 lg:border-b-0">
            <div className="flex items-center gap-2">
              {isMood ? <StatusMark status={moodStatus[systemMoodSource]} /> : null}
              <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.12em] text-[var(--bb-text-faint)]">{item.label}</p>
            </div>
            <div className="mt-1.5 flex items-baseline gap-1.5">
              <span className={`text-lg font-semibold leading-none tracking-[-0.02em] text-[var(--bb-text)] ${isMood ? (systemMoodSource === 'review-needed' ? 'text-[#c2410c]' : systemMoodSource === 'busy' ? 'text-[var(--bb-accent)]' : '') : ''}`}>{item.value}</span>
            </div>
          </div>
        )
      })}
    </div>
  </>
)
