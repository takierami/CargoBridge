import { api, getAccessToken } from '../lib/apiClient'
import { API_BASE } from '../lib/apiBase'
import { mapFromApi } from '../lib/caseTransform'

export interface TrackTimelineEvent {
  id: string
  fromStatus: string
  toStatus: string
  user: string
  office: string
  notes: string
  photos: string[]
  latitude: number | null
  longitude: number | null
  createdAt: string
}

export interface TrackAction {
  status: string
  actionKey: string
}

export interface TrackPayload {
  token: string
  trackingNumber: string
  description: string
  descriptionFr: string
  category: string
  quantity: number
  weight: number | null
  value: number | null
  status: string
  priority: string
  transportType: string
  agentName: string
  departureDate: string | null
  expectedArrivalDate: string | null
  arrivalDate: string | null
  notes: string
  photos: string[]
  createdAt: string
  timeline: TrackTimelineEvent[]
  allowedActions: TrackAction[]
  authenticated: boolean
  statusConsistent?: boolean
  lastEventStatus?: string | null
  success?: boolean
}

export interface GoodsQrInfo {
  token: string
  url: string
  createdAt: string
  isActive: boolean
}

/** Public GET that does not force login redirect on 401 (retries anonymously). */
async function trackGet(token: string): Promise<TrackPayload> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  const access = getAccessToken()
  if (access) headers.Authorization = `Bearer ${access}`

  let res = await fetch(`${API_BASE}/track/${token}/`, { headers })
  if (res.status === 401) {
    res = await fetch(`${API_BASE}/track/${token}/`, {
      headers: { 'Content-Type': 'application/json' },
    })
  }
  const text = await res.text()
  const data = text ? JSON.parse(text) : null
  if (!res.ok) {
    throw new Error(data?.error || data?.detail || res.statusText)
  }
  return mapFromApi(data) as TrackPayload
}

export const trackingService = {
  generateQr(goodsId: string): Promise<GoodsQrInfo> {
    return api.post<GoodsQrInfo>(`/goods/${goodsId}/generate_qr/`)
  },

  getQr(goodsId: string): Promise<GoodsQrInfo> {
    return api.get<GoodsQrInfo>(`/goods/${goodsId}/qr/`)
  },

  getByToken(token: string): Promise<TrackPayload> {
    return trackGet(token)
  },

  updateStatus(
    token: string,
    body: {
      status: string
      notes?: string
      photos?: string[]
      latitude?: number
      longitude?: number
      device?: string
    },
  ): Promise<TrackPayload> {
    return api.post<TrackPayload>(`/track/${token}/status/`, body)
  },
}

export function trackPageUrl(token: string): string {
  return `${window.location.origin}/t/${token}`
}

export function extractTrackToken(raw: string): string | null {
  const trimmed = raw.trim()
  // Goods QR encodes {origin}/t/{uuid} — allow trailing query/hash
  const urlMatch = trimmed.match(/\/t\/([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})(?:[/?#]|$)/i)
  if (urlMatch) return urlMatch[1]
  const bare = trimmed.replace(/[?#].*$/, '')
  if (/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/i.test(bare)) {
    return bare
  }
  return null
}
