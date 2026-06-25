// BBH Editorial Layout Engine — Layout Tokens

export type EditorialDensity = 'compact' | 'default' | 'relaxed' | 'hero'
export type EditorialRhythm = 'tight' | 'base' | 'section' | 'page' | 'hero'
export type EditorialWeight = 'caption' | 'body' | 'heading' | 'display'
export type EditorialColumns = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12

export interface EditorialSpacing {
  padding: number
  gap: number
  margin: number
}

export interface EditorialMargins {
  inline: number
  block: number
  section: number
  page: number
}

export interface EditorialConfig {
  density: EditorialDensity
  rhythm: EditorialRhythm
  columns: number
  spacing: EditorialSpacing
  margins: EditorialMargins
  maxWidth: string
}

const SPACING: Record<EditorialDensity, EditorialSpacing> = {
  compact: { padding: 8, gap: 6, margin: 12 },
  default: { padding: 16, gap: 12, margin: 24 },
  relaxed: { padding: 24, gap: 16, margin: 32 },
  hero: { padding: 32, gap: 24, margin: 48 },
}

export const EDITORIAL: Record<string, EditorialConfig> = {
  hero: {
    density: 'hero',
    rhythm: 'hero',
    columns: 12,
    spacing: SPACING.hero,
    margins: { inline: 48, block: 48, section: 64, page: 80 },
    maxWidth: '1200px',
  },
  article: {
    density: 'relaxed',
    rhythm: 'section',
    columns: 12,
    spacing: SPACING.relaxed,
    margins: { inline: 32, block: 32, section: 48, page: 64 },
    maxWidth: '960px',
  },
  rail: {
    density: 'default',
    rhythm: 'base',
    columns: 12,
    spacing: SPACING.default,
    margins: { inline: 16, block: 16, section: 32, page: 40 },
    maxWidth: '100%',
  },
  gallery: {
    density: 'compact',
    rhythm: 'tight',
    columns: 12,
    spacing: SPACING.compact,
    margins: { inline: 12, block: 12, section: 24, page: 32 },
    maxWidth: '1400px',
  },
  presentation: {
    density: 'relaxed',
    rhythm: 'hero',
    columns: 12,
    spacing: SPACING.relaxed,
    margins: { inline: 64, block: 48, section: 80, page: 96 },
    maxWidth: '1440px',
  },
  narrative: {
    density: 'relaxed',
    rhythm: 'section',
    columns: 12,
    spacing: SPACING.relaxed,
    margins: { inline: 48, block: 32, section: 48, page: 64 },
    maxWidth: '800px',
  },
}

export function getEditorial(mode: string): EditorialConfig {
  return EDITORIAL[mode] ?? EDITORIAL.rail
}

export function columnSpan(columns: number, total: number = 12): string {
  return `${(columns / total) * 100}%`
}

export function columnGrid(columns: number): string {
  return `repeat(${columns}, 1fr)`
}
