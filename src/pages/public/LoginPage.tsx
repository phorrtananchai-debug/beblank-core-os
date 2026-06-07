import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../core/auth/useAuth'

interface LocationState {
  from?: string
}

export const LoginPage = () => {
  const { login, isAuthenticated } = useAuth()
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
        Mock protected route for PR #1. Real identity provider will be connected in later milestones.
      </p>
      <button
        className="btn-primary"
        onClick={() => {
          login()
          navigate(redirectTarget, { replace: true })
        }}
      >
        Continue to Core OS
      </button>
    </section>
  )
}

