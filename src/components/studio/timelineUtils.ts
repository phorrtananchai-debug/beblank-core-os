import type { Project } from '../../types/models'

export const PHASES = [
  { id: 'brief', label: 'Brief', color: 'bg-black/[0.2]' },
  { id: 'design', label: 'Design', color: 'bg-[var(--bb-accent)]' },
  { id: 'approval', label: 'Approval', color: 'bg-[var(--bb-amber)]' },
  { id: 'production', label: 'Production', color: 'bg-[var(--bb-accent)]/60' },
  { id: 'construction', label: 'Construction', color: 'bg-[var(--bb-green)]' },
  { id: 'opening', label: 'Opening', color: 'bg-[var(--bb-green)]/70' },
  { id: 'maintenance', label: 'Maint.', color: 'bg-black/[0.15]' },
]

export function mapPhase(p: string): string {
  const s = p.toLowerCase()
  if (s.includes('brief') || s.includes('feasibility') || s.includes('concept')) return 'brief'
  if (s.includes('design') || s.includes('dd') || s.includes('drawing') || s.includes('schematic')) return 'design'
  if (s.includes('approval') || s.includes('review') || s.includes('permit')) return 'approval'
  if (s.includes('production') || s.includes('procurement') || s.includes('bid') || s.includes('buyout')) return 'production'
  if (s.includes('construction') || s.includes('site') || s.includes('build')) return 'construction'
  if (s.includes('opening') || s.includes('handover') || s.includes('hand-off')) return 'opening'
  if (s.includes('maintenance') || s.includes('ops') || s.includes('operations') || s.includes('complete')) return 'maintenance'
  return 'design'
}

export function projectStatus(p: Project): import('../../design/visual-language').OperationalStatus {
  if (p.timelineStatus === 'at-risk') return 'atRisk'
  if (p.timelineStatus === 'watch') return 'watch'
  if (p.status === 'paused') return 'blocked'
  return 'healthy'
}

export function daysUntil(dateStr: string): number {
  return Math.round((new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
}
