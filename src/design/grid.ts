// BBH Spatial Grid Language — Grid Tokens

export type GridVariant = 'architect' | 'operation' | 'presentation' | 'print'

export interface GridConfig {
  major: number
  minor: number
  opacity: number
  lineThickness: number
  fadeDistance: number
  label: string
  description: string
}

export const GRID_MAJOR = 64
export const GRID_MINOR = 8
export const DEFAULT_GRID_OPACITY = 0.03
export const ARCHITECT_OPACITY = 0.05
export const PRESENTATION_OPACITY = 0
export const PRINT_OPACITY = 0.08
export const REVIEW_OPACITY = 0.06
export const GRID_LINE_THICKNESS = 1
export const GRID_FADE_DISTANCE = 120

export const GRID_CONFIGS: Record<GridVariant, GridConfig> = {
  architect: {
    major: 64,
    minor: 8,
    opacity: 0.06,
    lineThickness: 1,
    fadeDistance: 120,
    label: 'Architect',
    description: 'Structural reference. Major grid at 0.06, minor at 0.025.',
  },
  operation: {
    major: 64,
    minor: 8,
    opacity: 0.03,
    lineThickness: 1,
    fadeDistance: 120,
    label: 'Operation',
    description: 'Subtle background reference for daily use. 0.03 opacity.',
  },
  presentation: {
    major: 64,
    minor: 8,
    opacity: 0,
    lineThickness: 1,
    fadeDistance: 120,
    label: 'Presentation',
    description: 'No grid visible. Clean client-facing mode.',
  },
  print: {
    major: 64,
    minor: 8,
    opacity: 0.08,
    lineThickness: 1,
    fadeDistance: 120,
    label: 'Print',
    description: 'Visible grid for print and documentation.',
  },
}

export function getGridConfig(variant: GridVariant = 'operation'): GridConfig {
  return GRID_CONFIGS[variant] ?? GRID_CONFIGS.operation
}
