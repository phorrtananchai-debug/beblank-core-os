export const MetricStrip = ({
  items,
  columnsClass = 'grid-cols-4',
}: {
  items: Array<{ label: string; value: string | number; valueClassName?: string }>
  columnsClass?: string
}) => (
  <div className={`grid gap-1.5 ${columnsClass}`}>
    {items.map((item) => (
      <div key={item.label} className="rounded-lg border border-[var(--bb-border)] px-2.5 py-2">
        <p className="font-mono text-[8px] font-semibold uppercase tracking-[0.1em] text-[var(--bb-text-faint)]">{item.label}</p>
        <p className={`mt-0.5 text-sm font-semibold text-[var(--bb-text)] ${item.valueClassName ?? ''}`}>{item.value}</p>
      </div>
    ))}
  </div>
)
