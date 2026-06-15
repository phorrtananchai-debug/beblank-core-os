import { Link } from 'react-router-dom'
import { PixelAgent } from './PixelAgent'
import { PixelStatusBubble } from './PixelStatusBubble'

type Mood = 'calm' | 'busy' | 'review-needed' | 'offline'
type Confidence = 'Real' | 'Inferred' | 'Fallback' | 'Mock' | 'Derived'
type Freshness = 'Fresh' | 'Stale' | 'Unknown'
type AgentState = 'running' | 'waiting-review' | 'completed'

const roomAccent: Record<string, string> = {
  'jarvis-b-hq': 'border-l-black/[0.16]',
  'aequitas-capital': 'border-l-[var(--bb-accent)]',
  'creator-factory': 'border-l-[var(--bb-green)]',
  'bbh-studio': 'border-l-[var(--bb-blue)]',
  'my-house': 'border-l-[var(--bb-purple)]',
}

type PixelRoomAgent = {
  id: string
  name: string
  state: AgentState
}

export const PixelRoom = ({
  division,
  agents,
  className = '',
}: {
  division: {
    id: string
    name: string
    mood: Mood
    activeAgents: number
    runningTasks: number
    waitingReviews: number
    completedToday: number
    confidence: Confidence
    freshness: Freshness
    readOnly: boolean
  }
  agents: PixelRoomAgent[]
  className?: string
}) => {
  const previewAgents = agents.slice(0, 5)
  const overflowAgents = Math.max(agents.length - previewAgents.length, 0)
  const attentionLevel = division.waitingReviews > 0 ? 'Review queue' : division.runningTasks > 0 ? 'Operating' : division.mood === 'offline' ? 'Offline' : 'Steady'

  return (
    <Link
      to={`/os/command-center/${division.id}`}
      className={`pixel-room group block border border-[var(--bb-border)] border-l-2 bg-[var(--bb-surface-2)] p-3 text-left transition-colors hover:border-[var(--bb-border-strong)] ${roomAccent[division.id] ?? 'border-l-black/[0.12]'} ${className}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.14em] text-[var(--bb-text-faint)]">
            Room / {division.id}
          </p>
          <h4 className="mt-1 text-sm font-semibold leading-tight text-[var(--bb-text)]">{division.name}</h4>
        </div>
        <PixelStatusBubble mood={division.mood} />
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <div className="pixel-room-metric">
          <span>Agents</span>
          <strong>{division.activeAgents}</strong>
        </div>
        <div className="pixel-room-metric">
          <span>Tasks</span>
          <strong>{division.runningTasks}</strong>
        </div>
        <div className="pixel-room-metric">
          <span>Reviews</span>
          <strong className={division.waitingReviews > 0 ? 'text-accent-strong' : ''}>{division.waitingReviews}</strong>
        </div>
        <div className="pixel-room-metric">
          <span>Done</span>
          <strong>{division.completedToday}</strong>
        </div>
      </div>

      <div className="mt-3">
        <div className="mb-2 flex items-center justify-between gap-2">
          <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.14em] text-[var(--bb-text-faint)]">Occupants</p>
          <span className="font-mono text-[9px] font-semibold uppercase tracking-[0.14em] text-[var(--bb-text-faint)]">
            {attentionLevel}
          </span>
        </div>
        <div className="flex min-h-10 items-end gap-1 rounded-[8px] border border-dashed border-[var(--bb-border)] bg-[var(--bb-surface-3)] px-2 py-2">
          {previewAgents.length ? previewAgents.map((agent) => (
            <PixelAgent key={agent.id} name={agent.name} state={agent.state} />
          )) : <span className="font-mono text-[9px] uppercase tracking-[0.1em] text-[var(--bb-text-faint)]">No live occupants</span>}
          {overflowAgents ? <span className="ml-auto rounded-[4px] border border-[var(--bb-border)] bg-[var(--bb-surface-2)] px-1.5 py-1 font-mono text-[9px] font-semibold text-[var(--bb-text-muted)]">+{overflowAgents}</span> : null}
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between gap-2 border-t border-dashed border-[var(--bb-border)] pt-2">
        <div className="flex items-center gap-1.5">
          <span className="font-mono text-[9px] font-semibold uppercase tracking-[0.14em] text-[var(--bb-text-faint)]">{division.confidence}</span>
          <span className="h-1 w-1 rounded-full bg-black/15" />
          <span className="font-mono text-[9px] font-semibold uppercase tracking-[0.14em] text-[var(--bb-text-faint)]">{division.freshness}</span>
        </div>
        {division.readOnly ? <span className="font-mono text-[9px] font-semibold uppercase tracking-[0.14em] text-accent-strong">Read-only</span> : null}
      </div>
    </Link>
  )
}
