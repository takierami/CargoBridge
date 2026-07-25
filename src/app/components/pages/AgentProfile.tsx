import { useState } from 'react'
import { useParams, useNavigate } from 'react-router'
import { ArrowLeft, Phone, Globe2, FileText, Package, TrendingUp, AlertTriangle, CheckCircle2, Pencil } from 'lucide-react'
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, Tooltip } from 'recharts'
import { toast } from 'sonner'
import { useAppStore } from '../../../store/appStore'
import { StatusBadge } from '../ui/StatusBadge'
import { formatDate, formatDistanceToNow } from '../../../utils/dateUtils'
import { AgentQuickCreate } from '../quick-create/AgentQuickCreate'
import { isOrgAdmin } from '../../../lib/roles'

export function AgentProfile() {
  const { id } = useParams<{ id: string }>()
  const { t, language, agents, goods, role, updateAgent } = useAppStore()
  const navigate = useNavigate()
  const [showEdit, setShowEdit] = useState(false)

  const agent = agents.find(a => a.id === id)
  if (!agent) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-500">{t('common.noData')}</p>
        <button onClick={() => navigate('/agents')} className="mt-3 text-blue-600 text-sm">{t('common.back')}</button>
      </div>
    )
  }

  const agentGoods = goods.filter(g => g.agentId === id)
  const delivered = agentGoods.filter(g => g.status === 'delivered').length
  const delayed = agentGoods.filter(g => g.status === 'delayed').length
  const inTransit = agentGoods.filter(g => g.status === 'in_transit').length
  const successRate = agentGoods.length > 0 ? Math.round((delivered / agentGoods.length) * 100) : 0

  const scoreColor = agent.reliabilityScore >= 90 ? 'text-green-600' : agent.reliabilityScore >= 75 ? 'text-amber-600' : 'text-red-600'
  const scoreBg = agent.reliabilityScore >= 90 ? 'bg-green-500' : agent.reliabilityScore >= 75 ? 'bg-amber-500' : 'bg-red-500'

  const radarData = [
    { subject: language === 'ar' ? 'الموثوقية' : 'Fiabilité', value: agent.reliabilityScore },
    { subject: language === 'ar' ? 'التسليمات' : 'Livraisons', value: Math.min(100, agent.totalDeliveries * 2) },
    { subject: language === 'ar' ? 'الدقة' : 'Ponctualité', value: agent.totalDeliveries > 0 ? Math.round(((agent.totalDeliveries - agent.delayedDeliveries) / agent.totalDeliveries) * 100) : 0 },
    { subject: language === 'ar' ? 'النشاط' : 'Activité', value: 85 },
    { subject: language === 'ar' ? 'الجودة' : 'Qualité', value: successRate },
  ]

  return (
    <div className="p-4 lg:p-6 space-y-5">
      {/* Back */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/agents')} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white flex-1">{t('agents.profile')}</h1>
        {isOrgAdmin(role) && (
          <button
            onClick={() => setShowEdit(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-gray-50 dark:bg-gray-900/40 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-medium"
          >
            <Pencil className="w-4 h-4" />
            {t('common.edit')}
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Profile Card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="text-center mb-4">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-3xl mx-auto mb-3">
              {agent.name.charAt(0)}
            </div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">{agent.name}</h2>
            <StatusBadge status={agent.status} type="agent" label={t(`agents.statuses.${agent.status}`)} />
          </div>

          <div className="mb-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-gray-500">{t('agents.reliabilityScore')}</span>
              <span className={`text-sm font-bold ${scoreColor}`}>{agent.reliabilityScore}%</span>
            </div>
            <div className="h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
              <div className={`h-full rounded-full ${scoreBg}`} style={{ width: `${agent.reliabilityScore}%` }} />
            </div>
          </div>

          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
              <Phone className="w-4 h-4 flex-shrink-0" />
              <span dir="ltr" className="font-mono">{agent.phone}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
              <FileText className="w-4 h-4 flex-shrink-0" />
              <span dir="ltr" className="font-mono">{agent.passport}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
              <Globe2 className="w-4 h-4 flex-shrink-0" />
              <span>{agent.country}</span>
            </div>
          </div>

          {agent.notes && (
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <p className="text-xs text-gray-500 mb-1">{t('common.notes')}</p>
              <p className="text-sm text-gray-700 dark:text-gray-300">{agent.notes}</p>
            </div>
          )}

          {agent.lastActive && (
            <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
              <p className="text-xs text-gray-500">{t('agents.lastActive')}</p>
              <p className="text-sm text-gray-700 dark:text-gray-300 mt-0.5">{formatDistanceToNow(agent.lastActive, language)}</p>
            </div>
          )}
        </div>

        {/* Stats + Radar */}
        <div className="lg:col-span-2 space-y-5">
          {/* Performance Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: t('agents.totalDeliveries'), value: agent.totalDeliveries, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20' },
              { label: t('agents.delayedDeliveries'), value: agent.delayedDeliveries, color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-900/20' },
              { label: language === 'ar' ? 'السلع الحالية' : 'Marchandises', value: agentGoods.length, color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-900/20' },
              { label: language === 'ar' ? 'نسبة النجاح' : 'Taux succès', value: `${successRate}%`, color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-900/20' },
            ].map((stat) => (
              <div key={stat.label} className={`rounded-2xl p-4 ${stat.bg} border border-transparent`}>
                <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                <p className="text-xs text-gray-500 mt-0.5">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Radar Chart */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3">{t('agents.performance')}</h3>
            <ResponsiveContainer width="100%" height={220}>
              <RadarChart data={radarData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11 }} />
                <Radar name={agent.name} dataKey="value" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          {/* Assigned Goods */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-900 dark:text-white">{t('agents.assignedGoods')}</h3>
              <span className="text-xs text-gray-500">{agentGoods.length} {t('common.records')}</span>
            </div>
            {agentGoods.length === 0 ? (
              <div className="text-center py-8">
                <Package className="w-10 h-10 mx-auto text-gray-300 mb-2" />
                <p className="text-sm text-gray-500">{t('goods.noGoods')}</p>
              </div>
            ) : (
              <div className="space-y-2">
                {agentGoods.map(g => (
                  <div key={g.id}
                    onClick={() => navigate(`/goods/${g.id}`)}
                    className="flex items-center justify-between p-3 rounded-xl border border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750 cursor-pointer">
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{g.description}</p>
                      <p className="text-xs text-gray-500 font-mono">{g.trackingNumber} · {g.quantity} {t('goods.pieces')}</p>
                    </div>
                    <StatusBadge status={g.status} type="goods" label={t(`goods.statuses.${g.status}`)} size="sm" />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      {showEdit && (
        <AgentQuickCreate
          initial={agent}
          onCancel={() => setShowEdit(false)}
          onSave={async (data) => {
            try {
              await updateAgent(agent.id, data)
              toast.success(t('common.success'))
              setShowEdit(false)
            } catch (err) {
              toast.error(err instanceof Error ? err.message : t('common.error'))
            }
          }}
        />
      )}
    </div>
  )
}
