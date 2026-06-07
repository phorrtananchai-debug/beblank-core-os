import { useMemo, useState } from 'react'
import { AuthContext, type AuthContextValue } from './authContextObject'

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  const value = useMemo<AuthContextValue>(
    () => ({
      isAuthenticated,
      login: () => setIsAuthenticated(true),
      logout: () => setIsAuthenticated(false),
    }),
    [isAuthenticated],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

