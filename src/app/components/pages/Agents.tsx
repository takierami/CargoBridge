import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router'
import { Plus, Search, Users, Pencil, Trash2, Eye } from 'lucide-react'
import { toast } from 'sonner'
import { useAppStore } from '../../../store/appStore'
import { StatusBadge } from '../ui/StatusBadge'
import { cn } from '../../utils/cn'
import { AgentForm } from '../agents/AgentForm'
import type { Agent, AgentEmploymentStatus, AgentType } from '../../../types'
import { parseTaxRate } from '../../../utils/agentTax'

export function Agents() {
  const { t, language, agents, goods, addAgent, updateAgent, deleteAgent } = useAppStore()
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [showForm, setShowForm] = useState(false)
  const [editItem, setEditItem] = useState<Agent | null>(null)

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return agents.filter(a => {
      const matchSearch =
        !q ||
        [a.name, a.nameFr, a.nameEn, a.code, a.companyName, a.phone, a.passport, a.email, a.whatsapp]
          .some(v => (v || '').toLowerCase().includes(q))
      const emp = a.employmentStatus || (a.status === 'inactive' ? 'inactive' : 'active')
      const matchStatus = statusFilter === 'all' || emp === statusFilter
      const matchType = typeFilter === 'all' || (a.agentType || 'standard') === typeFilter
      return matchSearch && matchStatus && matchType
    })
  }, [agents, search, statusFilter, typeFilter])

  const getAgentGoodsCount = (agentId: string) =>
    goods.filter(g => g.agentId === agentId).length

  const displayName = (a: Agent) =>
    language === 'fr' && a.nameFr ? a.nameFr : a.name

  const handleSave = async (data: Record<string, unknown>) => {
    try {
      if (editItem) {
        await updateAgent(editItem.id, data as Partial<Agent>)
      } else {
        await addAgent(data as Omit<Agent, 'id' | 'createdAt'>)
      }
      toast.success(t('common.success'))
      setShowForm(false)
      setEditItem(null)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('common.error'))
      throw err
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm(t('common.confirm'))) return
    try {
      await deleteAgent(id)
      toast.success(t('common.success'))
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('common.error'))
    }
  }

  const scoreColor = (score: number) =>
    score >= 90 ? 'text-green-600' : score >= 75 ? 'text-amber-600' : 'text-red-600'

  const scoreBg = (score: number) =>
    score >= 90 ? 'bg-green-500' : score >= 75 ? 'bg-amber-500' : 'bg-red-500'

  const employmentLabel = (a: Agent) => {
    const emp = (a.employmentStatus || (a.status === 'inactive' ? 'inactive' : 'active')) as AgentEmploymentStatus
    return t(`agents.employmentStatuses.${emp}`)
  }

  return (
    <div className="p-4 lg:p-6 space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold text-gray-900 dark:text-white sm:text-xl">{t('agents.title')}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">{filtered.length} {t('common.records')}</p>
        </div>
        <button
          onClick={() => { setEditItem(null); setShowForm(true) }}
          className="inline-flex min-h-11 items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          {t('agents.addAgent')}
        </button>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={t('agents.searchPlaceholder')}
            className="w-full ps-9 pe-3 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-base sm:text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="min-h-11 px-3 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-base sm:text-sm focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">{t('common.all')}</option>
          {(['active', 'inactive', 'suspended'] as AgentEmploymentStatus[]).map(s => (
            <option key={s} value={s}>{t(`agents.employmentStatuses.${s}`)}</option>
          ))}
        </select>
        <select
          value={typeFilter}
          onChange={e => setTypeFilter(e.target.value)}
          className="min-h-11 px-3 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-base sm:text-sm focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">{t('agents.allTypes')}</option>
          {(['standard', 'auto_entrepreneur'] as AgentType[]).map(s => (
            <option key={s} value={s}>{t(`agents.types.${s}`)}</option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-500 dark:text-gray-400">
          <Users className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p>{t('agents.noAgents')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map(agent => (
            <div
              key={agent.id}
              className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xl">
                  {displayName(agent).charAt(0)}
                </div>
                <div className="flex flex-col items-end gap-1">
                  <StatusBadge
                    status={agent.employmentStatus === 'inactive' ? 'inactive' : 'active'}
                    type="agent"
                    label={employmentLabel(agent)}
                    size="sm"
                  />
                  {agent.agentType === 'auto_entrepreneur' && (
                    <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200">
                      {t('agents.types.auto_entrepreneur')}
                      {parseTaxRate(agent.effectiveTaxRate) > 0
                        ? ` ${parseTaxRate(agent.effectiveTaxRate)}%`
                        : ''}
                    </span>
                  )}
                </div>
              </div>

              <h3 className="font-semibold text-gray-900 dark:text-white">{displayName(agent)}</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-mono mt-0.5">
                {agent.code ? `${agent.code} · ` : ''}{agent.passport}
              </p>
              {agent.companyName && (
                <p className="text-xs text-gray-500 mt-0.5 truncate">{agent.companyName}</p>
              )}

              <div className="mt-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-gray-500">{t('agents.reliabilityScore')}</span>
                  <span className={cn('text-xs font-bold', scoreColor(agent.reliabilityScore))}>
                    {agent.reliabilityScore}%
                  </span>
                </div>
                <div className="h-1.5 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                  <div
                    className={cn('h-full rounded-full', scoreBg(agent.reliabilityScore))}
                    style={{ width: `${agent.reliabilityScore}%` }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 mt-3 sm:grid-cols-3">
                <div className="text-center">
                  <p className="text-base font-bold text-gray-900 dark:text-white">{agent.totalDeliveries}</p>
                  <p className="text-xs text-gray-500">{t('agents.totalDeliveries')}</p>
                </div>
                <div className="text-center">
                  <p className="text-base font-bold text-red-600">{agent.delayedDeliveries}</p>
                  <p className="text-xs text-gray-500">{t('agents.delayedDeliveries')}</p>
                </div>
                <div className="text-center col-span-2 sm:col-span-1">
                  <p className="text-base font-bold text-blue-600">{getAgentGoodsCount(agent.id)}</p>
                  <p className="text-xs text-gray-500">{t('goods.goodsCount')}</p>
                </div>
              </div>

              <div className="flex gap-1 mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                <button
                  onClick={() => navigate(`/agents/${agent.id}`)}
                  className="flex-1 min-h-11 flex items-center justify-center gap-1 py-2 text-xs text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                >
                  <Eye className="w-3 h-3" />{t('common.view')}
                </button>
                <button
                  onClick={() => { setEditItem(agent); setShowForm(true) }}
                  className="flex-1 min-h-11 flex items-center justify-center gap-1 py-2 text-xs text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-lg transition-colors"
                >
                  <Pencil className="w-3 h-3" />{t('common.edit')}
                </button>
                <button
                  onClick={() => void handleDelete(agent.id)}
                  className="flex-1 flex items-center justify-center gap-1 py-1.5 text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                >
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
        />
      )}
    </div>
  )
}
