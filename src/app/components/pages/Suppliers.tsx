import { useState, useMemo, useRef } from 'react'
import { useNavigate } from 'react-router'
import { Plus, Search, Truck, X, Pencil, Trash2, Eye, Star, FileText, Printer, Copy } from 'lucide-react'
import { toast } from 'sonner'
import { useAppStore } from '../../../store/appStore'
import { cn } from '../../utils/cn'
import { formatDate } from '../../../utils/dateUtils'
import type { Supplier, SupplierStatus, SupplierCategory, SupplierPhone, SupplierDocumentTemplate } from '../../../types'
import { isOrgAdmin } from '../../../lib/roles'
import { DEFAULT_TRANSACTION_CURRENCY, currenciesForSelect, currencySymbol } from '../../../lib/currencies'

const ALL_STATUSES: SupplierStatus[] = ['active', 'inactive', 'suspended', 'blacklisted']
const ALL_CATEGORIES: SupplierCategory[] = ['shoes', 'clothing', 'electronics', 'furniture', 'accessories', 'other']

/** UI-only phone row; `id` is stripped before API save. */
type PhoneRow = SupplierPhone & { id: string }

function newPhoneRow(partial?: Partial<SupplierPhone>): PhoneRow {
  return {
    id: crypto.randomUUID(),
    label: partial?.label ?? 'رئيسي',
    number: partial?.number ?? '',
  }
}

function toPhoneRows(phones?: SupplierPhone[]): PhoneRow[] {
  if (phones?.length) return phones.map(p => newPhoneRow(p))
  return [newPhoneRow()]
}

function stripPhoneIds(phones: PhoneRow[]): SupplierPhone[] {
  return phones.map(({ label, number }) => ({ label, number }))
}

interface SupplierFormData {
  name: string
  nameFr: string
  country: string
  city: string
  address: string
  phones: PhoneRow[]
  email: string
  whatsapp: string
  wechat: string
  website: string
  primaryContact: string
  secondaryContact: string
  categories: SupplierCategory[]
  paymentPreferences: string
  preferredCurrency: string
  leadTimeDays: number
  minimumOrderQty: number
  businessNotes: string
  status: SupplierStatus
}

/** Payload shape for create/update (phones without UI ids). */
type SupplierSavePayload = Omit<SupplierFormData, 'phones'> & { phones: SupplierPhone[] }

const EMPTY_SUPPLIER_FORM: SupplierFormData = {
  name: '',
  nameFr: '',
  country: 'الصين',
  city: '',
  address: '',
  phones: [newPhoneRow()],
  email: '',
  whatsapp: '',
  wechat: '',
  website: '',
  primaryContact: '',
  secondaryContact: '',
  categories: [],
  paymentPreferences: '',
  preferredCurrency: DEFAULT_TRANSACTION_CURRENCY,
  leadTimeDays: 21,
  minimumOrderQty: 100,
  businessNotes: '',
  status: 'active',
}

function supplierFormFromInitial(initial?: Partial<Supplier>): SupplierFormData {
  return {
    name: initial?.name || '',
    nameFr: initial?.nameFr || '',
    country: initial?.country || 'الصين',
    city: initial?.city || '',
    address: initial?.address || '',
    phones: toPhoneRows(initial?.phones),
    email: initial?.email || '',
    whatsapp: initial?.whatsapp || '',
    wechat: initial?.wechat || '',
    website: initial?.website || '',
    primaryContact: initial?.primaryContact || '',
    secondaryContact: initial?.secondaryContact || '',
    categories: initial?.categories || [],
    paymentPreferences: initial?.paymentPreferences || '',
    preferredCurrency: initial?.preferredCurrency || DEFAULT_TRANSACTION_CURRENCY,
    leadTimeDays: initial?.leadTimeDays || 21,
    minimumOrderQty: initial?.minimumOrderQty || 100,
    businessNotes: initial?.businessNotes || '',
    status: initial?.status || 'active',
  }
}

function SupplierForm({ initial, onSave, onSaveAndAddAnother, onCancel, t, categories }: Readonly<{
  initial?: Partial<Supplier>
  onSave: (data: SupplierSavePayload) => void | Promise<void>
  onSaveAndAddAnother?: (data: SupplierSavePayload) => void | Promise<void>
  onCancel: () => void
  t: ReturnType<typeof useAppStore>['t']
  categories: { value: SupplierCategory; label: string }[]
}>) {
  const [form, setForm] = useState<SupplierFormData>(() => supplierFormFromInitial(initial))

  const set = (k: keyof SupplierFormData, v: unknown) => setForm(f => ({ ...f, [k]: v }))

  const toSavePayload = (): SupplierSavePayload => ({
    ...form,
    phones: stripPhoneIds(form.phones),
  })

  const addPhone = () => set('phones', [...form.phones, newPhoneRow({ label: '', number: '' })])
  const updatePhone = (i: number, field: 'label' | 'number', value: string) => {
    const phones = [...form.phones]
    phones[i] = { ...phones[i], [field]: value }
    set('phones', phones)
  }
  const removePhone = (i: number) => set('phones', form.phones.filter((_, idx) => idx !== i))

  const toggleCategory = (cat: SupplierCategory) => {
    const cats = form.categories.includes(cat)
      ? form.categories.filter(c => c !== cat)
      : [...form.categories, cat]
    set('categories', cats)
  }

  const handleSave = () => {
    if (!form.name.trim()) {
      toast.error(t('suppliers.supplierName') + ' *')
      return
    }
    onSave(toSavePayload())
  }

  const handleSaveAndAddAnother = async () => {
    if (!form.name.trim() || !onSaveAndAddAnother) {
      if (!form.name.trim()) toast.error(t('suppliers.supplierName') + ' *')
      return
    }
    try {
      await onSaveAndAddAnother(toSavePayload())
      setForm({ ...EMPTY_SUPPLIER_FORM, phones: [newPhoneRow()] })
    } catch {
      // Parent toasts the error; keep form data for correction
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700">
          <h2 className="font-semibold text-gray-900 dark:text-white">
            {initial?.id ? t('suppliers.editSupplier') : t('suppliers.addSupplier')}
          </h2>
          <button onClick={onCancel} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('suppliers.supplierName')} * (عربي)</label>
              <input value={form.name} onChange={e => set('name', e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label htmlFor="supplier-name-fr" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nom (Français)</label>
              <input id="supplier-name-fr" value={form.nameFr} onChange={e => set('nameFr', e.target.value)} dir="ltr"
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500" />
            </div>
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
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('suppliers.address')}</label>
            <input value={form.address} onChange={e => set('address', e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('suppliers.phoneNumbers')}</label>
            <div className="space-y-2">
              {form.phones.map((phone, i) => (
                <div key={phone.id} className="flex flex-col gap-2 sm:flex-row">
                  <input value={phone.label} onChange={e => updatePhone(i, 'label', e.target.value)}
                    placeholder={t('suppliers.phoneLabel')}
                    className="w-full px-3 py-2.5 text-base sm:text-sm sm:w-1/3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500" />
                  <input value={phone.number} onChange={e => updatePhone(i, 'number', e.target.value)}
                    type="tel" inputMode="tel" autoComplete="tel"
                    placeholder={t('suppliers.phoneNumber')} dir="ltr"
                    className="w-full flex-1 px-3 py-2.5 text-base sm:text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500" />
                  {form.phones.length > 1 && (
                    <button type="button" onClick={() => removePhone(i)} className="min-h-11 min-w-11 self-end px-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg sm:self-auto">
                      <X className="w-4 h-4 mx-auto" />
                    </button>
                  )}
                </div>
              ))}
              <button onClick={addPhone} className="text-sm text-blue-500 hover:text-blue-600">
                + {t('suppliers.addPhone')}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('suppliers.email')}</label>
              <input value={form.email} onChange={e => set('email', e.target.value)} type="email" dir="ltr"
                className="w-full px-3 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base sm:text-sm focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('suppliers.whatsapp')}</label>
              <input value={form.whatsapp} onChange={e => set('whatsapp', e.target.value)} type="tel" inputMode="tel" dir="ltr"
                className="w-full px-3 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base sm:text-sm focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('suppliers.wechat')}</label>
              <input value={form.wechat} onChange={e => set('wechat', e.target.value)} dir="ltr"
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('suppliers.website')}</label>
              <input value={form.website} onChange={e => set('website', e.target.value)} dir="ltr"
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('suppliers.primaryContact')}</label>
              <input value={form.primaryContact} onChange={e => set('primaryContact', e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('suppliers.secondaryContact')}</label>
              <input value={form.secondaryContact} onChange={e => set('secondaryContact', e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('suppliers.categories')}</label>
            <div className="flex flex-wrap gap-2">
              {categories.map(cat => (
                <button key={cat.value} onClick={() => toggleCategory(cat.value)}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-sm border transition-colors',
                    form.categories.includes(cat.value)
                      ? 'bg-blue-500 text-white border-blue-500'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:border-blue-400'
                  )}>
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('suppliers.leadTimeDays')}</label>
              <input type="number" min="1" value={form.leadTimeDays} onChange={e => set('leadTimeDays', Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('suppliers.minimumOrderQty')}</label>
              <input type="number" min="1" value={form.minimumOrderQty} onChange={e => set('minimumOrderQty', Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('suppliers.preferredCurrency')}</label>
              <select value={form.preferredCurrency} onChange={e => set('preferredCurrency', e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500">
                {currenciesForSelect(form.preferredCurrency).map(c => (
                  <option key={c.code} value={c.code}>{c.code}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('suppliers.paymentPreferences')}</label>
            <input value={form.paymentPreferences} onChange={e => set('paymentPreferences', e.target.value)} dir="ltr"
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('suppliers.businessNotes')}</label>
            <textarea value={form.businessNotes} onChange={e => set('businessNotes', e.target.value)} rows={3}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 resize-none" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('suppliers.status')}</label>
            <select value={form.status} onChange={e => set('status', e.target.value as SupplierStatus)}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500">
              {ALL_STATUSES.map(s => <option key={s} value={s}>{t(`suppliers.statuses.${s}`)}</option>)}
            </select>
          </div>
        </div>
        <div className="flex flex-wrap gap-3 p-5 border-t border-gray-200 dark:border-gray-700">
          <button onClick={handleSave}
            className="flex-1 min-w-[120px] py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors">
            {t('common.save')}
          </button>
          {!initial?.id && onSaveAndAddAnother && (
            <button onClick={handleSaveAndAddAnother}
              className="flex-1 min-w-[120px] py-2 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 rounded-lg text-sm font-medium transition-colors">
              {t('suppliers.saveAndAddAnother')}
            </button>
          )}
          <button onClick={onCancel}
            className="flex-1 min-w-[120px] py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium transition-colors">
            {t('common.cancel')}
          </button>
        </div>
      </div>
    </div>
  )
}

const SUPPLIER_TEMPLATE_PLACEHOLDERS = [
  { key: 'اسم_المورد', labelAr: 'اسم المورد', labelFr: 'Nom du fournisseur' },
  { key: 'الدولة', labelAr: 'الدولة', labelFr: 'Pays' },
  { key: 'المدينة', labelAr: 'المدينة', labelFr: 'Ville' },
  { key: 'العنوان', labelAr: 'العنوان', labelFr: 'Adresse' },
  { key: 'الهاتف', labelAr: 'الهاتف', labelFr: 'Téléphone' },
  { key: 'البريد_الإلكتروني', labelAr: 'البريد الإلكتروني', labelFr: 'Email' },
  { key: 'رقم_المورد', labelAr: 'رقم المورد', labelFr: 'Code fournisseur' },
  { key: 'تاريخ_اليوم', labelAr: 'تاريخ اليوم', labelFr: 'Date du jour' },
  // Price / Amounts
  { key: 'القيمة', labelAr: 'القيمة (تلقائي حسب العملية)', labelFr: 'Valeur (Auto)' },
  { key: 'value', labelAr: 'القيمة (إنجليزي)', labelFr: 'Valeur (English)' },
  { key: 'المبلغ_المدفوع', labelAr: 'المبلغ المدفوع (دفع)', labelFr: 'Montant payé (Paiement)' },
  { key: 'amountPaid', labelAr: 'المبلغ المدفوع (إنجليزي)', labelFr: 'Montant payé (English)' },
  { key: 'المبلغ', labelAr: 'المبلغ الإجمالي (دفع)', labelFr: 'Montant total (Paiement)' },
  { key: 'amount', labelAr: 'المبلغ الإجمالي (إنجليزي)', labelFr: 'Montant total (English)' },
  { key: 'الإجمالي', labelAr: 'الإجمالي (أمر شراء)', labelFr: 'Total général (Achat/PO)' },
  { key: 'totalAmount', labelAr: 'الإجمالي (إنجليزي)', labelFr: 'Total général (English)' },
  // Context
  { key: 'رقم_الطلب', labelAr: 'رقم الطلب (أمر شراء)', labelFr: 'N° Commande (Achat/PO)' },
  { key: 'poNumber', labelAr: 'رقم الطلب (إنجليزي)', labelFr: 'N° Commande (English)' },
  { key: 'رقم_الدفعة', labelAr: 'رقم الدفعة (دفع)', labelFr: 'N° Reçu (Paiement)' },
  { key: 'paymentNumber', labelAr: 'رقم الدفعة (إنجليزي)', labelFr: 'N° Reçu (English)' },
  { key: 'رقم_أمر_الشراء', labelAr: 'أمر الشراء المرتبط (دفع)', labelFr: 'N° Commande lié (Paiement)' },
  { key: 'purchaseOrderNumber', labelAr: 'أمر الشراء المرتبط (إنجليزي)', labelFr: 'N° Commande lié (English)' },
  { key: 'العملة', labelAr: 'العملة', labelFr: 'Devise' },
  { key: 'currency', labelAr: 'العملة (إنجليزي)', labelFr: 'Devise (English)' },
  { key: 'طريقة_الدفع', labelAr: 'طريقة الدفع (دفع)', labelFr: 'Méthode de paiement (Paiement)' },
  { key: 'paymentMethod', labelAr: 'طريقة الدفع (إنجليزي)', labelFr: 'Méthode de paiement (English)' },
  { key: 'تاريخ_الطلب', labelAr: 'تاريخ الطلب (أمر شراء)', labelFr: 'Date commande (Achat/PO)' },
  { key: 'orderDate', labelAr: 'تاريخ الطلب (إنجليزي)', labelFr: 'Date commande (English)' },
  { key: 'تاريخ_الدفع', labelAr: 'تاريخ الدفع (دفع)', labelFr: 'Date paiement (Paiement)' },
  { key: 'paymentDate', labelAr: 'تاريخ الدفع (إنجليزي)', labelFr: 'Date paiement (English)' },
  { key: 'الكمية', labelAr: 'إجمالي الكمية (أمر شراء)', labelFr: 'Quantité totale (Achat/PO)' },
  { key: 'quantity', labelAr: 'إجمالي الكمية (إنجليزي)', labelFr: 'Quantité totale (English)' },
  { key: 'بنود_الطلب', labelAr: 'بنود الطلب (أمر شراء)', labelFr: 'Détails des articles (Achat/PO)' },
  { key: 'lineItems', labelAr: 'بنود الطلب (إنجليزي)', labelFr: 'Détails des articles (English)' },
] as const

function mergeSupplierTemplate(body: string, supplier: Supplier, language: 'ar' | 'fr') {
  const locale = language === 'ar' ? 'ar-DZ' : 'fr-FR'
  const phone = supplier.phones[0]?.number || '—'
  const today = new Date().toLocaleDateString(locale)

  const currency = supplier.preferredCurrency || DEFAULT_TRANSACTION_CURRENCY
  const symbol = currencySymbol(currency)
  const mockAmount = 150000
  const formattedMockAmount = `${symbol} ${mockAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

  const values: Record<string, string> = {
    supplierName: supplier.name,
    address: supplier.address || '—',
    city: supplier.city || '—',
    phone,
    email: supplier.email || '—',
    imageNumber: supplier.code || '—',
    todayDate: today,
    status: language === 'ar' ? 'نشط' : 'Actif',
    'اسم_المورد': supplier.name,
    'الدولة': supplier.country,
    'المدينة': supplier.city,
    'العنوان': supplier.address,
    'الهاتف': phone,
    'البريد_الإلكتروني': supplier.email || '—',
    'رقم_المورد': supplier.code,
    'تاريخ_اليوم': today,
    'القيمة': formattedMockAmount,
    value: formattedMockAmount,
    'المبلغ': formattedMockAmount,
    amount: formattedMockAmount,
    'المبلغ_المدفوع': formattedMockAmount,
    amountPaid: formattedMockAmount,
    'الإجمالي': formattedMockAmount,
    totalAmount: formattedMockAmount,
    'رقم_الطلب': 'PO-2026-001',
    poNumber: 'PO-2026-001',
    'رقم_الدفعة': 'PAY-2026-001',
    paymentNumber: 'PAY-2026-001',
    'رقم_أمر_الشراء': 'PO-2026-001',
    purchaseOrderNumber: 'PO-2026-001',
    'العملة': currency,
    currency,
    'طريقة_الدفع': language === 'ar' ? 'تحويل بنكي' : 'Virement bancaire',
    paymentMethod: language === 'ar' ? 'تحويل بنكي' : 'Bank Transfer',
    'تاريخ_الطلب': today,
    orderDate: today,
    'تاريخ_الدفع': today,
    paymentDate: today,
    'الكمية': '10',
    quantity: '10',
    'بنود_الطلب': language === 'ar'
      ? '1. منتج تجريبي × 10 @ 15,000.00 دج'
      : '1. Test Product × 10 @ 15,000.00 DZD',
    lineItems: language === 'ar'
      ? '1. منتج تجريبي × 10 @ 15,000.00 دج'
      : '1. Test Product × 10 @ 15,000.00 DZD',
  }

  return body.replace(/\{\{([^}]+)\}\}/g, (match, key) => values[String(key)] ?? match)
}

function looksLikeHtmlTemplate(content: string): boolean {
  return /<(?:style|div|table|section|html)\b/i.test(content)
}

function buildSupplierTemplatePrintHtml(title: string, body: string, language: 'ar' | 'fr') {
  const isRTL = language === 'ar' || /[\u0600-\u06FF]/.test(body)
  const dir = isRTL ? 'rtl' : 'ltr'

  if (looksLikeHtmlTemplate(body)) {
    return `<!DOCTYPE html>
<html lang="${isRTL ? 'ar' : 'en'}" dir="${dir}">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>${title}</title>
</head>
<body style="margin:0;background:#fff;">
${body}
</body>
</html>`
  }

  const align = isRTL ? 'right' : 'left'
  const font = isRTL ? "'Cairo', 'Tahoma', sans-serif" : "'Inter', 'Segoe UI', sans-serif"
  const content = body.split('\n').map(line => {
    if (line.startsWith('━')) return '<hr style="border:none;border-top:1px solid #d1d5db;margin:14px 0"/>'
    return `<p style="margin:3px 0;white-space:pre-wrap;min-height:1.4em">${line || '&nbsp;'}</p>`
  }).join('')

  return `<!DOCTYPE html>
<html lang="${isRTL ? 'ar' : 'fr'}" dir="${dir}">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>${title}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com"/>
  <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&family=Inter:wght@400;600;700&display=swap" rel="stylesheet"/>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    html, body { direction: ${dir}; unicode-bidi: embed; }
    body {
      font-family: ${font};
      color: #111827;
      font-size: 13.5px;
      line-height: 1.8;
      padding: 48px 56px;
      text-align: ${align};
      background: #fff;
    }
    .doc-header {
      text-align: center;
      border-bottom: 2px solid #111827;
      padding-bottom: 18px;
      margin-bottom: 28px;
    }
    .doc-header h1 { font-size: 18px; font-weight: 700; }
    .doc-body { line-height: 1.9; }
    .doc-footer {
      margin-top: 48px;
      padding-top: 14px;
      border-top: 1px solid #e5e7eb;
      font-size: 10px;
      color: #9ca3af;
      text-align: center;
    }
    @media print {
      body { padding: 0; }
      @page { margin: 18mm 22mm; size: A4; }
    }
  </style>
</head>
<body>
  <div class="doc-header"><h1>${title}</h1></div>
  <div class="doc-body">${content}</div>
  <div class="doc-footer">CargoBridge &mdash; ${new Date().toLocaleDateString(isRTL ? 'ar-DZ' : 'fr-FR')}</div>
</body>
</html>`
}

function SupplierTemplateForm({
  template,
  onSave,
  onCancel,
  onPreview,
  t,
  language,
}: Readonly<{
  template?: SupplierDocumentTemplate
  onSave: (data: Omit<SupplierDocumentTemplate, 'id' | 'createdAt'>) => void
  onCancel: () => void
  onPreview: (data: { templateName: string; templateBody: string }) => void
  t: ReturnType<typeof useAppStore>['t']
  language: 'ar' | 'fr'
}>) {
  const [templateName, setTemplateName] = useState(template?.templateName ?? '')
  const [templateBody, setTemplateBody] = useState(template?.templateBody ?? '')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const insertPlaceholder = (key: string) => {
    const textarea = textareaRef.current
    if (!textarea) return
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const snippet = `{{${key}}}`
    const next = templateBody.slice(0, start) + snippet + templateBody.slice(end)
    setTemplateBody(next)
    requestAnimationFrame(() => {
      textarea.focus()
      textarea.setSelectionRange(start + snippet.length, start + snippet.length)
    })
  }

  const handleSave = () => {
    if (!templateName.trim() || !templateBody.trim()) return
    onSave({
      templateName: templateName.trim(),
      templateBody,
      kind: template?.kind ?? 'custom',
      systemKey: null,
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-2xl dark:bg-gray-800">
        <div className="flex items-center justify-between border-b border-gray-200 p-5 dark:border-gray-700">
          <h2 className="font-semibold text-gray-900 dark:text-white">{template ? t('suppliers.editTemplate') : t('suppliers.addTemplate')}</h2>
          <button onClick={onCancel} className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4 p-5">
          {template?.systemKey && (
            <p className="rounded-lg bg-blue-50 px-3 py-2 text-xs text-blue-700 dark:bg-blue-900/20 dark:text-blue-300">
              {t('suppliers.htmlTemplateHint')}
            </p>
          )}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">{t('suppliers.templateName')}</label>
            <input
              value={templateName}
              onChange={e => setTemplateName(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div>
            <p className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">{t('suppliers.placeholders')}</p>
            <div className="flex flex-wrap gap-2">
              {SUPPLIER_TEMPLATE_PLACEHOLDERS.map(placeholder => (
                <button
                  key={placeholder.key}
                  onClick={() => insertPlaceholder(placeholder.key)}
                  title={language === 'ar' ? placeholder.labelAr : placeholder.labelFr}
                  className="rounded-full bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 transition-colors hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-300 dark:hover:bg-blue-900/50"
                >
                  {`{{${placeholder.key}}}`}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">{t('suppliers.templateBody')}</label>
            <textarea
              ref={textareaRef}
              value={templateBody}
              onChange={e => setTemplateBody(e.target.value)}
              rows={16}
              dir={language === 'ar' ? 'rtl' : 'ltr'}
              className="w-full resize-none rounded-xl border border-gray-300 bg-white px-3 py-2 font-mono text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            />
          </div>
        </div>

        <div className="flex gap-3 border-t border-gray-200 p-5 dark:border-gray-700">
          <button onClick={() => onPreview({ templateName, templateBody })} className="flex-1 rounded-lg bg-gray-100 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600">
            {t('suppliers.previewTemplate')}
          </button>
          <button onClick={handleSave} className="flex-1 rounded-lg bg-blue-600 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700">
            {t('common.save')}
          </button>
          <button onClick={onCancel} className="flex-1 rounded-lg bg-gray-100 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600">
            {t('common.cancel')}
          </button>
        </div>
      </div>
    </div>
  )
}

function SupplierTemplatePreviewModal({
  template,
  suppliers,
  language,
  onClose,
  t,
}: Readonly<{
  template: SupplierDocumentTemplate
  suppliers: Supplier[]
  language: 'ar' | 'fr'
  onClose: () => void
  t: ReturnType<typeof useAppStore>['t']
}>) {
  const [query, setQuery] = useState('')
  const [selectedSupplierId, setSelectedSupplierId] = useState(suppliers[0]?.id || '')
  const selectedSupplier = suppliers.find(supplier => supplier.id === selectedSupplierId) || suppliers[0]

  const filteredSuppliers = suppliers.filter(supplier => {
    const search = query.toLowerCase()
    return !search || supplier.name.toLowerCase().includes(search) || supplier.code.toLowerCase().includes(search)
  })

  const mergedBody = selectedSupplier ? mergeSupplierTemplate(template.templateBody, selectedSupplier, language) : ''

  const handlePrint = () => {
    if (!selectedSupplier) return
    const html = buildSupplierTemplatePrintHtml(template.templateName, mergedBody, language)
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const win = window.open(url, '_blank', 'width=820,height=960')
    if (!win) return
    win.onload = () => { win.focus(); win.print(); URL.revokeObjectURL(url) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 sm:p-4">
      <div className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-gray-900">
        <div className="flex shrink-0 items-center justify-between border-b border-gray-200 p-4 sm:p-5 dark:border-gray-700">
          <div>
            <h2 className="font-bold text-gray-900 dark:text-white">{template.templateName}</h2>
            <p className="text-xs text-gray-500">{t('suppliers.chooseSupplier')}</p>
          </div>
          <button type="button" onClick={onClose} className="min-h-11 min-w-11 inline-flex items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Mobile: stacked wizard; desktop: dual pane */}
        <div className="grid min-h-0 flex-1 gap-4 overflow-y-auto p-4 sm:p-5 lg:grid-cols-[340px_minmax(0,1fr)] lg:overflow-hidden">
          <div className="space-y-3 rounded-2xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800">
            <div className="relative">
              <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder={t('suppliers.searchSupplier')}
                className="w-full rounded-lg border border-gray-300 bg-white py-2.5 ps-9 pe-3 text-base text-gray-900 focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white sm:text-sm"
              />
            </div>

            <div className="max-h-48 overflow-y-auto rounded-xl border border-gray-200 bg-white sm:max-h-72 dark:border-gray-700 dark:bg-gray-900">
              {filteredSuppliers.map(supplier => (
                <button
                  type="button"
                  key={supplier.id}
                  onClick={() => setSelectedSupplierId(supplier.id)}
                  className={cn(
                    'flex min-h-11 w-full items-center justify-between border-b border-gray-100 px-3 py-3 text-start last:border-b-0 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-800',
                    selectedSupplier?.id === supplier.id && 'bg-blue-50 dark:bg-blue-900/20'
                  )}
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{supplier.name}</p>
                    <p className="text-xs text-gray-500" dir="ltr">{supplier.code}</p>
                  </div>
                  <span className="text-xs text-gray-400">{supplier.city}</span>
                </button>
              ))}
              {filteredSuppliers.length === 0 && (
                <div className="p-4 text-center text-sm text-gray-500">{t('common.noData')}</div>
              )}
            </div>

            <button
              type="button"
              onClick={handlePrint}
              disabled={!selectedSupplier}
              className="hidden min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-blue-600 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 lg:flex"
            >
              <Printer className="h-4 w-4" />
              {t('suppliers.printExport')}
            </button>
          </div>

          <div className="min-h-[280px] overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-950 lg:min-h-0">
            {selectedSupplier ? (
              looksLikeHtmlTemplate(mergedBody) ? (
                <iframe
                  title={template.templateName}
                  className="h-full min-h-[280px] w-full bg-white lg:min-h-[420px]"
                  srcDoc={buildSupplierTemplatePrintHtml(template.templateName, mergedBody, language)}
                />
              ) : (
                <div className="overflow-y-auto p-5" dir={language === 'ar' ? 'rtl' : 'ltr'}>
                  <div className="mb-4 border-b border-gray-200 pb-3 text-center dark:border-gray-700">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{template.templateName}</h3>
                    <p className="text-sm text-gray-500">{selectedSupplier.name}</p>
                  </div>
                  <div className="whitespace-pre-wrap text-sm leading-8 text-gray-800 dark:text-gray-200">
                    {mergedBody}
                  </div>
                </div>
              )
            ) : (
              <div className="flex h-full items-center justify-center p-5 text-gray-500">{t('common.noData')}</div>
            )}
          </div>
        </div>

        <div className="shrink-0 border-t border-gray-200 p-3 lg:hidden dark:border-gray-700 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <button
            type="button"
            onClick={handlePrint}
            disabled={!selectedSupplier}
            className="flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-blue-600 py-2.5 text-sm font-medium text-white disabled:opacity-50"
          >
            <Printer className="h-4 w-4" />
            {t('suppliers.printExport')}
          </button>
        </div>
      </div>
    </div>
  )
}

export function Suppliers() {
  const { t, language, role, suppliers, supplierTemplates, addSupplier, updateSupplier, deleteSupplier, getSupplierRating, addSupplierTemplate, updateSupplierTemplate, deleteSupplierTemplate, duplicateSupplierTemplate } = useAppStore()
  const navigate = useNavigate()
  const [activeView, setActiveView] = useState<'suppliers' | 'templates'>('suppliers')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [showForm, setShowForm] = useState(false)
  const [editItem, setEditItem] = useState<Supplier | null>(null)
  const [templateEditor, setTemplateEditor] = useState<SupplierDocumentTemplate | 'new' | null>(null)
  const [previewTemplate, setPreviewTemplate] = useState<SupplierDocumentTemplate | null>(null)

  const categoryOptions = ALL_CATEGORIES.map(cat => ({
    value: cat,
    label: t(`suppliers.categoryLabels.${cat}`),
  }))

  const filtered = useMemo(() =>
    suppliers.filter(s => {
      const matchSearch = !search ||
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.code.toLowerCase().includes(search.toLowerCase()) ||
        (s.nameFr?.toLowerCase().includes(search.toLowerCase()) ?? false)
      const matchStatus = statusFilter === 'all' || s.status === statusFilter
      return matchSearch && matchStatus
    }),
  [suppliers, search, statusFilter])

  const handleSave = async (data: SupplierSavePayload, options?: { addAnother?: boolean }) => {
    if (!isOrgAdmin(role)) {
      toast.error(t('common.error'))
      return
    }
    try {
      if (editItem) {
        await updateSupplier(editItem.id, data)
      } else {
        await addSupplier(data)
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('common.error'))
      throw err
    }
    toast.success(t('common.success'))
    if (options?.addAnother) {
      setEditItem(null)
      return
    }
    setShowForm(false)
    setEditItem(null)
  }

  const handleDelete = async (id: string) => {
    if (!isOrgAdmin(role)) return
    if (confirm(t('suppliers.confirmDelete'))) {
      await deleteSupplier(id)
      toast.success(t('common.success'))
    }
  }

  const handleSaveTemplate = (data: Omit<SupplierDocumentTemplate, 'id' | 'createdAt'>) => {
    if (!isOrgAdmin(role)) return
    if (templateEditor && templateEditor !== 'new') {
      updateSupplierTemplate(templateEditor.id, data)
    } else {
      addSupplierTemplate(data)
    }
    toast.success(t('common.success'))
    setTemplateEditor(null)
  }

  const handleDeleteTemplate = (id: string) => {
    if (!isOrgAdmin(role)) return
    if (confirm(t('suppliers.confirmDelete'))) {
      deleteSupplierTemplate(id)
      toast.success(t('common.success'))
    }
  }

  const handleDuplicateTemplate = async (id: string) => {
    if (!isOrgAdmin(role)) return
    try {
      await duplicateSupplierTemplate(id)
      toast.success(t('common.success'))
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('common.error'))
    }
  }

  const templateSnippet = (body: string) => {
    if (looksLikeHtmlTemplate(body)) {
      const text = body.replace(/<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
      return text.slice(0, 160) || 'HTML'
    }
    return body
  }

  const statusColor = (status: SupplierStatus) => {
    switch (status) {
      case 'active': return 'bg-green-500'
      case 'inactive': return 'bg-gray-500'
      case 'suspended': return 'bg-amber-500'
      case 'blacklisted': return 'bg-red-500'
    }
  }

  const templateCount = supplierTemplates.length

  return (
    <div className="p-4 lg:p-6 space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold text-gray-900 dark:text-white sm:text-xl">{t('suppliers.title')}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {activeView === 'suppliers' ? `${filtered.length} ${t('common.records')}` : `${templateCount} ${t('common.records')}`}
          </p>
        </div>
        {isOrgAdmin(role) && (
          <button
            onClick={() => activeView === 'suppliers' ? (setEditItem(null), setShowForm(true)) : setTemplateEditor('new')}
            className="inline-flex min-h-11 items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            {activeView === 'suppliers' ? t('suppliers.addSupplier') : t('suppliers.addTemplate')}
          </button>
        )}
      </div>

      <div className="flex gap-2 rounded-xl border border-gray-200 bg-white p-1 dark:border-gray-700 dark:bg-gray-800 w-fit">
        <button
          onClick={() => setActiveView('suppliers')}
          className={cn(
            'rounded-lg px-4 py-2 text-sm font-medium transition-colors',
            activeView === 'suppliers' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
          )}
        >
          {t('suppliers.moduleTabs.suppliers')}
        </button>
        <button
          onClick={() => setActiveView('templates')}
          className={cn(
            'rounded-lg px-4 py-2 text-sm font-medium transition-colors',
            activeView === 'templates' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
          )}
        >
          {t('suppliers.moduleTabs.templates')}
        </button>
      </div>

      {activeView === 'suppliers' ? (
        <>
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-48">
              <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder={t('suppliers.searchPlaceholder')}
                className="w-full ps-9 pe-3 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-base sm:text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
              className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm focus:ring-2 focus:ring-blue-500">
              <option value="all">{t('common.all')}</option>
              {ALL_STATUSES.map(s => <option key={s} value={s}>{t(`suppliers.statuses.${s}`)}</option>)}
            </select>
          </div>

          {filtered.length === 0 ? (
            <div className="text-center py-16 text-gray-500 dark:text-gray-400">
              <Truck className="w-12 h-12 mx-auto mb-3 opacity-40" />
              <p>{t('suppliers.noSuppliers')}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filtered.map((supplier) => (
                <div
                  key={supplier.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => navigate(`/suppliers/${supplier.id}`)}
                  onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); navigate(`/suppliers/${supplier.id}`) } }}
                  className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 hover:shadow-md transition-shadow cursor-pointer text-start"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-white font-bold text-xl">
                      {supplier.name.charAt(0)}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className={cn('w-2.5 h-2.5 rounded-full', statusColor(supplier.status))} />
                      <span className="text-xs text-gray-500">{supplier.code}</span>
                    </div>
                  </div>

                  <h3 className="font-semibold text-gray-900 dark:text-white">{supplier.name}</h3>
                  {supplier.nameFr && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-mono mt-0.5" dir="ltr">{supplier.nameFr}</p>
                  )}

                  <div className="flex flex-wrap gap-1 mt-2">
                    {supplier.categories.slice(0, 2).map(cat => (
                      <span key={cat} className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded text-[10px]">
                        {t(`suppliers.categoryLabels.${cat}`)}
                      </span>
                    ))}
                    {supplier.categories.length > 2 && (
                      <span className="px-2 py-0.5 text-gray-500 text-[10px]">+{supplier.categories.length - 2}</span>
                    )}
                  </div>

                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    {supplier.city}{supplier.country ? `, ${supplier.country}` : ''}
                  </p>

                  <div className="mt-3 space-y-1">
                    {supplier.phones[0] && (
                      <p className="text-xs text-gray-600 dark:text-gray-400" dir="ltr">{supplier.phones[0].number}</p>
                    )}
                    {supplier.email && (
                      <p className="text-xs text-gray-600 dark:text-gray-400 truncate" dir="ltr">{supplier.email}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-gray-100 dark:border-gray-700 sm:grid-cols-4">
                    <div className="text-center">
                      <p className="text-base font-bold text-gray-900 dark:text-white">{supplier.leadTimeDays}</p>
                      <p className="text-xs text-gray-500">{t('suppliers.leadTimeDays').split(' ')[0]}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-base font-bold text-gray-900 dark:text-white">{supplier.minimumOrderQty}</p>
                      <p className="text-xs text-gray-500">{t('suppliers.minimumOrderQty').split(' ')[0]}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-base font-bold text-blue-600">{supplier.phones.length}</p>
                      <p className="text-xs text-gray-500">{t('suppliers.phoneNumbers').split(' ')[0]}</p>
                    </div>
                    <div className="text-center flex flex-col items-center">
                      {(() => {
                        const rating = getSupplierRating(supplier.id)
                        return rating ? (
                          <>
                            <div className="flex items-center gap-0.5">
                              {[1,2,3,4,5].map(s => (
                                <Star key={s} className={cn('w-3 h-3', s <= Math.round(rating.overall) ? 'fill-amber-400 text-amber-400' : 'text-gray-300 dark:text-gray-600')} />
                              ))}
                            </div>
                            <p className="text-xs text-gray-500">{rating.overall.toFixed(1)}</p>
                          </>
                        ) : (
                          <Star className="w-3.5 h-3.5 text-gray-300 dark:text-gray-600" />
                        )
                      })()}
                    </div>
                  </div>

                  <div className="flex gap-1 mt-3 pt-3 border-t border-gray-100 dark:border-gray-700" onClick={e => e.stopPropagation()}>
                    <button onClick={() => navigate(`/suppliers/${supplier.id}`)} className="flex-1 min-h-11 flex items-center justify-center gap-1 py-2 text-xs text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors">
                      <Eye className="w-3 h-3" />{t('common.view')}
                    </button>
                    {isOrgAdmin(role) && (
                      <>
                        <button onClick={() => { setEditItem(supplier); setShowForm(true) }} className="flex-1 min-h-11 flex items-center justify-center gap-1 py-2 text-xs text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-lg transition-colors">
                          <Pencil className="w-3 h-3" />{t('common.edit')}
                        </button>
                        <button onClick={() => handleDelete(supplier.id)} className="flex-1 min-h-11 flex items-center justify-center gap-1 py-2 text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                          <Trash2 className="w-3 h-3" />{t('common.delete')}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {showForm && (
            <SupplierForm
              initial={editItem || undefined}
              onSave={(data) => handleSave(data)}
              onSaveAndAddAnother={(data) => handleSave(data, { addAnother: true })}
              onCancel={() => { setShowForm(false); setEditItem(null) }}
              t={t}
              categories={categoryOptions}
            />
          )}
        </>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {supplierTemplates.length === 0 ? (
              <div className="col-span-full rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center text-gray-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400">
                <FileText className="mx-auto mb-3 h-10 w-10 opacity-40" />
                <p>{t('suppliers.noTemplates')}</p>
              </div>
            ) : supplierTemplates.map(template => (
              <div key={template.id} className="rounded-2xl border border-gray-200 bg-white p-5 transition-shadow hover:shadow-md dark:border-gray-700 dark:bg-gray-800">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold text-gray-900 dark:text-white">{template.templateName}</h3>
                      {template.systemKey && (
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-700 dark:bg-slate-700 dark:text-slate-200">
                          {t('suppliers.builtInTemplate')}
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-xs text-gray-500">{formatDate(template.createdAt, language)}</p>
                  </div>
                  <FileText className="h-5 w-5 flex-shrink-0 text-blue-500" />
                </div>
                <p className="mt-3 line-clamp-4 text-sm leading-6 text-gray-600 dark:text-gray-300">
                  {templateSnippet(template.templateBody)}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {isOrgAdmin(role) && (
                    <>
                      <button onClick={() => setTemplateEditor(template)} className="flex items-center gap-1.5 rounded-lg bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-700 transition-colors hover:bg-amber-100 dark:bg-amber-900/20 dark:text-amber-300">
                        <Pencil className="h-3.5 w-3.5" /> {t('common.edit')}
                      </button>
                      <button onClick={() => handleDuplicateTemplate(template.id)} className="flex items-center gap-1.5 rounded-lg bg-purple-50 px-3 py-1.5 text-xs font-medium text-purple-700 transition-colors hover:bg-purple-100 dark:bg-purple-900/20 dark:text-purple-300">
                        <Copy className="h-3.5 w-3.5" /> {t('suppliers.duplicateTemplate')}
                      </button>
                      <button onClick={() => handleDeleteTemplate(template.id)} className="flex items-center gap-1.5 rounded-lg bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 transition-colors hover:bg-red-100 dark:bg-red-900/20 dark:text-red-300">
                        <Trash2 className="h-3.5 w-3.5" /> {t('common.delete')}
                      </button>
                    </>
                  )}
                  <button onClick={() => setPreviewTemplate(template)} className="flex items-center gap-1.5 rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 transition-colors hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-300">
                    <Printer className="h-3.5 w-3.5" /> {t('suppliers.printExport')}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {templateEditor && (
            <SupplierTemplateForm
              template={templateEditor === 'new' ? undefined : templateEditor}
              onSave={handleSaveTemplate}
              onCancel={() => setTemplateEditor(null)}
              onPreview={(data) => setPreviewTemplate({ id: 'draft', templateName: data.templateName, templateBody: data.templateBody, createdAt: new Date().toISOString() })}
              t={t}
              language={language}
            />
          )}

          {previewTemplate && (
            <SupplierTemplatePreviewModal
              template={previewTemplate}
              suppliers={suppliers}
              language={language}
              onClose={() => setPreviewTemplate(null)}
              t={t}
            />
          )}
        </>
      )}
    </div>
  )
}