import type { SpacingToken } from '../types'

export const spacing: SpacingToken[] = [
  { name: '3xs', value: '0.125rem', usage: 'Tiny gaps between inline elements.' },
  { name: '2xs', value: '0.25rem', usage: 'Compact spacing, badge padding.' },
  { name: 'xs', value: '0.375rem', usage: 'Small gaps between related items.' },
  { name: 'sm', value: '0.5rem', usage: 'Default gap between form elements.' },
  { name: 'md', value: '0.75rem', usage: 'Section spacing, card padding.' },
  { name: 'lg', value: '1rem', usage: 'Panel padding, grid gap.' },
  { name: 'xl', value: '1.5rem', usage: 'Section margins, hero padding.' },
  { name: '2xl', value: '2rem', usage: 'Page section spacing.' },
  { name: '3xl', value: '2.5rem', usage: 'Large page separation.' },
]

export const radius: SpacingToken[] = [
  { name: 'sm', value: '0.375rem', usage: 'Badges, small indicators.' },
  { name: 'md', value: '0.5rem', usage: 'Buttons, inputs.' },
  { name: 'lg', value: '0.75rem', usage: 'Cards, panels.' },
  { name: 'xl', value: '1rem', usage: 'Modals, large panels.' },
  { name: '2xl', value: '1.5rem', usage: 'Hero sections, command headers.' },
  { name: 'full', value: '9999px', usage: 'Pills, circular avatars.' },
]
