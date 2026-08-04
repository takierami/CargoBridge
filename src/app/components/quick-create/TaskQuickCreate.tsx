import { useState } from 'react'
import { X } from 'lucide-react'
import { toast } from 'sonner'
import { useAppStore } from '../../../store/appStore'
import type { SupplierTask } from '../../../types'

export type TaskQuickPayload = {
  supplierId: string
  title: string
  description: string
  dueDate: string
  status: 'pending' | 'completed'
  priority: 'low' | 'medium' | 'high'
}

type Props = {
  initial?: Partial<SupplierTask>
  defaultSupplierId?: string
  onSave: (data: TaskQuickPayload) => void | Promise<void>
  onCancel: () => void
  nested?: boolean
  /** Hide supplier picker when locked to a profile */
  lockSupplier?: boolean
}

export function TaskQuickCreate({ initial, defaultSupplierId, onSave, onCancel, nested, lockSupplier }: Props) {
  const t = useAppStore(s => s.t)
  const suppliers = useAppStore(s => s.suppliers)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    supplierId: initial?.supplierId || defaultSupplierId || '',
    title: initial?.title || '',
    description: initial?.description || '',
    dueDate: initial?.dueDate || '',
    status: (initial?.status || 'pending') as 'pending' | 'completed',
    priority: (initial?.priority || 'medium') as 'low' | 'medium' | 'high',
  })

  const handleSave = async () => {
    if (!form.supplierId || !form.title.trim() || !form.dueDate) {
      toast.error(t('common.required'))
      return
    }
    if (saving) return
    setSaving(true)
    try {
      await onSave({
        ...form,
        title: form.title.trim(),
        description: form.description.trim(),
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className={`fixed inset-0 bg-black/50 ${nested ? 'z-[60]' : 'z-50'} flex items-center justify-center p-4`}>
      <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700">
          <h2 className="font-semibold text-gray-900 dark:text-white">
            {initial?.id ? t('suppliers.editTask') : t('suppliers.addTask')}
          </h2>
          <button type="button" onClick={onCancel} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-5 space-y-4">
          {!lockSupplier && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('suppliers.selectSupplier')} *</label>
              <select
                value={form.supplierId}
                onChange={e => setForm(f => ({ ...f, supplierId: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500"
              >
                <option value="">{t('suppliers.selectSupplier')}</option>
                {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('suppliers.taskTitle')} *</label>
            <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('suppliers.taskDescription')}</label>
            <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('suppliers.dueDate')} *</label>
              <input type="date" value={form.dueDate} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('suppliers.priority')}</label>
              <select value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value as 'low' | 'medium' | 'high' }))}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500">
                <option value="low">{t('suppliers.priorityLow')}</option>
                <option value="medium">{t('suppliers.priorityMedium')}</option>
                <option value="high">{t('suppliers.priorityHigh')}</option>
              </select>
            </div>
          </div>
          {initial?.id && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('suppliers.status')}</label>
              <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as 'pending' | 'completed' }))}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500">
                <option value="pending">{t('suppliers.taskPending')}</option>
                <option value="completed">{t('suppliers.taskCompleted')}</option>
              </select>
            </div>
          )}
        </div>
        <div className="flex gap-3 p-5 border-t border-gray-200 dark:border-gray-700">
          <button type="button" disabled={saving} onClick={() => void handleSave()}
            className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium disabled:opacity-50">
            {t('common.save')}
          </button>
          <button type="button" onClick={onCancel}
            className="flex-1 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium">
            {t('common.cancel')}
          </button>
        </div>
      </div>
    </div>
  )
}
