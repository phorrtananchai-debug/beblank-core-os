import { useCallback, useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import type { GridVariant } from '../../design/grid'
import { SpatialContext, DEFAULT_SPACING_RHYTHM } from '../../design/spatial'
import type { SpatialConfig, SpacingRhythm } from '../../design/spatial'
import { GridDebug } from './GridDebug'

function getGridVariant(path: string): GridVariant {
  if (path.startsWith('/os/studio') || path.startsWith('/os/design-system')) return 'architect'
  return 'operation'
}

function getVariantOpacity(variant: GridVariant): number {
  if (variant === 'architect') return 0.05
  if (variant === 'presentation') return 0.015
  if (variant === 'print') return 0.08
  return 0.03
}

function getRhythm(variant: GridVariant): SpacingRhythm {
  const base = DEFAULT_SPACING_RHYTHM
  if (variant === 'presentation') {
    return { ...base, sm: 12, md: 16, lg: 24, xl: 32, xxl: 48 }
  }
  return base
}

export const SpatialProvider = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation()
  const [isDebugMode, setDebugMode] = useState(false)

  const variant = getGridVariant(location.pathname)
  const opacity = getVariantOpacity(variant)
  const rhythm = getRhythm(variant)

  const config: SpatialConfig = useMemo(() => ({
    variant,
    major: 64,
    minor: 8,
    baseline: { height: 8, unit: 8 },
    opacity,
    columns: Array.from({ length: 12 }, (_, i) => ({
      index: i, start: i * 64, end: (i + 1) * 64, width: 64,
    })),
    rhythm,
  }), [variant, opacity, rhythm])

  const toggleDebug = useCallback(() => setDebugMode((p) => !p), [])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'G') {
        e.preventDefault()
        setDebugMode((p) => !p)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  const value = useMemo(() => ({ config, isDebugMode, toggleDebug }), [config, isDebugMode, toggleDebug])

  return (
    <SpatialContext.Provider value={value}>
      {children}
      <GridDebug />
    </SpatialContext.Provider>
  )
}
