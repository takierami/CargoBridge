import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router'
import { Plus, Search, Users, Star, Package, X, Pencil, Trash2, Eye } from 'lucide-react'
import { toast } from 'sonner'
import { useAppStore } from '../../../store/appStore'
import { StatusBadge } from '../ui/StatusBadge'
import { cn } from '../../utils/cn'
import type { Agent, AgentStatus } from '../../../types'

const ALL_STATUSES: AgentStatus[] = ['active', 'traveling', 'delivered', 'delayed', 'inactive']

function AgentForm({ initial, onSave, onCancel, t }: {
  initial?: Partial<Agent>; onSave: (data: any) => void; onCancel: () => void
  t: ReturnType<typeof useAppStore>['t']
}) {
  const [form, setForm] = useState({
    name: initial?.name || '',
    nameFr: initial?.nameFr || '',
    phone: initial?.phone || '',
    passport: initial?.passport || '',
    country: initial?.country || 'الجزائر',
    status: initial?.status || 'active',
    reliabilityScore: initial?.reliabilityScore || 80,
    totalDeliveries: initial?.totalDeliveries || 0,
    delayedDeliveries: initial?.delayedDeliveries || 0,
    notes: initial?.notes || '',
  })
  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }))

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700">
          <h2 className="font-semibold text-gray-900 dark:text-white">
            {initial?.id ? t('agents.editAgent') : t('agents.addAgent')}
          </h2>
          <button onClick={onCancel} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('agents.fullName')} * (عربي)</label>
              <input value={form.name} onChange={e => set('name', e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nom (Français)</label>
              <input value={form.nameFr} onChange={e => set('nameFr', e.target.value)} dir="ltr"
                placeholder="ex: Ahmed Ben Ali"
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('agents.phone')}</label>
              <input value={form.phone} onChange={e => set('phone', e.target.value)} dir="ltr"
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('agents.passport')}</label>
              <input value={form.passport} onChange={e => set('passport', e.target.value)} dir="ltr"
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('agents.country')}</label>
              <input value={form.country} onChange={e => set('country', e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('agents.status')}</label>
              <select value={form.status} onChange={e => set('status', e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500">
                {ALL_STATUSES.map(s => <option key={s} value={s}>{t(`agents.statuses.${s}`)}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('agents.reliabilityScore')}: {form.reliabilityScore}%
            </label>
            <input type="range" min="0" max="100" value={form.reliabilityScore} onChange={e => set('reliabilityScore', Number(e.target.value))}
              className="w-full accent-blue-600" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('agents.totalDeliveries')}</label>
              <input type="number" min="0" value={form.totalDeliveries} onChange={e => set('totalDeliveries', Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('agents.delayedDeliveries')}</label>
              <input type="number" min="0" value={form.delayedDeliveries} onChange={e => set('delayedDeliveries', Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('common.notes')}</label>
            <textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={2}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 resize-none" />
          </div>
        </div>
        <div className="flex gap-3 p-5 border-t border-gray-200 dark:border-gray-700">
          <button onClick={() => { if (!form.name.trim()) return; onSave(form) }}
            className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors">
            {t('common.save')}
          </button>
          <button onClick={onCancel}
            className="flex-1 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium transition-colors">
            {t('common.cancel')}
          </button>
        </div>
      </div>
    </div>
  )
}

export function Agents() {
  const { t, language, agents, goods, addAgent, updateAgent, deleteAgent } = useAppStore()
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [showForm, setShowForm] = useState(false)
  const [editItem, setEditItem] = useState<Agent | null>(null)

  const filtered = useMemo(() =>
    agents.filter(a => {
      const matchSearch = !search || a.name.toLowerCase().includes(search.toLowerCase())
      const matchStatus = statusFilter === 'all' || a.status === statusFilter
      return matchSearch && matchStatus
    }),
  [agents, search, statusFilter])

  const getAgentGoodsCount = (agentId: string) =>
    goods.filter(g => g.agentId === agentId).length

  const handleSave = (data: any) => {
    if (editItem) {
      updateAgent(editItem.id, data)
    } else {
      addAgent(data)
    }
    toast.success(t('common.success'))
    setShowForm(false)
    setEditItem(null)
  }

  const handleDelete = (id: string) => {
    if (confirm(t('common.confirm'))) {
      deleteAgent(id)
      toast.success(t('common.success'))
    }
  }

  const scoreColor = (score: number) =>
    score >= 90 ? 'text-green-600' : score >= 75 ? 'text-amber-600' : 'text-red-600'

  const scoreBg = (score: number) =>
    score >= 90 ? 'bg-green-500' : score >= 75 ? 'bg-amber-500' : 'bg-red-500'

  return (
    <div className="p-4 lg:p-6 space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">{t('agents.title')}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">{filtered.length} {t('common.records')}</p>
        </div>
        <button
          onClick={() => { setEditItem(null); setShowForm(true) }}
          className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          {t('agents.addAgent')}
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={t('agents.searchPlaceholder')}
            className="w-full ps-9 pe-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm focus:ring-2 focus:ring-blue-500">
          <option value="all">{t('common.all')}</option>
          {ALL_STATUSES.map(s => <option key={s} value={s}>{t(`agents.statuses.${s}`)}</option>)}
        </select>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-500 dark:text-gray-400">
          <Users className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p>{t('agents.noAgents')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((agent) => (
            <div key={agent.id} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 hover:shadow-md transition-shadow">
              {/* Avatar + Status */}
              <div className="flex items-start justify-between mb-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-xl">
                  {agent.name.charAt(0)}
                </div>
                <StatusBadge status={agent.status} type="agent" label={t(`agents.statuses.${agent.status}`)} size="sm" />
              </div>

              {/* Name */}
              <h3 className="font-semibold text-gray-900 dark:text-white">{agent.name}</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-mono mt-0.5">{agent.passport}</p>

              {/* Reliability */}
              <div className="mt-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-gray-500">{t('agents.reliabilityScore')}</span>
                  <span className={cn('text-xs font-bold', scoreColor(agent.reliabilityScore))}>
                    {agent.reliabilityScore}%
                  </span>
                </div>
                <div className="h-1.5 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                  <div className={cn('h-full rounded-full', scoreBg(agent.reliabilityScore))} style={{ width: `${agent.reliabilityScore}%` }} />
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-2 mt-3">
                <div className="text-center">
                  <p className="text-base font-bold text-gray-900 dark:text-white">{agent.totalDeliveries}</p>
                  <p className="text-[10px] text-gray-500">{t('agents.totalDeliveries')}</p>
                </div>
                <div className="text-center">
                  <p className="text-base font-bold text-red-600">{agent.delayedDeliveries}</p>
                  <p className="text-[10px] text-gray-500">{t('agents.delayedDeliveries')}</p>
                </div>
                <div className="text-center">
                  <p className="text-base font-bold text-blue-600">{getAgentGoodsCount(agent.id)}</p>
                  <p className="text-[10px] text-gray-500">{t('goods.goodsCount')}</p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-1 mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                <button onClick={() => navigate(`/agents/${agent.id}`)} className="flex-1 flex items-center justify-center gap-1 py-1.5 text-xs text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors">
                  <Eye className="w-3 h-3" />{t('common.view')}
                </button>
                <button onClick={() => { setEditItem(agent); setShowForm(true) }} className="flex-1 flex items-center justify-center gap-1 py-1.5 text-xs text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-lg transition-colors">
                  <Pencil className="w-3 h-3" />{t('common.edit')}
                </button>
                <button onClick={() => handleDelete(agent.id)} className="flex-1 flex items-center justify-center gap-1 py-1.5 text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                  <Trash2 className="w-3 h-3" />{t('common.delete')}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <AgentForm
          initial={editItem || undefined}
          onSave={handleSave}
          onCancel={() => { setShowForm(false); setEditItem(null) }}
          t={t}
        />
      )}
    </div>
  )
}
