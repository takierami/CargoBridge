import { useState, useMemo, useEffect } from 'react'
import { useNavigate, useParams, useSearchParams, useLocation } from 'react-router'
import { Plus, Search, X, Pencil, Trash2, CheckCircle, Printer } from 'lucide-react'
import { toast } from 'sonner'
import { useAppStore } from '../../../store/appStore'
import { cn } from '../../utils/cn'
import type { SupplierPayment, PaymentStatus, PaymentMethod } from '../../../types'
import { ReceiptPrintModal } from '../ReceiptPrintModal'
import type { PaymentReceiptData } from '../ReceiptPrintModal'

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

function PaymentForm({ initial, onSave, onCancel, t, suppliers, purchaseOrders, getPOBalance }: {
  initial?: Partial<SupplierPayment>
  onSave: (data: PaymentFormData) => void
  onCancel: () => void
  t: ReturnType<typeof useAppStore>['t']
  suppliers: { id: string; name: string }[]
  purchaseOrders: { id: string; poNumber: string; supplierId: string; totalAmount: number }[]
  getPOBalance: (purchaseOrderId: string) => { total: number; paid: number; remaining: number }
}) {
  const [form, setForm] = useState<PaymentFormData>({
    supplierId: initial?.supplierId || '',
    purchaseOrderId: initial?.purchaseOrderId || '',
    amount: initial?.amount || 0,
    amountPaid: initial?.amountPaid || 0,
    currency: initial?.currency || 'USD',
    paymentMethod: initial?.paymentMethod || 'bank_transfer',
    paymentDate: initial?.paymentDate || new Date().toISOString().split('T')[0],
    status: initial?.status || 'pending',
    notes: initial?.notes || '',
  })

  const set = (k: keyof PaymentFormData, v: unknown) => setForm(f => ({ ...f, [k]: v }))

  const supplierPOs = useMemo(() => purchaseOrders.filter(po => po.supplierId === form.supplierId && !['draft', 'cancelled'].includes(po.status)), [purchaseOrders, form.supplierId])

  const poBalance = useMemo(() => {
    if (!form.purchaseOrderId) return undefined
    return getPOBalance(form.purchaseOrderId)
  }, [form.purchaseOrderId, getPOBalance])

  useEffect(() => {
    if (supplierPOs.length > 0 && !form.purchaseOrderId) {
      const firstPoId = supplierPOs[0].id
      const balance = getPOBalance(firstPoId)
      setForm(f => ({
        ...f,
        purchaseOrderId: firstPoId,
        amount: balance.remaining,
        amountPaid: balance.remaining,
        status: balance.remaining > 0 ? 'fully_paid' : 'pending'
      }))
    }
  }, [form.supplierId, supplierPOs, getPOBalance])

  const handleSave = () => {
    if (!form.supplierId || form.amount <= 0) return
    onSave(form)
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
            <select value={form.supplierId} onChange={e => set('supplierId', e.target.value)} className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500">
              <option value="">{t('suppliers.selectSupplier')}</option>
              {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>

          {form.supplierId && supplierPOs.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('suppliers.linkedPO')}</label>
              <select
                value={form.purchaseOrderId}
                onChange={e => {
                  const poId = e.target.value
                  const balance = poId ? getPOBalance(poId) : null
                  setForm(f => ({
                    ...f,
                    purchaseOrderId: poId,
                    amount: balance ? balance.remaining : 0,
                    amountPaid: balance ? balance.remaining : 0,
                    status: balance && balance.remaining > 0 ? 'fully_paid' : 'pending'
                  }))
                }}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500"
              >
                <option value="">{t('suppliers.noLinkedPO')}</option>
                {supplierPOs.map(po => <option key={po.id} value={po.id}>{po.poNumber} ({po.totalAmount})</option>)}
              </select>
              {poBalance && poBalance.remaining > 0 && (
                <p className="text-xs text-blue-500 mt-1">{t('suppliers.remainingBalance')}: {poBalance.remaining} {form.currency}</p>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('suppliers.amount')} *</label>
              <input type="number" min="0" step="0.01" value={form.amount}
                onChange={e => {
                  const val = Number(e.target.value)
                  setForm(f => ({
                    ...f,
                    amount: val,
                    amountPaid: f.amountPaid === f.amount || f.amountPaid === 0 ? val : f.amountPaid,
                    status: f.status === 'pending' || f.status === 'fully_paid' ? 'fully_paid' : f.status
                  }))
                }}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('suppliers.amountPaid')}</label>
              <input type="number" min="0" step="0.01" value={form.amountPaid} onChange={e => set('amountPaid', Number(e.target.value))} className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('suppliers.selectCurrency')}</label>
              <select value={form.currency} onChange={e => set('currency', e.target.value)} className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500">
                <option value="USD">USD</option>
                <option value="CNY">CNY</option>
                <option value="EUR">EUR</option>
                <option value="DZD">DZD</option>
              </select>
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
        <div className="flex gap-3 p-5 border-t border-gray-200 dark:border-gray-700">
          <button onClick={handleSave} className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors">{t('common.save')}</button>
          <button onClick={onCancel} className="flex-1 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium transition-colors">{t('common.cancel')}</button>
        </div>
      </div>
    </div>
  )
}

export function Payments() {
  const { t, language, supplierPayments, suppliers, purchaseOrders, addSupplierPayment, updateSupplierPayment, markPaymentAsFullyPaid, deleteSupplierPayment, getPOBalance } = useAppStore()
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
    const symbols: Record<string, string> = { USD: '$', CNY: '¥', EUR: '€', DZD: 'دج' }
    return symbols[currency] + ' ' + amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  }

  const handleSave = (data: PaymentFormData) => {
    let savedPaymentNumber = editItem?.paymentNumber ?? ''
    if (editItem?.id) {
      updateSupplierPayment(editItem.id, data)
    } else {
      const saved = addSupplierPayment(data)
      savedPaymentNumber = saved.paymentNumber
    }
    toast.success(t('common.success'))
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
      amountPaid: data.amountPaid,
      currency: data.currency,
      paymentMethod: data.paymentMethod,
      paymentDate: data.paymentDate,
      status: data.status,
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

  const handleDelete = (id: string) => {
    if (confirm(t('suppliers.confirmDelete'))) {
      deleteSupplierPayment(id)
      toast.success(t('common.success'))
    }
  }

  const handleMarkAsPaid = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    const result = markPaymentAsFullyPaid(id)
    if (result) toast.success(t('suppliers.confirmFullPayment'))
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
        <button onClick={() => navigate('/suppliers/payments/new')} className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors">
          <Plus className="w-4 h-4" /> {t('suppliers.addPayment')}
        </button>
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
                      {(p.status === 'pending' || p.status === 'partially_paid' || p.status === 'overdue') && (
                        <button onClick={(e) => handleMarkAsPaid(p.id, e)} className="p-1.5 text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg" title={t('suppliers.markAsFullyPaid')}>
                          <CheckCircle className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button onClick={() => navigate('/suppliers/payments/' + p.id)} className="p-1.5 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => handleDelete(p.id)} className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg">
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

      {showForm && (
        <PaymentForm
          initial={editItem || undefined}
          onSave={handleSave}
          onCancel={handleCloseForm}
          t={t}
          suppliers={suppliers.map(s => ({ id: s.id, name: s.name }))}
          purchaseOrders={purchaseOrders.map(po => ({ id: po.id, poNumber: po.poNumber, supplierId: po.supplierId, totalAmount: po.totalAmount }))}
          getPOBalance={getPOBalance}
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