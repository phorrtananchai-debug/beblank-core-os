import type { ReactNode } from 'react'

interface ActivityItem {
  id: string
  label: string
  description: string
  timestamp: string
  dotColor?: string
}

interface Props {
  items: ActivityItem[]
  children?: ReactNode
  className?: string
}

const dotStyle: Record<string, string> = {
  green: 'bg-[#16a36a]',
  amber: 'bg-[#c67f1e]',
  red: 'bg-[#c2410c]',
  gray: 'bg-black/[0.15]',
  accent: 'bg-[var(--bb-accent)]',
}

export const ActivityFeed = ({ items, children, className = '' }: Props) => (
  <div className={`space-y-2 ${className}`}>
    {items.map((item) => (
      <div key={item.id} className="grid gap-2 border-b border-black/[0.04] pb-2 last:border-b-0 md:grid-cols-[90px_1fr_auto] md:items-center">
        <p className="font-mono text-[10px] font-semibold uppercase text-[var(--bb-text-muted)]">{item.timestamp}</p>
        <div className="min-w-0">
          <p className="text-sm font-semibold truncate">{item.label}</p>
          <p className="text-xs text-[var(--bb-text-muted)]">{item.description}</p>
        </div>
        {item.dotColor && <span className={`inline-block h-1.5 w-1.5 rounded-full ${dotStyle[item.dotColor] ?? dotStyle.gray}`} />}
      </div>
    ))}
    {children}
  </div>
)
