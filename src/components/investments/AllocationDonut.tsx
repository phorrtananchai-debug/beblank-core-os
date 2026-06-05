import { useMemo } from 'react'

interface DonutSlice {
  id: string
  label: string
  color: string
  percent: number
  valueTHB: number
}

interface Props {
  slices: DonutSlice[]
  totalValue: number
  size?: number
  strokeWidth?: number
}

const thb = (value = 0) => `${Math.round(value).toLocaleString('en-US')} THB`

export const AllocationDonut = ({ slices, totalValue, size = 200, strokeWidth = 28 }: Props) => {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const center = size / 2

  const arcs = useMemo(() => {
    const total = slices.reduce((s, sl) => s + Math.max(sl.percent, 0), 0) || 100
    const result: Array<DonutSlice & { dashArray: string; dashOffset: number }> = []
    let offset = 0
    for (const slice of slices) {
      const sliceLen = (Math.max(slice.percent, 0) / total) * circumference
      result.push({
        ...slice,
        dashArray: `${sliceLen} ${circumference - sliceLen}`,
        dashOffset: -offset,
      })
      offset += sliceLen
    }
    return result
  }, [slices, circumference])

  if (slices.length === 0) {
    return (
      <div className="flex items-center justify-center" style={{ width: size, height: size }}>
        <p className="text-xs text-[var(--bb-text-muted)]">No data</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Background ring */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="#f0eeec"
          strokeWidth={strokeWidth}
        />
        {/* Slices */}
        {arcs.map((arc) => (
          <circle
            key={arc.id}
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke={arc.color}
            strokeWidth={strokeWidth}
            strokeDasharray={arc.dashArray}
            strokeDashoffset={arc.dashOffset}
            strokeLinecap="round"
            transform={`rotate(-90 ${center} ${center})`}
            className="transition-all duration-300"
          />
        ))}
        {/* Center text */}
        <text x={center} y={center - 6} textAnchor="middle" className="text-lg font-bold" fill="currentColor">
          {totalValue > 0 ? `${((totalValue / 1000) >= 1 ? `${(totalValue / 1000).toFixed(0)}k` : totalValue.toFixed(0))}` : '—'}
        </text>
        <text x={center} y={center + 12} textAnchor="middle" className="text-[10px]" fill="var(--bb-text-muted)">
          THB
        </text>
      </svg>

      {/* Legend */}
      <div className="flex flex-wrap justify-center gap-x-4 gap-y-1.5">
        {slices.map((slice) => (
          <div key={slice.id} className="flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: slice.color }} />
            <span className="font-mono text-[10px] font-semibold uppercase text-[var(--bb-text-muted)]">
              {slice.label} {slice.percent.toFixed(1)}%
            </span>
            <span className="text-[10px] text-[var(--bb-text-faint)]">{thb(slice.valueTHB)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
