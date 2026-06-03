import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../core/auth/AuthContext'
import { useOs } from '../core/os/OsContext'
import { AIContextExportPanel } from '../components/shared/AIContextExportPanel'
import { AISuggestionImportPanel } from '../components/shared/AISuggestionImportPanel'
import { ModuleAISummaryPanel } from '../components/shared/ModuleAISummaryPanel'

const links = [
  { to: '/os', label: 'Command Center', end: true },
  { to: '/os/studio', label: 'Studio Work' },
  { to: '/os/finance', label: 'Finance' },
  { to: '/os/finance/investments', label: 'Investments / Stocks' },
  { to: '/os/finance/family-office', label: 'Family Office Finance' },
  { to: '/os/finance/trading-lab', label: 'Trading Lab / Sandbox' },
  { to: '/os/ai', label: 'AI Workflow' },
  { to: '/os/settings', label: 'Settings' },
]

export const OSLayout = () => {
  const { logout } = useAuth()
  const { data, queueSuggestionImport } = useOs()

  return (
    <div className="os-shell min-h-screen overflow-hidden bg-[#faf9f8] px-3 py-3 text-[#111111] md:px-6 md:py-5">
      <div className="os-ambient-plane" />
      <div className="os-shell-frame mx-auto flex w-full max-w-[1500px] gap-5 rounded-[36px] border border-black/[0.04] bg-[#f2f0ed]/80 p-3 shadow-[0_36px_90px_-56px_rgba(0,0,0,0.34)] backdrop-blur-xl">
        <aside className="os-sidebar sticky top-5 h-[calc(100vh-2.5rem)] w-[292px] rounded-[34px] border border-black/[0.05] bg-[#fffaf1]/95 p-5 shadow-[0_24px_60px_-42px_rgba(0,0,0,0.36)] backdrop-blur-xl">
          <div className="mb-6">
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[#777777]">Studio Environment</p>
            <h1 className="mt-2 text-2xl font-bold leading-none tracking-tight">BE BLANK OS</h1>
            <p className="mt-2 text-xs leading-5 text-[#777777]">Sheet-first operating surface for the team.</p>
          </div>
          <div className="mb-6 grid grid-cols-3 gap-2">
            {['sync', 'ai', 'sheet'].map((item) => (
              <div key={item} className="rounded-2xl border border-black/[0.04] bg-white/55 px-2 py-3 text-center">
                <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.12em] text-[#777777]">{item}</p>
              </div>
            ))}
          </div>
          <nav className="space-y-1.5">
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                className={({ isActive }) =>
                  `os-nav-link block rounded-2xl px-3 py-2.5 text-sm font-semibold transition ${isActive ? 'bg-black text-white shadow-[0_16px_34px_-24px_rgba(0,0,0,0.7)]' : 'text-[#55504a] hover:bg-black/[0.04] hover:text-[#111111]'}`
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>
          <button className="btn-secondary mt-6 w-full" onClick={logout}>Logout</button>
        </aside>

        <div className="min-w-0 flex-1 space-y-5">
          <div className="os-workspace-panel rounded-[34px] border border-black/[0.05] bg-white/92 p-4 shadow-[0_24px_80px_-62px_rgba(0,0,0,0.38)] md:p-7">
            <Outlet />
          </div>
          <div className="os-ai-dock grid gap-4 rounded-[34px] border border-black/[0.05] bg-white/88 p-4 shadow-[0_20px_70px_-58px_rgba(0,0,0,0.32)] xl:grid-cols-3">
            <AIContextExportPanel contexts={data.aiContexts} />
            <AISuggestionImportPanel onImport={queueSuggestionImport} />
            <ModuleAISummaryPanel moduleName="" suggestions={data.aiSuggestions} />
          </div>
        </div>
      </div>
    </div>
  )
}
