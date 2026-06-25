import type { ReactNode } from 'react'
import { GridOverlay } from './GridOverlay'
import type { GridVariant } from '../../design/grid'

interface Props {
  children: ReactNode
  gridEnabled?: boolean
  gridVariant?: GridVariant
  className?: string
}

export const GridCanvas = ({ children, gridEnabled = false, gridVariant = 'operation', className = '' }: Props) => (
  <div className={`bbh-grid-canvas relative ${className}`} style={{ position: 'relative' }}>
    <GridOverlay enabled={gridEnabled} variant={gridVariant} />
    {children}
  </div>
)
