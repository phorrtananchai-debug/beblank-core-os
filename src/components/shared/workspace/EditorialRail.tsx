import type { ReactNode } from 'react'
import { columnGrid } from '../../../design/editorial'

interface Props {
  children: ReactNode
  columns?: number
  gap?: number
  className?: string
}

export const EditorialRail = ({ children, columns = 12, gap = 12, className = '' }: Props) => (
  <div
    className={className}
    style={{
      display: 'grid',
      gridTemplateColumns: columnGrid(columns),
      gap: `${gap}px`,
    }}
  >
    {children}
  </div>
)
