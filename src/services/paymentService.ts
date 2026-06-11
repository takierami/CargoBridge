import type { SupplierPayment, SupplierAdjustment, PaymentStatus, AdjustmentType, LedgerEntry } from '../types'
import { purchaseOrderService } from './purchaseOrderService'
import { supplierService } from './supplierService'

const PAYMENT_KEY = 'cargobridge_supplier_payments'
const PAYMENT_COUNTER_KEY = 'cargobridge_payment_counter'
const ADJUSTMENT_KEY = 'cargobridge_supplier_adjustments'
const ADJUSTMENT_COUNTER_KEY = 'cargobridge_adjustment_counter'

function generatePaymentNumber(): string {
  const year = new Date().getFullYear()
  const stored = localStorage.getItem(PAYMENT_COUNTER_KEY)
  const counterData = stored ? JSON.parse(stored) : { year, count: 0 }
  if (counterData.year !== year) {
    counterData.year = year
    counterData.count = 0
  }
  counterData.count += 1
  localStorage.setItem(PAYMENT_COUNTER_KEY, JSON.stringify(counterData))
  return `PAY-${year}-${String(counterData.count).padStart(4, '0')}`
}

function generateAdjustmentId(): string {
  const stored = localStorage.getItem(ADJUSTMENT_COUNTER_KEY)
  const counterData = stored ? JSON.parse(stored) : { count: 0 }
  counterData.count += 1
  localStorage.setItem(ADJUSTMENT_COUNTER_KEY, JSON.stringify(counterData))
  return `adj-${Date.now()}-${counterData.count}`
}

const ACTIVE_PO_STATUSES = ['draft', 'sent', 'confirmed', 'in_production', 'ready', 'shipped', 'received']

function computeSupplierBalance(supplierId: string): { totalPurchased: number; totalPaid: number; outstanding: number; currency: string } {
  const pos = purchaseOrderService.getAll().filter(po => po.supplierId === supplierId && !po.isDeleted && ACTIVE_PO_STATUSES.includes(po.status))
  const totalPurchased = pos.reduce((sum, po) => sum + po.totalAmount, 0)

  const payments = getPaymentsBySupplierId(supplierId)
  const totalPaid = payments.reduce((sum, p) => {
    if (p.status === 'fully_paid') return sum + p.amount
    if (p.status === 'partially_paid') return sum + p.amountPaid
    return sum
  }, 0)

  const outstanding = totalPurchased - totalPaid
  const currency = pos.length > 0 ? pos[0].currency : 'USD'

  return { totalPurchased, totalPaid, outstanding: Math.max(0, outstanding), currency }
}

function updateSupplierBalance(supplierId: string): void {
  const balance = computeSupplierBalance(supplierId)
  supplierService.update(supplierId, {
    totalPurchased: balance.totalPurchased,
    totalPaid: balance.totalPaid,
    outstanding: balance.outstanding,
    balanceCurrency: balance.currency,
  })
}

function getPaymentsBySupplierId(supplierId: string): SupplierPayment[] {
  return paymentService.getAll().filter(p => p.supplierId === supplierId && !p.isDeleted)
}

function derivePaymentStatus(payment: SupplierPayment): PaymentStatus {
  const today = new Date().toISOString().split('T')[0]
  if (payment.status === 'fully_paid') return 'fully_paid'
  if (payment.amountPaid >= payment.amount && payment.amountPaid > 0) return 'fully_paid'
  if (payment.amountPaid > 0 && payment.amountPaid < payment.amount) return 'partially_paid'
  if (payment.paymentDate < today && payment.status !== 'fully_paid') return 'overdue'
  return 'pending'
}

export const paymentService = {
  getAll(): SupplierPayment[] {
    const stored = localStorage.getItem(PAYMENT_KEY)
    if (!stored) return []
    try {
      return JSON.parse(stored) as SupplierPayment[]
    } catch {
      return []
    }
  },

  getById(id: string): SupplierPayment | undefined {
    return this.getAll().find(p => p.id === id)
  },

  getBySupplierId(supplierId: string): SupplierPayment[] {
    return this.getAll()
      .filter(p => p.supplierId === supplierId && !p.isDeleted)
      .sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime())
  },

  create(data: Omit<SupplierPayment, 'id' | 'paymentNumber' | 'isDeleted' | 'createdAt' | 'updatedAt'>): SupplierPayment {
    const all = this.getAll()
    const now = new Date().toISOString()
    const newPayment: SupplierPayment = {
      ...data,
      id: `payment-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      paymentNumber: generatePaymentNumber(),
      isDeleted: false,
      createdAt: now,
      updatedAt: now,
    }
    all.push(newPayment)
    localStorage.setItem(PAYMENT_KEY, JSON.stringify(all))

    const finalPayment = { ...newPayment, status: derivePaymentStatus(newPayment) }
    all[all.length - 1] = finalPayment
    localStorage.setItem(PAYMENT_KEY, JSON.stringify(all))

    updateSupplierBalance(data.supplierId)
    return finalPayment
  },

  update(id: string, data: Partial<SupplierPayment>): SupplierPayment | null {
    const all = this.getAll()
    const idx = all.findIndex(p => p.id === id)
    if (idx === -1) return null

    const now = new Date().toISOString()
    const updated = { ...all[idx], ...data, updatedAt: now }
    all[idx] = updated
    localStorage.setItem(PAYMENT_KEY, JSON.stringify(all))

    updateSupplierBalance(updated.supplierId)
    return updated
  },

  markAsFullyPaid(id: string): SupplierPayment | null {
    return this.update(id, { status: 'fully_paid', amountPaid: this.getById(id)?.amount || 0 })
  },

  delete(id: string): boolean {
    const all = this.getAll()
    const idx = all.findIndex(p => p.id === id)
    if (idx === -1) return false
    const supplierId = all[idx].supplierId
    all[idx] = { ...all[idx], isDeleted: true, updatedAt: new Date().toISOString() }
    localStorage.setItem(PAYMENT_KEY, JSON.stringify(all))
    updateSupplierBalance(supplierId)
    return true
  },

  getPOBalance(purchaseOrderId: string): { total: number; paid: number; remaining: number } {
    const po = purchaseOrderService.getById(purchaseOrderId)
    if (!po) return { total: 0, paid: 0, remaining: 0 }
    const payments = this.getAll().filter(p => p.purchaseOrderId === purchaseOrderId && !p.isDeleted)
    const paid = payments.reduce((sum, p) => {
      if (p.status === 'fully_paid') return sum + p.amount
      if (p.status === 'partially_paid') return sum + p.amountPaid
      return sum
    }, 0)
    return { total: po.totalAmount, paid, remaining: po.totalAmount - paid }
  },

  reset(): void {
    localStorage.setItem(PAYMENT_KEY, JSON.stringify([]))
    localStorage.setItem(PAYMENT_COUNTER_KEY, JSON.stringify({ year: new Date().getFullYear(), count: 0 }))
  },

  updateSupplierBalance(supplierId: string): void {
    updateSupplierBalance(supplierId)
  },
}

export const adjustmentService = {
  getAll(): SupplierAdjustment[] {
    const stored = localStorage.getItem(ADJUSTMENT_KEY)
    if (!stored) return []
    try {
      return JSON.parse(stored) as SupplierAdjustment[]
    } catch {
      return []
    }
  },

  getById(id: string): SupplierAdjustment | undefined {
    return this.getAll().find(a => a.id === id)
  },

  getBySupplierId(supplierId: string): SupplierAdjustment[] {
    return this.getAll()
      .filter(a => a.supplierId === supplierId && !a.isDeleted)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  },

  create(data: Omit<SupplierAdjustment, 'id' | 'isDeleted' | 'createdAt' | 'updatedAt'>): SupplierAdjustment {
    const all = this.getAll()
    const now = new Date().toISOString()
    const newAdjustment: SupplierAdjustment = {
      ...data,
      id: generateAdjustmentId(),
      isDeleted: false,
      createdAt: now,
      updatedAt: now,
    }
    all.push(newAdjustment)
    localStorage.setItem(ADJUSTMENT_KEY, JSON.stringify(all))
    return newAdjustment
  },

  update(id: string, data: Partial<SupplierAdjustment>): SupplierAdjustment | null {
    const all = this.getAll()
    const idx = all.findIndex(a => a.id === id)
    if (idx === -1) return null
    const now = new Date().toISOString()
    all[idx] = { ...all[idx], ...data, updatedAt: now }
    localStorage.setItem(ADJUSTMENT_KEY, JSON.stringify(all))
    return all[idx]
  },

  delete(id: string): boolean {
    const all = this.getAll()
    const idx = all.findIndex(a => a.id === id)
    if (idx === -1) return false
    all[idx] = { ...all[idx], isDeleted: true, updatedAt: new Date().toISOString() }
    localStorage.setItem(ADJUSTMENT_KEY, JSON.stringify(all))
    return true
  },

  reset(): void {
    localStorage.setItem(ADJUSTMENT_KEY, JSON.stringify([]))
    localStorage.setItem(ADJUSTMENT_COUNTER_KEY, JSON.stringify({ count: 0 }))
  },
}

export function buildLedger(supplierId: string): LedgerEntry[] {
  const pos = purchaseOrderService.getBySupplierId(supplierId).filter(po => !po.isDeleted && po.status !== 'cancelled')
  const payments = paymentService.getBySupplierId(supplierId)
  const adjustments = adjustmentService.getBySupplierId(supplierId)

  const entries: { date: string; type: LedgerEntry['type']; reference: string; debit: number; credit: number }[] = []

  pos.forEach(po => {
    entries.push({
      date: po.orderDate,
      type: 'order',
      reference: po.poNumber,
      debit: po.totalAmount,
      credit: 0,
    })
  })

  payments.forEach(p => {
    entries.push({
      date: p.paymentDate,
      type: 'payment',
      reference: p.paymentNumber,
      debit: 0,
      credit: p.status === 'fully_paid' ? p.amount : p.amountPaid,
    })
  })

  adjustments.forEach(adj => {
    entries.push({
      date: adj.date,
      type: adj.type === 'credit' ? 'credit_adjustment' : 'debit_adjustment',
      reference: adj.id,
      debit: adj.type === 'debit' ? adj.amount : 0,
      credit: adj.type === 'credit' ? adj.amount : 0,
    })
  })

  entries.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

  const ledger: LedgerEntry[] = []
  let runningBalance = 0
  entries.forEach(e => {
    runningBalance += e.credit - e.debit
    ledger.push({
      ...e,
      runningBalance,
      currency: 'USD',
    })
  })

  return ledger
}