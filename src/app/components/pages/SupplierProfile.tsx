import { useState, useMemo, useRef, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router'
import { ArrowLeft, Plus, Pencil, X, Trash2, Star, Phone, Mail, Globe, MapPin, Clock, Download, Eye, Upload, CheckCircle } from 'lucide-react'
import { toast } from 'sonner'
import { useAppStore } from '../../../store/appStore'
import { cn } from '../../utils/cn'
import { formatDate } from '../../../utils/dateUtils'
import type { SupplierProduct, SupplierDocument, SupplierDocumentType, SupplierAdjustment, CommunicationType } from '../../../types'
import { isOrgAdmin } from '../../../lib/roles'
import { DEFAULT_TRANSACTION_CURRENCY, currenciesForSelect, currencySymbol } from '../../../lib/currencies'

type Tab = 'overview' | 'products' | 'documents' | 'communications' | 'adjustments' | 'tasks' | 'performance' | 'rating'
const TABS: Tab[] = ['overview', 'products', 'documents', 'communications', 'adjustments', 'tasks', 'performance', 'rating']

function ProductForm({ initial, onSave, onCancel, t }: Readonly<{
  initial?: Partial<SupplierProduct>
  onSave: (data: Omit<SupplierProduct, 'id' | 'supplierId' | 'createdAt' | 'updatedAt'>) => void
  onCancel: () => void
  t: ReturnType<typeof useAppStore>['t']
}>) {
  const [form, setForm] = useState({
    name: initial?.name || '',
    category: initial?.category || '',
    sku: initial?.sku || '',
    unitCost: initial?.unitCost || 0,
    currency: initial?.currency || DEFAULT_TRANSACTION_CURRENCY,
    notes: initial?.notes || '',
  })
  const set = (k: string, v: unknown) => setForm(f => ({ ...f, [k]: v }))

  const handleSave = () => {
    if (!form.name.trim() || !form.category.trim()) return
    onSave(form)
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700">
          <h2 className="font-semibold text-gray-900 dark:text-white">
            {initial?.id ? t('suppliers.editProduct') : t('suppliers.addProduct')}
          </h2>
          <button onClick={onCancel} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500"><X className="w-4 h-4" /></button>
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
          <button onClick={handleSave}
            className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors">
            {t('common.save')}
          </button>
          <button onClick={onCancel}
            className="flex-1 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium transition-colors">
            {t('common.cancel')}
          </button>
        </div>
      </div>
    </div>
  )
}

const DOCUMENT_TYPE_OPTIONS: Array<{ value: SupplierDocumentType; label: string }> = [
  { value: 'invoice', label: 'فاتورة' },
  { value: 'contract', label: 'عقد' },
  { value: 'certificate_of_origin', label: 'شهادة منشأ' },
  { value: 'packing_list', label: 'قائمة التعبئة' },
  { value: 'bill_of_lading', label: 'بوليصة شحن' },
  { value: 'customs_declaration', label: 'تصريح جمركي' },
  { value: 'power_of_attorney', label: 'تفويض' },
  { value: 'other', label: 'أخرى' },
]

function documentTypeLabel(document: SupplierDocument): string {
  if (document.documentType === 'other') {
    return document.customDocumentTypeLabel?.trim() || 'أخرى'
  }
  return DOCUMENT_TYPE_OPTIONS.find(option => option.value === document.documentType)?.label || 'أخرى'
}

function getDocumentExpiryState(expiryDate: string | undefined, language: 'ar' | 'fr') {
  if (!expiryDate) {
    return { label: language === 'ar' ? 'بدون انتهاء' : 'Sans expiration', className: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200' }
  }

  const expiry = new Date(expiryDate)
  if (Number.isNaN(expiry.getTime())) {
    return { label: '—', className: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200' }
  }

  const now = new Date()
  const diffDays = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  if (diffDays < 0) {
    return { label: language === 'ar' ? 'منتهي الصلاحية' : 'Expiré', className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' }
  }
  if (diffDays <= 30) {
    return { label: language === 'ar' ? 'ينتهي قريباً' : 'Expire bientôt', className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' }
  }
  return { label: language === 'ar' ? 'ساري' : 'Valide', className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' }
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '')
    reader.onerror = () => reject(new Error('File read failed'))
    reader.readAsDataURL(file)
  })
}

function DocumentForm({
  onSave,
  onCancel,
  t,
  language,
}: Readonly<{
  onSave: (data: Omit<SupplierDocument, 'id' | 'uploadedAt'>) => void
  onCancel: () => void
  t: ReturnType<typeof useAppStore>['t']
  language: 'ar' | 'fr'
}>) {
  const [documentType, setDocumentType] = useState<SupplierDocumentType>('invoice')
  const [customLabel, setCustomLabel] = useState('')
  const [documentNumber, setDocumentNumber] = useState('')
  const [documentDate, setDocumentDate] = useState('')
  const [expiryDate, setExpiryDate] = useState('')
  const [notes, setNotes] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const saveLabel = isSaving
    ? (language === 'ar' ? 'جارٍ الحفظ...' : 'Enregistrement...')
    : t('common.save')

  const canSave = Boolean(documentNumber.trim() && documentDate && file && (documentType !== 'other' || customLabel.trim()))

  const handleSubmit = async () => {
    if (!canSave || !file) return
    if (file.size > 10 * 1024 * 1024) {
      toast.error(language === 'ar' ? 'الملف يجب ألا يتجاوز 10MB' : 'Le fichier ne doit pas dépasser 10 Mo')
      return
    }

    try {
      setIsSaving(true)
      const fileDataUrl = await readFileAsDataUrl(file)
      onSave({
        supplierId: '',
        documentType,
        customDocumentTypeLabel: documentType === 'other' ? customLabel.trim() : undefined,
        documentNumber: documentNumber.trim(),
        documentDate,
        expiryDate: expiryDate || undefined,
        notes: notes.trim() || undefined,
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        fileDataUrl,
      })
    } catch {
      toast.error(language === 'ar' ? 'تعذر قراءة الملف' : 'Impossible de lire le fichier')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl dark:bg-gray-800">
        <div className="flex items-center justify-between border-b border-gray-200 p-5 dark:border-gray-700">
          <h2 className="font-semibold text-gray-900 dark:text-white">{t('suppliers.addDocument')}</h2>
          <button onClick={onCancel} className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4 p-5">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">{t('suppliers.documentType')}</label>
              <select
                value={documentType}
                onChange={e => setDocumentType(e.target.value as SupplierDocumentType)}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              >
                {DOCUMENT_TYPE_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
            {documentType === 'other' && (
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">{language === 'ar' ? 'اسم النوع' : 'Nom du type'}</label>
                <input
                  value={customLabel}
                  onChange={e => setCustomLabel(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">{t('suppliers.documentNumber')}</label>
              <input
                value={documentNumber}
                onChange={e => setDocumentNumber(e.target.value)}
                dir="ltr"
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                placeholder="INV-2024-001"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">{t('suppliers.documentDate')}</label>
              <input
                type="date"
                value={documentDate}
                onChange={e => setDocumentDate(e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">{t('suppliers.expiryDate')}</label>
              <input
                type="date"
                value={expiryDate}
                onChange={e => setExpiryDate(e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">{t('suppliers.uploadFile')}</label>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={e => setFile(e.target.files?.[0] || null)}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 file:mr-3 file:rounded-md file:border-0 file:bg-gray-100 file:px-3 file:py-1.5 file:text-sm file:font-medium dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:file:bg-gray-600 dark:file:text-white"
              />
              {file && <p className="mt-1 text-xs text-gray-500">{file.name}</p>}
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">{t('common.notes')}</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={3}
              className="w-full resize-none rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            />
          </div>
        </div>

        <div className="flex gap-3 border-t border-gray-200 p-5 dark:border-gray-700">
          <button
            onClick={handleSubmit}
            disabled={!canSave || isSaving}
            className="flex-1 rounded-lg bg-blue-600 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saveLabel}
          </button>
          <button
            onClick={onCancel}
            className="flex-1 rounded-lg bg-gray-100 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
          >
            {t('common.cancel')}
          </button>
        </div>
      </div>
    </div>
  )
}

export function SupplierProfile() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { t, language, role, suppliers, supplierProducts, supplierDocuments, supplierCommunications, supplierAdjustments, supplierTasks,
    addSupplierProduct, updateSupplierProduct, deleteSupplierProduct,
    addSupplierDocument, deleteSupplierDocument,
    addSupplierCommunication, deleteSupplierCommunication,
    addSupplierAdjustment, deleteSupplierAdjustment,
    markTaskComplete, deleteSupplierTask,
    getSupplierRating, loadSuppliers } = useAppStore()
  const [activeTab, setActiveTab] = useState<Tab>('overview')
  const [showProductForm, setShowProductForm] = useState(false)
  const [editProduct, setEditProduct] = useState<SupplierProduct | null>(null)
  const [showDocumentForm, setShowDocumentForm] = useState(false)
  const [showCommForm, setShowCommForm] = useState(false)
  const [commForm, setCommForm] = useState({ type: 'phone_call' as CommunicationType, summary: '', date: new Date().toISOString().slice(0, 10) })
  const [showAdjForm, setShowAdjForm] = useState(false)
  const [adjForm, setAdjForm] = useState({ type: 'credit' as SupplierAdjustment['type'], amount: 0, currency: DEFAULT_TRANSACTION_CURRENCY, reason: '', date: new Date().toISOString().slice(0, 10) })

  const supplier = useMemo(() => suppliers.find(s => s.id === id), [suppliers, id])
  const products = useMemo(() => supplierProducts.filter(p => p.supplierId === id), [supplierProducts, id])
  const documents = useMemo(() => supplierDocuments.filter(d => d.supplierId === id), [supplierDocuments, id])
  const communications = useMemo(() => supplierCommunications.filter(c => c.supplierId === id), [supplierCommunications, id])
  const adjustments = useMemo(() => supplierAdjustments.filter(a => a.supplierId === id && !a.isDeleted), [supplierAdjustments, id])
  const tasks = useMemo(() => supplierTasks.filter(t => t.supplierId === id), [supplierTasks, id])
  const existingRating = useMemo(() => id ? getSupplierRating(id) : undefined, [id, getSupplierRating])

  useEffect(() => {
    if (!id) return
    loadSuppliers()
  }, [id, loadSuppliers])

  if (!supplier) {
    return (
      <div className="p-4 lg:p-6">
        <button onClick={() => navigate('/suppliers')} className="flex items-center gap-2 text-blue-500 hover:text-blue-600 mb-4">
          <ArrowLeft className="w-4 h-4" /> {t('common.back')}
        </button>
        <div className="text-center py-16 text-gray-500">{t('common.noData')}</div>
      </div>
    )
  }

  const statusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500'
      case 'inactive': return 'bg-gray-500'
      case 'suspended': return 'bg-amber-500'
      case 'blacklisted': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  const formatCurrency = (amount: number, currency: string) => {
    return currencySymbol(currency) + ' ' + amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  }

  const handleSaveProduct = (data: Omit<SupplierProduct, 'id' | 'supplierId' | 'createdAt' | 'updatedAt'>) => {
    if (!isOrgAdmin(role)) return
    if (editProduct) {
      updateSupplierProduct(editProduct.id, data)
    } else {
      addSupplierProduct({ ...data, supplierId: supplier.id })
    }
    toast.success(t('common.success'))
    setShowProductForm(false)
    setEditProduct(null)
  }

  const handleDeleteProduct = (productId: string) => {
    if (!isOrgAdmin(role)) return
    if (confirm(t('common.confirm'))) {
      deleteSupplierProduct(productId)
      toast.success(t('common.success'))
    }
  }

  const handleSaveDocument = (data: Omit<SupplierDocument, 'id' | 'uploadedAt'>) => {
    if (!isOrgAdmin(role)) return
    if (!supplier) return
    addSupplierDocument({ ...data, supplierId: supplier.id })
    toast.success(t('common.success'))
    setShowDocumentForm(false)
  }

  const handleViewDocument = (doc: SupplierDocument) => {
    const win = window.open(doc.fileDataUrl, '_blank', 'noopener,noreferrer')
    if (!win) toast.error(language === 'ar' ? 'تعذر فتح الملف' : 'Impossible d\'ouvrir le fichier')
  }

  const handleDownloadDocument = (doc: SupplierDocument) => {
    const link = document.createElement('a')
    link.href = doc.fileDataUrl
    link.download = doc.fileName
    link.click()
  }

  return (
    <div className="p-4 lg:p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button onClick={() => navigate('/suppliers')} className="flex items-center gap-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">{t('common.back')}</span>
        </button>
        <div className="flex items-center gap-2">
          <div className={cn('w-2.5 h-2.5 rounded-full', statusColor(supplier.status))} />
          <span className="text-sm text-gray-500 font-mono">{supplier.code}</span>
        </div>
      </div>

      {/* Supplier Header Card */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-white font-bold text-2xl flex-shrink-0">
            {supplier.name.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">{supplier.name}</h1>
            {supplier.nameFr && <p className="text-sm text-gray-500 dark:text-gray-400" dir="ltr">{supplier.nameFr}</p>}
            <div className="flex flex-wrap gap-2 mt-2">
              {supplier.categories.map(cat => (
                <span key={cat} className="px-2.5 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-xs">
                  {t(`suppliers.categoryLabels.${cat}`)}
                </span>
              ))}
            </div>
          </div>
          <div className="text-start">
            <span className="text-sm font-medium text-gray-900 dark:text-white">{t(`suppliers.statuses.${supplier.status}`)}</span>
          </div>
        </div>
      </div>

{/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex gap-4">
          {TABS.map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={cn(
                'pb-3 px-1 text-sm font-medium border-b-2 transition-colors',
                activeTab === tab
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              )}>
              {t(`suppliers.tabs.${tab}`) || t(`suppliers.tabs2.${tab}`)}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Contact Info */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">{t('suppliers.supplierDetails')}</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-xs text-gray-500">{t('suppliers.address')}</p>
                    <p className="text-sm text-gray-900 dark:text-white">{supplier.address}</p>
                    <p className="text-xs text-gray-500">{supplier.city}, {supplier.country}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Clock className="w-4 h-4 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-xs text-gray-500">{t('suppliers.leadTimeDays')}</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{supplier.leadTimeDays} {language === 'ar' ? 'يوم' : 'jours'}</p>
                  </div>
                </div>
                {supplier.phones.map((phone) => (
                  <div key={`${phone.label}-${phone.number}`} className="flex items-start gap-3">
                    <Phone className="w-4 h-4 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-500">{phone.label}</p>
                      <p className="text-sm text-gray-900 dark:text-white" dir="ltr">{phone.number}</p>
                    </div>
                  </div>
                ))}
                {supplier.email && (
                  <div className="flex items-start gap-3">
                    <Mail className="w-4 h-4 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-500">{t('suppliers.email')}</p>
                      <p className="text-sm text-gray-900 dark:text-white" dir="ltr">{supplier.email}</p>
                    </div>
                  </div>
                )}
                {supplier.website && (
                  <div className="flex items-start gap-3">
                    <Globe className="w-4 h-4 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-500">{t('suppliers.website')}</p>
                      <p className="text-sm text-gray-900 dark:text-white" dir="ltr">{supplier.website}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Business Info */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">{t('suppliers.businessNotes') || 'معلومات العمل'}</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-xs text-gray-500">{t('suppliers.primaryContact')}</p>
                  <p className="text-gray-900 dark:text-white">{supplier.primaryContact}</p>
                </div>
                {supplier.secondaryContact && (
                  <div>
                    <p className="text-xs text-gray-500">{t('suppliers.secondaryContact')}</p>
                    <p className="text-gray-900 dark:text-white">{supplier.secondaryContact}</p>
                  </div>
                )}
                <div>
                  <p className="text-xs text-gray-500">{t('suppliers.paymentPreferences')}</p>
                  <p className="text-gray-900 dark:text-white" dir="ltr">{supplier.paymentPreferences}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">{t('suppliers.preferredCurrency')}</p>
                  <p className="text-gray-900 dark:text-white">{supplier.preferredCurrency}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">{t('suppliers.minimumOrderQty')}</p>
                  <p className="text-gray-900 dark:text-white">{supplier.minimumOrderQty}</p>
                </div>
                {supplier.whatsapp && (
                  <div>
                    <p className="text-xs text-gray-500">{t('suppliers.whatsapp')}</p>
                    <p className="text-gray-900 dark:text-white" dir="ltr">{supplier.whatsapp}</p>
                  </div>
                )}
                {supplier.wechat && (
                  <div>
                    <p className="text-xs text-gray-500">{t('suppliers.wechat')}</p>
                    <p className="text-gray-900 dark:text-white" dir="ltr">{supplier.wechat}</p>
                  </div>
                )}
              </div>
              {supplier.businessNotes && (
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <p className="text-xs text-gray-500 mb-1">{t('suppliers.businessNotes')}</p>
                  <p className="text-sm text-gray-700 dark:text-gray-300">{supplier.businessNotes}</p>
                </div>
              )}
            </div>
          </div>

          {/* Balance Overview - Phase 3 */}
          <div className="space-y-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900 dark:text-white">{t('suppliers.balanceOverview')}</h3>
                <button onClick={() => navigate('/suppliers/' + supplier.id + '/statement')} className="text-xs text-blue-500 hover:text-blue-600 flex items-center gap-1">
                  {t('suppliers.viewStatement')} <ArrowLeft className="w-3 h-3 rtl:rotate-180" />
                </button>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">{t('suppliers.totalPurchased')}</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">{formatCurrency(supplier.totalPurchased || 0, supplier.balanceCurrency || 'USD')}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">{t('suppliers.totalPaid')}</span>
                  <span className="text-sm font-medium text-green-600">{formatCurrency(supplier.totalPaid || 0, supplier.balanceCurrency || 'USD')}</span>
                </div>
                <div className="flex justify-between items-center pt-3 border-t border-gray-200 dark:border-gray-700">
                  <span className="text-sm font-medium text-gray-900 dark:text-white">{t('suppliers.outstandingBalance')}</span>
                  <span className={cn('text-lg font-bold', (supplier.outstanding || 0) > 0 ? 'text-red-600' : 'text-green-600')}>
                    {formatCurrency(supplier.outstanding || 0, supplier.balanceCurrency || 'USD')}
                  </span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 pt-1">{t('suppliers.balanceHelper')}</p>
              </div>
            </div>

            {/* Quick Actions — match profile reference: both actions visible */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-4">
              <div className="flex flex-wrap gap-2">
                <button onClick={() => navigate('/suppliers/purchase-orders/new?supplierId=' + supplier.id)} className="flex-1 min-w-[120px] flex items-center justify-center gap-1.5 px-3 py-2 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg text-sm font-medium transition-colors">
                  <Plus className="w-3.5 h-3.5" /> {t('suppliers.addPurchaseOrder')}
                </button>
                <button onClick={() => navigate('/suppliers/payments/new?supplierId=' + supplier.id)} className="flex-1 min-w-[120px] flex items-center justify-center gap-1.5 px-3 py-2 bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30 text-green-700 dark:text-green-300 rounded-lg text-sm font-medium transition-colors">
                  <Plus className="w-3.5 h-3.5" /> {t('suppliers.addPayment')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'products' && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700">
          <div className="p-5 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900 dark:text-white">{t('suppliers.productCatalog')}</h3>
            {isOrgAdmin(role) && (
              <button
                onClick={() => { setEditProduct(null); setShowProductForm(true) }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
              >
                <Plus className="w-4 h-4" />
                {t('suppliers.addProduct')}
              </button>
            )}
          </div>

          {products.length === 0 ? (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400">
              <p>{t('suppliers.noProducts')}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-900/50">
                  <tr>
                    <th className="px-5 py-3 text-start text-xs font-medium text-gray-500 uppercase">{t('suppliers.productName')}</th>
                    <th className="px-5 py-3 text-start text-xs font-medium text-gray-500 uppercase">{t('goods.category')}</th>
                    <th className="px-5 py-3 text-start text-xs font-medium text-gray-500 uppercase">{t('suppliers.sku')}</th>
                    <th className="px-5 py-3 text-end text-xs font-medium text-gray-500 uppercase">{t('suppliers.unitCost')}</th>
                    <th className="px-5 py-3 text-end text-xs font-medium text-gray-500 uppercase">{t('common.actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {products.map(product => (
                    <tr key={product.id} className="hover:bg-gray-50 dark:hover:bg-gray-900/50">
                      <td className="px-5 py-4 text-sm text-gray-900 dark:text-white">{product.name}</td>
                      <td className="px-5 py-4 text-sm text-gray-500 dark:text-gray-400">{product.category}</td>
                      <td className="px-5 py-4 text-sm text-gray-500 dark:text-gray-400 font-mono" dir="ltr">{product.sku || '—'}</td>
                      <td className="px-5 py-4 text-sm text-gray-900 dark:text-white text-end font-mono" dir="ltr">
                        {product.unitCost.toFixed(2)} {product.currency}
                      </td>
                      <td className="px-5 py-4 text-end">
                        <div className="flex items-center justify-end gap-1">
                          {isOrgAdmin(role) && (
                            <>
                              <button onClick={() => { setEditProduct(product); setShowProductForm(true) }}
                                className="p-1.5 text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-lg">
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <button onClick={() => handleDeleteProduct(product.id)}
                                className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'documents' && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700">
          <div className="p-5 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900 dark:text-white">{t('suppliers.documents')}</h3>
            {isOrgAdmin(role) && (
              <button onClick={() => setShowDocumentForm(true)} className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors">
                <Plus className="w-4 h-4" /> {t('suppliers.addDocument')}
              </button>
            )}
          </div>
          {documents.length === 0 ? (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400">
              <Upload className="mx-auto mb-3 h-10 w-10 opacity-40" />
              <p>{t('suppliers.noDocuments')}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-900/50">
                  <tr>
                    <th className="px-5 py-3 text-start text-xs font-medium text-gray-500 uppercase">{t('suppliers.documentType')}</th>
                    <th className="px-5 py-3 text-start text-xs font-medium text-gray-500 uppercase">{t('suppliers.documentNumber')}</th>
                    <th className="px-5 py-3 text-start text-xs font-medium text-gray-500 uppercase">{t('suppliers.documentDate')}</th>
                    <th className="px-5 py-3 text-start text-xs font-medium text-gray-500 uppercase">{t('suppliers.expiryDate')}</th>
                    <th className="px-5 py-3 text-start text-xs font-medium text-gray-500 uppercase">{t('common.notes')}</th>
                    <th className="px-5 py-3 text-end text-xs font-medium text-gray-500 uppercase">{t('common.actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {documents.map(doc => (
                    <tr key={doc.id} className="hover:bg-gray-50 dark:hover:bg-gray-900/50">
                      <td className="px-5 py-4 text-sm text-gray-900 dark:text-white">
                        <span className="inline-flex rounded-full bg-blue-100 px-2.5 py-1 text-xs font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                          {documentTypeLabel(doc)}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-sm font-mono text-gray-900 dark:text-white" dir="ltr">{doc.documentNumber}</td>
                      <td className="px-5 py-4 text-sm text-gray-500 dark:text-gray-400">{formatDate(doc.documentDate, language)}</td>
                      <td className="px-5 py-4 text-sm text-gray-500 dark:text-gray-400">
                        <span className={cn('inline-flex rounded-full px-2.5 py-1 text-xs font-medium', getDocumentExpiryState(doc.expiryDate, language).className)}>
                          {getDocumentExpiryState(doc.expiryDate, language).label}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-sm text-gray-500 dark:text-gray-400">
                        <div className="max-w-xs truncate">{doc.notes || '—'}</div>
                      </td>
                      <td className="px-5 py-4 text-end">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => handleViewDocument(doc)} className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg" title={t('common.view')}>
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => handleDownloadDocument(doc)} className="p-1.5 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg" title={t('common.download') || 'Download'}>
                            <Download className="w-3.5 h-3.5" />
                          </button>
                          {isOrgAdmin(role) && (
                            <button onClick={() => { if (confirm(t('common.confirm'))) { deleteSupplierDocument(doc.id); toast.success(t('common.success')) } }} className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg" title={t('common.delete')}>
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'communications' && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700">
          <div className="p-5 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900 dark:text-white">{t('suppliers.communications')}</h3>
            <button onClick={() => setShowCommForm(!showCommForm)} className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm">
              <Plus className="w-4 h-4" /> {t('suppliers.addCommunication')}
            </button>
          </div>
          {showCommForm && (
            <div className="p-5 border-b border-gray-200 dark:border-gray-700 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">{t('suppliers.communicationType')}</label>
                  <select value={commForm.type} onChange={e => setCommForm(f => ({ ...f, type: e.target.value as CommunicationType }))}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm">
                    {(['phone_call', 'meeting', 'email', 'wechat', 'whatsapp', 'other'] as CommunicationType[]).map(ct => (
                      <option key={ct} value={ct}>{t(`suppliers.communicationTypes.${ct}`)}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">{t('common.date')}</label>
                  <input type="date" value={commForm.date} onChange={e => setCommForm(f => ({ ...f, date: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm" />
                </div>
                <div className="sm:col-span-1 flex items-end">
                  <button
                    onClick={async () => {
                      if (!id || !commForm.summary.trim()) return
                      await addSupplierCommunication({ supplierId: id, type: commForm.type, summary: commForm.summary, date: commForm.date, followUpRequired: false })
                      setCommForm({ type: 'phone_call', summary: '', date: new Date().toISOString().slice(0, 10) })
                      setShowCommForm(false)
                      toast.success(t('common.success'))
                    }}
                    className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm"
                  >{t('common.save')}</button>
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">{t('suppliers.summary')}</label>
                <input value={commForm.summary} onChange={e => setCommForm(f => ({ ...f, summary: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm" />
              </div>
            </div>
          )}
          {communications.length === 0 ? (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400"><p>{t('suppliers.noCommunications')}</p></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-900/50">
                  <tr>
                    <th className="px-5 py-3 text-start text-xs font-medium text-gray-500 uppercase">{t('suppliers.communicationType')}</th>
                    <th className="px-5 py-3 text-start text-xs font-medium text-gray-500 uppercase">{t('suppliers.summary')}</th>
                    <th className="px-5 py-3 text-start text-xs font-medium text-gray-500 uppercase">{t('common.date')}</th>
                    <th className="px-5 py-3 text-start text-xs font-medium text-gray-500 uppercase">{t('common.actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {communications.map(com => (
                    <tr key={com.id} className="hover:bg-gray-50 dark:hover:bg-gray-900/50">
                      <td className="px-5 py-4 text-sm text-gray-900 dark:text-white">{t(`suppliers.communicationTypes.${com.type}`)}</td>
                      <td className="px-5 py-4 text-sm text-gray-500 dark:text-gray-400">{com.summary}</td>
                      <td className="px-5 py-4 text-sm text-gray-500 dark:text-gray-400">{com.date}</td>
                      <td className="px-5 py-4 text-end">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => deleteSupplierCommunication(com.id)} className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'adjustments' && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700">
          <div className="p-5 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900 dark:text-white">{t('suppliers.adjustments')}</h3>
            {isOrgAdmin(role) && (
              <button onClick={() => setShowAdjForm(!showAdjForm)} className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm">
                <Plus className="w-4 h-4" /> {t('suppliers.addAdjustment')}
              </button>
            )}
          </div>
          {showAdjForm && (
            <div className="p-5 border-b border-gray-200 dark:border-gray-700 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">{t('suppliers.adjustmentType')}</label>
                <select value={adjForm.type} onChange={e => setAdjForm(f => ({ ...f, type: e.target.value as SupplierAdjustment['type'] }))}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm">
                  <option value="credit">{t('suppliers.adjustmentTypes.credit')}</option>
                  <option value="debit">{t('suppliers.adjustmentTypes.debit')}</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">{t('common.amount')}</label>
                <input type="number" min="0" step="0.01" value={adjForm.amount || ''} onChange={e => setAdjForm(f => ({ ...f, amount: parseFloat(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">{t('common.currency')}</label>
                <select value={adjForm.currency} onChange={e => setAdjForm(f => ({ ...f, currency: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm">
                  {currenciesForSelect(adjForm.currency).map(c => <option key={c.code} value={c.code}>{c.code}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">{t('common.date')}</label>
                <input type="date" value={adjForm.date} onChange={e => setAdjForm(f => ({ ...f, date: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm" />
              </div>
              <div className="flex items-end">
                <button
                  onClick={async () => {
                    if (!isOrgAdmin(role)) return
                    if (!id || !adjForm.amount || !adjForm.reason.trim()) return
                    await addSupplierAdjustment({ supplierId: id, ...adjForm })
                    setAdjForm({ type: 'credit', amount: 0, currency: DEFAULT_TRANSACTION_CURRENCY, reason: '', date: new Date().toISOString().slice(0, 10) })
                    setShowAdjForm(false)
                    toast.success(t('common.success'))
                  }}
                  className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm"
                >{t('common.save')}</button>
              </div>
              <div className="sm:col-span-2 lg:col-span-5">
                <label className="block text-xs text-gray-500 mb-1">{t('suppliers.reason')}</label>
                <input value={adjForm.reason} onChange={e => setAdjForm(f => ({ ...f, reason: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm" />
              </div>
            </div>
          )}
          {adjustments.length === 0 ? (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400"><p>{t('common.noData')}</p></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-900/50">
                  <tr>
                    <th className="px-5 py-3 text-start text-xs font-medium text-gray-500 uppercase">{t('common.date')}</th>
                    <th className="px-5 py-3 text-start text-xs font-medium text-gray-500 uppercase">{t('suppliers.adjustmentType')}</th>
                    <th className="px-5 py-3 text-end text-xs font-medium text-gray-500 uppercase">{t('common.amount')}</th>
                    <th className="px-5 py-3 text-start text-xs font-medium text-gray-500 uppercase">{t('suppliers.reason')}</th>
                    <th className="px-5 py-3 text-start text-xs font-medium text-gray-500 uppercase">{t('common.actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {adjustments.map(adj => (
                    <tr key={adj.id} className="hover:bg-gray-50 dark:hover:bg-gray-900/50">
                      <td className="px-5 py-4 text-sm text-gray-500">{adj.date}</td>
                      <td className="px-5 py-4 text-sm">{t(`suppliers.adjustmentTypes.${adj.type}`)}</td>
                      <td className="px-5 py-4 text-end text-sm font-mono">{adj.amount.toLocaleString()} {adj.currency}</td>
                      <td className="px-5 py-4 text-sm text-gray-500">{adj.reason}</td>
                      <td className="px-5 py-4 text-end">
                        {isOrgAdmin(role) && (
                          <button onClick={() => deleteSupplierAdjustment(adj.id)} className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'tasks' && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700">
          <div className="p-5 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900 dark:text-white">{t('suppliers.tasks')}</h3>
            <button onClick={() => navigate('/suppliers/tasks/new?supplierId=' + id)} className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors">
              <Plus className="w-4 h-4" /> {t('suppliers.addTask')}
            </button>
          </div>
          {tasks.length === 0 ? (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400"><p>{t('suppliers.noTasks')}</p></div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {tasks.map(task => (
                <div key={task.id} className="p-5 hover:bg-gray-50 dark:hover:bg-gray-900/50">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-gray-900 dark:text-white">{task.title}</h4>
                        <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium',
                          task.status === 'completed' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                        )}>
                          {task.status === 'completed' ? t('suppliers.taskCompleted') : t('suppliers.taskPending')}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{task.description}</p>
                      <p className="text-xs text-gray-400 mt-1">{t('suppliers.dueDate')}: {task.dueDate}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      {task.status !== 'completed' && (
                        <button onClick={() => markTaskComplete(task.id)} className="p-1.5 text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg" title={t('suppliers.markComplete')}>
                          <CheckCircle className="w-4 h-4" />
                        </button>
                      )}
                      <button onClick={() => deleteSupplierTask(task.id)} className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'performance' && (
        <div className="space-y-5">
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900 dark:text-white">{t('suppliers.performance')}</h3>
              <button onClick={() => navigate('/suppliers/' + id + '/performance')} className="text-sm text-blue-500 hover:text-blue-600">
                {t('suppliers.viewPerformance')} →
              </button>
            </div>
            {existingRating ? (
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl">
                  <p className="text-xs text-gray-500 mb-1">{t('suppliers.overallRating')}</p>
                  <div className="flex items-center justify-center gap-1">
                    {[1,2,3,4,5].map(s => (
                      <Star key={s} className={cn('w-4 h-4', s <= Math.round(existingRating.overall) ? 'fill-amber-400 text-amber-400' : 'text-gray-300 dark:text-gray-600')} />
                    ))}
                  </div>
                  <p className="text-lg font-bold text-gray-900 dark:text-white mt-1">{existingRating.overall.toFixed(1)}</p>
                </div>
                <div className="text-center p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl">
                  <p className="text-xs text-gray-500 mb-1">{t('suppliers.rateQuality')}</p>
                  <div className="flex items-center justify-center gap-1 mt-2">
                    {[1,2,3,4,5].map(s => (
                      <Star key={s} className={cn('w-4 h-4', s <= existingRating.quality ? 'fill-amber-400 text-amber-400' : 'text-gray-300 dark:text-gray-600')} />
                    ))}
                  </div>
                </div>
                <div className="text-center p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl">
                  <p className="text-xs text-gray-500 mb-1">{t('suppliers.rateDeliverySpeed')}</p>
                  <div className="flex items-center justify-center gap-1 mt-2">
                    {[1,2,3,4,5].map(s => (
                      <Star key={s} className={cn('w-4 h-4', s <= existingRating.deliverySpeed ? 'fill-amber-400 text-amber-400' : 'text-gray-300 dark:text-gray-600')} />
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <Star className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
                <p className="text-gray-500 dark:text-gray-400">{t('suppliers.unrated')}</p>
                <button onClick={() => navigate('/suppliers/' + id + '/performance')} className="mt-3 text-sm text-blue-500 hover:text-blue-600">
                  {t('suppliers.rateSupplier')}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'rating' && (
        <div className="space-y-5">
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900 dark:text-white">{t('suppliers.rating')}</h3>
              <button onClick={() => navigate('/suppliers/' + id + '/performance')} className="text-sm text-blue-500 hover:text-blue-600">
                {existingRating ? t('suppliers.saveRating') : t('suppliers.rateSupplier')}
              </button>
            </div>
            {existingRating ? (
              <div className="space-y-4">
                <div className="flex items-center justify-center py-4">
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 mb-2">
                      {[1,2,3,4,5].map(s => (
                        <Star key={s} className={cn('w-6 h-6', s <= Math.round(existingRating.overall) ? 'fill-amber-400 text-amber-400' : 'text-gray-300 dark:text-gray-600')} />
                      ))}
                    </div>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">{existingRating.overall.toFixed(1)} / 5</p>
                    <p className="text-sm text-gray-500 mt-1">{t('suppliers.overallRating')}</p>
                  </div>
                </div>
                {existingRating.note && (
                  <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl">
                    <p className="text-xs text-gray-500 mb-1">{t('common.notes')}</p>
                    <p className="text-sm text-gray-700 dark:text-gray-300">{existingRating.note}</p>
                  </div>
                )}
                <div className="text-xs text-gray-400 text-center">
                  {t('suppliers.ratedAt')}: {new Date(existingRating.ratedAt).toLocaleDateString(language === 'ar' ? 'ar-DZ' : 'fr-FR')}
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <Star className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
                <p className="text-gray-500 dark:text-gray-400">{t('suppliers.unrated')}</p>
                <button onClick={() => navigate('/suppliers/' + id + '/performance')} className="mt-3 flex items-center gap-1.5 mx-auto px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium">
                  <Plus className="w-4 h-4" /> {t('suppliers.rateSupplier')}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {showProductForm && (
        <ProductForm
          initial={editProduct || undefined}
          onSave={handleSaveProduct}
          onCancel={() => { setShowProductForm(false); setEditProduct(null) }}
          t={t}
        />
      )}

      {showDocumentForm && (
        <DocumentForm
          onSave={handleSaveDocument}
          onCancel={() => setShowDocumentForm(false)}
          t={t}
          language={language}
        />
      )}
    </div>
  )
}