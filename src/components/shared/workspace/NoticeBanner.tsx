import type { ReactNode } from 'react'

interface Props {
  children: ReactNode
  variant?: 'warning' | 'info' | 'success' | 'error'
  className?: string
}

const styles: Record<string, string> = {
  warning: 'border-[#c67f1e]/20 bg-[#c67f1e]/5 text-[#c67f1e]',
  info: 'border-[#2563eb]/20 bg-[#2563eb]/5 text-[#2563eb]',
  success: 'border-[#16a36a]/20 bg-[#16a36a]/5 text-[#16a36a]',
  error: 'border-[#c2410c]/20 bg-[#c2410c]/5 text-[#c2410c]',
}

export const NoticeBanner = ({ children, variant = 'warning', className = '' }: Props) => (
  <div className={`rounded-xl border px-3 py-2 text-xs leading-5 ${styles[variant]} ${className}`}>
    {children}
  </div>
)
