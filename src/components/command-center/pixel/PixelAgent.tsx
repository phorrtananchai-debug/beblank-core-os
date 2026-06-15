type AgentState = 'running' | 'waiting-review' | 'completed'

const stateTone: Record<AgentState, string> = {
  running: 'border-accent-border bg-accent-soft text-accent-strong',
  'waiting-review': 'border-amber-border bg-amber-soft text-amber',
  completed: 'border-green-border bg-green-soft text-green',
}

export const PixelAgent = ({
  name,
  state,
  compact = false,
}: {
  name: string
  state: AgentState
  compact?: boolean
}) => {
  const initials = name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <div className={`relative flex shrink-0 items-end justify-center ${compact ? 'h-7 w-5' : 'h-8 w-6'}`}>
      <span className={`absolute bottom-0 block border border-[var(--bb-border-strong)] bg-white shadow-none ${compact ? 'h-5 w-4 rounded-[3px]' : 'h-6 w-5 rounded-[4px]'}`} />
      <span className={`absolute border border-[var(--bb-border-strong)] bg-[var(--bb-surface-4)] ${compact ? 'bottom-4 h-3 w-3 rounded-[2px]' : 'bottom-5 h-3.5 w-3.5 rounded-[2px]'}`} />
      <span className={`relative z-[1] inline-flex items-center justify-center rounded-[4px] border text-[7px] font-bold leading-none ${stateTone[state]} ${compact ? 'h-5 w-4' : 'h-6 w-5'}`}>
        {initials}
      </span>
      {state === 'running' ? <span className="pixel-agent-signal pixel-agent-signal-running" /> : null}
      {state === 'waiting-review' ? <span className="pixel-agent-signal pixel-agent-signal-review" /> : null}
      {state === 'completed' ? <span className="pixel-agent-signal pixel-agent-signal-complete" /> : null}
    </div>
  )
}
