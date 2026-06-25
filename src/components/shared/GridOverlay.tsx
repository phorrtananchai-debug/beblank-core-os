import type { CSSProperties } from 'react'
import { getGridConfig, type GridVariant } from '../../design/grid'

interface Props {
  enabled?: boolean
  variant?: GridVariant
  opacity?: number
  major?: number
  minor?: number
  fadeEdges?: boolean
  pointerEvents?: boolean
  shell?: boolean
}

const GRID_LINE_COLOR = 'rgba(0,0,0,0.04)'

export const GridOverlay = ({
  enabled = false,
  variant = 'operation',
  opacity,
  major,
  minor,
  fadeEdges = true,
  pointerEvents = false,
  shell = false,
}: Props) => {
  if (!enabled) return null

  const config = getGridConfig(variant)
  const gridOpacity = opacity ?? config.opacity
  const majorPx = major ?? config.major
  const minorPx = minor ?? config.minor

  const baseStyle: CSSProperties = {
    position: shell ? 'absolute' : 'fixed',
    inset: 0,
    zIndex: shell ? 0 : 9999,
    pointerEvents: pointerEvents ? 'auto' : 'none',
  }

  const majorStyle: CSSProperties = {
    position: 'absolute',
    inset: 0,
    backgroundImage: `repeating-linear-gradient(0deg, ${GRID_LINE_COLOR}, ${GRID_LINE_COLOR} 1px, transparent 1px, transparent ${majorPx}px),
                       repeating-linear-gradient(90deg, ${GRID_LINE_COLOR}, ${GRID_LINE_COLOR} 1px, transparent 1px, transparent ${majorPx}px)`,
    backgroundSize: `${majorPx}px ${majorPx}px`,
    opacity: gridOpacity * 2,
  }

  const minorStyle: CSSProperties = {
    position: 'absolute',
    inset: 0,
    backgroundImage: `repeating-linear-gradient(0deg, ${GRID_LINE_COLOR}, ${GRID_LINE_COLOR} 1px, transparent 1px, transparent ${minorPx}px),
                       repeating-linear-gradient(90deg, ${GRID_LINE_COLOR}, ${GRID_LINE_COLOR} 1px, transparent 1px, transparent ${minorPx}px)`,
    backgroundSize: `${minorPx}px ${minorPx}px`,
    opacity: gridOpacity,
  }

  const fadeStyle: CSSProperties = fadeEdges ? {
    position: 'absolute',
    inset: 0,
    background: 'radial-gradient(ellipse at center, transparent 60%, var(--bb-shell, #f2efe9) 100%)',
    pointerEvents: 'none',
  } : {}

  return (
    <div
      style={baseStyle}
      className="bbh-grid-overlay"
      aria-hidden="true"
      data-variant={variant}
    >
      <div style={minorStyle} />
      <div style={majorStyle} />
      {fadeEdges && <div style={fadeStyle} />}
    </div>
  )
}
