import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router'
import { Package, Loader2, LogIn, MapPin, CheckCircle2, Clock } from 'lucide-react'
import { toast } from 'sonner'
import { useAuthStore } from '../../../store/authStore'
import { useAppStore } from '../../../store/appStore'
import { StatusBadge } from '../ui/StatusBadge'
import { formatDate, formatDateTime } from '../../../utils/dateUtils'
import { cn } from '../../utils/cn'
import {
  trackingService,
  type TrackAction,
  type TrackPayload,
} from '../../../services/trackingService'

export function GoodsTrackPage() {
  const { token } = useParams<{ token: string }>()
  const { t, language } = useAppStore()
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const [data, setData] = useState<TrackPayload | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [gps, setGps] = useState<{ latitude: number; longitude: number } | null>(null)

  const load = async () => {
    if (!token) return
    setLoading(true)
    setError('')
    try {
      const payload = await trackingService.getByToken(token)
      setData(payload)
      setSelectedStatus(payload.allowedActions[0]?.status || '')
    } catch (err) {
      setError(err instanceof Error ? err.message : t('common.error'))
      setData(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void useAuthStore.getState().loadUser()
    load()
  }, [token, isAuthenticated])

  useEffect(() => {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(
      (pos) => setGps({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
      () => setGps(null),
      { enableHighAccuracy: false, timeout: 8000 },
    )
  }, [])

  const handleUpdate = async () => {
    if (!token || !selectedStatus) return
    setSaving(true)
    try {
      const payload = await trackingService.updateStatus(token, {
        status: selectedStatus,
        notes,
        ...(gps || {}),
        device: navigator.userAgent.slice(0, 255),
      })
      setData(payload)
      setNotes('')
      setSelectedStatus(payload.allowedActions[0]?.status || '')
      toast.success(t('common.success'))
      void useAppStore.getState().loadGoods()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('common.error'))
    } finally {
      setSaving(false)
    }
  }

  const actionLabel = (action: TrackAction) => {
    const key = `goods.qrActions.${action.actionKey}`
    const translated = t(key)
    return translated === key ? t(`goods.statuses.${action.status}`) : translated
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-gray-50 p-6 dark:bg-gray-900">
        <Package className="h-12 w-12 text-gray-300" />
        <p className="text-gray-500">{error || t('common.noData')}</p>
        <Link to="/login" className="text-sm text-blue-600">{t('tracking.signIn')}</Link>
      </div>
    )
  }

  const desc = language === 'fr' && data.descriptionFr ? data.descriptionFr : data.description

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <header className="border-b border-gray-200 bg-white px-4 py-4 dark:border-gray-700 dark:bg-gray-800">
        <div className="mx-auto flex max-w-lg items-center justify-between gap-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-blue-600">{t('tracking.title')}</p>
            <p className="font-mono text-sm text-gray-900 dark:text-white">{data.trackingNumber}</p>
          </div>
          <StatusBadge status={data.status} type="goods" label={t(`goods.statuses.${data.status}`)} />
        </div>
      </header>

      <main className="mx-auto max-w-lg space-y-4 p-4 pb-28">
        <section className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
          <h1 className="text-lg font-bold text-gray-900 dark:text-white">{desc}</h1>
          <p className="mt-1 text-sm text-gray-500">{t(`goods.categories.${data.category}`) || data.category}</p>
          <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
            <Info label={t('goods.quantity')} value={`${data.quantity}`} />
            <Info label={t('goods.weight')} value={data.weight != null ? String(data.weight) : '—'} />
            <Info label={t('goods.agent')} value={data.agentName || t('goods.noAgent')} />
            <Info label={t('goods.transportType')} value={data.transportType ? t(`goods.transportTypes.${data.transportType}`) : '—'} />
            <Info label={t('goods.departureDate')} value={formatDate(data.departureDate, language)} />
            <Info label={t('goods.expectedArrival')} value={formatDate(data.expectedArrivalDate, language)} />
            <Info label={t('goods.arrivalDate')} value={formatDate(data.arrivalDate, language)} />
            <Info label={t('common.date')} value={formatDate(data.createdAt, language)} />
          </div>
          {data.notes && (
            <p className="mt-3 rounded-lg bg-gray-50 p-3 text-sm text-gray-600 dark:bg-gray-900/40 dark:text-gray-300">{data.notes}</p>
          )}
          {gps && (
            <p className="mt-2 flex items-center gap-1 text-xs text-gray-400">
              <MapPin className="h-3 w-3" /> GPS ready
            </p>
          )}
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
          <h2 className="mb-3 font-semibold text-gray-900 dark:text-white">{t('tracking.timeline')}</h2>
          {data.timeline.length === 0 ? (
            <p className="text-sm text-gray-500">{t('tracking.noEvents')}</p>
          ) : (
            <ol className="relative space-y-4 border-s border-gray-200 ps-4 dark:border-gray-600">
              {[...data.timeline].reverse().map((ev) => (
                <li key={ev.id} className="relative">
                  <span className="absolute -start-[21px] mt-1 flex h-3 w-3 items-center justify-center rounded-full bg-blue-600 ring-4 ring-white dark:ring-gray-800" />
                  <p className="text-xs text-gray-400">{formatDateTime(language, new Date(ev.createdAt))}</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {ev.fromStatus ? t(`goods.statuses.${ev.fromStatus}`) : '—'}
                    {' → '}
                    {t(`goods.statuses.${ev.toStatus}`)}
                  </p>
                  {(ev.user || ev.office) && (
                    <p className="text-xs text-gray-500">
                      {[ev.user, ev.office].filter(Boolean).join(' · ')}
                    </p>
                  )}
                  {ev.notes && <p className="mt-1 text-xs text-gray-600 dark:text-gray-300">{ev.notes}</p>}
                </li>
              ))}
            </ol>
          )}
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
          <h2 className="mb-3 font-semibold text-gray-900 dark:text-white">{t('tracking.updateStatus')}</h2>
          {data.statusConsistent === false && (
            <p className="mb-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:bg-amber-900/20 dark:text-amber-200">
              {t('tracking.statusInconsistent')}
            </p>
          )}
          {!isAuthenticated ? (
            <Link
              to={`/login?next=${encodeURIComponent(`/t/${token}`)}`}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3.5 text-base font-semibold text-white hover:bg-blue-700"
            >
              <LogIn className="h-5 w-5" />
              {t('tracking.signInToUpdate')}
            </Link>
          ) : data.allowedActions.length === 0 ? (
            <p className="flex items-center gap-2 text-sm text-gray-500">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              {t('tracking.noActions')}
            </p>
          ) : (
            <div className="space-y-3">
              <div className="grid gap-2">
                {data.allowedActions.map((action) => (
                  <button
                    key={action.status}
                    type="button"
                    onClick={() => setSelectedStatus(action.status)}
                    className={cn(
                      'rounded-xl border px-4 py-3.5 text-start text-base font-medium transition-colors',
                      selectedStatus === action.status
                        ? 'border-blue-600 bg-blue-50 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200'
                        : 'border-gray-200 bg-gray-50 text-gray-800 hover:border-blue-300 dark:border-gray-600 dark:bg-gray-900/40 dark:text-gray-200',
                    )}
                  >
                    {actionLabel(action)}
                  </button>
                ))}
              </div>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder={t('tracking.notesPlaceholder')}
                className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />
              <button
                type="button"
                disabled={saving || !selectedStatus}
                onClick={handleUpdate}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3.5 text-base font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Clock className="h-5 w-5" />}
                {t('common.save')}
              </button>
            </div>
          )}
        </section>
      </main>
    </div>
  )
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-gray-50 p-2.5 dark:bg-gray-900/40">
      <p className="text-[11px] text-gray-500">{label}</p>
      <p className="font-medium text-gray-900 dark:text-white">{value || '—'}</p>
    </div>
  )
}
