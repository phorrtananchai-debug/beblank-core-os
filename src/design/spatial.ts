import { createContext, useContext } from 'react'
import type { GridVariant } from './grid'

export interface GridColumn {
  index: number
  start: number
  end: number
  width: number
}

export interface GridBaseline {
  height: number
  unit: number
}

export interface SpacingRhythm {
  xs: number
  sm: number  // 8px
  md: number  // 12px
  lg: number  // 16px
  xl: number  // 24px
  xxl: number // 32px
  section: number // 48px
  page: number    // 64px
}

export interface SpatialConfig {
  variant: GridVariant
  major: number
  minor: number
  baseline: GridBaseline
  opacity: number
  columns: GridColumn[]
  rhythm: SpacingRhythm
}

export const DEFAULT_SPACING_RHYTHM: SpacingRhythm = {
  xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32,
  section: 48, page: 64,
}

export const DEFAULT_SPATIAL_CONFIG: SpatialConfig = {
  variant: 'operation',
  major: 64,
  minor: 8,
  baseline: { height: 8, unit: 8 },
  opacity: 0.03,
  columns: Array.from({ length: 12 }, (_, i) => ({
    index: i,
    start: i * 64,
    end: (i + 1) * 64,
    width: 64,
  })),
  rhythm: DEFAULT_SPACING_RHYTHM,
}

export interface SpatialContextValue {
  config: SpatialConfig
  isDebugMode: boolean
  toggleDebug: () => void
}

export const SpatialContext = createContext<SpatialContextValue>({
  config: DEFAULT_SPATIAL_CONFIG,
  isDebugMode: false,
  toggleDebug: () => {},
})

export const useSpatial = () => useContext(SpatialContext)
