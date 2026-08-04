import { api, getAccessToken } from '../lib/apiClient'
import { API_BASE } from '../lib/apiBase'

export type ActivityEvent = {
  id: string
  occurredAt: string
  actor: number | null
  actorUsername: string
  actorDisplayName: string
  module: string
  action: string
  entityType: string
  entityId: string | null
  entityLabel: string
  summary: string
  summaryAr: string
  summaryFr: string
  before: Record<string, unknown>
  after: Record<string, unknown>
  changedFields: string[]
  supplierId: string | null
  agentId: string | null
  goodsId: string | null
  currency: string
  country: string
  status: string
  tags: string[]
  metadata: Record<string, unknown>
  relatedUrl: string
  isArchived: boolean
  source: string
}

export type ActivitySummary = {
  totalEvents: number
  averageDailyActivity: number
  goodsCreated: number
  purchaseOrders: number
  payments: number
  documents: number
  totalSpending: string
  mostActiveModules: { module: string; count: number }[]
  mostActiveActions: { action: string; count: number }[]
  mostActiveUsers: { actorUsername: string; actorDisplayName: string; count: number }[]
  dateFrom: string | null
  dateTo: string | null
}

export type ActivityQuery = {
  preset?: string
  dateFrom?: string
  dateTo?: string
  module?: string
  action?: string
  actor?: string
  supplierId?: string
  agentId?: string
  goodsId?: string
  currency?: string
  q?: string
  cursor?: string
  pageSize?: number
  /** File type for export — sent as export_format (not format; DRF reserves format=) */
  exportFormat?: 'csv' | 'xlsx' | 'pdf'
}

function toQuery(params: ActivityQuery, options?: { omitPagination?: boolean }): string {
  const sp = new URLSearchParams()
  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === null || v === '') return
    if (options?.omitPagination && (k === 'cursor' || k === 'pageSize')) return
    const key = k.replace(/[A-Z]/g, m => `_${m.toLowerCase()}`)
    sp.set(key, String(v))
  })
  const q = sp.toString()
  return q ? `?${q}` : ''
}

function activityApiRoot(): string {
  return API_BASE.replace(/\/$/, '')
}

export async function fetchActivityEvents(params: ActivityQuery): Promise<{
  results: ActivityEvent[]
  next: string | null
  previous: string | null
}> {
  const path = `/activity-events/${toQuery(params)}`
  const data = await api.get<{ results?: ActivityEvent[]; next?: string | null; previous?: string | null } | ActivityEvent[]>(path)
  if (Array.isArray(data)) {
    return { results: data, next: null, previous: null }
  }
  return {
    results: data.results ?? [],
    next: data.next ?? null,
    previous: data.previous ?? null,
  }
}

export async function fetchActivitySummary(params: ActivityQuery): Promise<ActivitySummary> {
  return api.get<ActivitySummary>(`/activity-events/summary/${toQuery(params)}`)
}

export async function fetchActivityEvent(id: string): Promise<ActivityEvent> {
  return api.get<ActivityEvent>(`/activity-events/${id}/`)
}

export async function downloadActivityExport(
  params: ActivityQuery & { exportFormat: 'csv' | 'xlsx' | 'pdf' },
) {
  const qs = toQuery(params, { omitPagination: true })
  // Guaranteed trailing slash before query string
  const url = `${activityApiRoot()}/activity-events/export/${qs}`
  const token = getAccessToken()
  const res = await fetch(url, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
  if (!res.ok) {
    let detail = ''
    try {
      const body = await res.json()
      detail = body?.detail || body?.error || ''
    } catch {
      /* ignore non-JSON error bodies */
    }
    throw new Error(detail ? `Export failed (${res.status}): ${detail}` : `Export failed (${res.status})`)
  }
  const blob = await res.blob()
  const objectUrl = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = objectUrl
  const fmt = params.exportFormat
  const isPdf = fmt === 'pdf' && (res.headers.get('content-type') || '').includes('pdf')
  a.download = `activity-history.${fmt === 'pdf' && !isPdf ? 'html' : fmt}`
  a.click()
  URL.revokeObjectURL(objectUrl)
}
