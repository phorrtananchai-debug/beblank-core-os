export type OperationalStatus = 'healthy' | 'watch' | 'atRisk' | 'blocked' | 'complete'

const LABELS: Record<OperationalStatus, string> = {
  healthy: 'Healthy',
  watch: 'Watch',
  atRisk: 'At Risk',
  blocked: 'Blocked',
  complete: 'Complete',
}

const TONES: Record<OperationalStatus, string> = {
  healthy: 'text-[var(--bb-green)]',
  watch: 'text-[var(--bb-amber)]',
  atRisk: 'text-red',
  blocked: 'text-black/[0.4]',
  complete: 'text-[var(--bb-text-muted)]',
}

const DOT_CLASSES: Record<OperationalStatus, string> = {
  healthy: 'bg-[var(--bb-green)]',
  watch: 'bg-[var(--bb-amber)]',
  atRisk: 'bg-red',
  blocked: 'bg-black/[0.2]',
  complete: 'bg-[var(--bb-text-faint)]',
}

const BADGE_CLASSES: Record<OperationalStatus, string> = {
  healthy: 'bg-[var(--bb-green)]/10 text-[var(--bb-green)] border-[var(--bb-green)]/20',
  watch: 'bg-[var(--bb-amber)]/10 text-[var(--bb-amber)] border-[var(--bb-amber)]/20',
  atRisk: 'bg-red/10 text-red border-red/20',
  blocked: 'bg-black/[0.04] text-black/[0.4] border-black/[0.08]',
  complete: 'bg-black/[0.03] text-[var(--bb-text-muted)] border-black/[0.06]',
}

export function getStatusLabel(status: OperationalStatus): string {
  return LABELS[status]
}

export function getStatusTone(status: OperationalStatus): string {
  return TONES[status]
}

export function getStatusDotClass(status: OperationalStatus): string {
  return DOT_CLASSES[status]
}

export function getStatusBadgeClass(status: OperationalStatus): string {
  return BADGE_CLASSES[status]
}

export function normalizeStatus(input: string | undefined | null): OperationalStatus {
  if (!input) return 'healthy'
  const s = input.toLowerCase().trim()
  if (['healthy', 'connected', 'success', 'normal', 'stable', 'good', 'steady', 'on_track', 'on-track'].includes(s)) return 'healthy'
  if (['watch', 'warning', 'attention', 'pending', 'pending_review', 'medium', 'stale'].includes(s)) return 'watch'
  if (['atrisk', 'at_risk', 'at-risk', 'failed', 'critical', 'overdue', 'late', 'high', 'error', 'blocking'].includes(s)) return 'atRisk'
  if (['blocked', 'disconnected', 'missing', 'unavailable', 'paused'].includes(s)) return 'blocked'
  if (['complete', 'completed', 'done', 'resolved', 'archived', 'idle'].includes(s)) return 'complete'
  return 'healthy'
}
