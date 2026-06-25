import type { ColorToken } from '../types'

export const colors: ColorToken[] = [
  { name: 'Accent', variable: '--bb-accent', value: '#d97a34', usage: 'Primary interaction color. Used for buttons, links, active states. Max 10-15% of any surface.' },
  { name: 'Accent Border', variable: '--bb-accent-border', value: '#d97a34', usage: 'Accent-colored borders on hover or active states.' },
  { name: 'Accent Strong', variable: '--bb-accent-strong', value: '#c06a2a', usage: 'Stronger accent for pressed states or high-contrast needs.' },
  { name: 'Text', variable: '--bb-text', value: '#1a1a1a', usage: 'Primary text color on white/light surfaces.' },
  { name: 'Text Muted', variable: '--bb-text-muted', value: '#777777', usage: 'Secondary text, labels, metadata.' },
  { name: 'Text Soft', variable: '--bb-text-soft', value: '#666666', usage: 'Body text on tinted surfaces.' },
  { name: 'Text Faint', variable: '--bb-text-faint', value: '#999999', usage: 'Placeholder, disabled, or tertiary text.' },
  { name: 'Border', variable: '--bb-border', value: '#e6e0d5', usage: 'Default border color for cards, panels, dividers.' },
  { name: 'Border Strong', variable: '--bb-border-strong', value: '#d4cdc2', usage: 'Stronger border for hover states or emphasis.' },
  { name: 'Shell', variable: '--bb-shell', value: '#f2efe9', usage: 'Page background / shell color.' },
  { name: 'Surface 2', variable: '--bb-surface-2', value: '#ffffff', usage: 'Card surface, panel background.' },
  { name: 'Surface 3', variable: '--bb-surface-3', value: '#faf9f8', usage: 'Subtle tinted surface for secondary cards.' },
  { name: 'Green', variable: '--bb-green', value: '#16a36a', usage: 'Positive states, healthy status, completed.' },
  { name: 'Amber', variable: '--bb-amber', value: '#c67f1e', usage: 'Warning states, pending review, medium risk.' },
  { name: 'Red', variable: '--bb-red', value: '#c2410c', usage: 'Error states, high risk, blocked, failed.' },
  { name: 'Blue', variable: '--bb-blue', value: '#2563eb', usage: 'Informational states, external links, blue badges.' },
  { name: 'Shadow Sm', variable: '--bb-shadow-sm', value: '0 1px 3px rgba(0,0,0,0.06)', usage: 'Small card shadow.' },
  { name: 'Shadow Md', variable: '--bb-shadow-md', value: '0 4px 12px rgba(0,0,0,0.06)', usage: 'Elevated card shadow.' },
]

export const statusColorTokens: ColorToken[] = [
  { name: 'Status Healthy', variable: '--bb-green', value: '#16a36a', usage: 'OK / healthy / connected / success.' },
  { name: 'Status Watch', variable: '--bb-amber', value: '#c67f1e', usage: 'Watch / warning / pending / medium.' },
  { name: 'Status AtRisk', variable: '--bb-red', value: '#c2410c', usage: 'At risk / failed / critical / error.' },
  { name: 'Status Blocked', variable: '--bb-text-faint', value: '#999999', usage: 'Blocked / disconnected / unavailable.' },
  { name: 'Status Complete', variable: '--bb-text-faint', value: '#999999', usage: 'Complete / done / resolved.' },
]
