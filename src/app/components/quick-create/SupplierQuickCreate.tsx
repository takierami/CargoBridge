import { useState } from 'react'
import { X } from 'lucide-react'
import { toast } from 'sonner'
import { useAppStore } from '../../../store/appStore'
import { DEFAULT_TRANSACTION_CURRENCY, currenciesForSelect } from '../../../lib/currencies'

export type SupplierQuickPayload = {
  name: string
  nameFr: string
  country: string
  city: string
  preferredCurrency: string
  status: 'active'
  phones: { label: string; number: string }[]
  categories: []
  email: string
  whatsapp: string
  wechat: string
  website: string
  address: string
  primaryContact: string
  secondaryContact: string
  paymentPreferences: string
  leadTimeDays: number
  minimumOrderQty: number
  businessNotes: string
}

type Props = {
  onSave: (data: SupplierQuickPayload) => void | Promise<void>
  onCancel: () => void
  nested?: boolean
}

export function SupplierQuickCreate({ onSave, onCancel, nested }: Props) {
  const t = useAppStore(s => s.t)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    name: '',
    nameFr: '',
    country: '',
    city: '',
    preferredCurrency: DEFAULT_TRANSACTION_CURRENCY,
  })
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error(t('suppliers.supplierName') + ' *')
      return
    }
    if (saving) return
    setSaving(true)
    try {
      await onSave({
        name: form.name.trim(),
        nameFr: form.nameFr.trim(),
        country: form.country.trim(),
        city: form.city.trim(),
        preferredCurrency: form.preferredCurrency,
        status: 'active',
        phones: [],
        categories: [],
        email: '',
        whatsapp: '',
        wechat: '',
        website: '',
        address: '',
        primaryContact: '',
        secondaryContact: '',
        paymentPreferences: '',
        leadTimeDays: 0,
        minimumOrderQty: 0,
        businessNotes: '',
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className={`fixed inset-0 bg-black/50 ${nested ? 'z-[60]' : 'z-50'} flex items-center justify-center p-4`}>
      <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700">
          <h2 className="font-semibold text-gray-900 dark:text-white">{t('common.addNew')} — {t('suppliers.addSupplier')}</h2>
          <button type="button" onClick={onCancel} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('suppliers.supplierName')} *</label>
            <input value={form.name} onChange={e => set('name', e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nom (Français)</label>
            <input value={form.nameFr} onChange={e => set('nameFr', e.target.value)} dir="ltr"
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('suppliers.country')}</label>
              <input value={form.country} onChange={e => set('country', e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('suppliers.city')}</label>
              <input value={form.city} onChange={e => set('city', e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('suppliers.currency')}</label>
            <select value={form.preferredCurrency} onChange={e => set('preferredCurrency', e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500">
              {currenciesForSelect(form.preferredCurrency).map(c => (
                <option key={c.code} value={c.code}>{c.code}</option>
              ))}
            </select>
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
