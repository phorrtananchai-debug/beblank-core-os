import type { ReactNode } from 'react'

interface StatusItem {
  label: string
  value?: string | number
  color?: 'green' | 'amber' | 'red' | 'gray' | 'accent'
  dot?: boolean
}

interface Props {
  items: StatusItem[]
  children?: ReactNode
  className?: string
}

const dotColors: Record<string, string> = {
  green: 'bg-[#16a36a]',
  amber: 'bg-[#c67f1e]',
  red: 'bg-[#c2410c]',
  gray: 'bg-black/[0.15]',
  accent: 'bg-[var(--bb-accent)]',
}

const textColors: Record<string, string> = {
  green: 'text-[#16a36a]',
  amber: 'text-[#c67f1e]',
  red: 'text-[#c2410c]',
  gray: 'text-[var(--bb-text-muted)]',
  accent: 'text-[var(--bb-accent)]',
}

export const StatusRail = ({ items, children, className = '' }: Props) => (
  <div className={`flex flex-wrap items-center gap-2 ${className}`}>
    {items.map((item, i) => (
      <span key={i} className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] ${textColors[item.color ?? 'gray']} border-current/20`}>
        {item.dot && <span className={`inline-block h-1.5 w-1.5 rounded-full ${dotColors[item.color ?? 'gray']}`} />}
        {item.label}
        {item.value !== undefined && <span className="font-bold">{item.value}</span>}
      </span>
    ))}
    {children}
  </div>
)
