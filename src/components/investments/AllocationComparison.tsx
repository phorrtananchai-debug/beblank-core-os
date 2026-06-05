import type { PostureBucket } from '../../core/investments/allocationUtils'

interface Props {
  buckets: PostureBucket[]
}

const thb = (value = 0) => `${Math.round(value).toLocaleString('en-US')} THB`

export const AllocationComparison = ({ buckets }: Props) => {
  if (buckets.length === 0) {
    return <p className="text-sm text-[var(--bb-text-muted)]">No allocation data. Add holdings to begin.</p>
  }

  const maxPercent = Math.max(
    ...buckets.map((b) => Math.max(b.currentPercent, b.targetPercent)),
    10,
  )

  return (
    <div className="space-y-4">
      {buckets.map((bucket) => {
        const drift = bucket.currentPercent - bucket.targetPercent
        const isDrifted = Math.abs(drift) >= 2
        return (
          <div key={bucket.id}>
            <div className="mb-1.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="inline-block h-2 w-2 rounded-full" style={{ background: bucket.color }} />
                <span className="text-sm font-semibold">{bucket.label}</span>
                <span className="pill">{bucket.holdingCount} holdings</span>
              </div>
              <div className={`text-right text-xs font-semibold ${isDrifted ? 'text-[var(--bb-amber)]' : 'text-[var(--bb-text-muted)]'}`}>
                {drift > 0 ? `+${drift.toFixed(1)}%` : `${drift.toFixed(1)}%`} drift
              </div>
            </div>

            <div className="relative h-8">
              {/* Target bar (background outline style) */}
              <div
                className="absolute bottom-0 rounded-md border-2 border-dashed"
                style={{
                  left: 0,
                  width: `${Math.min((bucket.targetPercent / maxPercent) * 100, 100)}%`,
                  height: '100%',
                  borderColor: bucket.color,
                  opacity: 0.5,
                }}
              />
              {/* Current bar */}
              <div
                className="absolute bottom-0 rounded-md transition-all"
                style={{
                  left: 0,
                  width: `${Math.min((bucket.currentPercent / maxPercent) * 100, 100)}%`,
                  height: '100%',
                  background: bucket.color,
                  opacity: 0.7,
                }}
              />
              {/* Labels overlay */}
              <div className="absolute inset-0 flex items-center px-2 text-[10px] font-mono font-semibold text-white mix-blend-difference">
                <span>{bucket.currentPercent.toFixed(1)}%</span>
                {bucket.targetPercent > 0 && (
                  <span className="ml-2 opacity-60">target {bucket.targetPercent.toFixed(1)}%</span>
                )}
              </div>
            </div>

            <div className="mt-1 flex justify-between text-[10px] text-[var(--bb-text-faint)]">
              <span>{thb(bucket.valueTHB)}</span>
              {isDrifted && (
                <span className="text-[var(--bb-amber)]">
                  {drift > 0
                    ? `Reduce by ${drift.toFixed(1)}% to meet target`
                    : `Increase by ${Math.abs(drift).toFixed(1)}% to meet target`}
                </span>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
