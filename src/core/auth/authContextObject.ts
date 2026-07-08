import { createContext } from 'react'

export interface AuthContextValue {
  isAuthenticated: boolean
  authMode: 'firebase' | 'local/mock'
  login: () => Promise<void>
  logout: () => void
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined)
