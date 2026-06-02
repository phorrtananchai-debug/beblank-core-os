import { Link, NavLink, Outlet } from 'react-router-dom'

const navItems = [
  { to: '/contact', label: 'contact' },
  { to: '/projects', label: 'projects' },
  { to: '/work', label: 'work' },
  { to: '/journal', label: 'journal' },
  { to: '/about', label: 'about' },
]

export const PublicWebsiteLayout = () => {
  return (
    <div className="public-studio-canvas min-h-screen text-[#111111]">
      <header className="public-masthead-nav fixed left-0 right-0 top-0 z-50 grid grid-cols-[1fr_auto_1fr] items-center px-5 py-4 md:px-8">
        <Link to="/" className="justify-self-start transition hover:opacity-55">
          be blank
        </Link>
        <nav className="flex flex-wrap items-center justify-center gap-4 md:gap-7">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `transition hover:opacity-55 ${isActive ? 'text-[#111111]' : 'text-[#777777]'}`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <a
          className="justify-self-end text-[#111111] transition hover:opacity-55"
          href="https://instagram.com"
          rel="noreferrer"
          target="_blank"
        >
          instagram
        </a>
      </header>
      <main>
        <Outlet />
      </main>
      <div className="public-utility-dock">
        <Link to="/login">os</Link>
        <Link to="/login">edit</Link>
      </div>
    </div>
  )
}
