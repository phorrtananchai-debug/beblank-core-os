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
export const PRESENTATION_OPACITY = 0.015
export const PRINT_OPACITY = 0.08
export const GRID_LINE_THICKNESS = 1
export const GRID_FADE_DISTANCE = 120

export const GRID_CONFIGS: Record<GridVariant, GridConfig> = {
  architect: {
    major: 64,
    minor: 8,
    opacity: ARCHITECT_OPACITY,
    lineThickness: 1,
    fadeDistance: 120,
    label: 'Architect',
    description: 'Structural reference for layout composition. Visible during design and review.',
  },
  operation: {
    major: 64,
    minor: 8,
    opacity: DEFAULT_GRID_OPACITY,
    lineThickness: 1,
    fadeDistance: 120,
    label: 'Operation',
    description: 'Subtle background reference for daily use. Almost invisible unless focused.',
  },
  presentation: {
    major: 64,
    minor: 8,
    opacity: PRESENTATION_OPACITY,
    lineThickness: 1,
    fadeDistance: 120,
    label: 'Presentation',
    description: 'Minimal grid for client-facing views. Barely visible.',
  },
  print: {
    major: 64,
    minor: 8,
    opacity: PRINT_OPACITY,
    lineThickness: 1,
    fadeDistance: 120,
    label: 'Print',
    description: 'Visible grid for print and documentation output.',
  },
}

export function getGridConfig(variant: GridVariant = 'operation'): GridConfig {
  return GRID_CONFIGS[variant] ?? GRID_CONFIGS.operation
}
