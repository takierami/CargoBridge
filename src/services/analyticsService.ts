import type {
  AnalyticsReport,
  PurchaseOrder,
  Supplier,
  SupplierPayment,
  SupplierPerformance,
  SupplierRating,
  SupplierTask,
} from '../types'

// Matches backend api/constants.py ANALYTICS_PO_STATUSES
const ACTIVE_PO_STATUSES = ['confirmed', 'in_production', 'ready', 'shipped', 'received']

export interface AnalyticsInput {
  suppliers: Supplier[]
  purchaseOrders: PurchaseOrder[]
  supplierPayments: SupplierPayment[]
  supplierRatings: SupplierRating[]
  supplierTasks: SupplierTask[]
}

export function computeSupplierPerformance(
  supplier: Supplier,
  purchaseOrders: PurchaseOrder[],
  payments: SupplierPayment[],
): SupplierPerformance {
  const pos = purchaseOrders.filter((po) => po.supplierId === supplier.id && !po.isDeleted)
  const supplierPayments = payments.filter((p) => p.supplierId === supplier.id && !p.isDeleted)

  const totalOrders = pos.length
  const totalPurchaseValue = pos
    .filter((po) => ACTIVE_PO_STATUSES.includes(po.status))
    .reduce((sum, po) => sum + po.totalAmount, 0)

  const receivedPOs = pos.filter((po) => po.status === 'received' && po.receivedDate)
  const avgDeliveryDays =
    receivedPOs.length > 0
      ? Math.round(
          receivedPOs.reduce((sum, po) => {
            const orderDate = new Date(po.orderDate)
            const receivedDate = new Date(po.receivedDate!)
            return sum + Math.max(1, Math.round((receivedDate.getTime() - orderDate.getTime()) / 86400000))
          }, 0) / receivedPOs.length,
        )
      : 0

  const onTimeCount = receivedPOs.filter((po) => {
    if (!po.expectedCompletionDate) return true
    return po.receivedDate! <= po.expectedCompletionDate
  }).length
  const onTimeDeliveryRate = receivedPOs.length > 0 ? Math.round((onTimeCount / receivedPOs.length) * 100) : 0

  const delayCount = receivedPOs.filter((po) => {
    if (!po.expectedCompletionDate) return false
    return po.receivedDate! > po.expectedCompletionDate
  }).length

  const overduePayments = supplierPayments.filter((p) => p.status === 'overdue').length
  const shippedCount = pos.filter((po) => po.linkedShipmentId && po.status === 'received').length

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

export function computeAnalytics(input: AnalyticsInput, dateFrom?: string, dateTo?: string): AnalyticsReport {
  const { suppliers, purchaseOrders, supplierPayments, supplierRatings } = input
  const posAll = purchaseOrders.filter((po) => !po.isDeleted)
  const paymentsAll = supplierPayments.filter((p) => !p.isDeleted)

  const pos =
    dateFrom || dateTo
      ? posAll.filter(
          (po) =>
            (!dateFrom || po.orderDate >= dateFrom) && (!dateTo || po.orderDate <= dateTo),
        )
      : posAll

  const ratingMap = new Map(supplierRatings.map((r) => [r.supplierId, r.overall]))

  const supplierValues = suppliers
    .map((s) => {
      const supplierPOs = pos.filter((po) => po.supplierId === s.id && ACTIVE_PO_STATUSES.includes(po.status))
      const totalValue = supplierPOs.reduce((sum, po) => sum + po.totalAmount, 0)
      return {
        supplierId: s.id,
        supplierName: s.name,
        code: s.code,
        orderCount: supplierPOs.length,
        totalValue,
        outstanding: s.outstanding || 0,
        rating: ratingMap.get(s.id),
      }
    })
    .filter((sv) => sv.orderCount > 0)
    .sort((a, b) => b.totalValue - a.totalValue)

  const receivedPOs = pos.filter((po) => po.status === 'received' && po.receivedDate)
  const supplierReliability = suppliers
    .map((s) => {
      const supReceivedPOs = receivedPOs.filter((po) => po.supplierId === s.id)
      if (supReceivedPOs.length < 3) return null
      const onTimeCount = supReceivedPOs.filter((po) => {
        if (!po.expectedCompletionDate) return true
        return po.receivedDate! <= po.expectedCompletionDate
      }).length
      const onTimeRate = Math.round((onTimeCount / supReceivedPOs.length) * 100)
      const avgDeliveryDays =
        supReceivedPOs.length > 0
          ? Math.round(
              supReceivedPOs.reduce((sum, po) => {
                const orderDate = new Date(po.orderDate)
                const receivedDate = new Date(po.receivedDate!)
                return sum + Math.max(1, Math.round((receivedDate.getTime() - orderDate.getTime()) / 86400000))
              }, 0) / supReceivedPOs.length,
            )
          : 0
      return {
        supplierId: s.id,
        supplierName: s.name,
        receivedCount: supReceivedPOs.length,
        onTimeRate,
        avgDeliveryDays,
        rating: ratingMap.get(s.id),
      }
    })
    .filter(Boolean)
    .sort((a, b) => b!.onTimeRate - a!.onTimeRate) as AnalyticsReport['topSuppliersByReliability']

  const largestBalances = suppliers
    .map((s) => {
      const supplierPOs = pos.filter((po) => po.supplierId === s.id && ACTIVE_PO_STATUSES.includes(po.status))
      const totalPurchased = supplierPOs.reduce((sum, po) => sum + po.totalAmount, 0)
      const supPayments = paymentsAll.filter((p) => p.supplierId === s.id)
      const totalPaid = supPayments.reduce((sum, p) => {
        if (p.status === 'fully_paid') return sum + p.amount
        if (p.status === 'partially_paid') return sum + p.amountPaid
        return sum
      }, 0)
      const overduePayments = supPayments.filter((p) => p.status === 'overdue').length
      return {
        supplierId: s.id,
        supplierName: s.name,
        totalPurchased,
        totalPaid,
        outstanding: Math.max(0, totalPurchased - totalPaid),
        overduePayments,
      }
    })
    .filter((s) => s.outstanding > 0)
    .sort((a, b) => b.outstanding - a.outstanding)

  const avgLeadTime = suppliers
    .map((s) => {
      const supReceivedPOs = receivedPOs.filter((po) => po.supplierId === s.id)
      if (supReceivedPOs.length === 0) return null
      const deliveryDays = supReceivedPOs.map((po) => {
        const orderDate = new Date(po.orderDate)
        const receivedDate = new Date(po.receivedDate!)
        return Math.max(1, Math.round((receivedDate.getTime() - orderDate.getTime()) / 86400000))
      })
      return {
        supplierId: s.id,
        supplierName: s.name,
        receivedCount: supReceivedPOs.length,
        avgDays: Math.round(deliveryDays.reduce((a, b) => a + b, 0) / deliveryDays.length),
        minDays: Math.min(...deliveryDays),
        maxDays: Math.max(...deliveryDays),
      }
    })
    .filter(Boolean)
    .sort((a, b) => a!.avgDays - b!.avgDays) as AnalyticsReport['avgLeadTime']

  const totalVolume = pos
    .filter((po) => ACTIVE_PO_STATUSES.includes(po.status))
    .reduce((sum, po) => sum + po.totalAmount, 0)
  const purchaseVolume = suppliers
    .map((s) => {
      const supplierPOs = pos.filter((po) => po.supplierId === s.id && ACTIVE_PO_STATUSES.includes(po.status))
      const volume = supplierPOs.reduce((sum, po) => sum + po.totalAmount, 0)
      return {
        supplierId: s.id,
        supplierName: s.name,
        volume,
        percentage: totalVolume > 0 ? Math.round((volume / totalVolume) * 100) : 0,
      }
    })
    .filter((pv) => pv.volume > 0)
    .sort((a, b) => b.volume - a.volume)

  return {
    topSuppliersByValue: supplierValues.slice(0, 10),
    topSuppliersByReliability: supplierReliability.slice(0, 10),
    largestBalances: largestBalances.slice(0, 10),
    avgLeadTime: avgLeadTime.slice(0, 10),
    purchaseVolume: purchaseVolume.slice(0, 10),
  }
}

export function getDashboardStats(input: AnalyticsInput) {
  const allPOs = input.purchaseOrders.filter((po) => !po.isDeleted)
  const allPayments = input.supplierPayments.filter((p) => !p.isDeleted)
  const today = new Date().toISOString().split('T')[0]
  const overdueTasks = input.supplierTasks.filter(
    (t) => !t.isDeleted && t.status === 'pending' && t.dueDate < today,
  )

  const uniqueSupplierIds = [
    ...new Set(
      allPOs.filter((po) => !po.isDeleted && ACTIVE_PO_STATUSES.includes(po.status)).map((po) => po.supplierId),
    ),
  ]

  const delayedPOs = allPOs.filter(
    (po) =>
      po.status !== 'received' &&
      po.status !== 'cancelled' &&
      po.expectedCompletionDate &&
      po.expectedCompletionDate < today,
  ).length

  const monthStart = new Date()
  monthStart.setDate(1)
  const monthStartStr = monthStart.toISOString().split('T')[0]
  const thisMonthPOs = allPOs.filter((po) => po.orderDate >= monthStartStr && ACTIVE_PO_STATUSES.includes(po.status))
  const supplierSpend: Record<string, number> = {}
  thisMonthPOs.forEach((po) => {
    supplierSpend[po.supplierId] = (supplierSpend[po.supplierId] || 0) + po.totalAmount
  })

  return {
    totalOutstanding: uniqueSupplierIds.reduce((sum, sid) => {
      const supPOs = allPOs.filter((po) => po.supplierId === sid && ACTIVE_PO_STATUSES.includes(po.status))
      const totalPurchased = supPOs.reduce((s, po) => s + po.totalAmount, 0)
      const supPayments = allPayments.filter((p) => p.supplierId === sid)
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
        const supplier = input.suppliers.find((s) => s.id === sid)
        return { supplierId: sid, supplierName: supplier?.name || sid, spend }
      }),
  }
}
