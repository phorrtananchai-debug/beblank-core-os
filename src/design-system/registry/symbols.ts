import type { SymbolDef } from '../types'

export const symbols: SymbolDef[] = [
  { id: 'healthy-dot', label: 'Healthy green dot', meaning: 'Everything is operating normally. No action needed.', usage: 'Status indicators, source health, division mood.' },
  { id: 'watch-dot', label: 'Amber watch dot', meaning: 'Something needs attention but is not broken.', usage: 'Pending review items, stale sources, medium risk.' },
  { id: 'at-risk-dot', label: 'Red at-risk dot', meaning: 'Critical issue requiring immediate action.', usage: 'Failed sources, high risk, blocked items.' },
  { id: 'blocked-dot', label: 'Gray blocked dot', meaning: 'Item is disabled, unavailable, or paused.', usage: 'Offline divisions, disabled features.' },
  { id: 'pulse-dot', label: 'Animated pulse dot', meaning: 'System is actively processing or running.', usage: 'Running agents, active processes, live indicators.' },
  { id: 'pill-count', label: 'Pill count badge', meaning: 'Numerical count of items in a category.', usage: 'Tab counts, queue lengths, metric end-slots.' },
  { id: 'accent-border-left', label: 'Left accent border', meaning: 'Visual grouping or ownership indicator by color.', usage: 'Division cards in Command Center, color-coded sections.' },
]
