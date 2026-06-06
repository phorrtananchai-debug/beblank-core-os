import type { OperationalStatus } from '../../design/visual-language'
import { getStatusVisual } from '../../design/visual-language'

interface Props {
  status: OperationalStatus
  label?: string
  size?: 'sm' | 'md'
  showDot?: boolean
  showIcon?: boolean
}

const sizeClasses = {
  sm: 'px-2 py-0.5 text-[9px] gap-1',
  md: 'px-2.5 py-1 text-[10px] gap-1.5',
}

const dotSizeClasses = {
  sm: 'h-1.5 w-1.5',
  md: 'h-2 w-2',
}

export const OperationalStatusChip = ({ status, label, size = 'sm', showDot = true, showIcon = false }: Props) => {
  const v = getStatusVisual(status)
  return (
    <span className={`inline-flex items-center rounded-full font-mono font-semibold uppercase tracking-[0.06em] ${v.badgeClass} ${sizeClasses[size]}`}>
      {showIcon && <span className={`text-[10px] leading-none ${v.dotClass}`}>{v.icon}</span>}
      {showDot && !showIcon && <span className={`inline-block shrink-0 rounded-full ${v.dotClass} ${dotSizeClasses[size]}`} />}
      {label ?? v.label}
    </span>
  )
}

export type { OperationalStatus }
