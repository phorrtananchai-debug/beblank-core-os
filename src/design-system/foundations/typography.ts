import type { TypographyToken } from '../types'

export const typography: TypographyToken[] = [
  { name: 'Display 1', family: 'IBM Plex Sans Thai, sans-serif', weight: 700, size: '2.4rem', lineHeight: '1', usage: 'Page title / hero heading.' },
  { name: 'Display 2', family: 'IBM Plex Sans Thai, sans-serif', weight: 600, size: '1.9rem', lineHeight: '1', usage: 'Section heading.' },
  { name: 'Heading 3', family: 'IBM Plex Sans Thai, sans-serif', weight: 600, size: '1.1rem', lineHeight: '1.3', usage: 'Card title, panel header.' },
  { name: 'Body', family: 'IBM Plex Sans Thai, sans-serif', weight: 400, size: '0.875rem', lineHeight: '1.6', usage: 'Default body text.' },
  { name: 'Body Small', family: 'IBM Plex Sans Thai, sans-serif', weight: 400, size: '0.75rem', lineHeight: '1.5', usage: 'Secondary text, metadata.' },
  { name: 'Caption', family: 'IBM Plex Sans Thai, sans-serif', weight: 500, size: '0.625rem', lineHeight: '1.4', usage: 'Labels, badges, timestamps.' },
  { name: 'Mono', family: 'Geist Mono, monospace', weight: 500, size: '0.625rem', lineHeight: '1.4', usage: 'Code, metrics, data displays.' },
  { name: 'Mono Small', family: 'Geist Mono, monospace', weight: 500, size: '0.5rem', lineHeight: '1.3', usage: 'Tiny data labels, progress percentages.' },
  { name: 'Button', family: 'IBM Plex Sans Thai, sans-serif', weight: 600, size: '0.75rem', lineHeight: '1', usage: 'Button text, uppercase tracking 0.05em.' },
]
