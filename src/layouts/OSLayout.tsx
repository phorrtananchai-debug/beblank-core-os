import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../core/auth/useAuth'
import { useProfile } from '../hooks/useProfile'

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
      { to: '/os/labs/investments-v2', label: 'Investment V2 (Preview)', icon: 'V2' },
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

export const OSLayout = () => {
  const { logout } = useAuth()
  const navigate = useNavigate()
  const { profile } = useProfile()

  return (
    <div className="os-shell min-h-screen overflow-hidden bg-[var(--bb-shell)] px-3 py-3 text-[var(--bb-text)] md:px-6 md:py-5">
      <div className="os-ambient-plane" />
      <div className="os-shell-frame mx-auto flex w-full max-w-[1500px] gap-5 rounded-[36px] border border-[var(--bb-border)]/60 bg-white/80 p-3 shadow-[0_36px_90px_-56px_rgba(0,0,0,0.34)] backdrop-blur-xl">
        <aside className="os-sidebar sticky top-5 flex h-[calc(100vh-2.5rem)] w-[292px] flex-col overflow-x-hidden rounded-[34px] border border-[var(--bb-border)] bg-white/92 p-5 shadow-[0_24px_60px_-42px_rgba(0,0,0,0.36)] backdrop-blur-xl">
          <div className="flex-1 overflow-y-auto overflow-x-hidden">
            <div className="mb-6">
              <p className="text-[10px] font-semibold text-[#777777]">Studio environment</p>
              <h1 className="mt-2 text-2xl font-bold leading-none tracking-tight">BE BLANK OS</h1>
              <p className="mt-2 text-xs leading-5 text-[#777777]">Connected workspace for teams</p>
            </div>
            <div className="mb-6 grid grid-cols-3 gap-2">
              {['sync', 'ai', 'sheet'].map((item) => (
                <div key={item} className="rounded-2xl border border-black/[0.04] bg-white/55 px-2 py-3 text-center">
                  <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.12em] text-[#777777]">{item}</p>
                </div>
              ))}
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
                          `group flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-semibold transition-all duration-200 ${
                            isActive
                              ? 'bg-[var(--bb-accent)]/10 text-[var(--bb-accent)] shadow-sm'
                              : 'text-[var(--bb-text-muted)] hover:bg-black/[0.03] hover:text-[var(--bb-text)]'
                          }`
                        }
                      >
                        <span className={`flex h-6 w-6 items-center justify-center rounded-lg text-xs transition-all duration-200 ${
                          (() => { switch (link.to) {
                            case '/os':
                            case '/os/studio':
                              return 'bg-black/[0.04] text-[var(--bb-text-muted)]'
                            case '/os/finance':
                            case '/os/finance/investments':
                            case '/os/capital':
                              return 'bg-[var(--bb-amber)]/10 text-[var(--bb-amber)]'
                            case '/os/finance/trading-lab':
                              return 'bg-black/[0.04] text-[var(--bb-text-muted)]'
                            case '/os/ai':
                              return 'bg-black/[0.04] text-[var(--bb-text-muted)]'
                            default:
                              return 'bg-black/[0.04] text-[var(--bb-text-faint)]'
                          } })()
                        }`}>{link.icon}</span>
                        {link.label}
                      </NavLink>
                    ))}
                  </div>
                </div>
              ))}
            </nav>
          </div>
          <div className="mt-4 space-y-2">
            <div className="group flex cursor-pointer items-center gap-3 rounded-2xl border border-[var(--bb-border)]/60 bg-white px-3 py-2.5 shadow-sm transition-all duration-200 hover:border-[var(--bb-accent-border)] hover:shadow-[var(--bb-shadow-sm)]" onClick={() => navigate('/os/settings')} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') navigate('/os/settings') }}>
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
          <div className="os-workspace-panel break-words rounded-[34px] border border-[var(--bb-border)] bg-white/92 p-4 shadow-[0_24px_80px_-62px_rgba(0,0,0,0.38)] md:p-7">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  )
}


