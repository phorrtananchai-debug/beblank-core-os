import type { ReactNode } from 'react'

interface Props {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
}

export const WorkspaceDrawer = ({ open, onClose, title, children }: Props) => {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/[0.2] backdrop-blur-sm" onClick={onClose} />

      {/* Drawer panel */}
      <div className="relative flex h-full w-full flex-col overflow-y-auto bg-white shadow-2xl md:w-[680px] md:rounded-l-[28px]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-black/[0.05] px-6 py-4">
          <h2 className="text-lg font-bold">{title}</h2>
          <button
            className="flex h-8 w-8 items-center justify-center rounded-full bg-black/[0.05] text-sm transition hover:bg-black/[0.1]"
            type="button"
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {children}
        </div>
      </div>
    </div>
  )
}
