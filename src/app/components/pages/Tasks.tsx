import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router'
import { Plus, Search, X, CheckCircle, Trash2, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'
import { useAppStore } from '../../../store/appStore'
import { cn } from '../../utils/cn'
import { taskService, isOverdue } from '../../../services/taskService'
import type { SupplierTask, TaskStatus } from '../../../types'

const TASK_STATUSES: TaskStatus[] = ['pending', 'completed']

export function Tasks() {
  const { t, language, supplierTasks, suppliers, addSupplierTask, updateSupplierTask, markTaskComplete, deleteSupplierTask } = useAppStore()
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [supplierFilter, setSupplierFilter] = useState<string>('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [showOverdueOnly, setShowOverdueOnly] = useState(false)

  const filtered = useMemo(() => {
    const today = new Date().toISOString().split('T')[0]
    return supplierTasks.filter(task => {
      if (task.isDeleted) return false
      const matchSearch = !search || task.title.toLowerCase().includes(search.toLowerCase())
      const matchStatus = statusFilter === 'all' || task.status === statusFilter
      const matchSupplier = supplierFilter === 'all' || task.supplierId === supplierFilter
      const matchDateFrom = !dateFrom || task.dueDate >= dateFrom
      const matchDateTo = !dateTo || task.dueDate <= dateTo
      const matchOverdue = !showOverdueOnly || (task.status === 'pending' && task.dueDate < today)
      return matchSearch && matchStatus && matchSupplier && matchDateFrom && matchDateTo && matchOverdue
    })
  }, [supplierTasks, search, statusFilter, supplierFilter, dateFrom, dateTo, showOverdueOnly])

  const getSupplierName = (supplierId?: string) => {
    if (!supplierId) return '—'
    const supplier = suppliers.find(s => s.id === supplierId)
    return supplier ? supplier.name : '—'
  }

  const handleMarkComplete = (id: string) => {
    markTaskComplete(id)
    toast.success(t('suppliers.taskCompleted'))
  }

  const handleDelete = (id: string) => {
    if (confirm(t('suppliers.confirmDelete'))) {
      deleteSupplierTask(id)
      toast.success(t('common.success'))
    }
  }

  const taskStatusColor = (task: SupplierTask) => {
    if (isOverdue(task)) return 'text-red-600 bg-red-50 dark:bg-red-900/20'
    if (task.status === 'completed') return 'text-green-600 bg-green-50 dark:bg-green-900/20'
    return ''
  }

  return (
    <div className="p-4 lg:p-6 space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">{t('suppliers.tasks')}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">{filtered.length} {t('common.records')}</p>
        </div>
        <button onClick={() => navigate('/suppliers/tasks/new')} className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors">
          <Plus className="w-4 h-4" /> {t('suppliers.addTask')}
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-4 space-y-4">
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder={t('suppliers.searchPlaceholder')} className="w-full ps-9 pe-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
          </div>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm focus:ring-2 focus:ring-blue-500">
            <option value="all">{t('suppliers.allTasks')}</option>
            <option value="pending">{t('suppliers.pendingTasks')}</option>
            <option value="completed">{t('suppliers.taskCompleted')}</option>
          </select>
          <select value={supplierFilter} onChange={e => setSupplierFilter(e.target.value)} className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm focus:ring-2 focus:ring-blue-500">
            <option value="all">{t('suppliers.selectSupplier')}</option>
            {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <button onClick={() => setShowOverdueOnly(!showOverdueOnly)} className={cn('px-3 py-2 rounded-lg border text-sm transition-colors', showOverdueOnly ? 'bg-red-100 border-red-300 text-red-700 dark:bg-red-900/20 dark:border-red-700 dark:text-red-300' : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700')}>
            <AlertTriangle className="w-4 h-4 inline me-1" /> {t('suppliers.overdueTasks')}
          </button>
        </div>
        <div className="flex flex-wrap gap-3">
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500" placeholder={t('suppliers.statementFrom')} />
          <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500" placeholder={t('suppliers.statementTo')} />
          {(statusFilter !== 'all' || supplierFilter !== 'all' || dateFrom || dateTo || showOverdueOnly) && (
            <button onClick={() => { setStatusFilter('all'); setSupplierFilter('all'); setDateFrom(''); setDateTo(''); setShowOverdueOnly(false) }} className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 flex items-center gap-1">
              <X className="w-3.5 h-3.5" /> {t('common.clear')}
            </button>
          )}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-500 dark:text-gray-400"><p>{t('suppliers.noTasks')}</p></div>
      ) : (
        <div className="space-y-3">
          {filtered.map(task => (
            <div key={task.id} className={cn('bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-4', taskStatusColor(task))}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-medium text-gray-900 dark:text-white truncate">{task.title}</h3>
                    <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium', task.status === 'completed' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' : isOverdue(task) ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300')}>
                      {task.status === 'completed' ? t('suppliers.taskCompleted') : isOverdue(task) ? t('suppliers.taskOverdue') : t('suppliers.taskPending')}
                    </span>
                  </div>
                  {task.description && <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mb-2">{task.description}</p>}
                  <div className="flex flex-wrap gap-4 text-xs text-gray-500">
                    <span>{t('suppliers.dueDate')}: {task.dueDate}</span>
                    <span>{t('suppliers.supplierName')}: {getSupplierName(task.supplierId)}</span>
                    {task.completedAt && <span className="text-green-600">{t('suppliers.taskCompleted')}: {task.completedAt.split('T')[0]}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {task.status !== 'completed' && (
                    <button onClick={() => handleMarkComplete(task.id)} className="p-1.5 text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg" title={t('suppliers.markComplete')}>
                      <CheckCircle className="w-4 h-4" />
                    </button>
                  )}
                  <button onClick={() => navigate('/suppliers/tasks/' + task.id)} className="p-1.5 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg">
                    <X className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(task.id)} className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}