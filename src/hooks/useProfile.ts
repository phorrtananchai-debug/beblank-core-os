import { useState, useCallback } from 'react'

const STORAGE_KEY = 'beblank_os_profile_v1'

const DEFAULTS: ProfileData = {
  displayName: 'Por',
  role: 'Director',
  workspace: 'Be Blank OS',
  avatarInitial: 'P',
  avatarUrl: '',
}

export interface ProfileData {
  displayName: string
  role: string
  workspace: string
  avatarInitial: string
  avatarUrl: string
}

function loadProfile(): ProfileData {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const parsed = JSON.parse(stored)
      return { ...DEFAULTS, ...parsed }
    }
  } catch {
    return { ...DEFAULTS }
  }
  return { ...DEFAULTS }
}

export function useProfile() {
  const [profile, setProfile] = useState<ProfileData>(loadProfile)

  const saveProfile = useCallback((updates: Partial<ProfileData>) => {
    const current = loadProfile()
    const next = { ...current, ...updates }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    setProfile(next)
  }, [])

  const resetProfile = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULTS))
    setProfile(DEFAULTS)
  }, [])

  return { profile, saveProfile, resetProfile, defaults: DEFAULTS }
}
