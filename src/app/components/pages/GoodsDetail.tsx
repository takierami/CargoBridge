import { useState } from 'react'
import { useParams, useNavigate } from 'react-router'
import { ArrowLeft, Package, User, Calendar, FileText, CheckCircle2, Clock, AlertTriangle, Receipt } from 'lucide-react'
import { useAppStore } from '../../../store/appStore'
import { StatusBadge, PriorityBadge } from '../ui/StatusBadge'
import { formatDate } from '../../../utils/dateUtils'
import { ReceiptModal } from '../ui/ReceiptModal'
import type { GoodsStatus, TemplateType } from '../../../types'

const STATUS_ORDER: GoodsStatus[] = [
  'draft', 'assigned', 'ready_for_departure', 'in_transit', 'arrived', 'delivered', 'delayed', 'cancelled'
]

export function GoodsDetail() {
  const { id } = useParams<{ id: string }>()
  const { t, language, goods, agents } = useAppStore()
  const navigate = useNavigate()
  const [showReceipt, setShowReceipt] = useState(false)
  const [receiptType, setReceiptType] = useState<TemplateType>('reception')

  const item = goods.find(g => g.id === id)
  if (!item) {
    return (
      <div className="p-6 text-center">
        <Package className="w-12 h-12 mx-auto text-gray-300 mb-3" />
        <p className="text-gray-500">{t('common.noData')}</p>
        <button onClick={() => navigate('/goods')} className="mt-3 text-blue-600 text-sm">{t('common.back')}</button>
      </div>
    )
  }

  const agent = agents.find(a => a.id === item.agentId)
  const currentIdx = STATUS_ORDER.indexOf(item.status as GoodsStatus)

  const timelineSteps = STATUS_ORDER.map((s, i) => ({
    status: s,
    label: t(`goods.statuses.${s}`),
    completed: i < currentIdx,
    active: i === currentIdx,
    delayed: item.status === 'delayed' && i === currentIdx,
  }))

  const InfoRow = ({ label, value }: { label: string; value: React.ReactNode }) => (
    <div className="flex items-start gap-3 py-2.5 border-b border-gray-100 dark:border-gray-700 last:border-0">
      <span className="text-sm text-gray-500 dark:text-gray-400 w-36 flex-shrink-0">{label}</span>
      <span className="text-sm text-gray-900 dark:text-white font-medium flex-1">{value || '—'}</span>
    </div>
  )

  return (
    <div className="p-4 lg:p-6 space-y-5">
      {/* Back + Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/goods')} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">{item.description}</h1>
            <StatusBadge status={item.status} type="goods" label={t(`goods.statuses.${item.status}`)} />
            <PriorityBadge priority={item.priority} label={t(`goods.priorities.${item.priority}`)} />
          </div>
          <p className="text-sm text-blue-600 dark:text-blue-400 font-mono mt-0.5">{item.trackingNumber}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => { setReceiptType('reception'); setShowReceipt(true) }}
            className="flex items-center gap-1.5 px-3 py-2 bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800 rounded-lg text-sm font-medium transition-colors"
          >
            <Receipt className="w-4 h-4" />
            {t('receipts.generateReceipt')}
          </button>
          <button
            onClick={() => { setReceiptType('delivery'); setShowReceipt(true) }}
            className="flex items-center gap-1.5 px-3 py-2 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800 rounded-lg text-sm font-medium transition-colors"
          >
            <Receipt className="w-4 h-4" />
            {t('receipts.generateDelivery')}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Main Details */}
        <div className="lg:col-span-2 space-y-5">
          {/* Info Card */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-200 dark:border-gray-700">
            <h2 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-500" />
              {t('common.details')}
            </h2>
            <InfoRow label={t('goods.description')} value={item.description} />
            <InfoRow label={t('goods.category')} value={t(`goods.categories.${item.category}`)} />
            <InfoRow label={t('goods.quantity')} value={`${item.quantity} ${t('goods.pieces')}`} />
            {item.weight && <InfoRow label={t('goods.weight')} value={`${item.weight} كجم`} />}
            {item.value && <InfoRow label={t('goods.value')} value={`${item.value.toLocaleString()} ${language === 'ar' ? 'دج' : 'DZD'}`} />}
            {item.transportType && <InfoRow label={t('goods.transportType')} value={t(`goods.transportTypes.${item.transportType}`)} />}
            <InfoRow label={t('goods.departureDate')} value={formatDate(item.departureDate, language)} />
            <InfoRow label={t('goods.expectedArrival')} value={formatDate(item.expectedArrivalDate, language)} />
            {item.arrivalDate && <InfoRow label={t('goods.arrivalDate')} value={formatDate(item.arrivalDate, language)} />}
            {item.notes && (
              <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                <p className="text-xs text-gray-500 mb-1">{t('goods.notes')}</p>
                <p className="text-sm text-gray-700 dark:text-gray-300">{item.notes}</p>
              </div>
            )}
          </div>

          {/* Timeline */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-200 dark:border-gray-700">
            <h2 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-500" />
              {t('goods.timeline')}
            </h2>
            {item.status === 'cancelled' ? (
              <div className="flex items-center gap-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-xl">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                <span className="text-sm text-red-700 dark:text-red-400">{t(`goods.statuses.cancelled`)}</span>
              </div>
            ) : (
              <div className="relative">
                <div className="absolute start-3.5 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-600" />
                <div className="space-y-4">
                  {timelineSteps.map((step) => (
                    <div key={step.status} className="flex items-center gap-3 relative">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 relative z-10 ${
                        step.delayed ? 'bg-red-500' :
                        step.active ? 'bg-blue-500' :
                        step.completed ? 'bg-green-500' : 'bg-gray-200 dark:bg-gray-600'
                      }`}>
                        {step.completed ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                        ) : step.delayed ? (
                          <AlertTriangle className="w-3.5 h-3.5 text-white" />
                        ) : (
                          <div className={`w-2 h-2 rounded-full ${step.active ? 'bg-white' : 'bg-gray-400'}`} />
                        )}
                      </div>
                      <span className={`text-sm ${
                        step.active ? 'font-semibold text-blue-600 dark:text-blue-400' :
                        step.completed ? 'text-gray-500 dark:text-gray-400' : 'text-gray-400 dark:text-gray-500'
                      }`}>
                        {step.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Agent Card */}
        <div className="space-y-5">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-200 dark:border-gray-700">
            <h2 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <User className="w-4 h-4 text-blue-500" />
              {t('goods.agent')}
            </h2>
            {agent ? (
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-lg">
                    {agent.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">{agent.name}</p>
                    <StatusBadge status={agent.status} type="agent" label={t(`agents.statuses.${agent.status}`)} size="sm" />
                  </div>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">{t('agents.phone')}</span>
                    <span className="text-gray-900 dark:text-white font-mono text-xs">{agent.phone}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">{t('agents.passport')}</span>
                    <span className="text-gray-900 dark:text-white font-mono text-xs">{agent.passport}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">{t('agents.reliabilityScore')}</span>
                    <div className="flex items-center gap-1">
                      <div className="w-16 h-1.5 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                        <div className="h-full bg-green-500 rounded-full" style={{ width: `${agent.reliabilityScore}%` }} />
                      </div>
                      <span className="text-xs font-medium text-green-600">{agent.reliabilityScore}%</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => navigate(`/agents/${agent.id}`)}
                  className="w-full mt-3 py-2 text-sm text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                >
                  {t('agents.profile')}
                </button>
              </div>
            ) : (
              <div className="text-center py-6 text-gray-400">
                <User className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm">{t('goods.noAgent')}</p>
              </div>
            )}
          </div>

          {/* Dates Summary */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-200 dark:border-gray-700">
            <h2 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-500" />
              {language === 'ar' ? 'المواعيد' : 'Dates'}
            </h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-2.5 rounded-lg bg-gray-50 dark:bg-gray-700">
                <span className="text-xs text-gray-500">{t('goods.departureDate')}</span>
                <span className="text-xs font-medium text-gray-900 dark:text-white">{formatDate(item.departureDate, language)}</span>
              </div>
              <div className="flex justify-between items-center p-2.5 rounded-lg bg-amber-50 dark:bg-amber-900/20">
                <span className="text-xs text-gray-500">{t('goods.expectedArrival')}</span>
                <span className="text-xs font-medium text-amber-700 dark:text-amber-400">{formatDate(item.expectedArrivalDate, language)}</span>
              </div>
              {item.arrivalDate && (
                <div className="flex justify-between items-center p-2.5 rounded-lg bg-green-50 dark:bg-green-900/20">
                  <span className="text-xs text-gray-500">{t('goods.arrivalDate')}</span>
                  <span className="text-xs font-medium text-green-700 dark:text-green-400">{formatDate(item.arrivalDate, language)}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {showReceipt && (
        <ReceiptModal
          goods={item}
          agent={agent}
          defaultType={receiptType}
          onClose={() => setShowReceipt(false)}
        />
      )}
    </div>
  )
}
