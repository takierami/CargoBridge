import { useState } from 'react'
import { X } from 'lucide-react'
import { useAppStore } from '../../../store/appStore'
import { DEFAULT_TRANSACTION_CURRENCY, currenciesForSelect } from '../../../lib/currencies'
import type { SupplierProduct } from '../../../types'

export type ProductQuickPayload = Omit<SupplierProduct, 'id' | 'supplierId' | 'createdAt' | 'updatedAt'>

type Props = {
  initial?: Partial<SupplierProduct>
  onSave: (data: ProductQuickPayload) => void | Promise<void>
  onCancel: () => void
  nested?: boolean
}

export function ProductQuickCreate({ initial, onSave, onCancel, nested }: Props) {
  const t = useAppStore(s => s.t)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    name: initial?.name || '',
    category: initial?.category || '',
    sku: initial?.sku || '',
    unitCost: initial?.unitCost || 0,
    currency: initial?.currency || DEFAULT_TRANSACTION_CURRENCY,
    notes: initial?.notes || '',
  })
  const set = (k: string, v: unknown) => setForm(f => ({ ...f, [k]: v }))

  const handleSave = async () => {
    if (!form.name.trim() || !form.category.trim() || saving) return
    setSaving(true)
    try {
      await onSave({
        name: form.name.trim(),
        category: form.category.trim(),
        sku: form.sku.trim(),
        unitCost: Number(form.unitCost) || 0,
        currency: form.currency,
        notes: form.notes.trim(),
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className={`fixed inset-0 bg-black/50 ${nested ? 'z-[60]' : 'z-50'} flex items-center justify-center p-4`}>
      <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700">
          <h2 className="font-semibold text-gray-900 dark:text-white">
            {initial?.id ? t('suppliers.editProduct') : t('suppliers.addProduct')}
          </h2>
          <button type="button" onClick={onCancel} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('suppliers.productName')} *</label>
            <input value={form.name} onChange={e => set('name', e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('goods.category')} *</label>
            <input value={form.category} onChange={e => set('category', e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('suppliers.sku')}</label>
              <input value={form.sku} onChange={e => set('sku', e.target.value)} dir="ltr"
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('suppliers.currency')}</label>
              <select value={form.currency} onChange={e => set('currency', e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500">
                {currenciesForSelect(form.currency).map(c => (
                  <option key={c.code} value={c.code}>{c.code}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('suppliers.unitCost')}</label>
            <input type="number" min="0" step="0.01" value={form.unitCost} onChange={e => set('unitCost', Number(e.target.value))}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('common.notes')}</label>
            <textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={2}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 resize-none" />
          </div>
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
