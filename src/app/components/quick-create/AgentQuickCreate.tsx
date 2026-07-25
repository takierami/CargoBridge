import { useState } from 'react'
import { X } from 'lucide-react'
import { useAppStore } from '../../../store/appStore'
import type { Agent, AgentStatus } from '../../../types'

const ALL_STATUSES: AgentStatus[] = ['active', 'traveling', 'delivered', 'delayed', 'inactive']

export type AgentFormPayload = {
  name: string
  nameFr: string
  phone: string
  passport: string
  country: string
  status: AgentStatus
  notes: string
}

type Props = {
  initial?: Partial<Agent>
  onSave: (data: AgentFormPayload) => void | Promise<void>
  onCancel: () => void
  /** Raise z-index when nested above another modal */
  nested?: boolean
}

export function AgentQuickCreate({ initial, onSave, onCancel, nested }: Props) {
  const t = useAppStore(s => s.t)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    name: initial?.name || '',
    nameFr: initial?.nameFr || '',
    phone: initial?.phone || '',
    passport: initial?.passport || '',
    country: initial?.country || 'الجزائر',
    status: (initial?.status || 'active') as AgentStatus,
    notes: initial?.notes || '',
  })
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const handleSave = async () => {
    if (!form.name.trim() || !form.phone.trim() || !form.passport.trim() || saving) return
    setSaving(true)
    try {
      await onSave({
        ...form,
        name: form.name.trim(),
        nameFr: form.nameFr.trim(),
        phone: form.phone.trim(),
        passport: form.passport.trim(),
        country: form.country.trim(),
        notes: form.notes.trim(),
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className={`fixed inset-0 bg-black/50 ${nested ? 'z-[60]' : 'z-50'} flex items-center justify-center p-4`}>
      <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700">
          <h2 className="font-semibold text-gray-900 dark:text-white">
            {initial?.id ? t('agents.editAgent') : t('agents.addAgent')}
          </h2>
          <button type="button" onClick={onCancel} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('agents.fullName')} *</label>
              <input value={form.name} onChange={e => set('name', e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nom (Français)</label>
              <input value={form.nameFr} onChange={e => set('nameFr', e.target.value)} dir="ltr"
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('agents.phone')} *</label>
              <input value={form.phone} onChange={e => set('phone', e.target.value)} dir="ltr"
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('agents.passport')} *</label>
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
            className="flex-1 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium">
            {t('common.cancel')}
          </button>
        </div>
      </div>
    </div>
  )
}
