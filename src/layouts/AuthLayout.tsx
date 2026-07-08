import { Link, Outlet } from 'react-router-dom'

export const AuthLayout = () => {
  return (
    <div className="auth-shell min-h-screen bg-[#d7d3c8] px-5 py-5 text-[#111111] md:px-8">
      <header className="auth-shell-nav flex items-center justify-between">
        <Link to="/" className="transition hover:opacity-55">
          be blank
        </Link>
        <Link to="/" className="transition hover:opacity-55">
          public site
        </Link>
      </header>
      <main className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-screen-2xl items-center justify-center">
        <Outlet />
      </main>
    </div>
  )
}
