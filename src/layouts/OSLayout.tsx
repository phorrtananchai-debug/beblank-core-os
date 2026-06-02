import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../core/auth/AuthContext'
import { useOs } from '../core/os/OsContext'
import { AIContextExportPanel } from '../components/shared/AIContextExportPanel'
import { AISuggestionImportPanel } from '../components/shared/AISuggestionImportPanel'
import { ModuleAISummaryPanel } from '../components/shared/ModuleAISummaryPanel'

const links = [
  { to: '/os', label: 'Command Center', end: true },
  { to: '/os/studio', label: 'Studio' },
  { to: '/os/finance', label: 'Finance' },
  { to: '/os/finance/investments', label: 'Investments' },
  { to: '/os/finance/family-office', label: 'Family Office' },
  { to: '/os/finance/trading-lab', label: 'Trading Lab' },
  { to: '/os/ai-workflow', label: 'AI Workflow' },
  { to: '/os/settings', label: 'Settings' },
]

export const OSLayout = () => {
  const { logout } = useAuth()
  const { data, queueSuggestionImport } = useOs()

  return (
    <div className="os-shell min-h-screen bg-[#faf9f8] px-4 py-4 text-[#111111] md:px-6">
      <div className="mx-auto flex w-full max-w-[1480px] gap-5 rounded-[32px] border border-black/[0.04] bg-[#f3f1ee] p-3 shadow-[0_28px_70px_-48px_rgba(0,0,0,0.28)]">
        <aside className="sticky top-4 h-[calc(100vh-2rem)] w-[292px] rounded-[32px] border border-black/[0.05] bg-[#fffaf1] p-5 shadow-[0_20px_45px_-34px_rgba(0,0,0,0.34)]">
          <div className="mb-6">
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[#777777]">Studio Environment</p>
            <h1 className="mt-2 text-2xl font-bold leading-none tracking-tight">BE BLANK OS</h1>
            <p className="mt-2 text-xs leading-5 text-[#777777]">Sheet-first operating surface</p>
          </div>
          <nav className="space-y-1">
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                className={({ isActive }) =>
                  `block rounded-2xl px-3 py-2 text-sm font-semibold transition ${isActive ? 'bg-black text-white' : 'text-[#55504a] hover:bg-black/[0.04] hover:text-[#111111]'}`
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>
          <button className="btn-secondary mt-6 w-full" onClick={logout}>
            Logout
          </button>
        </aside>

        <div className="flex-1 space-y-4">
          <div className="rounded-[32px] border border-black/[0.05] bg-white p-5 md:p-7">
            <Outlet />
          </div>
          <div className="grid gap-4 rounded-[32px] border border-black/[0.05] bg-white p-4 xl:grid-cols-3">
            <AIContextExportPanel contexts={data.aiContexts} />
            <AISuggestionImportPanel onImport={queueSuggestionImport} />
            <ModuleAISummaryPanel moduleName="" suggestions={data.aiSuggestions} />
          </div>
        </div>
      </div>
    </div>
  )
}

