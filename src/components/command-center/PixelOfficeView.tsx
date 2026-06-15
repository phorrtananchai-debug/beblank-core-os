import { PixelRoom } from './pixel/PixelRoom'

type Mood = 'calm' | 'busy' | 'review-needed' | 'offline'
type Confidence = 'Real' | 'Inferred' | 'Fallback' | 'Mock' | 'Derived'
type Freshness = 'Fresh' | 'Stale' | 'Unknown'
type AgentState = 'running' | 'waiting-review' | 'completed'

type DivisionRecord = {
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
}

type AgentRecord = {
  id: string
  name: string
  division: string
  role: string
  state: AgentState
  currentTask: string
  progress: number
  updatedAt: string
}

const roomLayout: Record<string, string> = {
  'jarvis-b-hq': 'md:col-span-3 xl:col-span-4 xl:row-span-2',
  'aequitas-capital': 'md:col-span-2 xl:col-span-3',
  'creator-factory': 'md:col-span-2 xl:col-span-3',
  'bbh-studio': 'md:col-span-3 xl:col-span-4',
  'my-house': 'md:col-span-2 xl:col-span-2',
}

const divisionNameById: Record<string, string> = {
  'jarvis-b-hq': 'Jarvis B HQ',
  'aequitas-capital': 'Aequitas Capital',
  'creator-factory': 'Creator Factory',
  'bbh-studio': 'BBH Studio',
  'my-house': 'My House',
}

export const PixelOfficeView = ({
  divisions,
  agents,
  runningNow,
  waitingReview,
  completed,
}: {
  divisions: DivisionRecord[]
  agents: AgentRecord[]
  runningNow: AgentRecord[]
  waitingReview: AgentRecord[]
  completed: AgentRecord[]
}) => {
  const agentsByDivision = divisions.reduce<Record<string, AgentRecord[]>>((acc, division) => {
    acc[division.id] = agents.filter((agent) => agent.division === divisionNameById[division.id])
    return acc
  }, {})

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-3 px-0.5">
        <div>
          <h3 className="text-sm font-semibold text-[var(--bb-text)]">Pixel Office</h3>
          <p className="mt-0.5 text-xs text-[var(--bb-text-muted)]">
            Living office view over the same command-center models, agents, and events.
          </p>
        </div>
        <span className="pill">Presentation Only</span>
      </div>

      <div className="grid gap-3 xl:grid-cols-[220px_minmax(0,1fr)_220px]">
        <aside className="panel space-y-3">
          <div>
            <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.14em] text-[var(--bb-text-faint)]">Running Now</p>
            <p className="mt-2 text-2xl font-semibold leading-none tracking-[-0.03em] text-[var(--bb-text)]">{runningNow.length}</p>
          </div>
          <div className="space-y-2">
            {runningNow.slice(0, 4).map((agent) => (
              <div key={agent.id} className="rounded-[8px] border border-[var(--bb-border)] bg-[var(--bb-surface-3)] px-2.5 py-2">
                <p className="text-xs font-semibold text-[var(--bb-text)]">{agent.name}</p>
                <p className="mt-1 text-[11px] text-[var(--bb-text-muted)]">{agent.currentTask}</p>
              </div>
            ))}
          </div>
        </aside>

        <div className="pixel-campus panel">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.14em] text-[var(--bb-text-faint)]">Board</p>
              <h3 className="mt-1 text-base font-semibold text-[var(--bb-text)]">Living Office Campus</h3>
            </div>
            <div className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.12em] text-[var(--bb-text-faint)]">
              <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-[var(--bb-accent)] animate-pulse" />Running</span>
              <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-[var(--bb-amber)]" />Review</span>
              <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-[var(--bb-green)]" />Done</span>
            </div>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-5 xl:grid-cols-6">
            {divisions.map((division) => (
              <PixelRoom
                key={division.id}
                division={division}
                agents={agentsByDivision[division.id] ?? []}
                className={roomLayout[division.id] ?? ''}
              />
            ))}
          </div>
        </div>

        <aside className="panel space-y-3">
          <div className="grid gap-2">
            <div className="rounded-[8px] border border-[var(--bb-border)] bg-[var(--bb-surface-3)] px-3 py-2.5">
              <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.14em] text-[var(--bb-text-faint)]">Waiting Review</p>
              <p className="mt-1 text-xl font-semibold leading-none tracking-[-0.03em] text-accent-strong">{waitingReview.length}</p>
            </div>
            <div className="rounded-[8px] border border-[var(--bb-border)] bg-[var(--bb-surface-3)] px-3 py-2.5">
              <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.14em] text-[var(--bb-text-faint)]">Completed</p>
              <p className="mt-1 text-xl font-semibold leading-none tracking-[-0.03em] text-green">{completed.length}</p>
            </div>
          </div>

          <div>
            <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.14em] text-[var(--bb-text-faint)]">Division Notes</p>
            <div className="mt-2 space-y-2">
              {divisions.map((division) => (
                <div key={division.id} className="rounded-[8px] border border-[var(--bb-border)] bg-[var(--bb-surface-3)] px-2.5 py-2">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-semibold text-[var(--bb-text)]">{division.name}</p>
                    <span className="font-mono text-[9px] uppercase tracking-[0.1em] text-[var(--bb-text-faint)]">{division.mood}</span>
                  </div>
                  <p className="mt-1 text-[11px] leading-5 text-[var(--bb-text-muted)]">{division.summary}</p>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </section>
  )
}
