import type { SupplierPerformance, AnalyticsReport, Supplier } from '../types'
import { purchaseOrderService } from './purchaseOrderService'
import { paymentService } from './paymentService'
import { taskService } from './taskService'
import { ratingService } from './ratingService'

const ACTIVE_PO_STATUSES = ['confirmed', 'in_production', 'ready', 'shipped', 'received']

export function computeSupplierPerformance(supplier: Supplier): SupplierPerformance {
  const pos = purchaseOrderService.getBySupplierId(supplier.id).filter(po => !po.isDeleted)
  const payments = paymentService.getAll().filter(p => p.supplierId === supplier.id && !p.isDeleted)

  const totalOrders = pos.length
  const totalPurchaseValue = pos.filter(po => ACTIVE_PO_STATUSES.includes(po.status)).reduce((sum, po) => sum + po.totalAmount, 0)

  const receivedPOs = pos.filter(po => po.status === 'received' && po.receivedDate)
  const avgDeliveryDays = receivedPOs.length > 0
    ? Math.round(receivedPOs.reduce((sum, po) => {
        const orderDate = new Date(po.orderDate)
        const receivedDate = new Date(po.receivedDate!)
        return sum + Math.max(1, Math.round((receivedDate.getTime() - orderDate.getTime()) / (1000 * 60 * 60 * 24)))
      }, 0) / receivedPOs.length)
    : 0

  const onTimeCount = receivedPOs.filter(po => {
    if (!po.expectedCompletionDate) return true
    return po.receivedDate! <= po.expectedCompletionDate
  }).length
  const onTimeDeliveryRate = receivedPOs.length > 0 ? Math.round((onTimeCount / receivedPOs.length) * 100) : 0

  const delayCount = receivedPOs.filter(po => {
    if (!po.expectedCompletionDate) return false
    return po.receivedDate! > po.expectedCompletionDate
  }).length

  const overduePayments = payments.filter(p => p.status === 'overdue').length
  const shippedCount = pos.filter(po => po.linkedShipmentId && po.status === 'received').length

  return {
    totalOrders,
    totalPurchaseValue,
    outstandingBalance: supplier.outstanding || 0,
    avgDeliveryDays,
    onTimeDeliveryRate,
    delayCount,
    disputeCount: overduePayments,
    shippedCount,
  }
}

export function computeAnalytics(dateFrom?: string, dateTo?: string): AnalyticsReport {
  const suppliers = purchaseOrderService.getAll()
    .filter(po => !po.isDeleted && ACTIVE_PO_STATUSES.includes(po.status))
    .map(po => po.supplierId)
    .filter((id, idx, arr) => arr.indexOf(id) === idx)
    .map(id => {
      const sup = paymentService.getAll().find(() => true)
      const allSuppliers = (globalThis as any).__suppliers || []
      return allSuppliers.find((s: Supplier) => s.id === id)
    })
    .filter(Boolean) as Supplier[]

  const posAll = purchaseOrderService.getAll().filter(po => !po.isDeleted)
  const paymentsAll = paymentService.getAll().filter(p => !p.isDeleted)

  // Filter by date if provided
  const pos = dateFrom || dateTo
    ? posAll.filter(po => {
        const inDateRange = (!dateFrom || po.orderDate >= dateFrom) && (!dateTo || po.orderDate <= dateTo)
        return inDateRange
      })
    : posAll

  // Best suppliers by value
  const supplierValues = suppliers.map(s => {
    const supplierPOs = pos.filter(po => po.supplierId === s.id && ACTIVE_PO_STATUSES.includes(po.status))
    const totalValue = supplierPOs.reduce((sum, po) => sum + po.totalAmount, 0)
    const rating = ratingService.getBySupplierId(s.id)
    return { supplierId: s.id, supplierName: s.name, code: s.code, orderCount: supplierPOs.length, totalValue, outstanding: s.outstanding || 0, rating: rating?.overall }
  }).filter(sv => sv.orderCount > 0).sort((a, b) => b.totalValue - a.totalValue)

  // Most reliable (require >= 3 received POs)
  const receivedPOs = pos.filter(po => po.status === 'received' && po.receivedDate)
  const supplierReliability = suppliers.map(s => {
    const supReceivedPOs = receivedPOs.filter(po => po.supplierId === s.id)
    if (supReceivedPOs.length < 3) return null
    const onTimeCount = supReceivedPOs.filter(po => {
      if (!po.expectedCompletionDate) return true
      return po.receivedDate! <= po.expectedCompletionDate
    }).length
    const onTimeRate = Math.round((onTimeCount / supReceivedPOs.length) * 100)
    const avgDeliveryDays = supReceivedPOs.length > 0
      ? Math.round(supReceivedPOs.reduce((sum, po) => {
          const orderDate = new Date(po.orderDate)
          const receivedDate = new Date(po.receivedDate!)
          return sum + Math.max(1, Math.round((receivedDate.getTime() - orderDate.getTime()) / (1000 * 60 * 60 * 24)))
        }, 0) / supReceivedPOs.length)
      : 0
    const rating = ratingService.getBySupplierId(s.id)
    return { supplierId: s.id, supplierName: s.name, receivedCount: supReceivedPOs.length, onTimeRate, avgDeliveryDays, rating: rating?.overall }
  }).filter(Boolean).sort((a, b) => b!.onTimeRate - a!.onTimeRate) as { supplierId: string; supplierName: string; receivedCount: number; onTimeRate: number; avgDeliveryDays: number; rating?: number }[]

  // Largest balances
  const largestBalances = suppliers.map(s => {
    const supplierPOs = pos.filter(po => po.supplierId === s.id && ACTIVE_PO_STATUSES.includes(po.status))
    const totalPurchased = supplierPOs.reduce((sum, po) => sum + po.totalAmount, 0)
    const supplierPayments = paymentsAll.filter(p => p.supplierId === s.id && !p.isDeleted)
    const totalPaid = supplierPayments.reduce((sum, p) => {
      if (p.status === 'fully_paid') return sum + p.amount
      if (p.status === 'partially_paid') return sum + p.amountPaid
      return sum
    }, 0)
    const overduePayments = supplierPayments.filter(p => p.status === 'overdue').length
    return { supplierId: s.id, supplierName: s.name, totalPurchased, totalPaid, outstanding: Math.max(0, totalPurchased - totalPaid), overduePayments }
  }).filter(s => s.outstanding > 0).sort((a, b) => b.outstanding - a.outstanding)

  // Average lead time
  const avgLeadTime = suppliers.map(s => {
    const supReceivedPOs = receivedPOs.filter(po => po.supplierId === s.id)
    if (supReceivedPOs.length === 0) return null
    const deliveryDays = supReceivedPOs.map(po => {
      const orderDate = new Date(po.orderDate)
      const receivedDate = new Date(po.receivedDate!)
      return Math.max(1, Math.round((receivedDate.getTime() - orderDate.getTime()) / (1000 * 60 * 60 * 24)))
    })
    return {
      supplierId: s.id,
      supplierName: s.name,
      receivedCount: supReceivedPOs.length,
      avgDays: Math.round(deliveryDays.reduce((a, b) => a + b, 0) / deliveryDays.length),
      minDays: Math.min(...deliveryDays),
      maxDays: Math.max(...deliveryDays),
    }
  }).filter(Boolean).sort((a, b) => a!.avgDays - b!.avgDays) as { supplierId: string; supplierName: string; receivedCount: number; avgDays: number; minDays: number; maxDays: number }[]

  // Purchase volume bars
  const totalVolume = pos.filter(po => ACTIVE_PO_STATUSES.includes(po.status)).reduce((sum, po) => sum + po.totalAmount, 0)
  const purchaseVolume = suppliers.map(s => {
    const supplierPOs = pos.filter(po => po.supplierId === s.id && ACTIVE_PO_STATUSES.includes(po.status))
    const volume = supplierPOs.reduce((sum, po) => sum + po.totalAmount, 0)
    return { supplierId: s.id, supplierName: s.name, volume, percentage: totalVolume > 0 ? Math.round((volume / totalVolume) * 100) : 0 }
  }).filter(pv => pv.volume > 0).sort((a, b) => b.volume - a.volume)

  return {
    topSuppliersByValue: supplierValues.slice(0, 10),
    topSuppliersByReliability: supplierReliability.slice(0, 10),
    largestBalances: largestBalances.slice(0, 10),
    avgLeadTime: avgLeadTime.slice(0, 10),
    purchaseVolume: purchaseVolume.slice(0, 10),
  }
}

export function getDashboardStats() {
  const allPOs = purchaseOrderService.getAll().filter(po => !po.isDeleted)
  const allPayments = paymentService.getAll().filter(p => !p.isDeleted)
  const overdueTasks = taskService.getOverdue()
  const allSuppliers = purchaseOrderService.getAll().filter(po => !po.isDeleted && ACTIVE_PO_STATUSES.includes(po.status)).map(po => po.supplierId)

  // Total outstanding balance
  const uniqueSupplierIds = [...new Set(allSuppliers)]
  const today = new Date().toISOString().split('T')[0]
  const delayedPOs = allPOs.filter(po =>
    po.status !== 'received' &&
    po.status !== 'cancelled' &&
    po.expectedCompletionDate &&
    po.expectedCompletionDate < today
  ).length

  // Top 5 suppliers this month
  const monthStart = new Date()
  monthStart.setDate(1)
  const monthStartStr = monthStart.toISOString().split('T')[0]
  const thisMonthPOs = allPOs.filter(po => po.orderDate >= monthStartStr && ACTIVE_PO_STATUSES.includes(po.status))
  const supplierSpend = {} as Record<string, number>
  thisMonthPOs.forEach(po => { supplierSpend[po.supplierId] = (supplierSpend[po.supplierId] || 0) + po.totalAmount })

  return {
    totalOutstanding: uniqueSupplierIds.reduce((sum, sid) => {
      const supPOs = allPOs.filter(po => po.supplierId === sid && ACTIVE_PO_STATUSES.includes(po.status))
      const totalPurchased = supPOs.reduce((s, po) => s + po.totalAmount, 0)
      const supPayments = allPayments.filter(p => p.supplierId === sid && !p.isDeleted)
      const totalPaid = supPayments.reduce((s, p) => {
        if (p.status === 'fully_paid') return s + p.amount
        if (p.status === 'partially_paid') return s + p.amountPaid
        return s
      }, 0)
      return sum + Math.max(0, totalPurchased - totalPaid)
    }, 0),
    delayedPOs,
    overdueTasks: overdueTasks.length,
    topSuppliersThisMonth: Object.entries(supplierSpend)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([sid, spend]) => {
        const allSup = (globalThis as any).__suppliers || []
        const supplier = allSup.find((s: Supplier) => s.id === sid)
        return { supplierId: sid, supplierName: supplier?.name || sid, spend }
      }),
  }
}