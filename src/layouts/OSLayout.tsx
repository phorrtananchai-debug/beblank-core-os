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
    <div className="min-h-screen bg-[#f3ebdf] px-4 py-4 text-[#26221c] md:px-6">
      <div className="mx-auto flex w-full max-w-[1450px] gap-4">
        <aside className="sticky top-4 h-[calc(100vh-2rem)] w-[290px] rounded-[28px] border border-[#e0d7ca] bg-[#fffaf1] p-5 shadow-[0_20px_45px_-30px_rgba(34,25,12,0.35)]">
          <div className="mb-5">
            <p className="text-xs uppercase tracking-[0.18em] text-[#9a6a42]">Be Blank</p>
            <h1 className="mt-1 text-xl font-semibold">Core OS</h1>
          </div>
          <nav className="space-y-1">
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                className={({ isActive }) =>
                  `block rounded-2xl px-3 py-2 text-sm transition ${isActive ? 'bg-[#26221c] text-[#fff9ef]' : 'text-[#3f3a33] hover:bg-[#f4ecdf]'}`
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
          <div className="rounded-[28px] border border-[#e0d7ca] bg-[#f9f3e9] p-6">
            <Outlet />
          </div>
          <div className="grid gap-4 rounded-[28px] border border-[#e0d7ca] bg-[#f7efe3] p-4 xl:grid-cols-3">
            <AIContextExportPanel contexts={data.aiContexts} />
            <AISuggestionImportPanel onImport={queueSuggestionImport} />
            <ModuleAISummaryPanel moduleName="" suggestions={data.aiSuggestions} />
          </div>
        </div>
      </div>
    </div>
  )
}

