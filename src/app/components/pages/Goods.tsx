import { useState, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router'
import {
  Plus, Search, Eye, Pencil, Trash2, Package,
  ChevronDown, X, LayoutList, LayoutGrid, Receipt, QrCode,
} from 'lucide-react'
import { toast } from 'sonner'
import { useAppStore } from '../../../store/appStore'
import { StatusBadge, PriorityBadge } from '../ui/StatusBadge'
import { formatDate } from '../../../utils/dateUtils'
import { cn } from '../../utils/cn'
import { ReceiptModal } from '../ui/ReceiptModal'
import { GoodsQrModal } from '../GoodsQrModal'
import { trackingService } from '../../../services/trackingService'
import { goodsService } from '../../../services/goodsService'
import type { Goods as GoodsType, GoodsStatus, Priority, TemplateType, TransportType } from '../../../types'
import { isOrgAdmin } from '../../../lib/roles'
import { AgentQuickCreate } from '../quick-create/AgentQuickCreate'
import { CurrencyQuickCreate } from '../quick-create/CurrencyQuickCreate'
import { currenciesForSelect, currencyOptionLabel } from '../../../lib/currencies'

const ALL_TRANSPORT_TYPES: TransportType[] = ['air', 'sea', 'land', 'express', 'other']

const ALL_STATUSES: GoodsStatus[] = [
  'draft', 'assigned', 'ready_for_departure', 'in_transit', 'arrived', 'warehouse', 'delivered', 'delayed', 'cancelled'
]
const ALL_CATEGORIES = ['electronics','clothing','food','cosmetics','medicine','tools','furniture','other']

export function GoodsForm({
  initial, agents, onSave, onCancel, onStatusChange, t, language, role,
}: {
  initial?: Partial<GoodsType>
  agents: ReturnType<typeof useAppStore>['agents']
  onSave: (data: any) => void
  onCancel: () => void
  onStatusChange?: (status: GoodsStatus) => Promise<void>
  t: ReturnType<typeof useAppStore>['t']
  language: 'ar' | 'fr'
  role: string
}) {
  const isEdit = Boolean(initial?.id)
  const [form, setForm] = useState({
    description: initial?.description || '',
    descriptionFr: initial?.descriptionFr || '',
    category: initial?.category || 'electronics',
    quantity: initial?.quantity || 1,
    weight: initial?.weight || '',
    value: initial?.value || '',
    agentId: initial?.agentId || '',
    priority: initial?.priority || 'medium',
    departureDate: initial?.departureDate ? initial.departureDate.split('T')[0] : '',
    expectedArrivalDate: initial?.expectedArrivalDate ? initial.expectedArrivalDate.split('T')[0] : '',
    transportType: initial?.transportType || '' as TransportType | '',
    notes: initial?.notes || '',
    notesFr: initial?.notesFr || '',
    hsCode: initial?.hsCode || '',
    incoterm: initial?.incoterm || '',
    freightCost: initial?.freightCost ?? '',
    insuranceCost: initial?.insuranceCost ?? '',
    dutyAmount: initial?.dutyAmount ?? '',
    valueCurrency: initial?.valueCurrency || 'USD',
  })
  const [allowedActions, setAllowedActions] = useState<{ status: string; actionKey: string }[]>([])
  const [statusConsistent, setStatusConsistent] = useState(true)
  const [statusBusy, setStatusBusy] = useState(false)
  const [showAgentQuick, setShowAgentQuick] = useState(false)
  const [showCurrencyQuick, setShowCurrencyQuick] = useState(false)
  const [currencyListTick, setCurrencyListTick] = useState(0)
  const addAgent = useAppStore(s => s.addAgent)

  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }))

  useEffect(() => {
    if (!initial?.id) return
    goodsService.getAllowedStatuses(initial.id).then((res) => {
      setAllowedActions(res.allowedActions || [])
      setStatusConsistent(res.statusConsistent !== false)
    }).catch(() => {
      setAllowedActions([])
    })
  }, [initial?.id, initial?.status])

  const actionLabel = (action: { status: string; actionKey: string }) => {
    const key = `goods.qrActions.${action.actionKey}`
    const translated = t(key)
    return translated === key ? t(`goods.statuses.${action.status}`) : translated
  }

  const buildPayload = () => ({
    ...form,
    weight: form.weight ? Number(form.weight) : undefined,
    value: form.value ? Number(form.value) : undefined,
    freightCost: form.freightCost !== '' ? Number(form.freightCost) : undefined,
    insuranceCost: form.insuranceCost !== '' ? Number(form.insuranceCost) : undefined,
    dutyAmount: form.dutyAmount !== '' ? Number(form.dutyAmount) : undefined,
    hsCode: form.hsCode || undefined,
    incoterm: form.incoterm || undefined,
    valueCurrency: form.valueCurrency || 'USD',
    departureDate: form.departureDate ? new Date(form.departureDate).toISOString() : undefined,
    expectedArrivalDate: form.expectedArrivalDate ? new Date(form.expectedArrivalDate).toISOString() : undefined,
    agentId: form.agentId || undefined,
    descriptionFr: form.descriptionFr || undefined,
    notesFr: form.notesFr || undefined,
    transportType: (form.transportType || undefined) as TransportType | undefined,
  })

  const agentLocked =
    isEdit &&
    !!initial?.status &&
    ['assigned', 'ready_for_departure', 'in_transit', 'arrived', 'warehouse', 'delayed', 'delivered'].includes(initial.status)

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700">
          <h2 className="font-semibold text-gray-900 dark:text-white">
            {isEdit ? t('goods.editGoods') : t('goods.addGoods')}
          </h2>
          <button onClick={onCancel} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-5 space-y-4">
          {!isEdit && (
            <p className="text-xs text-gray-500 dark:text-gray-400 rounded-lg bg-gray-50 dark:bg-gray-900/40 px-3 py-2">
              {t('goods.statusLockedCreate')}
            </p>
          )}
          {isEdit && (
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('goods.status')}</span>
                <StatusBadge status={initial!.status!} type="goods" label={t(`goods.statuses.${initial!.status}`)} />
              </div>
              {!statusConsistent && (
                <p className="text-xs text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/20 rounded-lg px-3 py-2">
                  {t('goods.statusInconsistent')}
                </p>
              )}
              <p className="text-xs font-medium text-gray-500">{t('goods.advanceStatus')}</p>
              {allowedActions.length === 0 ? (
                <p className="text-xs text-gray-400">{t('goods.noAllowedTransitions')}</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {allowedActions.map((action) => (
                    <button
                      key={action.status}
                      type="button"
                      disabled={statusBusy || !onStatusChange}
                      onClick={async () => {
                        if (!onStatusChange) return
                        setStatusBusy(true)
                        try {
                          await onStatusChange(action.status as GoodsStatus)
                          const res = await goodsService.getAllowedStatuses(initial!.id!)
                          setAllowedActions(res.allowedActions || [])
                          setStatusConsistent(res.statusConsistent !== false)
                        } finally {
                          setStatusBusy(false)
                        }
                      }}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 hover:bg-blue-100 disabled:opacity-50"
                    >
                      {actionLabel(action)}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('goods.description')} * (عربي)</label>
              <input
                value={form.description}
                onChange={e => set('description', e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description (Français)</label>
              <input
                value={form.descriptionFr}
                onChange={e => set('descriptionFr', e.target.value)}
                dir="ltr"
                placeholder="ex: Smartphones Samsung"
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('goods.category')}</label>
              <select value={form.category} onChange={e => set('category', e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500">
                {ALL_CATEGORIES.map(c => <option key={c} value={c}>{t(`goods.categories.${c}`)}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('goods.priority')}</label>
              <select value={form.priority} onChange={e => set('priority', e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500">
                {(['low','medium','high'] as Priority[]).map(p => <option key={p} value={p}>{t(`goods.priorities.${p}`)}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('goods.quantity')}</label>
              <input type="number" min="1" value={form.quantity} onChange={e => set('quantity', Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('goods.weight')}</label>
              <input type="number" value={form.weight} onChange={e => set('weight', e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('goods.value')}</label>
              <input type="number" value={form.value} onChange={e => set('value', e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('suppliers.selectCurrency')}</label>
            <div className="flex gap-2">
              <select
                key={currencyListTick}
                value={form.valueCurrency}
                onChange={e => set('valueCurrency', e.target.value)}
                className="flex-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500"
              >
                {currenciesForSelect(form.valueCurrency).map(c => (
                  <option key={c.code} value={c.code}>{currencyOptionLabel(c.code, language)}</option>
                ))}
              </select>
              {isOrgAdmin(role) && (
                <button
                  type="button"
                  onClick={() => setShowCurrencyQuick(true)}
                  title={t('common.addNew')}
                  className="shrink-0 px-2.5 py-2 rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                >
                  <Plus className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('goods.agent')}</label>
            <div className="flex gap-2">
              <select value={form.agentId} onChange={e => set('agentId', e.target.value)}
                disabled={!isOrgAdmin(role)}
                className="flex-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 disabled:opacity-60">
                {!agentLocked && <option value="">{t('goods.noAgent')}</option>}
                {agents.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
              {isOrgAdmin(role) && !agentLocked && (
                <button
                  type="button"
                  onClick={() => setShowAgentQuick(true)}
                  title={t('common.addNew')}
                  className="shrink-0 px-2.5 py-2 rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-sm font-medium hover:bg-blue-100 dark:hover:bg-blue-900/50"
                >
                  <Plus className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('goods.hsCode')}</label>
              <input value={form.hsCode} onChange={e => set('hsCode', e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('goods.incoterm')}</label>
              <select value={form.incoterm} onChange={e => set('incoterm', e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500">
                <option value="">—</option>
                {['EXW','FCA','FOB','CFR','CIF','CPT','CIP','DAP','DPU','DDP'].map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('goods.freightCost')}</label>
              <input type="number" value={form.freightCost} onChange={e => set('freightCost', e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('goods.insuranceCost')}</label>
              <input type="number" value={form.insuranceCost} onChange={e => set('insuranceCost', e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('goods.dutyAmount')}</label>
              <input type="number" value={form.dutyAmount} onChange={e => set('dutyAmount', e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('goods.transportType')}</label>
            <select value={form.transportType} onChange={e => set('transportType', e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500">
              <option value="">{language === 'ar' ? 'اختر نوع النقل' : 'Choisir le transport'}</option>
              {ALL_TRANSPORT_TYPES.map(tp => <option key={tp} value={tp}>{t(`goods.transportTypes.${tp}`)}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('goods.departureDate')}</label>
              <input type="date" value={form.departureDate} onChange={e => set('departureDate', e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('goods.expectedArrival')}</label>
              <input type="date" value={form.expectedArrivalDate} onChange={e => set('expectedArrivalDate', e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('goods.notes')} (عربي)</label>
            <textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={2}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 resize-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Notes (Français)</label>
            <textarea value={form.notesFr} onChange={e => set('notesFr', e.target.value)} rows={2} dir="ltr"
              placeholder="ex: Garantie d'un an incluse"
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 resize-none" />
          </div>
        </div>
        <div className="flex gap-3 p-5 border-t border-gray-200 dark:border-gray-700">
          <button onClick={() => onSave(buildPayload())}
            className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors">
            {t('common.save')}
          </button>
          <button onClick={onCancel} className="flex-1 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium transition-colors">
            {t('common.cancel')}
          </button>
        </div>
      </div>
      {showAgentQuick && (
        <AgentQuickCreate
          nested
          onCancel={() => setShowAgentQuick(false)}
          onSave={async (data) => {
            try {
              const created = await addAgent({
                ...data,
                reliabilityScore: 0,
                totalDeliveries: 0,
                delayedDeliveries: 0,
              })
              set('agentId', created.id)
              setShowAgentQuick(false)
              toast.success(t('common.success'))
            } catch (err) {
              toast.error(err instanceof Error ? err.message : t('common.error'))
            }
          }}
        />
      )}
      {showCurrencyQuick && (
        <CurrencyQuickCreate
          nested
          onCancel={() => setShowCurrencyQuick(false)}
          onSave={async (code) => {
            set('valueCurrency', code)
            setCurrencyListTick(n => n + 1)
            setShowCurrencyQuick(false)
            toast.success(t('common.success'))
          }}
        />
      )}
    </div>
  )
}

export function Goods() {
  const { t, language, role, goods, agents, addGoods, updateGoods, updateGoodsStatus, deleteGoods } = useAppStore()
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [priorityFilter, setPriorityFilter] = useState<string>('all')
  const [showForm, setShowForm] = useState(false)
  const [editItem, setEditItem] = useState<GoodsType | null>(null)
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list')
  const [showManifest, setShowManifest] = useState(false)
  const [manifestAgentId, setManifestAgentId] = useState('')
  const [receiptGoods, setReceiptGoods] = useState<GoodsType | null>(null)
  const [receiptType, setReceiptType] = useState<TemplateType>('reception')
  const [qrModal, setQrModal] = useState<{ token: string; trackingNumber: string; description: string } | null>(null)

  const handleGenerateQr = async (g: GoodsType) => {
    try {
      const info = await trackingService.generateQr(g.id)
      setQrModal({ token: info.token, trackingNumber: g.trackingNumber, description: g.description })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('common.error'))
    }
  }

  const filtered = useMemo(() => {
    return goods.filter(g => {
      const matchSearch = !search ||
        g.trackingNumber.toLowerCase().includes(search.toLowerCase()) ||
        g.description.toLowerCase().includes(search.toLowerCase())
      const matchStatus = statusFilter === 'all' || g.status === statusFilter
      const matchPriority = priorityFilter === 'all' || g.priority === priorityFilter
      return matchSearch && matchStatus && matchPriority
    })
  }, [goods, search, statusFilter, priorityFilter])

  const handleSave = async (data: any) => {
    try {
      if (editItem?.id) {
        if (isOrgAdmin(role)) {
          const { status: _status, ...rest } = data
          await updateGoods(editItem.id, rest)
        } else {
          toast.error(t('common.error'))
          return
        }
      } else {
        if (!isOrgAdmin(role)) {
          toast.error(t('common.error'))
          return
        }
        const { status: _status, ...rest } = data
        await addGoods(rest as any)
      }
      toast.success(t('common.success'))
      setShowForm(false)
      setEditItem(null)
    } catch {
      toast.error(t('common.error'))
    }
  }

  const handleStatusChange = async (newStatus: GoodsStatus) => {
    if (!editItem?.id) return
    const result = await updateGoodsStatus(editItem.id, newStatus)
    if (!result.success) {
      toast.error(result.error || t('common.error'))
      throw new Error(result.error || 'status failed')
    }
    toast.success(t('common.success'))
    const refreshed = useAppStore.getState().goods.find((g) => g.id === editItem.id)
    if (refreshed) setEditItem(refreshed)
  }

  const handleDelete = async (id: string) => {
    if (confirm(t('goods.confirmDelete'))) {
      await deleteGoods(id)
      toast.success(t('common.success'))
    }
  }

  const manifestGoods = manifestAgentId
    ? goods.filter(g => g.agentId === manifestAgentId)
    : []
  const manifestAgent = agents.find(a => a.id === manifestAgentId)

  return (
    <div className="p-4 lg:p-6 space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">{t('goods.title')}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">{filtered.length} {t('common.records')}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => { setShowManifest(true); setManifestAgentId(agents[0]?.id || '') }}
            className="flex items-center gap-1.5 px-3 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium transition-colors"
          >
            <Package className="w-4 h-4" />
            {t('goods.manifest')}
          </button>
          {isOrgAdmin(role) && (
            <button
              onClick={() => { setEditItem(null); setShowForm(true) }}
              className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
            >
              <Plus className="w-4 h-4" />
              {t('goods.addGoods')}
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={t('goods.searchPlaceholder')}
            className="w-full ps-9 pe-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm focus:ring-2 focus:ring-blue-500">
          <option value="all">{t('common.all')}</option>
          {ALL_STATUSES.map(s => <option key={s} value={s}>{t(`goods.statuses.${s}`)}</option>)}
        </select>
        <select value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)}
          className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm focus:ring-2 focus:ring-blue-500">
          <option value="all">{t('common.all')}</option>
          {(['low','medium','high'] as Priority[]).map(p => <option key={p} value={p}>{t(`goods.priorities.${p}`)}</option>)}
        </select>
        <div className="flex rounded-lg border border-gray-300 dark:border-gray-600 overflow-hidden">
          <button onClick={() => setViewMode('list')} className={cn('px-2.5 py-2', viewMode === 'list' ? 'bg-blue-600 text-white' : 'bg-white dark:bg-gray-800 text-gray-500')}>
            <LayoutList className="w-4 h-4" />
          </button>
          <button onClick={() => setViewMode('grid')} className={cn('px-2.5 py-2', viewMode === 'grid' ? 'bg-blue-600 text-white' : 'bg-white dark:bg-gray-800 text-gray-500')}>
            <LayoutGrid className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Content */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-500 dark:text-gray-400">
          <Package className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p>{t('goods.noGoods')}</p>
        </div>
      ) : viewMode === 'list' ? (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-750">
                  <th className="text-start px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">{t('goods.trackingNumber')}</th>
                  <th className="text-start px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">{t('goods.description')}</th>
                  <th className="text-start px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">{t('goods.agent')}</th>
                  <th className="text-start px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">{t('goods.status')}</th>
                  <th className="text-start px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">{t('goods.priority')}</th>
                  <th className="text-start px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">{t('goods.expectedArrival')}</th>
                  <th className="text-start px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">{t('common.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((g) => {
                  const agent = agents.find(a => a.id === g.agentId)
                  return (
                    <tr key={g.id} className="border-b border-gray-100 dark:border-gray-700 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-750">
                      <td className="px-4 py-3">
                        <span className="text-sm font-mono font-medium text-blue-600 dark:text-blue-400">{g.trackingNumber}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">{g.description}</p>
                          <p className="text-xs text-gray-500">{t(`goods.categories.${g.category}`)} · {g.quantity} {t('goods.pieces')}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-gray-700 dark:text-gray-300">{agent?.name || t('goods.noAgent')}</span>
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={g.status} type="goods" label={t(`goods.statuses.${g.status}`)} />
                      </td>
                      <td className="px-4 py-3">
                        <PriorityBadge priority={g.priority} label={t(`goods.priorities.${g.priority}`)} />
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-gray-600 dark:text-gray-400">{formatDate(g.expectedArrivalDate, language)}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {/* Receipt — full labeled button, separated */}
                          <button
                            onClick={() => { setReceiptGoods(g); setReceiptType(g.status === 'delivered' || g.status === 'arrived' ? 'delivery' : 'reception') }}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800 text-xs font-medium transition-colors whitespace-nowrap"
                            title={t('receipts.preview')}
                          >
                            <Receipt className="w-3.5 h-3.5" />
                            {language === 'ar' ? 'وصل' : 'Reçu'}
                          </button>
                          <button
                            onClick={() => handleGenerateQr(g)}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-violet-50 dark:bg-violet-900/20 hover:bg-violet-100 dark:hover:bg-violet-900/30 text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-800 text-xs font-medium transition-colors whitespace-nowrap"
                            title={t('goods.generateQr')}
                          >
                            <QrCode className="w-3.5 h-3.5" />
                            {t('goods.generateQr')}
                          </button>
                          {/* Divider */}
                          <div className="w-px h-5 bg-gray-200 dark:bg-gray-600" />
                          {/* View / Edit / Delete — icon-only group */}
                          <div className="flex items-center gap-0.5">
                            <button onClick={() => navigate(`/goods/${g.id}`)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 hover:text-blue-600" title={t('common.view')}>
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => { setEditItem(g); setShowForm(true) }} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 hover:text-amber-600" title={t('common.edit')}>
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            {isOrgAdmin(role) && (
                              <button onClick={() => handleDelete(g.id)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 hover:text-red-600" title={t('common.delete')}>
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((g) => {
            const agent = agents.find(a => a.id === g.agentId)
            return (
              <div key={g.id} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-2">
                  <span className="text-xs font-mono text-blue-600 dark:text-blue-400 font-medium">{g.trackingNumber}</span>
                  <PriorityBadge priority={g.priority} label={t(`goods.priorities.${g.priority}`)} />
                </div>
                <h3 className="font-medium text-gray-900 dark:text-white text-sm mb-1 truncate">{g.description}</h3>
                <p className="text-xs text-gray-500 mb-2">{t(`goods.categories.${g.category}`)} · {g.quantity} {t('goods.pieces')}</p>
                <StatusBadge status={g.status} type="goods" label={t(`goods.statuses.${g.status}`)} />
                {agent && <p className="text-xs text-gray-500 mt-2 truncate">{agent.name}</p>}
                <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700 space-y-2">
                  {/* Receipt — full-width labeled button, left-aligned */}
                  <button
                    onClick={() => { setReceiptGoods(g); setReceiptType(g.status === 'delivered' || g.status === 'arrived' ? 'delivery' : 'reception') }}
                    className="w-full flex items-center justify-start gap-1.5 ps-3 py-1.5 text-xs font-medium text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg transition-colors"
                  >
                    <Receipt className="w-3.5 h-3.5" />
                    {language === 'ar' ? 'إنشاء وصل' : 'Générer un reçu'}
                  </button>
                  <button
                    onClick={() => handleGenerateQr(g)}
                    className="w-full flex items-center justify-start gap-1.5 ps-3 py-1.5 text-xs font-medium text-violet-700 dark:text-violet-300 bg-violet-50 dark:bg-violet-900/20 hover:bg-violet-100 dark:hover:bg-violet-900/30 border border-violet-200 dark:border-violet-800 rounded-lg transition-colors"
                  >
                    <QrCode className="w-3.5 h-3.5" />
                    {t('goods.generateQr')}
                  </button>
                  {/* View / Edit / Delete */}
                  <div className="flex gap-1">
                    <button onClick={() => navigate(`/goods/${g.id}`)} className="flex-1 py-1.5 text-xs text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors">{t('common.view')}</button>
                    <button onClick={() => { setEditItem(g); setShowForm(true) }} className="flex-1 py-1.5 text-xs text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-lg transition-colors">{t('common.edit')}</button>
                    {isOrgAdmin(role) && (
                      <button onClick={() => handleDelete(g.id)} className="flex-1 py-1.5 text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">{t('common.delete')}</button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Manifest Modal */}
      {showManifest && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700">
              <h2 className="font-semibold text-gray-900 dark:text-white">{t('goods.manifest')}</h2>
              <button onClick={() => setShowManifest(false)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-5">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('goods.agent')}</label>
                <select value={manifestAgentId} onChange={e => setManifestAgentId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm">
                  {agents.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </div>
              {manifestAgent && (
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 mb-4">
                  <p className="font-semibold text-gray-900 dark:text-white">{manifestAgent.name}</p>
                  <div className="grid grid-cols-3 gap-3 mt-2">
                    <div className="text-center">
                      <p className="text-xl font-bold text-blue-600">{manifestGoods.length}</p>
                      <p className="text-xs text-gray-500">{t('goods.goodsCount')}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xl font-bold text-green-600">{manifestGoods.reduce((s, g) => s + g.quantity, 0)}</p>
                      <p className="text-xs text-gray-500">{t('goods.totalQuantity')}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xl font-bold text-amber-600">{manifestGoods.filter(g => g.status === 'delayed').length}</p>
                      <p className="text-xs text-gray-500">{t('dashboard.delayedGoods')}</p>
                    </div>
                  </div>
                </div>
              )}
              <div className="space-y-2">
                {manifestGoods.length === 0
                  ? <p className="text-center py-8 text-gray-500 text-sm">{t('goods.noGoods')}</p>
                  : manifestGoods.map(g => (
                    <div key={g.id} className="flex items-center justify-between p-3 rounded-xl border border-gray-200 dark:border-gray-700">
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{g.description}</p>
                        <p className="text-xs text-gray-500">{g.trackingNumber} · {g.quantity} {t('goods.pieces')}</p>
                      </div>
                      <StatusBadge status={g.status} type="goods" label={t(`goods.statuses.${g.status}`)} size="sm" />
                    </div>
                  ))
                }
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <GoodsForm
          initial={editItem || undefined}
          agents={agents}
          onSave={handleSave}
          onCancel={() => { setShowForm(false); setEditItem(null) }}
          onStatusChange={editItem ? handleStatusChange : undefined}
          t={t}
          language={language}
          role={role}
        />
      )}

      {/* Receipt Modal */}
      {receiptGoods && (
        <ReceiptModal
          goods={receiptGoods}
          agent={agents.find(a => a.id === receiptGoods.agentId)}
          defaultType={receiptType}
          onClose={() => setReceiptGoods(null)}
        />
      )}

      {qrModal && (
        <GoodsQrModal
          token={qrModal.token}
          trackingNumber={qrModal.trackingNumber}
          description={qrModal.description}
          onClose={() => setQrModal(null)}
        />
      )}
    </div>
  )
}
