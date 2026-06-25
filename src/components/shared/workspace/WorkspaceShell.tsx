import type { ReactNode } from 'react'

export const WorkspaceShell = ({ children, sidebar }: { children: ReactNode; sidebar?: ReactNode }) => (
  <div className="flex min-h-[200px] rounded-xl border border-black/[0.05] bg-white overflow-hidden">
    {sidebar && <div className="w-48 shrink-0 border-r border-black/[0.05] bg-[#faf9f8] p-3 text-xs text-[var(--bb-text-muted)]">{sidebar}</div>}
    <div className="flex-1 p-4 text-sm text-[var(--bb-text)]">{children}</div>
  </div>
)
