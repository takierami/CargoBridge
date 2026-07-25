import { useMemo } from 'react'
import { useNavigate } from 'react-router'
import { useAppStore } from '../../../store/appStore'
import { computeAnalytics } from '../../../services/analyticsService'
import { cn } from '../../utils/cn'

function StarRatingDisplay({ rating }: { rating: number }) {
  const stars = Math.round(rating)
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i} className={cn('text-sm', i < stars ? 'text-amber-400' : 'text-gray-300 dark:text-gray-600')}>★</span>
      ))}
      <span className="ms-1 text-xs text-gray-500 dark:text-gray-400">{rating.toFixed(1)}</span>
    </div>
  )
}

function PercentBar({ value, max = 100, color = 'bg-blue-500' }: { value: number; max?: number; color?: string }) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100))
  return (
    <div className="w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
      <div className={cn('h-full rounded-full transition-all', color)} style={{ width: `${pct}%` }} />
    </div>
  )
}

function formatNumber(n: number) {
  return n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })
}

function formatCurrency(n: number, currency = 'USD') {
  const symbols: Record<string, string> = { USD: '$', CNY: '¥', EUR: '€', DZD: 'دج' }
  const sym = symbols[currency] || currency
  return `${sym} ${formatNumber(n)}`
}

export function Analytics() {
  const navigate = useNavigate()
  const { t, suppliers, supplierRatings, purchaseOrders, supplierPayments, supplierTasks } = useAppStore()

  const twelveMonthsAgo = useMemo(() => {
    const d = new Date()
    d.setMonth(d.getMonth() - 12)
    return d.toISOString().split('T')[0]
  }, [])

  const stats = useMemo(() => {
    const total = suppliers.length
    const ACTIVE_PO_STATUSES = ['confirmed', 'in_production', 'ready', 'shipped', 'received']

    const activeSupplierIds = new Set(
      purchaseOrders
        .filter(po => !po.isDeleted && ACTIVE_PO_STATUSES.includes(po.status) && po.orderDate >= twelveMonthsAgo)
        .map(po => po.supplierId)
    )
    const active = activeSupplierIds.size

    const allRatings = supplierRatings.filter(r => r.overall > 0)
    const avgRating = allRatings.length > 0
      ? Math.round((allRatings.reduce((s, r) => s + r.overall, 0) / allRatings.length) * 10) / 10
      : 0

    const activePOs = purchaseOrders.filter(po => !po.isDeleted && ACTIVE_PO_STATUSES.includes(po.status))
    const totalSpend = activePOs.reduce((s, po) => s + po.totalAmount, 0)

    return { total, active, avgRating, totalSpend }
  }, [suppliers, purchaseOrders, supplierRatings, twelveMonthsAgo])

  const analytics = useMemo(() => {
    return computeAnalytics({ suppliers, purchaseOrders, supplierPayments, supplierRatings, supplierTasks })
  }, [suppliers, purchaseOrders, supplierPayments, supplierRatings, supplierTasks])

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">{t('suppliers.analytics')}</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">{t('suppliers.analyticsDescription')}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5">
          <p className="text-sm text-gray-500 dark:text-gray-400">{t('suppliers.totalSuppliers')}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stats.total}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5">
          <p className="text-sm text-gray-500 dark:text-gray-400">{t('suppliers.activeSuppliers')}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stats.active}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5">
          <p className="text-sm text-gray-500 dark:text-gray-400">{t('suppliers.avgRating')}</p>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.avgRating || '—'}</p>
            {stats.avgRating > 0 && <span className="text-amber-400">★</span>}
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5">
          <p className="text-sm text-gray-500 dark:text-gray-400">{t('suppliers.totalSpend')}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{formatCurrency(stats.totalSpend)}</p>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="font-semibold text-gray-900 dark:text-white">{t('suppliers.topSuppliersByScore')}</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{t('suppliers.topSuppliersByScoreDesc')}</p>
        </div>
        {analytics.topSuppliersByReliability.length === 0 ? (
          <div className="px-5 py-12 text-center text-gray-500 dark:text-gray-400 text-sm">{t('common.noData')}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-900/50">
                <tr>
                  <th className="px-5 py-3 text-start text-xs font-medium text-gray-500 uppercase">{t('suppliers.supplierName')}</th>
                  <th className="px-5 py-3 text-start text-xs font-medium text-gray-500 uppercase">{t('suppliers.overallScore')}</th>
                  <th className="px-5 py-3 text-start text-xs font-medium text-gray-500 uppercase">{t('suppliers.onTimeRate')}</th>
                  <th className="px-5 py-3 text-start text-xs font-medium text-gray-500 uppercase">{t('suppliers.receivedOrders')}</th>
                  <th className="px-5 py-3 text-start text-xs font-medium text-gray-500 uppercase">{t('suppliers.totalSpend')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {analytics.topSuppliersByReliability.map((s) => {
                  const valueData = analytics.topSuppliersByValue.find(v => v.supplierId === s.supplierId)
                  return (
                    <tr
                      key={s.supplierId}
                      role="button"
                      tabIndex={0}
                      onClick={() => navigate(`/suppliers/${s.supplierId}`)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          navigate(`/suppliers/${s.supplierId}`)
                        }
                      }}
                      className="hover:bg-gray-50 dark:hover:bg-gray-900/50 cursor-pointer"
                    >
                      <td className="px-5 py-4">
                        <span className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline">{s.supplierName}</span>
                      </td>
                      <td className="px-5 py-4">
                        {s.rating ? <StarRatingDisplay rating={s.rating} /> : <span className="text-gray-400 text-xs">—</span>}
                      </td>
                      <td className="px-5 py-4 min-w-32">
                        <div className="flex items-center gap-2">
                          <PercentBar value={s.onTimeRate} color={s.onTimeRate >= 80 ? 'bg-green-500' : s.onTimeRate >= 50 ? 'bg-amber-500' : 'bg-red-500'} />
                          <span className="text-xs text-gray-600 dark:text-gray-400 w-10">{s.onTimeRate}%</span>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-sm text-gray-600 dark:text-gray-400">{s.receivedCount}</td>
                      <td className="px-5 py-4 text-sm font-mono text-gray-900 dark:text-white">{formatCurrency(valueData?.totalValue || 0)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="font-semibold text-gray-900 dark:text-white">{t('suppliers.topSuppliersByOutstanding')}</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{t('suppliers.topSuppliersByOutstandingDesc')}</p>
        </div>
        {analytics.largestBalances.length === 0 ? (
          <div className="px-5 py-12 text-center text-gray-500 dark:text-gray-400 text-sm">{t('common.noData')}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-900/50">
                <tr>
                  <th className="px-5 py-3 text-start text-xs font-medium text-gray-500 uppercase">{t('suppliers.supplierName')}</th>
                  <th className="px-5 py-3 text-start text-xs font-medium text-gray-500 uppercase">{t('suppliers.totalPOs')}</th>
                  <th className="px-5 py-3 text-start text-xs font-medium text-gray-500 uppercase">{t('suppliers.totalPaid')}</th>
                  <th className="px-5 py-3 text-start text-xs font-medium text-gray-500 uppercase">{t('suppliers.totalOutstanding')}</th>
                  <th className="px-5 py-3 text-start text-xs font-medium text-gray-500 uppercase">{t('suppliers.overduePOs')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {analytics.largestBalances.map((s) => {
                  const maxOut = analytics.largestBalances[0]?.outstanding || 1
                  return (
                    <tr
                      key={s.supplierId}
                      role="button"
                      tabIndex={0}
                      onClick={() => navigate(`/suppliers/${s.supplierId}`)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          navigate(`/suppliers/${s.supplierId}`)
                        }
                      }}
                      className="hover:bg-gray-50 dark:hover:bg-gray-900/50 cursor-pointer"
                    >
                      <td className="px-5 py-4">
                        <span className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline">{s.supplierName}</span>
                      </td>
                      <td className="px-5 py-4 text-sm text-gray-600 dark:text-gray-400">{s.totalPurchased > 0 ? Math.round(s.totalPurchased / 1000) + 'K' : 0}</td>
                      <td className="px-5 py-4 text-sm font-mono text-gray-900 dark:text-white">{formatCurrency(s.totalPaid)}</td>
                      <td className="px-5 py-4 min-w-36">
                        <div className="flex items-center gap-2">
                          <PercentBar value={s.outstanding} max={maxOut} color="bg-red-500" />
                          <span className="text-sm font-mono text-gray-900 dark:text-white w-20">{formatCurrency(s.outstanding)}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        {s.overduePayments > 0 ? (
                          <span className="px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded text-xs font-medium">{s.overduePayments}</span>
                        ) : (
                          <span className="text-gray-400 text-xs">0</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}