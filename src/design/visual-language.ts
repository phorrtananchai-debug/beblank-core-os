export type OperationalStatus = 'healthy' | 'watch' | 'atRisk' | 'blocked' | 'complete'

export interface StatusVisual {
  icon: string
  dotClass: string
  badgeClass: string
  label: string
}

export const STATUS_VISUALS: Record<OperationalStatus, StatusVisual> = {
  healthy: {
    icon: '✓',
    dotClass: 'bg-[var(--bb-green)]',
    badgeClass: 'bg-[var(--bb-green)]/10 text-[var(--bb-green)] border-[var(--bb-green)]/20',
    label: 'Healthy',
  },
  watch: {
    icon: '⚠',
    dotClass: 'bg-[var(--bb-amber)]',
    badgeClass: 'bg-[var(--bb-amber)]/10 text-[var(--bb-amber)] border-[var(--bb-amber)]/20',
    label: 'Watch',
  },
  atRisk: {
    icon: '!',
    dotClass: 'bg-red',
    badgeClass: 'bg-red/10 text-red border-red/20',
    label: 'At Risk',
  },
  blocked: {
    icon: '⛔',
    dotClass: 'bg-black/[0.25]',
    badgeClass: 'bg-black/[0.05] text-black/[0.45] border-black/[0.08]',
    label: 'Blocked',
  },
  complete: {
    icon: '●',
    dotClass: 'bg-[var(--bb-text-faint)]',
    badgeClass: 'bg-black/[0.03] text-[var(--bb-text-muted)] border-black/[0.06]',
    label: 'Complete',
  },
}

export function getStatusVisual(status: OperationalStatus): StatusVisual {
  return STATUS_VISUALS[status]
}
