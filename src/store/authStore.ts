import { create } from 'zustand'
import { api, clearTokens, getRefreshToken, setTokens } from '../lib/apiClient'
import type { UserOffice, UserRole } from '../types'
import { useAppStore } from './appStore'

interface AuthUser {
  id: number
  username: string
  email: string
  profile: { role: UserRole; office?: UserOffice }
  organization: { name: string; nameFr: string }
}

interface AuthStore {
  user: AuthUser | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (username: string, password: string) => Promise<void>
  register: (data: {
    username: string
    email: string
    password: string
    companyName: string
    companyNameFr?: string
    acceptTerms: boolean
    office?: UserOffice
  }) => Promise<void>
  logout: () => Promise<void>
  loadUser: () => Promise<void>
  updateProfile: (data: {
    companyName?: string
    companyNameFr?: string
  }) => Promise<void>
  requestPasswordReset: (email: string) => Promise<void>
  confirmPasswordReset: (uid: string, token: string, newPassword: string) => Promise<void>
}

function applyUserToAppStore(user: AuthUser) {
  const app = useAppStore.getState()
  app.setRole(user.profile.role)
  if (user.profile.office) app.setOffice(user.profile.office)
  app.setCompanyName(user.organization.name)
  app.setCompanyNameFr(user.organization.nameFr || '')
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
      applyUserToAppStore(user)
      set({ user, isAuthenticated: true, isLoading: false })
    } catch (e) {
      set({ isLoading: false })
      throw e
    }
  },

  register: async (data) => {
    set({ isLoading: true })
    try {
      const res = await api.post<{
        access: string
        refresh: string
        user: AuthUser
      }>('/auth/register/', {
        username: data.username,
        email: data.email,
        password: data.password,
        companyName: data.companyName,
        companyNameFr: data.companyNameFr || '',
        acceptTerms: data.acceptTerms,
        office: data.office || 'china',
      })
      setTokens(res.access, res.refresh)
      applyUserToAppStore(res.user)
      set({ user: res.user, isAuthenticated: true, isLoading: false })
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
    useAppStore.getState().clearTenantState()
    set({ user: null, isAuthenticated: false })
  },

  loadUser: async () => {
    if (!localStorage.getItem('cargobridge_access')) {
      set({ isAuthenticated: false, user: null })
      return
    }
    try {
      const user = await api.get<AuthUser>('/auth/me/')
      applyUserToAppStore(user)
      set({ user, isAuthenticated: true })
    } catch {
      clearTokens()
      useAppStore.getState().clearTenantState()
      set({ user: null, isAuthenticated: false })
    }
  },

  updateProfile: async (data) => {
    const user = await api.patch<AuthUser>('/auth/me/', data)
    applyUserToAppStore(user)
    set({ user })
  },

  requestPasswordReset: async (email) => {
    await api.post('/auth/password-reset/', { email })
  },

  confirmPasswordReset: async (uid, token, newPassword) => {
    await api.post('/auth/password-reset/confirm/', {
      uid,
      token,
      newPassword,
    })
  },
}))
