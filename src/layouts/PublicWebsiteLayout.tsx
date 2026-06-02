import { Link, NavLink, Outlet } from 'react-router-dom'

const navItems = [
  { to: '/', label: 'Home' },
  { to: '/projects', label: 'Projects' },
  { to: '/about', label: 'About' },
  { to: '/contact', label: 'Contact' },
  { to: '/login', label: 'Login' },
]

export const PublicWebsiteLayout = () => {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#fffdf7,_#f6f0e6_65%,_#efe5d7)] text-[#23201c]">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6">
        <Link to="/" className="text-xl font-semibold tracking-tight">Be Blank Core OS</Link>
        <nav className="flex flex-wrap items-center gap-2">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `rounded-full px-4 py-2 text-sm transition ${isActive ? 'bg-[#23201c] text-[#fffdf7]' : 'hover:bg-white/70'}`
              }
              end={item.to === '/'}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </header>
      <main className="mx-auto w-full max-w-6xl px-6 pb-16">
        <Outlet />
      </main>
    </div>
  )
}

