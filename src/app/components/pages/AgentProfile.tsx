import { useState } from 'react'
import { useParams, useNavigate } from 'react-router'
import {
  ArrowLeft, Phone, Globe2, FileText, Package, Pencil, Mail, Building2, CreditCard, MapPin,
} from 'lucide-react'
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, Tooltip } from 'recharts'
import { toast } from 'sonner'
import { useAppStore } from '../../../store/appStore'
import { StatusBadge } from '../ui/StatusBadge'
import { formatDistanceToNow } from '../../../utils/dateUtils'
import { AgentForm } from '../agents/AgentForm'
import { isOrgAdmin } from '../../../lib/roles'
import { PartnerLocalTimeCard } from '../trade-time/PartnerLocalTimeCard'
import { ContactActions } from '../trade-time/ContactActions'
import { parseTaxRate } from '../../../utils/agentTax'

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
  const activityScore = agentGoods.length > 0
    ? Math.min(100, Math.round(((delivered + inTransit) / agentGoods.length) * 100))
    : 0

  const displayName = language === 'fr' && agent.nameFr ? agent.nameFr : agent.name
  const emp = agent.employmentStatus || (agent.status === 'inactive' ? 'inactive' : 'active')
  const taxRate = parseTaxRate(agent.effectiveTaxRate ?? agent.taxRateOverride)

  const scoreColor = agent.reliabilityScore >= 90 ? 'text-green-600' : agent.reliabilityScore >= 75 ? 'text-amber-600' : 'text-red-600'
  const scoreBg = agent.reliabilityScore >= 90 ? 'bg-green-500' : agent.reliabilityScore >= 75 ? 'bg-amber-500' : 'bg-red-500'

  const radarData = [
    { subject: language === 'ar' ? 'الموثوقية' : 'Fiabilité', value: agent.reliabilityScore },
    { subject: language === 'ar' ? 'التسليمات' : 'Livraisons', value: Math.min(100, agent.totalDeliveries * 2) },
    {
      subject: language === 'ar' ? 'الدقة' : 'Ponctualité',
      value: agent.totalDeliveries > 0
        ? Math.round(((agent.totalDeliveries - agent.delayedDeliveries) / agent.totalDeliveries) * 100)
        : 0,
    },
    { subject: language === 'ar' ? 'النشاط' : 'Activité', value: activityScore },
    { subject: language === 'ar' ? 'الجودة' : 'Qualité', value: successRate },
  ]

  const Field = ({ label, value }: { label: string; value?: string | number | null }) => {
    if (value == null || value === '') return null
    return (
      <div>
        <p className="text-xs text-gray-500">{label}</p>
        <p className="text-sm text-gray-800 dark:text-gray-200 mt-0.5 break-words">{value}</p>
      </div>
    )
  }

  return (
    <div className="p-4 lg:p-6 space-y-5">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/agents')} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <h1 className="text-lg font-bold text-gray-900 dark:text-white sm:text-xl flex-1">{t('agents.profile')}</h1>
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
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="text-center mb-4">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-3xl mx-auto mb-3">
              {displayName.charAt(0)}
            </div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">{displayName}</h2>
            {agent.code && <p className="text-xs font-mono text-gray-500 mt-0.5">{agent.code}</p>}
            <div className="flex flex-wrap justify-center gap-1.5 mt-2">
              <StatusBadge
                status={emp === 'inactive' ? 'inactive' : 'active'}
                type="agent"
                label={t(`agents.employmentStatuses.${emp}`)}
              />
              {agent.agentType === 'auto_entrepreneur' && (
                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200">
                  {t('agents.types.auto_entrepreneur')}
                  {taxRate > 0 ? ` · ${taxRate}%` : ''}
                </span>
              )}
            </div>
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
            {agent.email && (
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                <Mail className="w-4 h-4 flex-shrink-0" />
                <span dir="ltr">{agent.email}</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
              <FileText className="w-4 h-4 flex-shrink-0" />
              <span dir="ltr" className="font-mono">{agent.passport}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
              <Globe2 className="w-4 h-4 flex-shrink-0" />
              <span>{agent.country}</span>
            </div>
            {agent.companyName && (
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                <Building2 className="w-4 h-4 flex-shrink-0" />
                <span>{agent.companyName}</span>
              </div>
            )}
          </div>

          <div className="mt-4 space-y-3 border-t border-gray-200 pt-4 dark:border-gray-700">
            <PartnerLocalTimeCard country={agent.country} />
            <ContactActions country={agent.country} phone={agent.whatsapp || agent.phone} />
          </div>

          {agent.lastActive && (
            <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
              <p className="text-xs text-gray-500">{t('agents.lastActive')}</p>
              <p className="text-sm text-gray-700 dark:text-gray-300 mt-0.5">{formatDistanceToNow(agent.lastActive, language)}</p>
            </div>
          )}
        </div>

        <div className="lg:col-span-2 space-y-5">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: t('agents.totalDeliveries'), value: agent.totalDeliveries, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20' },
              { label: t('agents.delayedDeliveries'), value: agent.delayedDeliveries, color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-900/20' },
              { label: language === 'ar' ? 'السلع الحالية' : 'Marchandises', value: agentGoods.length, color: 'text-indigo-600', bg: 'bg-indigo-50 dark:bg-indigo-900/20' },
              { label: language === 'ar' ? 'نسبة النجاح' : 'Taux succès', value: `${successRate}%`, color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-900/20' },
            ].map(stat => (
              <div key={stat.label} className={`rounded-2xl p-4 ${stat.bg} border border-transparent`}>
                <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                <p className="text-xs text-gray-500 mt-0.5">{stat.label}</p>
              </div>
            ))}
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3">{t('agents.performance')}</h3>
            <ResponsiveContainer width="100%" height={220}>
              <RadarChart data={radarData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11 }} />
                <Radar name={displayName} dataKey="value" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 space-y-4">
            <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <FileText className="w-4 h-4" />{t('agents.personalInfo')}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label={t('agents.nameFr')} value={agent.nameFr} />
              <Field label={t('agents.nameEn')} value={agent.nameEn} />
              <Field label={t('agents.agentType')} value={t(`agents.types.${agent.agentType || 'standard'}`)} />
              <Field label={t('agents.taxRate')} value={taxRate > 0 ? `${taxRate}%` : '0%'} />
              <Field label={t('agents.nationalId')} value={agent.nationalId} />
              <Field label={t('agents.taxId')} value={agent.taxId} />
              <Field label={t('agents.businessRegistrationNumber')} value={agent.businessRegistrationNumber} />
              <Field label={t('agents.passportExpiry')} value={agent.passportExpiry} />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 space-y-4">
            <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <MapPin className="w-4 h-4" />{t('agents.formTabs.address')}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label={t('agents.city')} value={agent.city} />
              <Field label={t('agents.stateProvince')} value={agent.stateProvince} />
              <Field label={t('agents.postalCode')} value={agent.postalCode} />
              <Field label={t('agents.address')} value={agent.address} />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 space-y-4">
            <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <CreditCard className="w-4 h-4" />{t('agents.formTabs.financial')}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label={t('agents.preferredCurrency')} value={agent.preferredCurrency} />
              <Field label={t('agents.commissionRate')} value={agent.commissionRate != null ? `${agent.commissionRate}%` : undefined} />
              <Field label={t('agents.bankName')} value={agent.bankName} />
              <Field label={t('agents.iban')} value={agent.iban} />
              <Field label={t('agents.swift')} value={agent.swift} />
              <Field label={t('agents.preferredPaymentMethod')} value={agent.preferredPaymentMethod} />
            </div>
          </div>

          {(agent.notes || agent.internalNotes) && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 space-y-3">
              <h3 className="font-semibold text-gray-900 dark:text-white">{t('agents.formTabs.notes')}</h3>
              {agent.notes && <p className="text-sm text-gray-700 dark:text-gray-300">{agent.notes}</p>}
              {agent.internalNotes && (
                <div>
                  <p className="text-xs text-gray-500 mb-1">{t('agents.internalNotes')}</p>
                  <p className="text-sm text-gray-700 dark:text-gray-300">{agent.internalNotes}</p>
                </div>
              )}
            </div>
          )}

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
                  <div
                    key={g.id}
                    onClick={() => navigate(`/goods/${g.id}`)}
                    className="flex items-center justify-between p-3 rounded-xl border border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750 cursor-pointer"
                  >
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
        <AgentForm
          initial={agent}
          compact={false}
          onCancel={() => setShowEdit(false)}
          onSave={async (data) => {
            try {
              await updateAgent(agent.id, data)
              toast.success(t('common.success'))
              setShowEdit(false)
            } catch (err) {
              toast.error(err instanceof Error ? err.message : t('common.error'))
              throw err
            }
          }}
        />
      )}
    </div>
  )
}
