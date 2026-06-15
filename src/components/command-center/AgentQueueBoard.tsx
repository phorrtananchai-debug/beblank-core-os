import { FreshnessBadge } from './FreshnessBadge'
import { ConfidenceBadge } from './ConfidenceBadge'
import { WorkloadBar } from './WorkloadBar'

type AgentState = 'running' | 'waiting-review' | 'completed'
type Confidence = 'Real' | 'Inferred' | 'Fallback' | 'Mock' | 'Derived'
type Freshness = 'Fresh' | 'Stale' | 'Unknown'

const queueBorder: Record<AgentState, string> = {
  running: 'border-l-[var(--bb-accent)]',
  'waiting-review': 'border-l-[#c2410c]',
  completed: 'border-l-[#16a36a]',
}

const queueLabel: Record<AgentState, string> = {
  running: 'Running',
  'waiting-review': 'Waiting Review',
  completed: 'Completed',
}

const queueTone: Record<AgentState, 'running' | 'waiting-review' | 'completed'> = {
  running: 'running',
  'waiting-review': 'waiting-review',
  completed: 'completed',
}

const QueueColumn = ({
  title,
  items,
}: {
  title: string
  items: Array<{
    id: string
    name: string
    division: string
    role: string
    state: AgentState
    currentTask: string
    progress: number
    updatedAt: string
    confidence?: Confidence
    freshness?: Freshness
  }>
}) => (
  <div className="overflow-hidden rounded-[10px] border border-[var(--bb-border)] bg-[var(--bb-surface-2)]">
    <div className="flex items-center justify-between border-b border-[var(--bb-border)] px-3 py-2">
      <p className="text-xs font-semibold text-[var(--bb-text)]">{title}</p>
      <span className="rounded-md bg-black/[0.05] px-1.5 py-0.5 font-mono text-[9px] font-semibold text-[var(--bb-text-muted)]">{items.length}</span>
    </div>
    <div>
      {items.length === 0 ? (
        <div className="px-3 py-5 text-xs text-[var(--bb-text-muted)]">No agents in this queue.</div>
      ) : (
        items.map((item, index) => (
          <div key={item.id} className={`${index !== items.length - 1 ? 'border-b border-[var(--bb-border)]' : ''} border-l-2 ${queueBorder[item.state]} pl-3 pr-3 py-2.5`}>
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="text-xs font-semibold text-[var(--bb-text)]">{item.name}</p>
                  <span className="pill">{queueLabel[item.state]}</span>
                </div>
                <p className="mt-0.5 text-[10px] text-[var(--bb-text-faint)]">{item.division} / {item.role}</p>
              </div>
              <span className="shrink-0 font-mono text-[9px] text-[var(--bb-text-faint)]">{item.updatedAt}</span>
            </div>
            <p className="mt-1.5 text-[11px] leading-5 text-[var(--bb-text-muted)]">{item.currentTask}</p>
            <div className="mt-2">
              <WorkloadBar value={item.progress} tone={queueTone[item.state]} heightClass="h-1" />
            </div>
            {(item.confidence || item.freshness) ? (
              <div className="mt-1.5 flex gap-1.5">
                {item.confidence ? <ConfidenceBadge confidence={item.confidence} /> : null}
                {item.freshness ? <FreshnessBadge freshness={item.freshness} /> : null}
              </div>
            ) : null}
          </div>
        ))
      )}
    </div>
  </div>
)

export const AgentQueueBoard = ({
  runningNow,
  waitingReview,
  completed,
}: {
  runningNow: Array<{
    id: string
    name: string
    division: string
    role: string
    state: AgentState
    currentTask: string
    progress: number
    updatedAt: string
    confidence?: Confidence
    freshness?: Freshness
  }>
  waitingReview: Array<{
    id: string
    name: string
    division: string
    role: string
    state: AgentState
    currentTask: string
    progress: number
    updatedAt: string
    confidence?: Confidence
    freshness?: Freshness
  }>
  completed: Array<{
    id: string
    name: string
    division: string
    role: string
    state: AgentState
    currentTask: string
    progress: number
    updatedAt: string
    confidence?: Confidence
    freshness?: Freshness
  }>
}) => (
  <div className="grid gap-2 xl:grid-cols-3">
    <QueueColumn title="Running Now" items={runningNow} />
    <QueueColumn title="Waiting Review" items={waitingReview} />
    <QueueColumn title="Recently Completed" items={completed} />
  </div>
)
