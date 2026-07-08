import { onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth'
import { useEffect, useMemo, useState } from 'react'
import { getFirebaseRuntime, isFirebaseConfigured } from '../firebase/firebaseClient'
import { AuthContext, type AuthContextValue } from './authContextObject'

const STORAGE_KEY = 'beblank_os_auth_v1'

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const firebase = getFirebaseRuntime()
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    if (isFirebaseConfigured) return false
    try {
      return localStorage.getItem(STORAGE_KEY) === 'true'
    } catch {
      return false
    }
  })

  useEffect(() => {
    if (!firebase) return undefined
    return onAuthStateChanged(firebase.auth, (user) => {
      setIsAuthenticated(Boolean(user))
    })
  }, [firebase])

  const value = useMemo<AuthContextValue>(
    () => ({
      authMode: firebase ? 'firebase' : 'local/mock',
      isAuthenticated,
      login: async () => {
        if (firebase) {
          await signInWithPopup(firebase.auth, firebase.googleProvider)
          return
        }
        try {
          localStorage.setItem(STORAGE_KEY, 'true')
        } catch { /* ignore */ }
        setIsAuthenticated(true)
      },
      logout: () => {
        if (firebase) {
          void signOut(firebase.auth)
          return
        }
        try {
          localStorage.removeItem(STORAGE_KEY)
        } catch { /* ignore */ }
        setIsAuthenticated(false)
      },
    }),
    [firebase, isAuthenticated],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

