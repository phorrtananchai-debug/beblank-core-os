import type { ReactNode } from 'react'

interface Props {
  children: ReactNode
  className?: string
  variant?: 'default' | 'float' | 'compact' | 'tinted'
  padding?: 'sm' | 'md' | 'lg'
  as?: 'div' | 'article' | 'button' | 'link'
  href?: string
  onClick?: () => void
}

const variantStyles: Record<string, string> = {
  default: 'rounded-2xl border border-black/[0.05] bg-white',
  float: 'rounded-2xl border border-black/[0.05] bg-[#faf9f8]',
  compact: 'rounded-2xl border border-black/[0.04] bg-white/80',
  tinted: 'rounded-2xl border border-black/[0.04] bg-[#faf9f8]/80',
}

const paddingStyles: Record<string, string> = {
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-5',
}

export const WorkspaceCard = ({
  children,
  className = '',
  variant = 'default',
  padding = 'md',
  as = 'div',
  href,
  onClick,
}: Props) => {
  const cls = `${variantStyles[variant]} ${paddingStyles[padding]} ${className}`

  if (as === 'button') {
    return (
      <button type="button" className={cls} onClick={onClick}>
        {children}
      </button>
    )
  }

  if (as === 'link') {
    return (
      <a href={href} className={`block ${cls}`} onClick={onClick}>
        {children}
      </a>
    )
  }

  const Tag = as === 'article' ? 'article' : 'div'
  return <Tag className={cls}>{children}</Tag>
}
