import { create } from 'zustand'
import { api, clearTokens, getRefreshToken, setTokens } from '../lib/apiClient'
import type { UserRole } from '../types'

interface AuthUser {
  id: number
  username: string
  email: string
  profile: { role: UserRole }
  organization: { name: string; nameFr: string }
}

interface AuthStore {
  user: AuthUser | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (username: string, password: string) => Promise<void>
  logout: () => Promise<void>
  loadUser: () => Promise<void>
  updateProfile: (data: {
    companyName?: string
    companyNameFr?: string
  }) => Promise<void>
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  isAuthenticated: !!localStorage.getItem('cargobridge_access'),
  isLoading: false,

  login: async (username, password) => {
    set({ isLoading: true })
    try {
      const tokens = await api.post<{ access: string; refresh: string }>(
        '/auth/token/',
        { username, password },
      )
      setTokens(tokens.access, tokens.refresh)
      const user = await api.get<AuthUser>('/auth/me/')
      set({ user, isAuthenticated: true, isLoading: false })
    } catch (e) {
      set({ isLoading: false })
      throw e
    }
  },

  logout: async () => {
    const refresh = getRefreshToken()
    try {
      if (refresh) {
        await api.post('/auth/logout/', { refresh })
      }
    } catch {
      // Still clear local session if blacklist fails (expired token, offline, etc.)
    }
    clearTokens()
    set({ user: null, isAuthenticated: false })
  },

  loadUser: async () => {
    if (!localStorage.getItem('cargobridge_access')) {
      set({ isAuthenticated: false, user: null })
      return
    }
    try {
      const user = await api.get<AuthUser>('/auth/me/')
      set({ user, isAuthenticated: true })
    } catch {
      clearTokens()
      set({ user: null, isAuthenticated: false })
    }
  },

  updateProfile: async (data) => {
    const user = await api.patch<AuthUser>('/auth/me/', data)
    set({ user })
  },
}))
