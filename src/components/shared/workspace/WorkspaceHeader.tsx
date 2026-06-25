import type { ReactNode } from 'react'

interface Props {
  label?: string
  title?: string
  children?: ReactNode
  endSlot?: ReactNode
}

export const WorkspaceHeader = ({ label, title, children, endSlot }: Props) => (
  <div className="panel-header">
    <div>
      {label && <p className="text-[10px] font-semibold text-[var(--bb-text-muted)]">{label}</p>}
      {title && <h3>{title}</h3>}
      {children}
    </div>
    {endSlot && <div className="flex shrink-0 items-center gap-2">{endSlot}</div>}
  </div>
)
