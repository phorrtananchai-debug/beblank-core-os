import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../core/auth/useAuth'
import { useProfile } from '../hooks/useProfile'

type NavGroup = {
  label: string
  links: Array<{
    to: string
    label: string
    icon: string
    end?: boolean
  }>
}

const groups: NavGroup[] = [
  {
    label: 'OPERATE',
    links: [
      { to: '/os/command-center', label: 'Command Center', icon: 'CC' },
      { to: '/os/studio', label: 'Studio', icon: 'ST' },
    ],
  },
  {
    label: 'WEALTH',
    links: [
      { to: '/os/finance', label: 'Capital', icon: 'CP' },
      { to: '/os/finance/investments', label: 'Investments', icon: 'IV' },
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

export const OSLayout = () => {
  const { logout } = useAuth()
  const navigate = useNavigate()
  const { profile } = useProfile()

  return (
    <div className="os-shell min-h-screen overflow-hidden bg-[var(--bb-canvas)] px-2 py-2 text-[var(--bb-text)] md:px-4 md:py-4">
      <div className="os-ambient-plane" />
      <div className="os-shell-frame mx-auto flex w-full max-w-[1560px] gap-3 rounded-[18px] border border-[var(--bb-border)] bg-[var(--bb-shell)] p-3">
        <aside className="os-sidebar sticky top-4 flex h-[calc(100vh-2rem)] w-[280px] flex-col overflow-x-hidden rounded-[16px] border border-[var(--bb-border)] bg-[var(--bb-surface-2)] p-4">
          <div className="flex-1 overflow-y-auto overflow-x-hidden">
            <div className="mb-5 border-b border-[var(--bb-border)] pb-4">
              <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--bb-text-faint)]">Operational shell</p>
              <h1 className="mt-2 text-[1.4rem] font-semibold leading-none tracking-[-0.03em]">BE BLANK OS</h1>
              <p className="mt-2 max-w-[22ch] text-[12px] leading-5 text-[var(--bb-text-muted)]">Command software for linked teams, reviews, and division status.</p>
            </div>
            <div className="mb-5 grid grid-cols-3 gap-2">
              {['sync', 'ai', 'sheet'].map((item) => (
                <div key={item} className="rounded-[10px] border border-[var(--bb-border)] bg-[var(--bb-surface-3)] px-2 py-2 text-center">
                  <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.12em] text-[var(--bb-text-muted)]">{item}</p>
                </div>
              ))}
            </div>
            <nav className="space-y-4">
              {groups.map((group) => (
                <div key={group.label}>
                  <p className="mb-1.5 px-2 font-mono text-[9px] font-semibold uppercase tracking-[0.14em] text-[var(--bb-text-faint)]">{group.label}</p>
                  <div className="space-y-0.5">
                    {group.links.map((link) => (
                      <NavLink
                        key={link.to}
                        to={link.to}
                        end={link.end}
                        className={({ isActive }) =>
                          `os-nav-link group flex items-center gap-3 rounded-[10px] border px-3 py-2.5 text-[13px] font-medium transition-all duration-200 ${
                            isActive
                              ? 'border-[var(--bb-accent-border)] bg-[var(--bb-accent-soft)] text-[var(--bb-text)]'
                              : 'border-transparent text-[var(--bb-text-muted)] hover:border-[var(--bb-border)] hover:bg-[var(--bb-surface-4)] hover:text-[var(--bb-text)]'
                          }`
                        }
                      >
                        {({ isActive }) => (
                          <>
                            <span
                              className={`flex h-6 w-6 items-center justify-center rounded-[8px] border text-[10px] font-bold transition-all duration-200 ${
                                isActive
                                  ? 'border-[var(--bb-accent-border)] bg-white text-[var(--bb-accent-strong)]'
                                  : 'border-[var(--bb-border)] bg-[var(--bb-surface-4)] text-[var(--bb-text-muted)]'
                              }`}
                            >
                              {link.icon}
                            </span>
                            {link.label}
                          </>
                        )}
                      </NavLink>
                    ))}
                  </div>
                </div>
              ))}
            </nav>
          </div>
          <div className="mt-4 space-y-2 border-t border-[var(--bb-border)] pt-3">
            <div
              className="group flex cursor-pointer items-center gap-3 rounded-[12px] border border-[var(--bb-border)] bg-[var(--bb-surface-2)] px-3 py-2.5 transition-colors duration-200 hover:border-[var(--bb-border-strong)] hover:bg-[var(--bb-surface-3)]"
              onClick={() => navigate('/os/settings')}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') navigate('/os/settings')
              }}
            >
              <div className="relative shrink-0">
                {profile.avatarUrl ? (
                  <img src={profile.avatarUrl} alt="" className="h-10 w-10 rounded-full object-cover" />
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--bb-accent-border)] bg-[var(--bb-accent-soft)] text-sm font-bold text-[var(--bb-accent-strong)]">{profile.avatarInitial}</div>
                )}
                <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-white bg-[var(--bb-green)]" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold leading-tight">{profile.displayName}</p>
                <p className="text-[10px] leading-tight text-[var(--bb-text-muted)]">{profile.role}</p>
              </div>
              <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--bb-text-faint)]">ID</span>
            </div>
            <button className="btn-secondary w-full" onClick={logout}>Log Out</button>
          </div>
        </aside>

        <div className="min-w-0 flex-1 space-y-4">
          <div className="os-workspace-panel break-words rounded-[16px] border border-[var(--bb-border)] bg-[var(--bb-surface-2)] p-4 md:p-6">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  )
}
