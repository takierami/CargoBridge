import type { PurchaseOrder, PurchaseOrderItem, PriceHistoryEntry, POStatus } from '../types'

const PO_KEY = 'cargobridge_purchase_orders'
const PO_ITEM_KEY = 'cargobridge_po_items'
const PO_COUNTER_KEY = 'cargobridge_po_counter'
const PRICE_HISTORY_KEY = 'cargobridge_price_history'
const PRICE_HISTORY_COUNTER_KEY = 'cargobridge_price_history_counter'

function generatePONumber(): string {
  const year = new Date().getFullYear()
  const stored = localStorage.getItem(PO_COUNTER_KEY)
  const counterData = stored ? JSON.parse(stored) : { year, count: 0 }
  if (counterData.year !== year) {
    counterData.year = year
    counterData.count = 0
  }
  counterData.count += 1
  localStorage.setItem(PO_COUNTER_KEY, JSON.stringify(counterData))
  return `PO-${year}-${String(counterData.count).padStart(4, '0')}`
}

function generatePriceHistoryId(): string {
  const stored = localStorage.getItem(PRICE_HISTORY_COUNTER_KEY)
  const counterData = stored ? JSON.parse(stored) : { count: 0 }
  counterData.count += 1
  localStorage.setItem(PRICE_HISTORY_COUNTER_KEY, JSON.stringify(counterData))
  return `pricehist-${Date.now()}-${counterData.count}`
}

const PO_STATUS_FLOW: Record<POStatus, POStatus[]> = {
  draft: ['sent', 'cancelled'],
  sent: ['confirmed', 'cancelled'],
  confirmed: ['in_production', 'cancelled'],
  in_production: ['ready', 'cancelled'],
  ready: ['shipped', 'cancelled'],
  shipped: ['received', 'cancelled'],
  received: [],
  cancelled: [],
}

function canTransition(from: POStatus, to: POStatus): boolean {
  return PO_STATUS_FLOW[from]?.includes(to) ?? false
}

function computePOTotal(items: PurchaseOrderItem[]): number {
  return items.reduce((sum, item) => sum + item.totalCost, 0)
}

export const purchaseOrderService = {
  getAll(): PurchaseOrder[] {
    const stored = localStorage.getItem(PO_KEY)
    if (!stored) return []
    try {
      return JSON.parse(stored) as PurchaseOrder[]
    } catch {
      return []
    }
  },

  getById(id: string): PurchaseOrder | undefined {
    return this.getAll().find(po => po.id === id)
  },

  getByPONumber(poNumber: string): PurchaseOrder | undefined {
    return this.getAll().find(po => po.poNumber === poNumber)
  },

  getBySupplierId(supplierId: string): PurchaseOrder[] {
    return this.getAll().filter(po => po.supplierId === supplierId && !po.isDeleted)
  },

  getItemsByPOId(poId: string): PurchaseOrderItem[] {
    const stored = localStorage.getItem(PO_ITEM_KEY)
    if (!stored) return []
    try {
      return (JSON.parse(stored) as PurchaseOrderItem[]).filter(item => item.purchaseOrderId === poId)
    } catch {
      return []
    }
  },

  create(
    data: Omit<PurchaseOrder, 'id' | 'poNumber' | 'totalAmount' | 'isDeleted' | 'createdAt' | 'updatedAt'> & { items?: Omit<PurchaseOrderItem, 'id' | 'purchaseOrderId' | 'createdAt' | 'updatedAt'>[] }
  ): PurchaseOrder {
    const all = this.getAll()
    const now = new Date().toISOString()
    const poNumber = generatePONumber()

    const itemsData = data.items || []
    const items: PurchaseOrderItem[] = itemsData.map(item => ({
      ...item,
      id: `poitem-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      purchaseOrderId: '',
      totalCost: item.quantity * item.unitCost,
      createdAt: now,
      updatedAt: now,
    }))

    const totalAmount = computePOTotal(items)

    const newPO: PurchaseOrder = {
      ...data,
      id: `po-${Date.now()}`,
      poNumber,
      totalAmount,
      isDeleted: false,
      createdAt: now,
      updatedAt: now,
    }

    all.push(newPO)
    localStorage.setItem(PO_KEY, JSON.stringify(all))

    const allItems = this.getAllItems()
    const itemsWithPOId = items.map(item => ({ ...item, purchaseOrderId: newPO.id }))
    allItems.push(...itemsWithPOId)
    localStorage.setItem(PO_ITEM_KEY, JSON.stringify(allItems))

    return { ...newPO, items: itemsWithPOId } as PurchaseOrder & { items: PurchaseOrderItem[] }
  },

  getAllItems(): PurchaseOrderItem[] {
    const stored = localStorage.getItem(PO_ITEM_KEY)
    if (!stored) return []
    try {
      return JSON.parse(stored) as PurchaseOrderItem[]
    } catch {
      return []
    }
  },

  update(id: string, data: Partial<PurchaseOrder> & { items?: (Partial<PurchaseOrderItem> & { id?: string })[] }): PurchaseOrder | null {
    const all = this.getAll()
    const idx = all.findIndex(po => po.id === id)
    if (idx === -1) return null

    const now = new Date().toISOString()
    const updatedPO = { ...all[idx], ...data, updatedAt: now }
    all[idx] = updatedPO
    localStorage.setItem(PO_KEY, JSON.stringify(all))

    if (data.items) {
      const allItems = this.getAllItems()
      const otherItems = allItems.filter(item => item.purchaseOrderId !== id)
      const updatedItems: PurchaseOrderItem[] = data.items.map(item => ({
        ...item,
        id: item.id || `poitem-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        purchaseOrderId: id,
        totalCost: (item.quantity ?? 0) * (item.unitCost ?? 0),
        updatedAt: now,
        createdAt: item.id ? allItems.find(i => i.id === item.id)?.createdAt || now : now,
      })) as PurchaseOrderItem[]

      localStorage.setItem(PO_ITEM_KEY, JSON.stringify([...otherItems, ...updatedItems]))
      updatedPO.totalAmount = computePOTotal(updatedItems)
      localStorage.setItem(PO_KEY, JSON.stringify(all))
    }

    return updatedPO
  },

  updateStatus(id: string, newStatus: POStatus): { success: boolean; error?: string; po?: PurchaseOrder } {
    const all = this.getAll()
    const idx = all.findIndex(po => po.id === id)
    if (idx === -1) return { success: false, error: 'Request not found' }

    const currentStatus = all[idx].status
    if (!canTransition(currentStatus, newStatus)) {
      return { success: false, error: `Cannot transition from ${currentStatus} to ${newStatus}` }
    }

    const now = new Date().toISOString()
    const updatedPO = { ...all[idx], status: newStatus, updatedAt: now }

    if (newStatus === 'received' && !updatedPO.receivedDate) {
      updatedPO.receivedDate = new Date().toISOString().split('T')[0]
    }

    all[idx] = updatedPO
    localStorage.setItem(PO_KEY, JSON.stringify(all))

    if (newStatus === 'received') {
      this.createPriceHistoryFromPO(updatedPO)
    }

    return { success: true, po: updatedPO }
  },

  createPriceHistoryFromPO(po: PurchaseOrder): void {
    const items = this.getItemsByPOId(po.id)
    items.forEach(item => {
      priceHistoryService.create({
        supplierId: po.supplierId,
        productName: item.productName,
        unitCost: item.unitCost,
        currency: po.currency,
        sourcePoId: po.id,
        recordedAt: po.receivedDate || new Date().toISOString(),
      })
    })
  },

  delete(id: string): boolean {
    const all = this.getAll()
    const idx = all.findIndex(po => po.id === id)
    if (idx === -1) return false
    all[idx] = { ...all[idx], isDeleted: true, updatedAt: new Date().toISOString() }
    localStorage.setItem(PO_KEY, JSON.stringify(all))
    return true
  },

  hardDelete(id: string): boolean {
    const all = this.getAll()
    const idx = all.findIndex(po => po.id === id)
    if (idx === -1) return false
    const filtered = all.filter(po => po.id !== id)
    localStorage.setItem(PO_KEY, JSON.stringify(filtered))

    const allItems = this.getAllItems()
    const filteredItems = allItems.filter(item => item.purchaseOrderId !== id)
    localStorage.setItem(PO_ITEM_KEY, JSON.stringify(filteredItems))
    return true
  },

  reset(): void {
    localStorage.setItem(PO_KEY, JSON.stringify([]))
    localStorage.setItem(PO_ITEM_KEY, JSON.stringify([]))
    localStorage.setItem(PO_COUNTER_KEY, JSON.stringify({ year: new Date().getFullYear(), count: 0 }))
  },
}

export const priceHistoryService = {
  getAll(): PriceHistoryEntry[] {
    const stored = localStorage.getItem(PRICE_HISTORY_KEY)
    if (!stored) return []
    try {
      return JSON.parse(stored) as PriceHistoryEntry[]
    } catch {
      return []
    }
  },

  getById(id: string): PriceHistoryEntry | undefined {
    return this.getAll().find(entry => entry.id === id)
  },

  getBySupplierId(supplierId: string): PriceHistoryEntry[] {
    return this.getAll()
      .filter(entry => entry.supplierId === supplierId)
      .sort((a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime())
  },

  create(data: Omit<PriceHistoryEntry, 'id' | 'createdAt'>): PriceHistoryEntry {
    const all = this.getAll()
    const now = new Date().toISOString()
    const newEntry: PriceHistoryEntry = {
      ...data,
      id: generatePriceHistoryId(),
      createdAt: now,
    }
    all.push(newEntry)
    localStorage.setItem(PRICE_HISTORY_KEY, JSON.stringify(all))
    return newEntry
  },

  reset(): void {
    localStorage.setItem(PRICE_HISTORY_KEY, JSON.stringify([]))
    localStorage.setItem(PRICE_HISTORY_COUNTER_KEY, JSON.stringify({ count: 0 }))
  },
}