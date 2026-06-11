import { useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router'
import { ArrowRight } from 'lucide-react'
import { toast } from 'sonner'
import { useAppStore } from '../../../store/appStore'

export function TaskForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const supplierIdParam = searchParams.get('supplierId')
  const { t, suppliers, supplierTasks, addSupplierTask, updateSupplierTask } = useAppStore()
  const isEdit = Boolean(id)
  const existing = isEdit ? supplierTasks.find(t => t.id === id) : null

  const [form, setForm] = useState({
    supplierId: existing?.supplierId || supplierIdParam || '',
    title: existing?.title || '',
    description: existing?.description || '',
    dueDate: existing?.dueDate || '',
    status: existing?.status || 'pending' as const,
    priority: existing?.priority || 'medium' as const,
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.supplierId || !form.title || !form.dueDate) {
      toast.error(t('common.required'))
      return
    }
    if (isEdit && id) {
      updateSupplierTask(id, form)
    } else {
      addSupplierTask(form)
    }
    toast.success(t('common.success'))
    navigate('/suppliers/tasks')
  }

  return (
    <div className="p-4 lg:p-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/suppliers/tasks')} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
          <ArrowRight className="w-5 h-5 text-gray-500" />
        </button>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">
          {isEdit ? t('suppliers.editTask') : t('suppliers.addTask')}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('suppliers.selectSupplier')} *</label>
          <select value={form.supplierId} onChange={e => setForm({ ...form, supplierId: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500">
            <option value="">{t('suppliers.selectSupplier')}</option>
            {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('suppliers.taskTitle')} *</label>
          <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('suppliers.taskDescription')}</label>
          <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3} className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('suppliers.dueDate')} *</label>
            <input type="date" value={form.dueDate} onChange={e => setForm({ ...form, dueDate: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('suppliers.priority')}</label>
            <select value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value as any })} className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500">
              <option value="low">{t('suppliers.priorityLow')}</option>
              <option value="medium">{t('suppliers.priorityMedium')}</option>
              <option value="high">{t('suppliers.priorityHigh')}</option>
            </select>
          </div>
        </div>

        {isEdit && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('suppliers.status')}</label>
            <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value as any })} className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500">
              <option value="pending">{t('suppliers.taskPending')}</option>
              <option value="completed">{t('suppliers.taskCompleted')}</option>
            </select>
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <button type="submit" className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors">
            {t('common.save')}
          </button>
          <button type="button" onClick={() => navigate('/suppliers/tasks')} className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
            {t('common.cancel')}
          </button>
        </div>
      </form>
    </div>
  )
}