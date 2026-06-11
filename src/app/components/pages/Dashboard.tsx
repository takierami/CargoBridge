import { useMemo } from 'react'
import { useNavigate } from 'react-router'
import {
  Package, Users, Clock, AlertTriangle, CheckCircle2,
  TrendingUp, ArrowUpRight, Star, DollarSign,
} from 'lucide-react'
import { useAppStore } from '../../../store/appStore'
import { StatusBadge } from '../ui/StatusBadge'
import { formatDistanceToNow } from '../../../utils/dateUtils'
import { cn } from '../../utils/cn'
import { getDashboardStats } from '../../../services/analyticsService'

const MONTHS_AR = ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر']
const MONTHS_FR = ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc']

const BAR_COLORS = ['#3b82f6','#22c55e','#f59e0b','#ef4444','#8b5cf6','#06b6d4','#f97316','#6b7280']

// --- Custom mini charts (no recharts = no key collisions) ---

function AreaSparkline({ data }: { data: { label: string; value: number }[] }) {
  const max = Math.max(...data.map(d => d.value), 1)
  const w = 400
  const h = 120
  const pad = { l: 30, r: 10, t: 10, b: 28 }
  const chartW = w - pad.l - pad.r
  const chartH = h - pad.t - pad.b

  const pts = data.map((d, i) => {
    const x = pad.l + (i / (data.length - 1)) * chartW
    const y = pad.t + chartH - (d.value / max) * chartH
    return { x, y, ...d }
  })

  const linePath = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
  const areaPath = `${linePath} L ${pts[pts.length - 1].x} ${pad.t + chartH} L ${pts[0].x} ${pad.t + chartH} Z`

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full" preserveAspectRatio="none" style={{ height: 160 }}>
      <defs>
        <linearGradient id="spark-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
        </linearGradient>
      </defs>
      {/* Y grid lines */}
      {[0, 0.25, 0.5, 0.75, 1].map((t, i) => (
        <line
          key={`yg-${i}`}
          x1={pad.l} y1={pad.t + chartH * (1 - t)}
          x2={pad.l + chartW} y2={pad.t + chartH * (1 - t)}
          stroke="#e5e7eb" strokeWidth="1"
        />
      ))}
      <path d={areaPath} fill="url(#spark-grad)" />
      <path d={linePath} fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      {pts.map((p) => (
        <circle key={`dot-${p.label}`} cx={p.x} cy={p.y} r="3.5" fill="#3b82f6" stroke="white" strokeWidth="1.5" />
      ))}
      {/* X labels */}
      {pts.map((p) => (
        <text key={`xl-${p.label}`} x={p.x} y={h - 6} textAnchor="middle" fontSize="10" fill="#9ca3af">{p.label}</text>
      ))}
      {/* Y labels */}
      {[0, Math.round(max / 2), max].map((v, i) => (
        <text key={`yl-${i}`} x={pad.l - 4} y={pad.t + chartH - (v / max) * chartH + 4} textAnchor="end" fontSize="9" fill="#9ca3af">{v}</text>
      ))}
    </svg>
  )
}

function DonutChart({ data }: { data: { label: string; value: number; color: string }[] }) {
  const total = data.reduce((s, d) => s + d.value, 0) || 1
  const r = 52
  const cx = 80
  const cy = 80
  const circumference = 2 * Math.PI * r
  let offset = 0

  const slices = data.map((d, i) => {
    const pct = d.value / total
    const dash = pct * circumference
    const slice = { ...d, dash, offset, pct }
    offset += dash
    return slice
  })

  return (
    <div className="flex items-center gap-4">
      <svg width="160" height="160" viewBox="0 0 160 160" className="flex-shrink-0">
        {slices.map((s, i) => (
          <circle
            key={`donut-${i}-${s.label}`}
            cx={cx} cy={cy} r={r}
            fill="none"
            stroke={s.color}
            strokeWidth="20"
            strokeDasharray={`${s.dash} ${circumference - s.dash}`}
            strokeDashoffset={-s.offset}
            style={{ transform: 'rotate(-90deg)', transformOrigin: `${cx}px ${cy}px` }}
          />
        ))}
        <text x={cx} y={cy - 6} textAnchor="middle" fontSize="18" fontWeight="bold" fill="currentColor" className="fill-gray-900 dark:fill-white">
          {total}
        </text>
        <text x={cx} y={cy + 12} textAnchor="middle" fontSize="10" fill="#9ca3af">total</text>
      </svg>
      <div className="flex-1 space-y-2 min-w-0">
        {data.map((d, i) => (
          <div key={`dl-${i}-${d.label}`} className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: d.color }} />
            <span className="text-xs text-gray-600 dark:text-gray-400 flex-1 truncate">{d.label}</span>
            <span className="text-xs font-semibold text-gray-900 dark:text-white">{d.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function HorizontalBarChart({ data, lang }: {
  data: { label: string; deliveries: number; delayed: number }[]
  lang: string
}) {
  const max = Math.max(...data.map(d => d.deliveries), 1)
  const labelD = lang === 'ar' ? 'التسليمات' : 'Livraisons'
  const labelDel = lang === 'ar' ? 'متأخر' : 'Retard'

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3 text-xs text-gray-500 mb-2">
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm inline-block bg-blue-500" />{labelD}</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm inline-block bg-red-400" />{labelDel}</span>
      </div>
      {data.map((d, i) => (
        <div key={`hbar-${i}-${d.label}`} className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-700 dark:text-gray-300 font-medium truncate max-w-[80px]">{d.label}</span>
            <span className="text-gray-500">{d.deliveries}</span>
          </div>
          <div className="flex gap-1 h-4">
            <div
              className="bg-blue-500 rounded-sm transition-all"
              style={{ width: `${(d.deliveries / max) * 100}%` }}
            />
            {d.delayed > 0 && (
              <div
                className="bg-red-400 rounded-sm transition-all"
                style={{ width: `${(d.delayed / max) * 100}%` }}
              />
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

// --- Stat card ---
function StatCard({ icon: Icon, label, value, color, sub, onClick }: {
  icon: React.ElementType; label: string; value: number | string
  color: string; sub?: string; onClick?: () => void
}) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-200 dark:border-gray-700 flex items-start gap-4',
        onClick && 'cursor-pointer hover:shadow-md transition-shadow'
      )}
    >
      <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0', color)}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <div className="min-w-0">
        <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{label}</p>
        {sub && (
          <p className="text-xs text-green-600 dark:text-green-400 mt-1 flex items-center gap-0.5">
            <TrendingUp className="w-3 h-3" />{sub}
          </p>
        )}
      </div>
    </div>
  )
}

export function Dashboard() {
  const { t, language, goods, agents } = useAppStore()
  const navigate = useNavigate()

  const stats = useMemo(() => ({
    total: goods.length,
    expected: goods.filter(g => ['in_transit', 'arrived'].includes(g.status)).length,
    delivered: goods.filter(g => g.status === 'delivered').length,
    delayed: goods.filter(g => g.status === 'delayed').length,
    activeAgents: agents.filter(a => ['active', 'traveling'].includes(a.status)).length,
  }), [goods, agents])

  const monthlyData = useMemo(() => {
    const months = language === 'ar' ? MONTHS_AR : MONTHS_FR
    const now = new Date()
    return Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now)
      d.setMonth(d.getMonth() - (5 - i))
      const month = d.getMonth()
      const year = d.getFullYear()
      const count = goods.filter(g => {
        const gDate = new Date(g.createdAt)
        return gDate.getMonth() === month && gDate.getFullYear() === year
      }).length
      return { label: months[month], value: count }
    })
  }, [goods, language])

  const statusDistribution = useMemo(() => {
    const statuses: Record<string, number> = {}
    goods.forEach(g => { statuses[g.status] = (statuses[g.status] || 0) + 1 })
    return Object.entries(statuses).map(([key, val], i) => ({
      label: t(`goods.statuses.${key}`),
      value: val,
      color: BAR_COLORS[i % BAR_COLORS.length],
    }))
  }, [goods, language])

  const agentPerformance = useMemo(() =>
    agents.slice(0, 5).map(a => ({
      label: a.name.split(' ')[0],
      deliveries: a.totalDeliveries,
      delayed: a.delayedDeliveries,
    })),
  [agents])

  const recentActivity = useMemo(() => {
    return goods
      .slice()
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 6)
      .map(g => ({
        id: g.id,
        text: language === 'ar'
          ? `${g.status === 'delivered' ? 'تم تسليم' : g.status === 'in_transit' ? 'في الطريق' : 'تسجيل'} ${g.trackingNumber}`
          : `${g.trackingNumber} ${g.status === 'delivered' ? 'livré' : g.status === 'in_transit' ? 'en transit' : 'enregistré'}`,
        time: g.createdAt,
        status: g.status,
      }))
  }, [goods, language])

  const successRate = goods.length > 0
    ? Math.round((stats.delivered / goods.length) * 100)
    : 0

  const supplierStats = useMemo(() => getDashboardStats(), [goods, agents])

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Page title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">{t('dashboard.title')}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {language === 'ar' ? 'نظرة شاملة على عمليات النقل' : "Vue d'ensemble des opérations"}
          </p>
        </div>
        <div className="flex items-center gap-2 bg-green-50 dark:bg-green-900/20 px-3 py-1.5 rounded-full">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-xs text-green-700 dark:text-green-400 font-medium">
            {language === 'ar' ? 'النظام يعمل' : 'Système actif'}
          </span>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        <StatCard icon={Package} label={t('dashboard.totalGoods')} value={stats.total} color="bg-blue-500" onClick={() => navigate('/goods')} />
        <StatCard icon={Clock} label={t('dashboard.expectedArrivals')} value={stats.expected} color="bg-amber-500" onClick={() => navigate('/goods')} />
        <StatCard icon={CheckCircle2} label={t('dashboard.deliveredGoods')} value={stats.delivered} color="bg-green-500" sub={`${successRate}%`} />
        <StatCard icon={AlertTriangle} label={t('dashboard.delayedGoods')} value={stats.delayed} color="bg-red-500" />
        <StatCard icon={Users} label={t('dashboard.activeAgents')} value={stats.activeAgents} color="bg-purple-500" onClick={() => navigate('/agents')} />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Volume — custom SVG sparkline */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-200 dark:border-gray-700">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-2">{t('dashboard.monthlyVolume')}</h3>
          <AreaSparkline data={monthlyData} />
        </div>

        {/* Status Distribution — custom donut */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-200 dark:border-gray-700">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">{t('dashboard.deliveryPerformance')}</h3>
          <DonutChart data={statusDistribution} />
        </div>
      </div>

      {/* Agent Performance + Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Agent Performance — custom horizontal bars */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900 dark:text-white">{t('dashboard.agentPerformance')}</h3>
            <button onClick={() => navigate('/agents')} className="text-xs text-blue-500 flex items-center gap-1 hover:text-blue-600">
              {t('dashboard.viewAll')}<ArrowUpRight className="w-3 h-3" />
            </button>
          </div>
          <HorizontalBarChart data={agentPerformance} lang={language} />
        </div>

        {/* Recent Activity */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900 dark:text-white">{t('dashboard.recentActivity')}</h3>
            <button onClick={() => navigate('/goods')} className="text-xs text-blue-500 flex items-center gap-1 hover:text-blue-600">
              {t('dashboard.viewAll')}<ArrowUpRight className="w-3 h-3" />
            </button>
          </div>
          <div className="space-y-3">
            {recentActivity.map((activity) => {
              const goodsItem = goods.find(g => g.id === activity.id)
              return (
                <div key={`act-${activity.id}`} className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0 mt-1.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-700 dark:text-gray-300 truncate">{activity.text}</p>
                    {goodsItem && (
                      <StatusBadge
                        status={goodsItem.status}
                        type="goods"
                        label={t(`goods.statuses.${goodsItem.status}`)}
                        size="sm"
                      />
                    )}
                  </div>
                  <span className="text-xs text-gray-400 flex-shrink-0">
                    {formatDistanceToNow(activity.time, language)}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Supplier Stats Section */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div onClick={() => navigate('/suppliers/analytics')} className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-200 dark:border-gray-700 cursor-pointer hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{supplierStats.totalOutstanding.toLocaleString()}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{t('suppliers.outstandingBalance')}</p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/20 flex items-center justify-center">
                <Clock className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{supplierStats.delayedPOs}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{t('suppliers.delayedPOs')}</p>
              </div>
            </div>
          </div>
          <div onClick={() => navigate('/suppliers/tasks')} className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-200 dark:border-gray-700 cursor-pointer hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-orange-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{supplierStats.overdueTasks}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{t('suppliers.overdueTasks')}</p>
              </div>
            </div>
          </div>
          <div onClick={() => navigate('/suppliers/analytics')} className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-200 dark:border-gray-700 cursor-pointer hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold text-gray-900 dark:text-white text-sm">{t('suppliers.topSuppliersThisMonth')}</h4>
              <ArrowUpRight className="w-4 h-4 text-gray-400" />
            </div>
            <div className="space-y-1">
              {supplierStats.topSuppliersThisMonth.slice(0, 3).map((s, i) => (
                <div key={s.supplierId} className="flex items-center justify-between text-xs">
                  <span className="text-gray-700 dark:text-gray-300 truncate max-w-[100px]">{s.supplierName}</span>
                  <span className="text-gray-500 font-mono">{s.spend.toLocaleString()}</span>
                </div>
              ))}
              {supplierStats.topSuppliersThisMonth.length === 0 && (
                <p className="text-xs text-gray-400">{t('common.noData')}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
