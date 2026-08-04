import { useMemo, useState } from 'react'
import { X } from 'lucide-react'
import { useAppStore } from '../../../store/appStore'
import { applyAgentTax, parseTaxRate } from '../../../utils/agentTax'
import type {
  Agent,
  AgentEmploymentStatus,
  AgentPreferredChannel,
  AgentType,
} from '../../../types'
import { INPUT_TOUCH } from '../ui/responsive'

export type AgentFormTab = 'general' | 'contact' | 'address' | 'financial' | 'identity' | 'notes'

export type AgentFormPayload = {
  name: string
  nameFr: string
  nameEn: string
  companyName: string
  agentType: AgentType
  employmentStatus: AgentEmploymentStatus
  phone: string
  phoneAlt: string
  whatsapp: string
  email: string
  website: string
  preferredChannel: AgentPreferredChannel
  passport: string
  passportExpiry: string
  nationalId: string
  businessRegistrationNumber: string
  taxId: string
  country: string
  stateProvince: string
  city: string
  postalCode: string
  address: string
  preferredCurrency: string
  commissionRate: string
  taxRateOverride: string
  preferredPaymentMethod: string
  bankName: string
  bankAccount: string
  iban: string
  swift: string
  primaryTradeRegion: string
  yearsExperience: string
  notes: string
  internalNotes: string
  status: Agent['status']
}

const FULL_TABS: AgentFormTab[] = ['general', 'contact', 'address', 'financial', 'identity', 'notes']
const COMPACT_TABS: AgentFormTab[] = ['general', 'contact']

const inputCls = INPUT_TOUCH
const labelCls = 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'

function emptyForm(initial?: Partial<Agent>, defaultCountry = 'الجزائر'): AgentFormPayload {
  return {
    name: initial?.name || '',
    nameFr: initial?.nameFr || '',
    nameEn: initial?.nameEn || '',
    companyName: initial?.companyName || '',
    agentType: initial?.agentType || 'standard',
    employmentStatus: initial?.employmentStatus || 'active',
    phone: initial?.phone || '',
    phoneAlt: initial?.phoneAlt || '',
    whatsapp: initial?.whatsapp || '',
    email: initial?.email || '',
    website: initial?.website || '',
    preferredChannel: initial?.preferredChannel || 'phone',
    passport: initial?.passport || '',
    passportExpiry: initial?.passportExpiry ? String(initial.passportExpiry).slice(0, 10) : '',
    nationalId: initial?.nationalId || '',
    businessRegistrationNumber: initial?.businessRegistrationNumber || '',
    taxId: initial?.taxId || '',
    country: initial?.country || defaultCountry,
    stateProvince: initial?.stateProvince || '',
    city: initial?.city || '',
    postalCode: initial?.postalCode || '',
    address: initial?.address || '',
    preferredCurrency: initial?.preferredCurrency || 'DZD',
    commissionRate: initial?.commissionRate != null ? String(initial.commissionRate) : '',
    taxRateOverride: initial?.taxRateOverride != null ? String(initial.taxRateOverride) : '',
    preferredPaymentMethod: initial?.preferredPaymentMethod || '',
    bankName: initial?.bankName || '',
    bankAccount: initial?.bankAccount || '',
    iban: initial?.iban || '',
    swift: initial?.swift || '',
    primaryTradeRegion: initial?.primaryTradeRegion || '',
    yearsExperience: initial?.yearsExperience != null ? String(initial.yearsExperience) : '',
    notes: initial?.notes || '',
    internalNotes: initial?.internalNotes || '',
    status: initial?.status || 'active',
  }
}

function toApiPayload(form: AgentFormPayload) {
  const numOrNull = (v: string) => {
    const t = v.trim()
    if (!t) return null
    const n = parseFloat(t)
    return Number.isFinite(n) ? n : null
  }
  const intOrNull = (v: string) => {
    const t = v.trim()
    if (!t) return null
    const n = parseInt(t, 10)
    return Number.isFinite(n) ? n : null
  }
  return {
    name: form.name.trim(),
    nameFr: form.nameFr.trim(),
    nameEn: form.nameEn.trim(),
    companyName: form.companyName.trim(),
    agentType: form.agentType,
    employmentStatus: form.employmentStatus,
    phone: form.phone.trim(),
    phoneAlt: form.phoneAlt.trim(),
    whatsapp: form.whatsapp.trim(),
    email: form.email.trim(),
    website: form.website.trim(),
    preferredChannel: form.preferredChannel,
    passport: form.passport.trim(),
    passportExpiry: form.passportExpiry.trim() || null,
    nationalId: form.nationalId.trim(),
    businessRegistrationNumber: form.businessRegistrationNumber.trim(),
    taxId: form.taxId.trim(),
    country: form.country.trim(),
    stateProvince: form.stateProvince.trim(),
    city: form.city.trim(),
    postalCode: form.postalCode.trim(),
    address: form.address.trim(),
    preferredCurrency: form.preferredCurrency.trim() || 'DZD',
    commissionRate: numOrNull(form.commissionRate),
    taxRateOverride: numOrNull(form.taxRateOverride),
    preferredPaymentMethod: form.preferredPaymentMethod.trim(),
    bankName: form.bankName.trim(),
    bankAccount: form.bankAccount.trim(),
    iban: form.iban.trim(),
    swift: form.swift.trim(),
    primaryTradeRegion: form.primaryTradeRegion.trim(),
    yearsExperience: intOrNull(form.yearsExperience),
    notes: form.notes.trim(),
    internalNotes: form.internalNotes.trim(),
    // Keep legacy status in sync with employment for list badges until trip statuses leave Agent UI
    status: form.employmentStatus === 'inactive' ? 'inactive' : 'active',
  }
}

type Props = {
  initial?: Partial<Agent>
  onSave: (data: ReturnType<typeof toApiPayload>) => void | Promise<void>
  onCancel: () => void
  /** General+Contact only (Goods quick-create) */
  compact?: boolean
  nested?: boolean
  /** Preview tax % when no override (from org rules) */
  ruleTaxByType?: Partial<Record<AgentType, number>>
}

export function AgentForm({
  initial,
  onSave,
  onCancel,
  compact = false,
  nested = false,
  ruleTaxByType = { standard: 0, auto_entrepreneur: 5 },
}: Props) {
  const t = useAppStore(s => s.t)
  const tabs = compact ? COMPACT_TABS : FULL_TABS
  const [tab, setTab] = useState<AgentFormTab>('general')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState(() => emptyForm(initial))
  const set = <K extends keyof AgentFormPayload>(k: K, v: AgentFormPayload[K]) =>
    setForm(f => ({ ...f, [k]: v }))

  const previewRate = useMemo(() => {
    if (form.taxRateOverride.trim()) return parseTaxRate(form.taxRateOverride)
    return ruleTaxByType[form.agentType] ?? 0
  }, [form.agentType, form.taxRateOverride, ruleTaxByType])

  const taxPreview = useMemo(() => applyAgentTax(1000, previewRate), [previewRate])

  const handleSave = async () => {
    if (!form.name.trim() || !form.phone.trim() || !form.passport.trim() || !form.country.trim()) {
      setError(t('agents.validationRequired'))
      setTab('general')
      return
    }
    if (form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      setError(t('agents.validationEmail'))
      setTab('contact')
      return
    }
    setSaving(true)
    setError('')
    try {
      await onSave(toApiPayload(form))
    } catch (err) {
      setError(err instanceof Error ? err.message : t('common.error'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className={`fixed inset-0 bg-black/50 ${nested ? 'z-[60]' : 'z-50'} flex items-center justify-center p-4`}>
      <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700 shrink-0">
          <h2 className="font-semibold text-gray-900 dark:text-white">
            {initial?.id ? t('agents.editAgent') : t('agents.addAgent')}
            {initial?.code ? (
              <span className="ms-2 text-xs font-mono text-gray-500">{initial.code}</span>
            ) : null}
          </h2>
          <button type="button" onClick={onCancel} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex gap-1 px-5 pt-3 overflow-x-auto border-b border-gray-100 dark:border-gray-700 shrink-0">
          {tabs.map(id => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={`px-3 py-2 text-sm font-medium whitespace-nowrap rounded-t-lg border-b-2 transition-colors ${
                tab === id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'
              }`}
            >
              {t(`agents.formTabs.${id}`)}
            </button>
          ))}
        </div>

        <div className="p-5 space-y-4 overflow-y-auto flex-1 min-h-0">
          {error && (
            <p className="text-sm text-red-600 bg-red-50 dark:bg-red-900/20 rounded-lg px-3 py-2">{error}</p>
          )}

          {tab === 'general' && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>{t('agents.fullName')} * (عربي)</label>
                  <input value={form.name} onChange={e => set('name', e.target.value)} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>{t('agents.nameFr')}</label>
                  <input value={form.nameFr} onChange={e => set('nameFr', e.target.value)} dir="ltr" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>{t('agents.nameEn')}</label>
                  <input value={form.nameEn} onChange={e => set('nameEn', e.target.value)} dir="ltr" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>{t('agents.companyName')}</label>
                  <input value={form.companyName} onChange={e => set('companyName', e.target.value)} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>{t('agents.agentType')} *</label>
                  <select value={form.agentType} onChange={e => set('agentType', e.target.value as AgentType)} className={inputCls}>
                    <option value="standard">{t('agents.types.standard')}</option>
                    <option value="auto_entrepreneur">{t('agents.types.auto_entrepreneur')}</option>
                  </select>
                </div>
                <div>
                  <label className={labelCls}>{t('agents.employmentStatus')} *</label>
                  <select
                    value={form.employmentStatus}
                    onChange={e => set('employmentStatus', e.target.value as AgentEmploymentStatus)}
                    className={inputCls}
                  >
                    <option value="active">{t('agents.employmentStatuses.active')}</option>
                    <option value="inactive">{t('agents.employmentStatuses.inactive')}</option>
                    <option value="suspended">{t('agents.employmentStatuses.suspended')}</option>
                  </select>
                </div>
                <div>
                  <label className={labelCls}>{t('agents.passport')} *</label>
                  <input value={form.passport} onChange={e => set('passport', e.target.value)} dir="ltr" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>{t('agents.country')} *</label>
                  <input value={form.country} onChange={e => set('country', e.target.value)} className={inputCls} />
                </div>
              </div>
              {form.agentType === 'auto_entrepreneur' && (
                <div className="rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 px-3 py-2 text-sm text-amber-800 dark:text-amber-200">
                  {t('agents.taxPreviewHint', { percent: String(previewRate) })}
                  {' · '}
                  {t('agents.taxPreviewExample', {
                    tax: String(taxPreview.taxAmount),
                    total: String(taxPreview.totalPayable),
                  })}
                </div>
              )}
            </div>
          )}

          {tab === 'contact' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>{t('agents.phone')} *</label>
                <input value={form.phone} onChange={e => set('phone', e.target.value)} dir="ltr" type="tel" inputMode="tel" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>{t('agents.phoneAlt')}</label>
                <input value={form.phoneAlt} onChange={e => set('phoneAlt', e.target.value)} dir="ltr" type="tel" inputMode="tel" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>{t('agents.whatsapp')}</label>
                <input value={form.whatsapp} onChange={e => set('whatsapp', e.target.value)} dir="ltr" type="tel" inputMode="tel" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>{t('agents.email')}</label>
                <input value={form.email} onChange={e => set('email', e.target.value)} dir="ltr" type="email" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>{t('agents.website')}</label>
                <input value={form.website} onChange={e => set('website', e.target.value)} dir="ltr" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>{t('agents.preferredChannel')}</label>
                <select
                  value={form.preferredChannel}
                  onChange={e => set('preferredChannel', e.target.value as AgentPreferredChannel)}
                  className={inputCls}
                >
                  <option value="phone">{t('agents.channels.phone')}</option>
                  <option value="whatsapp">{t('agents.channels.whatsapp')}</option>
                  <option value="email">{t('agents.channels.email')}</option>
                  <option value="other">{t('agents.channels.other')}</option>
                </select>
              </div>
            </div>
          )}

          {tab === 'address' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>{t('agents.stateProvince')}</label>
                <input value={form.stateProvince} onChange={e => set('stateProvince', e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>{t('agents.city')}</label>
                <input value={form.city} onChange={e => set('city', e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>{t('agents.postalCode')}</label>
                <input value={form.postalCode} onChange={e => set('postalCode', e.target.value)} dir="ltr" className={inputCls} />
              </div>
              <div className="sm:col-span-2">
                <label className={labelCls}>{t('agents.address')}</label>
                <textarea value={form.address} onChange={e => set('address', e.target.value)} rows={2} className={`${inputCls} resize-none`} />
              </div>
            </div>
          )}

          {tab === 'financial' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>{t('agents.preferredCurrency')}</label>
                <input value={form.preferredCurrency} onChange={e => set('preferredCurrency', e.target.value)} dir="ltr" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>{t('agents.commissionRate')}</label>
                <input value={form.commissionRate} onChange={e => set('commissionRate', e.target.value)} dir="ltr" type="number" step="0.01" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>{t('agents.taxRateOverride')}</label>
                <input value={form.taxRateOverride} onChange={e => set('taxRateOverride', e.target.value)} dir="ltr" type="number" step="0.01" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>{t('agents.preferredPaymentMethod')}</label>
                <input value={form.preferredPaymentMethod} onChange={e => set('preferredPaymentMethod', e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>{t('agents.bankName')}</label>
                <input value={form.bankName} onChange={e => set('bankName', e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>{t('agents.bankAccount')}</label>
                <input value={form.bankAccount} onChange={e => set('bankAccount', e.target.value)} dir="ltr" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>{t('agents.iban')}</label>
                <input value={form.iban} onChange={e => set('iban', e.target.value)} dir="ltr" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>{t('agents.swift')}</label>
                <input value={form.swift} onChange={e => set('swift', e.target.value)} dir="ltr" className={inputCls} />
              </div>
            </div>
          )}

          {tab === 'identity' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>{t('agents.passportExpiry')}</label>
                <input value={form.passportExpiry} onChange={e => set('passportExpiry', e.target.value)} type="date" dir="ltr" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>{t('agents.nationalId')}</label>
                <input value={form.nationalId} onChange={e => set('nationalId', e.target.value)} dir="ltr" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>{t('agents.businessRegistrationNumber')}</label>
                <input value={form.businessRegistrationNumber} onChange={e => set('businessRegistrationNumber', e.target.value)} dir="ltr" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>{t('agents.taxId')}</label>
                <input value={form.taxId} onChange={e => set('taxId', e.target.value)} dir="ltr" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>{t('agents.primaryTradeRegion')}</label>
                <input value={form.primaryTradeRegion} onChange={e => set('primaryTradeRegion', e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>{t('agents.yearsExperience')}</label>
                <input value={form.yearsExperience} onChange={e => set('yearsExperience', e.target.value)} type="number" dir="ltr" className={inputCls} />
              </div>
            </div>
          )}

          {tab === 'notes' && (
            <div className="space-y-3">
              <div>
                <label className={labelCls}>{t('common.notes')}</label>
                <textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={3} className={`${inputCls} resize-none`} />
              </div>
              <div>
                <label className={labelCls}>{t('agents.internalNotes')}</label>
                <textarea value={form.internalNotes} onChange={e => set('internalNotes', e.target.value)} rows={3} className={`${inputCls} resize-none`} />
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-3 p-5 border-t border-gray-200 dark:border-gray-700 shrink-0">
          <button
            type="button"
            disabled={saving}
            onClick={() => void handleSave()}
            className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium disabled:opacity-50"
          >
            {t('common.save')}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-2.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium"
          >
            {t('common.cancel')}
          </button>
        </div>
      </div>
    </div>
  )
}
