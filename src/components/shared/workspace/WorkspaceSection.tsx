import type { ReactNode } from 'react'

interface Props {
  children: ReactNode
  header?: ReactNode
  className?: string
  variant?: 'card' | 'float' | 'plain'
  padded?: boolean
}

const variantClasses: Record<string, string> = {
  card: 'panel',
  float: 'panel panel-float',
  plain: '',
}

export const WorkspaceSection = ({
  children,
  header,
  className = '',
  variant = 'card',
  padded = true,
}: Props) => (
  <section className={`${variantClasses[variant]} ${padded ? '' : ''} ${className}`}>
    {header}
    {children}
  </section>
)
