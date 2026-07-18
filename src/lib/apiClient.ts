import { mapFromApi, mapToApi } from './caseTransform'
import { loginUrlWithNext } from './authRedirect'
import { API_BASE } from './apiBase'

const TOKEN_KEY = 'cargobridge_access'
const REFRESH_KEY = 'cargobridge_refresh'

export function getAccessToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_KEY)
}

export function setTokens(access: string, refresh: string) {
  localStorage.setItem(TOKEN_KEY, access)
  localStorage.setItem(REFRESH_KEY, refresh)
}

export function clearTokens() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(REFRESH_KEY)
}

let refreshInFlight: Promise<boolean> | null = null

async function refreshAccessToken(): Promise<boolean> {
  if (refreshInFlight) return refreshInFlight

  refreshInFlight = (async () => {
    const refresh = localStorage.getItem(REFRESH_KEY)
    if (!refresh) return false
    try {
      const res = await fetch(`${API_BASE}/auth/token/refresh/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh }),
      })
      if (!res.ok) return false
      const data = await res.json()
      if (!data.access) return false
      localStorage.setItem(TOKEN_KEY, data.access)
      if (data.refresh) {
        localStorage.setItem(REFRESH_KEY, data.refresh)
      }
      return true
    } catch {
      return false
    } finally {
      refreshInFlight = null
    }
  })()

  return refreshInFlight
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  retry = true,
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> | undefined),
  }
  const token = getAccessToken()
  if (token) headers.Authorization = `Bearer ${token}`

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers })

  if (res.status === 401 && retry) {
    const refreshed = await refreshAccessToken()
    if (refreshed) return request(path, options, false)
    clearTokens()
    window.location.href = loginUrlWithNext()
    throw new Error('Unauthorized')
  }

  if (res.status === 204) return undefined as T

  const text = await res.text()
  const data = text ? JSON.parse(text) : null

  if (!res.ok) {
    const msg =
      data?.detail ||
      data?.error ||
      data?.message ||
      (data && typeof data === 'object'
        ? Object.entries(data)
            .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : String(v)}`)
            .join('; ')
        : null) ||
      res.statusText
    throw new Error(typeof msg === 'string' ? msg : JSON.stringify(msg))
  }

  return mapFromApi(data) as T
}

export const api = {
  get<T>(path: string): Promise<T> {
    return request<T>(path)
  },

  getList<T>(path: string): Promise<T[]> {
    return request<{ results?: T[] } | T[]>(path).then((data) => {
      if (Array.isArray(data)) return data as T[]
      return (data.results ?? []) as T[]
    })
  },

  post<T>(path: string, body?: unknown): Promise<T> {
    return request<T>(path, {
      method: 'POST',
      body: body !== undefined ? JSON.stringify(mapToApi(body)) : undefined,
    })
  },

  patch<T>(path: string, body: unknown): Promise<T> {
    return request<T>(path, {
      method: 'PATCH',
      body: JSON.stringify(mapToApi(body)),
    })
  },

  delete(path: string): Promise<void> {
    return request<void>(path, { method: 'DELETE' })
  },
}

export interface BootstrapData {
  user: {
    username: string
    profile: { role: string }
    organization: { name: string; nameFr: string }
  }
  organization: { name: string; nameFr: string }
  goods: unknown[]
  agents: unknown[]
  notifications: unknown[]
  templates: unknown[]
  supplierTemplates: unknown[]
  suppliers: unknown[]
  supplierProducts: unknown[]
  supplierCategories: unknown[]
  purchaseOrders: unknown[]
  purchaseOrderItems: unknown[]
  priceHistory: unknown[]
  supplierPayments: unknown[]
  supplierAdjustments: unknown[]
  supplierDocuments: unknown[]
  supplierCommunications: unknown[]
  supplierTasks: unknown[]
  supplierRatings: unknown[]
  currencies: unknown[]
  conversionRecords: unknown[]
  calculatorRecords: unknown[]
  meta?: {
    bootstrapMaxPerCollection?: number
    truncated?: Record<string, { total: number; returned: number }>
  }
}

export async function fetchBootstrap(): Promise<BootstrapData> {
  return api.get<BootstrapData>('/bootstrap/')
}
