import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../core/auth/useAuth'

interface LocationState {
  from?: string
}

export const LoginPage = () => {
  const { authMode, login, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const state = location.state as LocationState | undefined

  const redirectTarget = state?.from ?? '/os'

  if (isAuthenticated) {
    return <Navigate to="/os" replace />
  }

  return (
    <section className="mx-auto grid max-w-md gap-4 py-16">
      <h1 className="text-4xl font-semibold">Login</h1>
      <p className="text-sm text-[#5a534a]">
        {authMode === 'firebase'
          ? 'Use Google to enter the private BeBlank workspace.'
          : 'Mock protected route for local development. Configure Firebase env for Google login.'}
      </p>
      <button
        className="btn-primary"
        onClick={async () => {
          await login()
          navigate(redirectTarget, { replace: true })
        }}
      >
        {authMode === 'firebase' ? 'Continue with Google' : 'Continue to Core OS'}
      </button>
    </section>
  )
}

