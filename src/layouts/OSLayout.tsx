import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { MiniLegend, RouteMark, SourceMark } from '../components/shared/workspace/marks'
import { useAuth } from '../core/auth/useAuth'
import { useProfile } from '../hooks/useProfile'
import { GridOverlay } from '../components/shared/GridOverlay'
import { SpatialProvider } from '../components/shared/SpatialProvider'
import { useSpatial } from '../design/spatial'

const groups = [
  {
    label: 'OPERATE',
    links: [
      { to: '/os', label: 'Command Center', icon: 'CC', end: true },
      { to: '/os/studio', label: 'Studio', icon: 'ST' },
    ],
  },
  {
    label: 'WEALTH',
    links: [
      { to: '/os/finance', label: 'Capital', icon: 'CA' },
      { to: '/os/finance/investments', label: 'Investments', icon: 'IN' },
      { to: '/os/capital', label: 'Reserves', icon: 'RS' },
    ],
  },
  {
    label: 'LAB',
    links: [
      { to: '/os/finance/trading-lab', label: 'Trading Lab', icon: 'TL' },
      { to: '/os/ai', label: 'AI Workspace', icon: 'AI' },
    ],
  },
  {
    label: 'SYSTEM',
    links: [
      { to: '/os/settings', label: 'Settings', icon: 'SE' },
      { to: '/os/bridge', label: 'Bridge', icon: 'BR' },
    ],
  },
]

const ShellInner = ({ children }: { children: React.ReactNode }) => {
  const { config } = useSpatial()
  return (
    <div className="os-shell relative min-h-screen overflow-hidden bg-[var(--bb-shell)] px-3 py-3 text-[var(--bb-text)] md:px-6 md:py-5">
      <GridOverlay enabled={true} variant={config.variant} pointerEvents={false} shell={true} />
      {children}
    </div>
  )
}

export const OSLayout = () => {
  const { logout } = useAuth()
  const navigate = useNavigate()
  const { profile } = useProfile()

  return (
    <SpatialProvider>
      <ShellInner>
        {/* existing shell content */}
        <div className="os-shell-frame mx-auto flex w-full max-w-[1500px] gap-5 rounded-[22px] border border-[var(--bb-border)]/80 bg-white/70 p-3 shadow-[var(--bb-shadow-sm)]">
        <aside className="os-sidebar sticky top-5 flex h-[calc(100vh-2.5rem)] w-[292px] flex-col overflow-x-hidden rounded-[18px] border border-[var(--bb-border)] bg-white/90 p-5 shadow-[var(--bb-shadow-sm)]">
          <div className="flex-1 overflow-y-auto overflow-x-hidden">
            <div className="mb-6">
              <p className="text-[10px] font-semibold text-[#777777]">Studio environment</p>
              <h1 className="mt-2 text-2xl font-bold leading-none tracking-tight">BE BLANK OS</h1>
              <p className="mt-2 text-xs leading-5 text-[#777777]">Connected workspace for teams</p>
            </div>
            <div className="mb-6 border-y border-[var(--bb-border)] py-3">
              <MiniLegend
                items={[
                  { label: 'manual sync', mark: <SourceMark /> },
                  { label: 'review first', mark: <RouteMark label="AI" /> },
                  { label: 'sheet source', mark: <SourceMark live /> },
                ]}
              />
            </div>
            <nav className="space-y-5">
              {groups.map((group) => (
                <div key={group.label}>
                  <p className="mb-1.5 px-3 font-mono text-[8px] font-semibold uppercase tracking-[0.1em] text-[var(--bb-text-faint)]">{group.label}</p>
                  <div className="space-y-0.5">
                    {group.links.map((link) => (
                      <NavLink
                        key={link.to}
                        to={link.to}
                        end={link.end}
                        className={({ isActive }) =>
                          `group flex items-center gap-3 rounded-lg border border-transparent px-3 py-2.5 text-sm font-semibold transition-all duration-200 ${
                            isActive
                              ? 'border-[var(--bb-accent-border)] bg-[var(--bb-accent-soft)] text-[var(--bb-accent-strong)]'
                              : 'text-[var(--bb-text-muted)] hover:bg-black/[0.03] hover:text-[var(--bb-text)]'
                          }`
                        }
                      >
                        <RouteMark label={link.icon} />
                        {link.label}
                      </NavLink>
                    ))}
                  </div>
                </div>
              ))}
            </nav>
          </div>
          <div className="mt-4 space-y-2">
            <div className="group flex cursor-pointer items-center gap-3 rounded-2xl border border-[var(--bb-border)]/60 bg-white px-3 py-2.5 transition-all duration-200 hover:border-[var(--bb-accent-border)]" onClick={() => navigate('/os/settings')} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') navigate('/os/settings') }}>
              <div className="relative shrink-0">
                {profile.avatarUrl ? (
                  <img src={profile.avatarUrl} alt="" className="h-10 w-10 rounded-full object-cover" />
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--bb-accent)] text-sm font-bold text-white">{profile.avatarInitial}</div>
                )}
                <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-white bg-[var(--bb-green)]" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold leading-tight">{profile.displayName}</p>
                <p className="text-[10px] leading-tight text-[var(--bb-text-muted)] group-hover:text-[var(--bb-accent-strong)]">{profile.role}</p>
              </div>
              <span className="text-xs text-[var(--bb-text-faint)] transition-colors duration-200 group-hover:text-[var(--bb-accent)]">v</span>
            </div>
            <button className="btn-secondary w-full" onClick={logout}>Log out</button>
          </div>
        </aside>

        <div className="min-w-0 flex-1 space-y-5">
          <div className="os-workspace-panel break-words rounded-[20px] border border-[var(--bb-border)] bg-white/92 p-4 shadow-[var(--bb-shadow-sm)] md:p-7">
            <Outlet />
          </div>
        </div>
      </div>
      </ShellInner>
    </SpatialProvider>
  )
}


