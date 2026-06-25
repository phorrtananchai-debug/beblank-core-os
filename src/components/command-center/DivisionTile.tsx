import { Link } from 'react-router-dom'
import { MetricStrip } from './MetricStrip'
import { StatusRail } from './StatusRail'
import { ReadOnlyBadge } from './ReadOnlyBadge'
import { RouteMark, StatusMark } from '../shared/workspace/marks'

type Mood = 'calm' | 'busy' | 'review-needed' | 'offline'
type Confidence = 'Real' | 'Inferred' | 'Fallback' | 'Mock' | 'Derived'
type Freshness = 'Fresh' | 'Stale' | 'Unknown'

const divisionIcons: Record<string, string> = {
  'jarvis-b-hq': 'JR',
  'aequitas-capital': 'AQ',
  'creator-factory': 'CF',
  'bbh-studio': 'BS',
  'my-house': 'MH',
}

export const DivisionTile = ({
  division,
}: {
  division: {
    id: string
    name: string
    mood: Mood
    activeAgents: number
    runningTasks: number
    waitingReviews: number
    completedToday: number
    summary: string
    confidence: Confidence
    freshness: Freshness
    readOnly: boolean
    keyMetrics: Array<{ label: string; value: string | number }>
  }
}) => {
  const icon = divisionIcons[division.id] ?? 'OS'
  const maxStat = Math.max(division.runningTasks, division.waitingReviews, division.completedToday, 1)

  return (
    <Link
      to={`/os/command-center/${division.id}`}
      className="block border-t border-[var(--bb-border)] bg-transparent py-3.5 transition-colors duration-150 hover:bg-[var(--bb-surface-1)]"
    >
      <div className="flex flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <RouteMark label={icon} />
            <div className="min-w-0">
              <h4 className="text-sm font-semibold leading-none text-[var(--bb-text)]">{division.name}</h4>
              <p className="mt-0.5 truncate text-[11px] text-[var(--bb-text-muted)]">
                {division.summary.slice(0, 80)}
                {division.summary.length > 80 ? '...' : ''}
              </p>
            </div>
          </div>
          <div className="shrink-0">
            <StatusRail
              mood={division.mood}
              confidence={division.confidence}
              freshness={division.freshness}
              extraLabels={division.readOnly ? [] : []}
            />
          </div>
        </div>

        {division.readOnly ? <ReadOnlyBadge label="R/O" /> : null}

        <MetricStrip
          items={[
            { label: 'Agents', value: division.activeAgents },
            { label: 'Tasks', value: division.runningTasks },
            { label: 'Reviews', value: division.waitingReviews, valueClassName: division.waitingReviews > 0 ? 'text-[#c2410c]' : '' },
            { label: 'Done', value: division.completedToday },
          ]}
        />

        <div className="mt-0.5 flex h-1 gap-0.5 overflow-hidden rounded-full bg-black/[0.04]">
          <div className="bg-[var(--bb-accent)] transition-all" style={{ width: `${(division.runningTasks / maxStat) * 30}%` }} />
          <div className="bg-[#c2410c] transition-all" style={{ width: `${(division.waitingReviews / maxStat) * 30}%` }} />
          <div className="bg-[#16a36a] transition-all" style={{ width: `${(division.completedToday / maxStat) * 30}%` }} />
        </div>

        <div className="mt-0.5 flex flex-wrap gap-1">
          {division.keyMetrics.map((metric) => (
            <span key={metric.label} className="inline-flex items-center gap-1.5 border-t border-[var(--bb-border)] px-0 py-1 font-mono text-[9px] text-[var(--bb-text-muted)]">
              <StatusMark status="ACTIVE" label={metric.label.slice(0, 2)} />
              {metric.label}: <strong className="text-[var(--bb-text)]">{metric.value}</strong>
            </span>
          ))}
        </div>
      </div>
    </Link>
  )
}
