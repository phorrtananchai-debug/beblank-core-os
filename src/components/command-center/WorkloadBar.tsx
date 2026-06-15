type Tone = 'running' | 'waiting-review' | 'completed' | 'default'

const toneClass: Record<Tone, string> = {
  running: 'os-progress-bar-accent',
  'waiting-review': 'os-progress-bar-amber',
  completed: 'os-progress-bar-green',
  default: 'os-progress-bar-neutral',
}

export const WorkloadBar = ({
  value,
  tone = 'default',
  heightClass = 'h-2',
  showValue = true,
}: {
  value: number
  tone?: Tone
  heightClass?: string
  showValue?: boolean
}) => (
  <div className="flex items-center gap-2">
    <div className={`os-progress flex-1 ${heightClass}`}>
      <div className={`os-progress-bar ${toneClass[tone]}`} style={{ width: `${value}%` }} />
    </div>
    {showValue ? <span className="text-xs font-medium text-[var(--bb-text-muted)]">{value}%</span> : null}
  </div>
)
