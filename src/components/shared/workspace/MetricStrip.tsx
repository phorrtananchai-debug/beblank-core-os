interface Metric {
  label: string
  value: string | number
  color?: string
}

interface Props {
  metrics: Metric[]
  columns?: number
  className?: string
}

export const MetricStrip = ({ metrics, columns = 4, className = '' }: Props) => (
  <div className={`grid gap-3 ${className}`} style={{ gridTemplateColumns: `repeat(${Math.min(columns, metrics.length)}, 1fr)` }}>
    {metrics.map((m, i) => (
      <div key={i} className="rounded-2xl border border-black/[0.04] bg-white/80 p-3 text-center">
        <p className={`text-2xl font-bold ${m.color ?? ''}`}>{m.value}</p>
        <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.1em] text-[var(--bb-text-muted)]">{m.label}</p>
      </div>
    ))}
  </div>
)
