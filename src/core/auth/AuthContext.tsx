import { useMemo, useState } from 'react'
import { AuthContext, type AuthContextValue } from './authContextObject'

const STORAGE_KEY = 'beblank_os_auth_v1'

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === 'true'
    } catch {
      return false
    }
  })

  const value = useMemo<AuthContextValue>(
    () => ({
      isAuthenticated,
      login: () => {
        try { localStorage.setItem(STORAGE_KEY, 'true') } catch { /* ignore */ }
        setIsAuthenticated(true)
      },
      logout: () => {
        try { localStorage.removeItem(STORAGE_KEY) } catch { /* ignore */ }
        setIsAuthenticated(false)
      },
    }),
    [isAuthenticated],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

