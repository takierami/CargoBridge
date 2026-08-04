import { useState } from 'react'
import { X } from 'lucide-react'
import { toast } from 'sonner'
import { useAppStore } from '../../../store/appStore'
import { currencyService } from '../../../services/currencyService'

type Props = {
  onSave: (code: string) => void | Promise<void>
  onCancel: () => void
  nested?: boolean
}

export function CurrencyQuickCreate({ onSave, onCancel, nested }: Props) {
  const t = useAppStore(s => s.t)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    code: '',
    name: '',
    nameFr: '',
    symbol: '',
    rateToBase: 1,
  })
  const set = (k: string, v: string | number) => setForm(f => ({ ...f, [k]: v }))

  const handleSave = async () => {
    if (!form.code.trim() || !form.name.trim() || saving) {
      toast.error(t('common.required'))
      return
    }
    setSaving(true)
    try {
      const result = await currencyService.create({
        code: form.code.trim().toUpperCase(),
        name: form.name.trim(),
        nameFr: form.nameFr.trim() || form.name.trim(),
        symbol: form.symbol.trim() || form.code.trim().toUpperCase(),
        rateToBase: Number(form.rateToBase) || 1,
        isBase: false,
        isEnabled: true,
        isDefault: false,
      })
      if ('error' in result) {
        toast.error(result.error)
        return
      }
      await onSave(result.code)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className={`fixed inset-0 bg-black/50 ${nested ? 'z-[70]' : 'z-[60]'} flex items-center justify-center p-4`}>
      <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700">
          <h2 className="font-semibold text-gray-900 dark:text-white">{t('calculator.addCurrency')}</h2>
          <button type="button" onClick={onCancel} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('calculator.currencyCode')} *</label>
              <input value={form.code} onChange={e => set('code', e.target.value.toUpperCase())} dir="ltr"
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm font-mono focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('calculator.currencySymbol')}</label>
              <input value={form.symbol} onChange={e => set('symbol', e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('calculator.currencyName')} (AR) *</label>
            <input value={form.name} onChange={e => set('name', e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('calculator.currencyName')} (FR)</label>
            <input value={form.nameFr} onChange={e => set('nameFr', e.target.value)} dir="ltr"
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('calculator.rateVsDzd')}</label>
            <input type="number" min="0.0001" step="0.01" value={form.rateToBase} onChange={e => set('rateToBase', Number(e.target.value) || 1)}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500" />
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
