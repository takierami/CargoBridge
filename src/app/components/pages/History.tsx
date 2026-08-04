import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router'
import {
  History as HistoryIcon, Search, Download, Printer, X,
  ChevronRight, Package, Truck, Users, CreditCard, Calculator,
  FileText, Shield, Settings, Activity,
} from 'lucide-react'
import { toast } from 'sonner'
import { useAppStore } from '../../../store/appStore'
import { FILTER_INPUT, PAGE_TITLE, PRIMARY_CTA } from '../ui/responsive'
import { cn } from '../../utils/cn'
import {
  downloadActivityExport,
  fetchActivityEvent,
  fetchActivityEvents,
  fetchActivitySummary,
  type ActivityEvent,
  type ActivityQuery,
  type ActivitySummary,
} from '../../../services/historyService'

const PRESETS = [
  'today', 'yesterday', 'last_7_days', 'last_30_days',
  'this_month', 'last_month', 'this_year', 'custom',
] as const

const MODULES = [
  'goods', 'suppliers', 'agents', 'purchase_orders', 'payments',
  'adjustments', 'calculator', 'templates', 'documents', 'tasks',
  'auth', 'settings', 'notifications', 'system',
] as const

const ACTIONS = [
  'create', 'update', 'soft_delete', 'status_change', 'mark_paid',
  'amount_paid_update', 'convert', 'login', 'logout', 'export',
  'generate', 'duplicate', 'customs_change', 'scan',
] as const

const MODULE_ICON: Record<string, React.ElementType> = {
  goods: Package,
  suppliers: Truck,
  agents: Users,
  purchase_orders: FileText,
  payments: CreditCard,
  calculator: Calculator,
  auth: Shield,
  settings: Settings,
}

function formatWhen(iso: string, language: string) {
  try {
    return new Date(iso).toLocaleString(language === 'ar' ? 'ar' : 'fr-FR', {
      dateStyle: 'medium',
      timeStyle: 'short',
    })
  } catch {
    return iso
  }
}

function JsonBlock({ data }: { data: Record<string, unknown> }) {
  const keys = Object.keys(data || {})
  if (!keys.length) return <p className="text-xs text-gray-400">—</p>
  return (
    <dl className="space-y-1 text-xs">
      {keys.map(k => (
        <div key={k} className="flex gap-2">
          <dt className="shrink-0 font-medium text-gray-500">{k}</dt>
          <dd className="min-w-0 break-all text-gray-800 dark:text-gray-200">{String(data[k] ?? '')}</dd>
        </div>
      ))}
    </dl>
  )
}

export function History() {
  const { t, language } = useAppStore()
  const [preset, setPreset] = useState<string>('last_30_days')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [module, setModule] = useState('')
  const [action, setAction] = useState('')
  const [q, setQ] = useState('')
  const [events, setEvents] = useState<ActivityEvent[]>([])
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [summary, setSummary] = useState<ActivitySummary | null>(null)
  const [detail, setDetail] = useState<ActivityEvent | null>(null)

  const buildQuery = useCallback((cursor?: string): ActivityQuery => {
    const params: ActivityQuery = { pageSize: 50 }
    if (preset && preset !== 'custom') params.preset = preset
    if (preset === 'custom') {
      if (dateFrom) params.dateFrom = dateFrom
      if (dateTo) params.dateTo = dateTo
    }
    if (module) params.module = module
    if (action) params.action = action
    if (q.trim()) params.q = q.trim()
    if (cursor) params.cursor = cursor
    return params
  }, [preset, dateFrom, dateTo, module, action, q])

  const load = useCallback(async (append = false, cursor?: string) => {
    setLoading(true)
    try {
      const params = buildQuery(cursor)
      const [list, sum] = await Promise.all([
        fetchActivityEvents(params),
        append ? Promise.resolve(null) : fetchActivitySummary(params),
      ])
      setEvents(prev => append ? [...prev, ...list.results] : list.results)
      // CursorPagination returns full URL in next; extract cursor param if present
      let next: string | null = null
      if (list.next) {
        try {
          const u = new URL(list.next)
          next = u.searchParams.get('cursor')
        } catch {
          next = null
        }
      }
      setNextCursor(next)
      if (sum) setSummary(sum)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('common.error'))
    } finally {
      setLoading(false)
    }
  }, [buildQuery, t])

  useEffect(() => {
    void load(false)
  }, [load])

  const openDetail = async (id: string) => {
    try {
      const ev = await fetchActivityEvent(id)
      setDetail(ev)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('common.error'))
    }
  }

  const exportFmt = async (format: 'csv' | 'xlsx' | 'pdf') => {
    try {
      await downloadActivityExport({ ...buildQuery(), exportFormat: format })
      toast.success(t('history.exportStarted'))
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('common.error'))
    }
  }

  const summaryText = (ev: ActivityEvent) =>
    language === 'ar' ? (ev.summaryAr || ev.summary) : (ev.summaryFr || ev.summary)

  return (
    <div className="space-y-5 p-4 lg:p-6 print:p-0">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between print:hidden">
        <div>
          <h1 className={PAGE_TITLE}>{t('history.title')}</h1>
          <p className="mt-1 text-sm text-gray-500">{t('history.subtitle')}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => window.print()} className="inline-flex min-h-11 items-center gap-1.5 rounded-lg border border-gray-300 px-3 text-sm dark:border-gray-600">
            <Printer className="h-4 w-4" /> {t('history.print')}
          </button>
          <button type="button" onClick={() => exportFmt('csv')} className={PRIMARY_CTA}>
            <Download className="h-4 w-4" /> CSV
          </button>
          <button type="button" onClick={() => exportFmt('xlsx')} className={PRIMARY_CTA}>
            <Download className="h-4 w-4" /> Excel
          </button>
          <button type="button" onClick={() => exportFmt('pdf')} className={PRIMARY_CTA}>
            <Download className="h-4 w-4" /> PDF
          </button>
        </div>
      </div>

      {/* KPI cards */}
      {summary && (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 xl:grid-cols-6 print:grid-cols-3">
          {[
            { label: t('history.kpiTotal'), value: summary.totalEvents },
            { label: t('history.kpiGoods'), value: summary.goodsCreated },
            { label: t('history.kpiPOs'), value: summary.purchaseOrders },
            { label: t('history.kpiPayments'), value: summary.payments },
            { label: t('history.kpiDocs'), value: summary.documents },
            { label: t('history.kpiDaily'), value: summary.averageDailyActivity },
          ].map(card => (
            <div key={card.label} className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
              <p className="text-xs text-gray-500">{card.label}</p>
              <p className="mt-1 text-xl font-bold text-gray-900 dark:text-white">{card.value}</p>
            </div>
          ))}
        </div>
      )}

      {summary && summary.mostActiveModules.length > 0 && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 print:hidden">
          <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
            <h3 className="mb-3 text-sm font-semibold">{t('history.mostActiveModules')}</h3>
            <ul className="space-y-2">
              {summary.mostActiveModules.map(m => (
                <li key={m.module} className="flex items-center justify-between text-sm">
                  <span>{t(`history.modules.${m.module}`) || m.module}</span>
                  <span className="font-semibold">{m.count}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
            <h3 className="mb-3 text-sm font-semibold">{t('history.mostActiveUsers')}</h3>
            <ul className="space-y-2">
              {summary.mostActiveUsers.map(u => (
                <li key={u.actorUsername} className="flex items-center justify-between text-sm">
                  <span>{u.actorDisplayName || u.actorUsername}</span>
                  <span className="font-semibold">{u.count}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="space-y-3 rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800 print:hidden">
        <div className="flex flex-wrap gap-2">
          {PRESETS.map(p => (
            <button
              key={p}
              type="button"
              onClick={() => setPreset(p)}
              className={cn(
                'min-h-11 rounded-lg border px-3 text-sm',
                preset === p
                  ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300'
                  : 'border-gray-200 text-gray-600 dark:border-gray-600 dark:text-gray-300',
              )}
            >
              {t(`history.presets.${p}`)}
            </button>
          ))}
        </div>
        {preset === 'custom' && (
          <div className="flex flex-wrap gap-3">
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="min-h-11 rounded-lg border border-gray-300 px-3 text-base sm:text-sm dark:border-gray-600 dark:bg-gray-700" />
            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="min-h-11 rounded-lg border border-gray-300 px-3 text-base sm:text-sm dark:border-gray-600 dark:bg-gray-700" />
          </div>
        )}
        <div className="flex flex-wrap gap-3">
          <div className="relative min-w-48 flex-1">
            <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input value={q} onChange={e => setQ(e.target.value)} placeholder={t('history.searchPlaceholder')} className={FILTER_INPUT} />
          </div>
          <select value={module} onChange={e => setModule(e.target.value)} className="min-h-11 rounded-lg border border-gray-300 bg-white px-3 text-base sm:text-sm dark:border-gray-600 dark:bg-gray-800">
            <option value="">{t('history.allModules')}</option>
            {MODULES.map(m => <option key={m} value={m}>{t(`history.modules.${m}`)}</option>)}
          </select>
          <select value={action} onChange={e => setAction(e.target.value)} className="min-h-11 rounded-lg border border-gray-300 bg-white px-3 text-base sm:text-sm dark:border-gray-600 dark:bg-gray-800">
            <option value="">{t('history.allActions')}</option>
            {ACTIONS.map(a => <option key={a} value={a}>{t(`history.actions.${a}`)}</option>)}
          </select>
        </div>
      </div>

      {/* Timeline */}
      <div className="space-y-3">
        {events.length === 0 && !loading && (
          <div className="rounded-2xl border border-dashed border-gray-300 p-10 text-center text-gray-500 dark:border-gray-600">
            <HistoryIcon className="mx-auto mb-2 h-8 w-8 opacity-40" />
            {t('common.noData')}
          </div>
        )}
        {events.map(ev => {
          const Icon = MODULE_ICON[ev.module] || Activity
          return (
            <button
              key={ev.id}
              type="button"
              onClick={() => openDetail(ev.id)}
              className="flex w-full gap-3 rounded-2xl border border-gray-200 bg-white p-4 text-start transition hover:shadow-md dark:border-gray-700 dark:bg-gray-800"
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300">
                <Icon className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs text-gray-500">{formatWhen(ev.occurredAt, language)}</span>
                  <span className="rounded bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                    {t(`history.modules.${ev.module}`) || ev.module}
                  </span>
                  <span className="rounded bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                    {t(`history.actions.${ev.action}`) || ev.action}
                  </span>
                </div>
                <p className="mt-1 font-medium text-gray-900 dark:text-white">{summaryText(ev)}</p>
                <p className="mt-0.5 text-xs text-gray-500">
                  {ev.actorDisplayName || ev.actorUsername || '—'}
                  {ev.entityLabel ? ` · ${ev.entityLabel}` : ''}
                </p>
              </div>
              <ChevronRight className="mt-2 h-4 w-4 shrink-0 text-gray-400" />
            </button>
          )
        })}
        {nextCursor && (
          <button
            type="button"
            disabled={loading}
            onClick={() => load(true, nextCursor)}
            className="w-full min-h-11 rounded-xl border border-gray-300 text-sm font-medium dark:border-gray-600"
          >
            {loading ? t('common.loading') : t('history.loadMore')}
          </button>
        )}
      </div>

      {/* Detail modal */}
      {detail && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4 print:hidden">
          <div className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl dark:bg-gray-900 sm:rounded-2xl">
            <div className="flex items-center justify-between border-b border-gray-200 p-4 dark:border-gray-700">
              <h2 className="font-semibold text-gray-900 dark:text-white">{t('history.eventDetail')}</h2>
              <button type="button" onClick={() => setDetail(null)} className="min-h-11 min-w-11 inline-flex items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 space-y-4 overflow-y-auto p-4">
              <p className="text-sm text-gray-500">{formatWhen(detail.occurredAt, language)}</p>
              <p className="font-medium text-gray-900 dark:text-white">{summaryText(detail)}</p>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-gray-500">{t('history.user')}</span><p>{detail.actorDisplayName || detail.actorUsername || '—'}</p></div>
                <div><span className="text-gray-500">{t('history.module')}</span><p>{t(`history.modules.${detail.module}`) || detail.module}</p></div>
                <div><span className="text-gray-500">{t('history.action')}</span><p>{t(`history.actions.${detail.action}`) || detail.action}</p></div>
                <div><span className="text-gray-500">{t('history.object')}</span><p>{detail.entityLabel || '—'}</p></div>
              </div>
              {(detail.metadata?.ip || detail.metadata?.userAgent) && (
                <div className="rounded-xl bg-gray-50 p-3 text-xs dark:bg-gray-800">
                  {detail.metadata.ip ? <p>IP: {String(detail.metadata.ip)}</p> : null}
                  {detail.metadata.userAgent ? <p className="mt-1 break-all">UA: {String(detail.metadata.userAgent)}</p> : null}
                </div>
              )}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <h4 className="mb-2 text-xs font-semibold uppercase text-gray-500">{t('history.previousValue')}</h4>
                  <JsonBlock data={detail.before} />
                </div>
                <div>
                  <h4 className="mb-2 text-xs font-semibold uppercase text-gray-500">{t('history.newValue')}</h4>
                  <JsonBlock data={detail.after} />
                </div>
              </div>
              {detail.relatedUrl && (
                <Link to={detail.relatedUrl} className="inline-flex text-sm font-medium text-blue-600 hover:underline" onClick={() => setDetail(null)}>
                  {t('history.openRecord')}
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
