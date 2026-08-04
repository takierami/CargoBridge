import { useState, useMemo, useEffect } from 'react'
import { useNavigate, useParams, useSearchParams, useLocation } from 'react-router'
import { Plus, Search, X, Pencil, Trash2, Printer } from 'lucide-react'
import { toast } from 'sonner'
import { useAppStore } from '../../../store/appStore'
import { cn } from '../../utils/cn'
import type { PurchaseOrder, POStatus, Supplier, PurchaseOrderItem, SupplierProduct } from '../../../types'
import { isOrgAdmin } from '../../../lib/roles'
import { ReceiptPrintModal } from '../ReceiptPrintModal'
import type { POReceiptData } from '../ReceiptPrintModal'
import { SupplierQuickCreate } from '../quick-create/SupplierQuickCreate'
import { ProductQuickCreate } from '../quick-create/ProductQuickCreate'
import { CurrencyQuickCreate } from '../quick-create/CurrencyQuickCreate'
import {
  DEFAULT_TRANSACTION_CURRENCY,
  currenciesForSelect,
  currencyOptionLabel,
  currencySymbol,
} from '../../../lib/currencies'
import { ResponsiveDataList } from '../ui/ResponsiveDataList'
import { TOUCH_ICON_BTN } from '../ui/responsive'

const PO_STATUSES: POStatus[] = ['draft', 'sent', 'confirmed', 'in_production', 'ready', 'shipped', 'received', 'cancelled']

interface POFormItem {
  id: string
  productName: string
  quantity: number
  unitCost: number
  isCustom: boolean
  selectedProduct?: string
}

interface POFormData {
  supplierId: string
  orderDate: string
  expectedCompletionDate: string
  currency: string
  status: POStatus
  notes: string
  items: POFormItem[]
}

function emptyLineItem(): POFormItem {
  return {
    id: crypto.randomUUID(),
    productName: '',
    quantity: 1,
    unitCost: 0,
    isCustom: true,
    selectedProduct: '',
  }
}

export function PurchaseOrderForm({
  initial,
  onSave,
  onCancel,
  t,
  language,
  suppliers,
  supplierProducts,
  canQuickAdd = false,
  nested = false,
}: {
  initial?: (Partial<PurchaseOrder> & { items?: Omit<PurchaseOrderItem, 'purchaseOrderId' | 'createdAt' | 'updatedAt'>[] }) | null
  onSave: (data: POFormData, options?: { addAnother?: boolean }) => void | Promise<void>
  onCancel: () => void
  t: ReturnType<typeof useAppStore>['t']
  language: 'ar' | 'fr'
  suppliers: Supplier[]
  supplierProducts: SupplierProduct[]
  canQuickAdd?: boolean
  nested?: boolean
}) {
  const addSupplier = useAppStore(s => s.addSupplier)
  const addSupplierProduct = useAppStore(s => s.addSupplierProduct)
  const [showSupplierQuick, setShowSupplierQuick] = useState(false)
  const [showProductQuick, setShowProductQuick] = useState(false)
  const [showCurrencyQuick, setShowCurrencyQuick] = useState(false)
  const [currencyListTick, setCurrencyListTick] = useState(0)
  const [supplierId, setSupplierId] = useState(initial?.supplierId || '')
  const [orderDate, setOrderDate] = useState(initial?.orderDate || new Date().toISOString().split('T')[0])
  const [expectedCompletionDate, setExpectedCompletionDate] = useState(initial?.expectedCompletionDate || '')
  const [currency, setCurrency] = useState(
    initial?.currency
      || suppliers.find(s => s.id === (initial?.supplierId || ''))?.preferredCurrency
      || DEFAULT_TRANSACTION_CURRENCY
  )
  const [status, setStatus] = useState<POStatus>(initial?.status || 'draft')
  const [notes, setNotes] = useState(initial?.notes || '')
  const [saving, setSaving] = useState(false)

  const availableProducts = useMemo(() => {
    return supplierProducts.filter(p => p.supplierId === supplierId)
  }, [supplierProducts, supplierId])

  const [items, setItems] = useState<POFormItem[]>(() => {
    if (initial?.items && initial.items.length > 0) {
      return initial.items.map(item => ({
        id: item.id || crypto.randomUUID(),
        productName: item.productName,
        quantity: item.quantity,
        unitCost: item.unitCost,
        isCustom: true,
        selectedProduct: '',
      }))
    }
    return [emptyLineItem()]
  })

  // If supplierId changes, clear product selections and adopt preferred currency
  useEffect(() => {
    if (supplierId && supplierId !== initial?.supplierId) {
      setItems([emptyLineItem()])
      const supplier = suppliers.find(s => s.id === supplierId)
      if (supplier?.preferredCurrency) {
        setCurrency(supplier.preferredCurrency)
      }
    }
  }, [supplierId, initial?.supplierId, suppliers])

  const addItem = () => {
    setItems(prev => [...prev, emptyLineItem()])
  }

  const removeItem = (index: number) => {
    setItems(prev => prev.filter((_, i) => i !== index))
  }

  const updateItem = (index: number, field: keyof POFormItem, value: any) => {
    setItems(prev => prev.map((item, i) => {
      if (i !== index) return item
      return { ...item, [field]: value }
    }))
  }

  const selectProduct = (index: number, productId: string) => {
    if (!productId) {
      updateItem(index, 'selectedProduct', '')
      return
    }
    const product = availableProducts.find(p => p.id === productId)
    if (!product) return
    setItems(prev => prev.map((item, i) => {
      if (i !== index) return item
      return {
        ...item,
        selectedProduct: productId,
        productName: product.name,
        unitCost: product.unitCost,
        isCustom: false,
      }
    }))
    setCurrency(product.currency || currency)
  }

  const totalAmount = useMemo(() => {
    return items.reduce((sum, item) => sum + (item.quantity * item.unitCost), 0)
  }, [items])

  const resetForAnother = () => {
    setOrderDate(new Date().toISOString().split('T')[0])
    setExpectedCompletionDate('')
    // Keep profile-create default (confirmed); free create stays draft
    setStatus((!initial?.id && initial?.status) ? initial.status : 'draft')
    setNotes('')
    setItems([emptyLineItem()])
    const supplier = suppliers.find(s => s.id === supplierId)
    if (supplier?.preferredCurrency) setCurrency(supplier.preferredCurrency)
  }

  const handleSave = async (addAnother = false) => {
    if (!supplierId) {
      toast.error(t('suppliers.selectSupplier'))
      return
    }
    if (items.length === 0) return
    const missingNameOrQty = items.some(item => !item.productName.trim() || item.quantity < 1)
    const missingCost = items.some(item => !(item.unitCost > 0))
    if (missingNameOrQty || missingCost) {
      toast.error(missingCost ? t('suppliers.unitCostRequired') : (
        language === 'ar' ? 'يرجى ملء جميع بنود الطلب بشكل صحيح' : 'Veuillez remplir correctement tous les éléments de la commande'
      ))
      return
    }
    setSaving(true)
    try {
      await onSave({
        supplierId,
        orderDate,
        expectedCompletionDate,
        currency,
        status,
        notes,
        items,
      }, { addAnother })
      if (addAnother) resetForAnother()
    } finally {
      setSaving(false)
    }
  }

  const formatItemCurrency = (amount: number) => {
    return currencySymbol(currency) + ' ' + amount.toFixed(2)
  }

  return (
    <div className={`fixed inset-0 bg-black/50 ${nested ? 'z-[60]' : 'z-50'} flex items-center justify-center p-4`}>
      <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700">
          <h2 className="font-semibold text-gray-900 dark:text-white">
            {initial?.id ? t('suppliers.editPurchaseOrder') : t('suppliers.addPurchaseOrder')}
          </h2>
          <button onClick={onCancel} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Supplier and Date Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('suppliers.supplierName')} *
              </label>
              <div className="flex gap-2">
                <select
                  value={supplierId}
                  onChange={e => setSupplierId(e.target.value)}
                  disabled={Boolean(initial?.id)}
                  className="flex-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  <option value="">{language === 'ar' ? 'اختر مورداً...' : 'Sélectionner un fournisseur...'}</option>
                  {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
                {canQuickAdd && !initial?.id && (
                  <button
                    type="button"
                    onClick={() => setShowSupplierQuick(true)}
                    title={t('common.addNew')}
                    className="shrink-0 px-2.5 py-2 rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('suppliers.orderDate')} *
              </label>
              <input
                type="date"
                value={orderDate}
                onChange={e => setOrderDate(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('suppliers.expectedCompletionDate')}
              </label>
              <input
                type="date"
                value={expectedCompletionDate}
                onChange={e => setExpectedCompletionDate(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('suppliers.selectCurrency')}
              </label>
              <div className="flex gap-2">
                <select
                  key={currencyListTick}
                  value={currency}
                  onChange={e => setCurrency(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500"
                >
                  {currenciesForSelect(currency).map(c => (
                    <option key={c.code} value={c.code}>
                      {currencyOptionLabel(c.code, language)}
                    </option>
                  ))}
                </select>
                {canQuickAdd && (
                  <button
                    type="button"
                    onClick={() => setShowCurrencyQuick(true)}
                    title={t('common.addNew')}
                    className="shrink-0 px-2.5 py-2 rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('common.status')}
              </label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value as POStatus)}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500"
              >
                {PO_STATUSES.map(s => <option key={s} value={s}>{t('suppliers.poStatuses.' + s)}</option>)}
              </select>
            </div>
          </div>

          {/* Line Items Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-700 pb-2">
              <h3 className="font-semibold text-gray-900 dark:text-white text-sm">
                {t('suppliers.lineItems')}
              </h3>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={addItem}
                  disabled={!supplierId}
                  className="flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 disabled:opacity-50"
                >
                  <Plus className="w-3.5 h-3.5" /> {t('suppliers.addLineItem')}
                </button>
                {canQuickAdd && supplierId && (
                  <button
                    type="button"
                    onClick={() => setShowProductQuick(true)}
                    className="flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 disabled:opacity-50"
                  >
                    <Plus className="w-3.5 h-3.5" /> {t('common.addNew')} {t('suppliers.productName')}
                  </button>
                )}
              </div>
            </div>

            {!supplierId ? (
              <div className="text-center py-6 text-sm text-gray-400 dark:text-gray-500">
                {language === 'ar' ? 'يرجى اختيار مورد أولاً لإضافة البنود' : 'Veuillez d\'abord sélectionner un fournisseur pour ajouter des articles'}
              </div>
            ) : (
              <div className="space-y-3 max-h-[35vh] overflow-y-auto pr-1">
                {items.map((item, idx) => (
                  <div
                    key={item.id}
                    className="rounded-xl border border-gray-100 dark:border-gray-700 p-3 space-y-3 md:grid md:grid-cols-12 md:gap-3 md:items-start md:space-y-0 md:rounded-none md:border-0 md:border-b md:border-gray-50 dark:md:border-gray-700/50 md:p-0 md:pb-3 last:md:border-0 last:md:pb-0"
                  >
                    <div className="md:col-span-5 space-y-1">
                      <label className="block text-xs font-medium text-gray-500 md:hidden">{t('suppliers.productName')}</label>
                      {availableProducts.length > 0 && (
                        <select
                          value={item.selectedProduct || ''}
                          onChange={e => selectProduct(idx, e.target.value)}
                          className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2.5 text-base sm:text-sm focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">{language === 'ar' ? 'منتج مخصص / اختر من الكتالوج' : 'Personnalisé / catalogue'}</option>
                          {availableProducts.map(p => (
                            <option key={p.id} value={p.id}>
                              {p.name} ({p.unitCost} {p.currency})
                            </option>
                          ))}
                        </select>
                      )}
                      <input
                        type="text"
                        placeholder={language === 'ar' ? 'اسم المنتج' : 'Nom du produit'}
                        value={item.productName}
                        onChange={e => updateItem(idx, 'productName', e.target.value)}
                        className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2.5 text-base sm:text-sm focus:ring-2 focus:ring-blue-500 font-medium"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3 md:contents">
                      <div className="md:col-span-2">
                        <label className="block text-xs font-medium text-gray-500 md:hidden">{t('suppliers.quantity')}</label>
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={e => updateItem(idx, 'quantity', Math.max(1, Number(e.target.value)))}
                          className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2.5 text-base sm:text-sm focus:ring-2 focus:ring-blue-500 font-mono text-center"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-xs font-medium text-gray-500 md:hidden">{t('suppliers.unitCost')}</label>
                        <input
                          type="number"
                          min="0.01"
                          step="0.01"
                          value={item.unitCost || ''}
                          onChange={e => updateItem(idx, 'unitCost', Math.max(0, Number(e.target.value)))}
                          placeholder="0.00"
                          className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2.5 text-base sm:text-sm focus:ring-2 focus:ring-blue-500 font-mono text-end"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between md:col-span-2 md:block md:text-end md:self-center font-mono text-sm text-gray-900 dark:text-white md:pr-2">
                      <label className="text-xs font-medium text-gray-500 md:hidden">{t('common.total')}</label>
                      <span>{formatItemCurrency(item.quantity * item.unitCost)}</span>
                    </div>

                    <div className="flex justify-end md:col-span-1 md:text-center md:self-center md:justify-center">
                      <button
                        type="button"
                        onClick={() => removeItem(idx)}
                        disabled={items.length === 1}
                        className="min-h-11 min-w-11 inline-flex items-center justify-center text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg disabled:opacity-30 disabled:hover:bg-transparent"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Notes Section */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('common.notes')}
            </label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-5 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/30 rounded-b-2xl">
          <div className="text-start">
            <span className="text-xs text-gray-500 dark:text-gray-400 block">{t('common.total')}</span>
            <span className="text-lg font-bold text-gray-900 dark:text-white font-mono">{formatItemCurrency(totalAmount)}</span>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => handleSave(false)}
              disabled={!supplierId || items.length === 0 || saving}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
            >
              {t('common.save')}
            </button>
            {!initial?.id && (
              <button
                onClick={() => handleSave(true)}
                disabled={!supplierId || items.length === 0 || saving}
                className="px-4 py-2 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
              >
                {t('suppliers.saveAndAddAnother')}
              </button>
            )}
            <button
              onClick={onCancel}
              className="px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium transition-colors"
            >
              {t('common.cancel')}
            </button>
          </div>
        </div>
      </div>
      {showSupplierQuick && (
        <SupplierQuickCreate
          nested
          onCancel={() => setShowSupplierQuick(false)}
          onSave={async (data) => {
            try {
              const created = await addSupplier(data)
              setSupplierId(created.id)
              if (created.preferredCurrency) setCurrency(created.preferredCurrency)
              setShowSupplierQuick(false)
              toast.success(t('common.success'))
            } catch (err) {
              toast.error(err instanceof Error ? err.message : t('common.error'))
            }
          }}
        />
      )}
      {showProductQuick && supplierId && (
        <ProductQuickCreate
          nested
          onCancel={() => setShowProductQuick(false)}
          onSave={async (data) => {
            try {
              const created = await addSupplierProduct({ ...data, supplierId })
              setItems(prev => [...prev, {
                id: crypto.randomUUID(),
                productName: created.name,
                quantity: 1,
                unitCost: created.unitCost,
                isCustom: false,
                selectedProduct: created.id,
              }])
              setShowProductQuick(false)
              toast.success(t('common.success'))
            } catch (err) {
              toast.error(err instanceof Error ? err.message : t('common.error'))
            }
          }}
        />
      )}
      {showCurrencyQuick && (
        <CurrencyQuickCreate
          nested
          onCancel={() => setShowCurrencyQuick(false)}
          onSave={async (code) => {
            setCurrency(code)
            setCurrencyListTick(n => n + 1)
            setShowCurrencyQuick(false)
            toast.success(t('common.success'))
          }}
        />
      )}
    </div>
  )
}

export function PurchaseOrders() {
  const { t, language, role, purchaseOrders, suppliers, supplierProducts, purchaseOrderItems, addPurchaseOrder, updatePurchaseOrder, updatePurchaseOrderStatus } = useAppStore()
  const navigate = useNavigate()
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const supplierIdParam = searchParams.get('supplierId')
  const location = useLocation()
  const isNew = id === 'new' || location.pathname.endsWith('/new')

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [supplierFilter, setSupplierFilter] = useState<string>('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editItem, setEditItem] = useState<(Partial<PurchaseOrder> & { items?: Omit<PurchaseOrderItem, 'purchaseOrderId' | 'createdAt' | 'updatedAt'>[] }) | null>(null)
  const [receiptData, setReceiptData] = useState<POReceiptData | null>(null)

  const currentPO = useMemo(() => {
    if (!id || id === 'new' || isNew) return null
    const po = purchaseOrders.find(p => p.id === id)
    if (!po) return null
    const items = purchaseOrderItems.filter(item => item.purchaseOrderId === po.id)
    return { ...po, items }
  }, [id, isNew, purchaseOrders, purchaseOrderItems])

  useEffect(() => {
    if (currentPO) {
      setEditItem(currentPO)
      setShowForm(true)
    } else if (id === 'new' || isNew) {
      setEditItem(supplierIdParam
        ? { supplierId: supplierIdParam, status: 'confirmed' }
        : null)
      setShowForm(true)
    } else {
      setShowForm(false)
      setEditItem(null)
    }
  }, [currentPO, id, isNew, supplierIdParam])

  const handleSaveForm = async (data: POFormData, options?: { addAnother?: boolean }) => {
    if (!isOrgAdmin(role)) {
      toast.error(t('common.error'))
      return
    }
    const itemsToSave = data.items.map(item => ({
      productName: item.productName,
      quantity: item.quantity,
      unitCost: item.unitCost,
    }))

    let savedPoNumber = editItem?.poNumber ?? ''
    let receiptStatus = data.status
    try {
      if (editItem?.id) {
        if (editItem.status && editItem.status !== data.status) {
          const statusResult = await updatePurchaseOrderStatus(editItem.id, data.status)
          if (!statusResult.success) {
            toast.error(statusResult.error || t('common.error'))
            return
          }
        }
        const updated = await updatePurchaseOrder(editItem.id, {
          supplierId: data.supplierId,
          orderDate: data.orderDate,
          expectedCompletionDate: data.expectedCompletionDate || undefined,
          currency: data.currency,
          notes: data.notes || undefined,
          items: itemsToSave,
        })
        if (updated?.status) receiptStatus = updated.status
      } else {
        let saved = await addPurchaseOrder({
          supplierId: data.supplierId,
          orderDate: data.orderDate,
          expectedCompletionDate: data.expectedCompletionDate || undefined,
          currency: data.currency,
          status: data.status,
          notes: data.notes || undefined,
          items: itemsToSave,
        })
        savedPoNumber = saved.poNumber
        // Belt-and-suspenders: if API still returned draft but form asked confirmed, advance.
        if (data.status === 'confirmed' && saved.status === 'draft') {
          const toSent = await updatePurchaseOrderStatus(saved.id, 'sent')
          if (toSent.success) {
            const toConfirmed = await updatePurchaseOrderStatus(saved.id, 'confirmed')
            if (toConfirmed.success) {
              saved = { ...saved, status: 'confirmed' }
            }
          }
        } else if (data.status === 'sent' && saved.status === 'draft') {
          const toSent = await updatePurchaseOrderStatus(saved.id, 'sent')
          if (toSent.success) saved = { ...saved, status: 'sent' }
        }
        receiptStatus = saved.status
      }
    } catch {
      toast.error(t('common.error'))
      return
    }
    toast.success(t('common.success'))

    if (options?.addAnother) {
      setEditItem(supplierIdParam
        ? { supplierId: supplierIdParam, status: 'confirmed' }
        : { supplierId: data.supplierId })
      return
    }

    setShowForm(false)

    // Build receipt data and show print modal
    const supplier = suppliers.find(s => s.id === data.supplierId)
    const totalAmount = data.items.reduce((sum, item) => sum + item.quantity * item.unitCost, 0)
    setReceiptData({
      type: 'purchase_order',
      poNumber: savedPoNumber,
      supplierName: supplier?.name ?? data.supplierId,
      orderDate: data.orderDate,
      expectedCompletionDate: data.expectedCompletionDate || undefined,
      currency: data.currency,
      status: receiptStatus,
      notes: data.notes || undefined,
      items: data.items.map(item => ({
        productName: item.productName,
        quantity: item.quantity,
        unitCost: item.unitCost,
        totalCost: item.quantity * item.unitCost,
      })),
      totalAmount,
    })
  }

  const handleReceiptClose = () => {
    setReceiptData(null)
    setEditItem(null)
    if (supplierIdParam) {
      navigate('/suppliers/' + supplierIdParam)
    } else {
      navigate('/suppliers/purchase-orders')
    }
  }

  const handleCloseForm = () => {
    setShowForm(false)
    setEditItem(null)
    if (id || isNew) navigate('/suppliers/purchase-orders')
  }

  const statusColor = (status: POStatus) => {
    const colors: Record<POStatus, string> = {
      draft: 'bg-gray-500',
      sent: 'bg-blue-500',
      confirmed: 'bg-indigo-500',
      in_production: 'bg-purple-500',
      ready: 'bg-teal-500',
      shipped: 'bg-amber-500',
      received: 'bg-green-500',
      cancelled: 'bg-red-500',
    }
    return colors[status] || 'bg-gray-500'
  }

  const filtered = useMemo(() =>
    purchaseOrders.filter(po => {
      const matchSearch = !search || po.poNumber.toLowerCase().includes(search.toLowerCase())
      const matchStatus = statusFilter === 'all' || po.status === statusFilter
      const matchSupplier = supplierFilter === 'all' || po.supplierId === supplierFilter
      const matchDateFrom = !dateFrom || po.orderDate >= dateFrom
      const matchDateTo = !dateTo || po.orderDate <= dateTo
      return matchSearch && matchStatus && matchSupplier && matchDateFrom && matchDateTo
    }),
    [purchaseOrders, search, statusFilter, supplierFilter, dateFrom, dateTo]
  )

  const getSupplierName = (supplierId: string) => {
    const supplier = suppliers.find(s => s.id === supplierId)
    return supplier ? supplier.name : '—'
  }

  const formatCurrency = (amount: number, currency: string) => {
    return currencySymbol(currency) + ' ' + amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  }

  const handleDelete = async (id: string) => {
    if (confirm(t('suppliers.confirmDelete'))) {
      try {
        const { deletePurchaseOrder } = useAppStore.getState()
        await deletePurchaseOrder(id)
        toast.success(t('common.success'))
      } catch {
        toast.error(t('common.error'))
      }
    }
  }

  return (
    <div className="p-4 lg:p-6 space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold text-gray-900 dark:text-white sm:text-xl">{t('suppliers.purchaseOrders')}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">{filtered.length} {t('common.records')}</p>
        </div>
        {isOrgAdmin(role) && (
          <button onClick={() => { setEditItem(null); setShowForm(true) }} className="inline-flex min-h-11 items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors">
            <Plus className="w-4 h-4" /> {t('suppliers.addPurchaseOrder')}
          </button>
        )}
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-4 space-y-4">
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder={t('suppliers.searchPlaceholder')} className="w-full ps-9 pe-3 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-base sm:text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
          </div>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="min-h-11 px-3 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-base sm:text-sm focus:ring-2 focus:ring-blue-500">
            <option value="all">{t('common.all')}</option>
            {PO_STATUSES.map(s => <option key={s} value={s}>{t('suppliers.poStatuses.' + s)}</option>)}
          </select>
          <select value={supplierFilter} onChange={e => setSupplierFilter(e.target.value)} className="min-h-11 px-3 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-base sm:text-sm focus:ring-2 focus:ring-blue-500">
            <option value="all">{t('suppliers.selectSupplier')}</option>
            {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <div className="flex flex-wrap gap-3">
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500" placeholder={t('common.date')} />
          <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500" placeholder={t('common.date')} />
          {(statusFilter !== 'all' || supplierFilter !== 'all' || dateFrom || dateTo) && (
            <button onClick={() => { setStatusFilter('all'); setSupplierFilter('all'); setDateFrom(''); setDateTo('') }} className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 flex items-center gap-1">
              <X className="w-3.5 h-3.5" /> {t('common.clear')}
            </button>
          )}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-500 dark:text-gray-400"><p>{t('suppliers.noPurchaseOrders')}</p></div>
      ) : (
        <ResponsiveDataList
          rows={filtered}
          keyField={(po) => po.id}
          table={(
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-900/50">
                <tr>
                  <th className="px-5 py-3 text-start text-xs font-medium text-gray-500 uppercase">{t('suppliers.poNumber')}</th>
                  <th className="px-5 py-3 text-start text-xs font-medium text-gray-500 uppercase">{t('suppliers.supplierName')}</th>
                  <th className="px-5 py-3 text-start text-xs font-medium text-gray-500 uppercase">{t('suppliers.orderDate')}</th>
                  <th className="px-5 py-3 text-start text-xs font-medium text-gray-500 uppercase">{t('suppliers.expectedCompletionDate')}</th>
                  <th className="px-5 py-3 text-start text-xs font-medium text-gray-500 uppercase">{t('common.status')}</th>
                  <th className="px-5 py-3 text-end text-xs font-medium text-gray-500 uppercase">{t('suppliers.totalAmount')}</th>
                  <th className="px-5 py-3 text-end text-xs font-medium text-gray-500 uppercase">{t('common.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filtered.map(po => (
                  <tr key={po.id} className="hover:bg-gray-50 dark:hover:bg-gray-900/50">
                    <td className="px-5 py-4 text-sm font-mono text-blue-600 dark:text-blue-400">{po.poNumber}</td>
                    <td className="px-5 py-4 text-sm text-gray-900 dark:text-white">{getSupplierName(po.supplierId)}</td>
                    <td className="px-5 py-4 text-sm text-gray-500 dark:text-gray-400">{po.orderDate}</td>
                    <td className="px-5 py-4 text-sm text-gray-500 dark:text-gray-400">{po.expectedCompletionDate || '—'}</td>
                    <td className="px-5 py-4"><span className={cn('px-2.5 py-1 rounded-full text-xs font-medium', statusColor(po.status))}>{t('suppliers.poStatuses.' + po.status)}</span></td>
                    <td className="px-5 py-4 text-end text-sm font-mono text-gray-900 dark:text-white">{formatCurrency(po.totalAmount, po.currency)}</td>
                    <td className="px-5 py-4 text-end">
                      <div className="flex items-center justify-end gap-1">
                        {isOrgAdmin(role) && (
                          <>
                            <button type="button" onClick={() => navigate('/suppliers/purchase-orders/' + po.id)} className={cn(TOUCH_ICON_BTN, 'text-blue-500')} title={t('common.edit')}><Pencil className="w-4 h-4" /></button>
                            <button type="button" onClick={() => handleDelete(po.id)} className={cn(TOUCH_ICON_BTN, 'text-red-500')} title={t('common.delete')}><Trash2 className="w-4 h-4" /></button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          renderCard={(po) => (
            <>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-mono text-sm font-semibold text-blue-600 dark:text-blue-400">{po.poNumber}</p>
                  <p className="mt-0.5 truncate text-sm text-gray-900 dark:text-white">{getSupplierName(po.supplierId)}</p>
                  <p className="mt-1 text-xs text-gray-500">{po.orderDate} → {po.expectedCompletionDate || '—'}</p>
                </div>
                <span className={cn('shrink-0 rounded-full px-2.5 py-1 text-xs font-medium', statusColor(po.status))}>
                  {t('suppliers.poStatuses.' + po.status)}
                </span>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <p className="font-mono text-base font-semibold text-gray-900 dark:text-white">{formatCurrency(po.totalAmount, po.currency)}</p>
                {isOrgAdmin(role) && (
                  <div className="flex gap-1">
                    <button type="button" onClick={() => navigate('/suppliers/purchase-orders/' + po.id)} className={cn(TOUCH_ICON_BTN, 'text-blue-500')}><Pencil className="w-4 h-4" /></button>
                    <button type="button" onClick={() => handleDelete(po.id)} className={cn(TOUCH_ICON_BTN, 'text-red-500')}><Trash2 className="w-4 h-4" /></button>
                  </div>
                )}
              </div>
            </>
          )}
        />
      )}

      {showForm && (
        <PurchaseOrderForm
          initial={editItem}
          onSave={handleSaveForm}
          onCancel={handleCloseForm}
          t={t}
          language={language}
          suppliers={suppliers}
          supplierProducts={supplierProducts}
          canQuickAdd={isOrgAdmin(role)}
        />
      )}

      {receiptData && (
        <ReceiptPrintModal
          data={receiptData}
          onClose={handleReceiptClose}
        />
      )}
    </div>
  )
}