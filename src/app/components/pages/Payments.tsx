import { useState, useMemo, useEffect } from 'react'
import { useNavigate, useParams, useSearchParams, useLocation } from 'react-router'
import { Plus, Search, X, Pencil, Trash2, CheckCircle, Printer } from 'lucide-react'
import { toast } from 'sonner'
import { useAppStore } from '../../../store/appStore'
import { cn } from '../../utils/cn'
import type { SupplierPayment, PaymentStatus, PaymentMethod } from '../../../types'
import { isOrgAdmin } from '../../../lib/roles'
import { ReceiptPrintModal } from '../ReceiptPrintModal'
import type { PaymentReceiptData } from '../ReceiptPrintModal'
import {
  DEFAULT_TRANSACTION_CURRENCY,
  currenciesForSelect,
  currencyOptionLabel,
  currencySymbol,
} from '../../../lib/currencies'
import { SupplierQuickCreate } from '../quick-create/SupplierQuickCreate'
import { CurrencyQuickCreate } from '../quick-create/CurrencyQuickCreate'
import { PurchaseOrderForm } from './PurchaseOrders'

const PAYMENT_METHODS: PaymentMethod[] = ['bank_transfer', 'cash', 'wise', 'western_union', 'paypal', 'other']
const PAYMENT_STATUSES: PaymentStatus[] = ['pending', 'partially_paid', 'fully_paid', 'overdue']

interface PaymentFormData {
  supplierId: string
  purchaseOrderId: string
  amount: number
  amountPaid: number
  currency: string
  paymentMethod: PaymentMethod
  paymentDate: string
  status: PaymentStatus
  notes: string
}

function deriveStatusFromAmounts(amount: number, amountPaid: number): PaymentStatus {
  if (amount > 0 && amountPaid >= amount) return 'fully_paid'
  if (amountPaid > 0) return 'partially_paid'
  return 'pending'
}

type PaymentSupplierOption = { id: string; name: string; preferredCurrency?: string }
type PaymentPOOption = { id: string; poNumber: string; supplierId: string; totalAmount: number; status: string; currency: string }

export function PaymentForm({ initial, onSave, onCancel, t, language, suppliers, purchaseOrders, getPOBalance, canQuickAdd = false, supplierProducts = [] }: {
  initial?: Partial<SupplierPayment>
  onSave: (data: PaymentFormData, options?: { addAnother?: boolean }) => void | Promise<void>
  onCancel: () => void
  t: ReturnType<typeof useAppStore>['t']
  language: 'ar' | 'fr'
  suppliers: PaymentSupplierOption[]
  purchaseOrders: PaymentPOOption[]
  getPOBalance: (purchaseOrderId: string) => Promise<{ total: number; paid: number; remaining: number }>
  canQuickAdd?: boolean
  supplierProducts?: import('../../../types').SupplierProduct[]
}) {
  const addSupplier = useAppStore(s => s.addSupplier)
  const addPurchaseOrder = useAppStore(s => s.addPurchaseOrder)
  const updatePurchaseOrderStatus = useAppStore(s => s.updatePurchaseOrderStatus)
  const storeSuppliers = useAppStore(s => s.suppliers)

  const defaultCurrency = () => {
    const supplier = suppliers.find(s => s.id === (initial?.supplierId || ''))
    return initial?.currency || supplier?.preferredCurrency || DEFAULT_TRANSACTION_CURRENCY
  }

  const [form, setForm] = useState<PaymentFormData>({
    supplierId: initial?.supplierId || '',
    purchaseOrderId: initial?.purchaseOrderId || '',
    amount: initial?.amount || 0,
    amountPaid: initial?.amountPaid || 0,
    currency: defaultCurrency(),
    paymentMethod: initial?.paymentMethod || 'bank_transfer',
    paymentDate: initial?.paymentDate || new Date().toISOString().split('T')[0],
    status: initial?.status || 'pending',
    notes: initial?.notes || '',
  })
  const [saving, setSaving] = useState(false)
  const [showSupplierQuick, setShowSupplierQuick] = useState(false)
  const [showPoQuick, setShowPoQuick] = useState(false)
  const [showCurrencyQuick, setShowCurrencyQuick] = useState(false)
  const [currencyListTick, setCurrencyListTick] = useState(0)

  const set = (k: keyof PaymentFormData, v: unknown) => setForm(f => ({ ...f, [k]: v }))

  const supplierPOs = useMemo(
    () => purchaseOrders.filter(po => po.supplierId === form.supplierId && !['draft', 'cancelled'].includes(po.status)),
    [purchaseOrders, form.supplierId]
  )

  const [poBalance, setPoBalance] = useState<{ total: number; paid: number; remaining: number } | undefined>()

  const applyPOSelection = (poId: string) => {
    if (!poId) {
      setForm(f => ({ ...f, purchaseOrderId: '' }))
      setPoBalance(undefined)
      return
    }
    const po = purchaseOrders.find(p => p.id === poId)
    getPOBalance(poId).then((balance) => {
      setForm(f => ({
        ...f,
        purchaseOrderId: poId,
        amount: balance.remaining,
        amountPaid: balance.remaining,
        currency: po?.currency || f.currency,
        status: deriveStatusFromAmounts(balance.remaining, balance.remaining),
      }))
    })
  }

  useEffect(() => {
    if (!form.purchaseOrderId) {
      setPoBalance(undefined)
      return
    }
    getPOBalance(form.purchaseOrderId).then(setPoBalance)
  }, [form.purchaseOrderId, getPOBalance])

  useEffect(() => {
    if (initial?.id || !initial?.supplierId || initial.purchaseOrderId) return
    const pos = purchaseOrders.filter(po => po.supplierId === initial.supplierId && !['draft', 'cancelled'].includes(po.status))
    if (pos.length > 0) applyPOSelection(pos[0].id)
  }, []) // mount only: prefill first PO when opened with supplierId query

  const selectSupplier = (supplierId: string) => {
    const supplier = suppliers.find(s => s.id === supplierId)
    const pos = purchaseOrders.filter(po => po.supplierId === supplierId && !['draft', 'cancelled'].includes(po.status))
    setForm(f => ({
      ...f,
      supplierId,
      purchaseOrderId: '',
      amount: 0,
      amountPaid: 0,
      status: 'pending',
      currency: supplier?.preferredCurrency || f.currency,
    }))
    setPoBalance(undefined)
    if (!initial?.id && pos.length > 0) {
      applyPOSelection(pos[0].id)
    }
  }

  const updateAmountFields = (amount: number, amountPaid: number) => {
    setForm(f => ({
      ...f,
      amount,
      amountPaid,
      status: deriveStatusFromAmounts(amount, amountPaid),
    }))
  }

  const resetForAnother = () => {
    setForm(f => ({
      ...f,
      purchaseOrderId: '',
      amount: 0,
      amountPaid: 0,
      paymentDate: new Date().toISOString().split('T')[0],
      status: 'pending',
      notes: '',
      paymentMethod: 'bank_transfer',
    }))
    setPoBalance(undefined)
  }

  const handleSave = async (addAnother = false) => {
    if (!form.supplierId) {
      toast.error(t('suppliers.selectSupplier'))
      return
    }
    if (!(form.amount > 0)) {
      toast.error(t('suppliers.amountRequired'))
      return
    }
    // Blank/zero paid on create means "pay in full" so كشف حساب updates immediately.
    const amountPaid = form.amountPaid > 0 ? form.amountPaid : form.amount
    const payload = {
      ...form,
      amountPaid,
      purchaseOrderId: form.purchaseOrderId || undefined,
      status: deriveStatusFromAmounts(form.amount, amountPaid),
    } as PaymentFormData
    setSaving(true)
    try {
      await onSave(payload, { addAnother })
      if (addAnother) resetForAnother()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700">
          <h2 className="font-semibold text-gray-900 dark:text-white">{initial?.id ? t('suppliers.editPayment') : t('suppliers.addPayment')}</h2>
          <button onClick={onCancel} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('suppliers.supplierName')} *</label>
            <div className="flex gap-2">
              <select
                value={form.supplierId}
                onChange={e => selectSupplier(e.target.value)}
                className="flex-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500"
              >
                <option value="">{t('suppliers.selectSupplier')}</option>
                {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
              {canQuickAdd && (
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

          {form.supplierId && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('suppliers.linkedPO')}</label>
                {canQuickAdd && (
                  <button
                    type="button"
                    onClick={() => setShowPoQuick(true)}
                    className="flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400"
                  >
                    <Plus className="w-3.5 h-3.5" /> {t('common.addNew')}
                  </button>
                )}
              </div>
              <select
                value={form.purchaseOrderId}
                onChange={e => applyPOSelection(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500"
              >
                <option value="">{t('suppliers.noLinkedPO')}</option>
                {supplierPOs.map(po => <option key={po.id} value={po.id}>{po.poNumber} ({po.totalAmount} {po.currency})</option>)}
              </select>
              {poBalance && (
                <p className="text-xs text-blue-500 mt-1">
                  {t('suppliers.remainingBalance')}: {poBalance.remaining.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {form.currency}
                </p>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('suppliers.amount')} *</label>
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={form.amount || ''}
                onChange={e => {
                  const val = Number(e.target.value)
                  const paid = form.amountPaid === form.amount || form.amountPaid === 0 ? val : form.amountPaid
                  updateAmountFields(val, paid)
                }}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('suppliers.amountPaid')}</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.amountPaid || ''}
                onChange={e => updateAmountFields(form.amount, Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('suppliers.selectCurrency')}</label>
              <div className="flex gap-2">
                <select
                  key={currencyListTick}
                  value={form.currency}
                  onChange={e => set('currency', e.target.value)}
                  className="flex-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500"
                >
                  {currenciesForSelect(form.currency).map(c => (
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
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('suppliers.paymentMethod')}</label>
              <select value={form.paymentMethod} onChange={e => set('paymentMethod', e.target.value as PaymentMethod)} className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500">
                {PAYMENT_METHODS.map(m => <option key={m} value={m}>{t('suppliers.paymentMethods.' + m)}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('suppliers.paymentDate')}</label>
              <input type="date" value={form.paymentDate} onChange={e => set('paymentDate', e.target.value)} className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('common.status')}</label>
              <select value={form.status} onChange={e => set('status', e.target.value as PaymentStatus)} className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500">
                {PAYMENT_STATUSES.map(s => <option key={s} value={s}>{t('suppliers.paymentStatuses.' + s)}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('common.notes')}</label>
            <textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={2} className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 resize-none" />
          </div>
        </div>
        <div className="flex flex-wrap gap-3 p-5 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={() => handleSave(false)}
            disabled={saving}
            className="flex-1 min-w-[120px] py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
          >
            {t('common.save')}
          </button>
          {!initial?.id && (
            <button
              onClick={() => handleSave(true)}
              disabled={saving}
              className="flex-1 min-w-[120px] py-2 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
            >
              {t('suppliers.saveAndAddAnother')}
            </button>
          )}
          <button onClick={onCancel} className="flex-1 min-w-[100px] py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium transition-colors">{t('common.cancel')}</button>
        </div>
      </div>
      {showSupplierQuick && (
        <SupplierQuickCreate
          nested
          onCancel={() => setShowSupplierQuick(false)}
          onSave={async (data) => {
            try {
              const created = await addSupplier(data)
              selectSupplier(created.id)
              setShowSupplierQuick(false)
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
            set('currency', code)
            setCurrencyListTick(n => n + 1)
            setShowCurrencyQuick(false)
            toast.success(t('common.success'))
          }}
        />
      )}
      {showPoQuick && form.supplierId && (
        <PurchaseOrderForm
          nested
          initial={{ supplierId: form.supplierId, status: 'confirmed' }}
          onCancel={() => setShowPoQuick(false)}
          t={t}
          language={language}
          suppliers={storeSuppliers}
          supplierProducts={supplierProducts}
          canQuickAdd={canQuickAdd}
          onSave={async (data) => {
            try {
              let saved = await addPurchaseOrder({
                supplierId: data.supplierId,
                orderDate: data.orderDate,
                expectedCompletionDate: data.expectedCompletionDate || undefined,
                currency: data.currency,
                status: data.status,
                notes: data.notes || undefined,
                items: data.items.map(item => ({
                  productName: item.productName,
                  quantity: item.quantity,
                  unitCost: item.unitCost,
                })),
              })
              if (data.status === 'confirmed' && saved.status === 'draft') {
                const toSent = await updatePurchaseOrderStatus(saved.id, 'sent')
                if (toSent.success) {
                  const toConfirmed = await updatePurchaseOrderStatus(saved.id, 'confirmed')
                  if (toConfirmed.success) saved = { ...saved, status: 'confirmed' }
                }
              }
              setShowPoQuick(false)
              setForm(f => ({
                ...f,
                purchaseOrderId: saved.id,
                amount: saved.totalAmount,
                amountPaid: saved.totalAmount,
                currency: saved.currency || f.currency,
                status: deriveStatusFromAmounts(saved.totalAmount, saved.totalAmount),
              }))
              getPOBalance(saved.id).then(setPoBalance).catch(() => setPoBalance(undefined))
              toast.success(t('common.success'))
            } catch (err) {
              toast.error(err instanceof Error ? err.message : t('common.error'))
            }
          }}
        />
      )}
    </div>
  )
}

export function Payments() {
  const { t, language, role, supplierPayments, suppliers, purchaseOrders, supplierProducts, addSupplierPayment, updateSupplierPayment, markPaymentAsFullyPaid, deleteSupplierPayment, getPOBalance } = useAppStore()
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
  const [editItem, setEditItem] = useState<SupplierPayment | null>(null)
  const [receiptData, setReceiptData] = useState<PaymentReceiptData | null>(null)

  const currentPayment = useMemo(() => {
    if (!id || id === 'new' || isNew) return null
    return supplierPayments.find(p => p.id === id) || null
  }, [id, isNew, supplierPayments])

  useEffect(() => {
    if (currentPayment) {
      setEditItem(currentPayment)
      setShowForm(true)
    } else if (id === 'new' || isNew) {
      setEditItem(supplierIdParam ? { supplierId: supplierIdParam } as SupplierPayment : null)
      setShowForm(true)
    }
  }, [currentPayment, id, isNew, supplierIdParam])



  const statusColor = (status: PaymentStatus) => {
    const colors: Record<PaymentStatus, string> = {
      pending: 'bg-blue-500',
      partially_paid: 'bg-amber-500',
      fully_paid: 'bg-green-500',
      overdue: 'bg-red-500',
    }
    return colors[status] || 'bg-gray-500'
  }

  const filtered = useMemo(() =>
    supplierPayments.filter(p => {
      const matchSearch = !search || p.paymentNumber.toLowerCase().includes(search.toLowerCase()) || getSupplierName(p.supplierId).toLowerCase().includes(search.toLowerCase())
      const matchStatus = statusFilter === 'all' || p.status === statusFilter
      const matchSupplier = supplierFilter === 'all' || p.supplierId === supplierFilter
      const matchDateFrom = !dateFrom || p.paymentDate >= dateFrom
      const matchDateTo = !dateTo || p.paymentDate <= dateTo
      return matchSearch && matchStatus && matchSupplier && matchDateFrom && matchDateTo
    }),
    [supplierPayments, search, statusFilter, supplierFilter, dateFrom, dateTo]
  )

  const getSupplierName = (supplierId: string) => {
    const supplier = suppliers.find(s => s.id === supplierId)
    return supplier ? supplier.name : '—'
  }

  const getPONumber = (poId?: string) => {
    if (!poId) return '—'
    const po = purchaseOrders.find(p => p.id === poId)
    return po ? po.poNumber : '—'
  }

  const formatCurrency = (amount: number, currency: string) => {
    return currencySymbol(currency) + ' ' + amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  }

  const canManagePayments = isOrgAdmin(role)

  const handleSave = async (data: PaymentFormData, options?: { addAnother?: boolean }) => {
    let savedPaymentNumber = editItem?.paymentNumber ?? ''
    let receiptPaid = data.amountPaid
    try {
      if (editItem?.id) {
        const updated = await updateSupplierPayment(editItem.id, data)
        if (updated) {
          receiptPaid = updated.amountPaid
          savedPaymentNumber = updated.paymentNumber || savedPaymentNumber
        }
      } else {
        const saved = await addSupplierPayment(data)
        savedPaymentNumber = saved.paymentNumber
        receiptPaid = saved.amountPaid
      }
    } catch (err) {
      toast.error(err instanceof Error && err.message ? err.message : t('common.error'))
      return
    }
    toast.success(t('common.success'))

    if (options?.addAnother) {
      setEditItem(supplierIdParam ? { supplierId: supplierIdParam } as SupplierPayment : { supplierId: data.supplierId } as SupplierPayment)
      return
    }

    setShowForm(false)

    // Build receipt data and show print modal
    const supplier = suppliers.find(s => s.id === data.supplierId)
    const po = purchaseOrders.find(p => p.id === data.purchaseOrderId)
    setReceiptData({
      type: 'payment',
      paymentNumber: savedPaymentNumber,
      supplierName: supplier?.name ?? data.supplierId,
      purchaseOrderNumber: po?.poNumber,
      amount: data.amount,
      amountPaid: receiptPaid,
      currency: data.currency,
      paymentMethod: data.paymentMethod,
      paymentDate: data.paymentDate,
      status: deriveStatusFromAmounts(data.amount, receiptPaid),
      notes: data.notes || undefined,
    })
  }

  const handleReceiptClose = () => {
    setReceiptData(null)
    setEditItem(null)
    if (supplierIdParam) {
      navigate('/suppliers/' + supplierIdParam)
    } else {
      navigate('/suppliers/payments')
    }
  }

  const handleDelete = async (id: string) => {
    if (!canManagePayments) return
    if (confirm(t('suppliers.confirmDelete'))) {
      await deleteSupplierPayment(id)
      toast.success(t('common.success'))
    }
  }

  const handleMarkAsPaid = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!canManagePayments) return
    try {
      await markPaymentAsFullyPaid(id)
      toast.success(t('suppliers.confirmFullPayment'))
    } catch {
      toast.error(t('common.error'))
    }
  }

  const handleCloseForm = () => {
    setShowForm(false)
    setEditItem(null)
    if (id === 'new' || isNew) navigate('/suppliers/payments')
  }

  return (
    <div className="p-4 lg:p-6 space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">{t('suppliers.payments')}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">{filtered.length} {t('common.records')}</p>
        </div>
        {canManagePayments && (
          <button onClick={() => { setEditItem(null); setShowForm(true) }} className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors">
            <Plus className="w-4 h-4" /> {t('suppliers.addPayment')}
          </button>
        )}
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-4 space-y-4">
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder={t('suppliers.searchPlaceholder')} className="w-full ps-9 pe-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
          </div>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm focus:ring-2 focus:ring-blue-500">
            <option value="all">{t('common.all')}</option>
            {PAYMENT_STATUSES.map(s => <option key={s} value={s}>{t('suppliers.paymentStatuses.' + s)}</option>)}
          </select>
          <select value={supplierFilter} onChange={e => setSupplierFilter(e.target.value)} className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm focus:ring-2 focus:ring-blue-500">
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
        <div className="text-center py-16 text-gray-500 dark:text-gray-400"><p>{t('common.noData')}</p></div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-900/50">
              <tr>
                <th className="px-5 py-3 text-start text-xs font-medium text-gray-500 uppercase">{t('suppliers.paymentNumber')}</th>
                <th className="px-5 py-3 text-start text-xs font-medium text-gray-500 uppercase">{t('suppliers.supplierName')}</th>
                <th className="px-5 py-3 text-start text-xs font-medium text-gray-500 uppercase">{t('suppliers.linkedPO')}</th>
                <th className="px-5 py-3 text-start text-xs font-medium text-gray-500 uppercase">{t('suppliers.amount')}</th>
                <th className="px-5 py-3 text-start text-xs font-medium text-gray-500 uppercase">{t('suppliers.paymentMethod')}</th>
                <th className="px-5 py-3 text-start text-xs font-medium text-gray-500 uppercase">{t('suppliers.paymentDate')}</th>
                <th className="px-5 py-3 text-start text-xs font-medium text-gray-500 uppercase">{t('common.status')}</th>
                <th className="px-5 py-3 text-end text-xs font-medium text-gray-500 uppercase">{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filtered.map(p => (
                <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-gray-900/50">
                  <td className="px-5 py-4 text-sm font-mono text-blue-600 dark:text-blue-400">{p.paymentNumber}</td>
                  <td className="px-5 py-4 text-sm text-gray-900 dark:text-white">{getSupplierName(p.supplierId)}</td>
                  <td className="px-5 py-4 text-sm text-gray-500 dark:text-gray-400">{getPONumber(p.purchaseOrderId)}</td>
                  <td className="px-5 py-4 text-end text-sm font-mono text-gray-900 dark:text-white">{formatCurrency(p.amount, p.currency)}</td>
                  <td className="px-5 py-4 text-sm text-gray-500 dark:text-gray-400">{t('suppliers.paymentMethods.' + p.paymentMethod)}</td>
                  <td className="px-5 py-4 text-sm text-gray-500 dark:text-gray-400">{p.paymentDate}</td>
                  <td className="px-5 py-4"><span className={cn('px-2.5 py-1 rounded-full text-xs font-medium', statusColor(p.status))}>{t('suppliers.paymentStatuses.' + p.status)}</span></td>
                  <td className="px-5 py-4 text-end">
                    <div className="flex items-center justify-end gap-1">
                      {canManagePayments && (p.status === 'pending' || p.status === 'partially_paid' || p.status === 'overdue') && (
                        <button onClick={(e) => handleMarkAsPaid(p.id, e)} className="p-1.5 text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg" title={t('suppliers.markAsFullyPaid')}>
                          <CheckCircle className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {canManagePayments && (
                        <>
                          <button onClick={() => navigate('/suppliers/payments/' + p.id)} className="p-1.5 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg">
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => handleDelete(p.id)} className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg">
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

      {showForm && (
        <PaymentForm
          initial={editItem || undefined}
          onSave={handleSave}
          onCancel={handleCloseForm}
          t={t}
          language={language}
          suppliers={suppliers.map(s => ({ id: s.id, name: s.name, preferredCurrency: s.preferredCurrency }))}
          purchaseOrders={purchaseOrders.map(po => ({
            id: po.id,
            poNumber: po.poNumber,
            supplierId: po.supplierId,
            totalAmount: po.totalAmount,
            status: po.status,
            currency: po.currency,
          }))}
          getPOBalance={getPOBalance}
          canQuickAdd={isOrgAdmin(role)}
          supplierProducts={supplierProducts}
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