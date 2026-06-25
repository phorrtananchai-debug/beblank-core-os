import type { ReactNode } from 'react'
import { getEditorial, type EditorialDensity } from '../../../design/editorial'

interface Props {
  children: ReactNode
  mode?: string
  columns?: number
  columnSpan?: number
  columnStart?: number
  density?: EditorialDensity
  className?: string
  as?: 'section' | 'article' | 'div' | 'aside'
}

export const EditorialSection = ({
  children,
  mode = 'rail',
  columnSpan: span,
  columnStart,
  className = '',
  as: Tag = 'section',
}: Props) => {
  const config = getEditorial(mode)
  const spacing = config.spacing

  const style: Record<string, string> = {}
  if (span) style.gridColumn = `span ${span}`
  if (columnStart) style.gridColumnStart = String(columnStart)

  return (
    <Tag
      className={className}
      style={{
        ...style,
        padding: `${spacing.padding}px`,
        marginBottom: `${spacing.margin}px`,
        maxWidth: config.maxWidth,
      }}
    >
      {children}
    </Tag>
  )
}
