import type { PurchaseOrder, PurchaseOrderItem, PriceHistoryEntry, POStatus } from '../types'
import { api } from '../lib/apiClient'

export const purchaseOrderService = {
  async getAll(): Promise<PurchaseOrder[]> {
    return api.getList<PurchaseOrder>('/purchase-orders/')
  },

  async getById(id: string): Promise<PurchaseOrder | undefined> {
    try {
      return await api.get<PurchaseOrder>(`/purchase-orders/${id}/`)
    } catch {
      return undefined
    }
  },

  async getBySupplierId(supplierId: string): Promise<PurchaseOrder[]> {
    const all = await this.getAll()
    return all.filter((po) => po.supplierId === supplierId && !po.isDeleted)
  },

  async getItemsByPOId(poId: string): Promise<PurchaseOrderItem[]> {
    const po = await this.getById(poId)
    return (po as PurchaseOrder & { items?: PurchaseOrderItem[] })?.items ?? []
  },

  async getAllItems(): Promise<PurchaseOrderItem[]> {
    const orders = await this.getAll()
    const items: PurchaseOrderItem[] = []
    for (const po of orders) {
      const poItems = (po as PurchaseOrder & { items?: PurchaseOrderItem[] }).items ?? []
      items.push(...poItems)
    }
    return items
  },

  async create(
    data: Omit<PurchaseOrder, 'id' | 'poNumber' | 'totalAmount' | 'isDeleted' | 'createdAt' | 'updatedAt'> & {
      items?: Omit<PurchaseOrderItem, 'id' | 'purchaseOrderId' | 'createdAt' | 'updatedAt'>[]
    },
  ): Promise<PurchaseOrder> {
    return api.post<PurchaseOrder>('/purchase-orders/', data)
  },

  async update(
    id: string,
    data: Partial<PurchaseOrder> & { items?: (Partial<PurchaseOrderItem> & { id?: string })[] },
  ): Promise<PurchaseOrder> {
    return api.patch<PurchaseOrder>(`/purchase-orders/${id}/`, data)
  },

  async updateStatus(id: string, newStatus: POStatus): Promise<{ success: boolean; error?: string; po?: PurchaseOrder }> {
    try {
      const result = await api.post<{ success: boolean; error?: string; po?: PurchaseOrder }>(
        `/purchase-orders/${id}/update_status/`,
        { status: newStatus },
      )
      return result
    } catch (e) {
      return { success: false, error: e instanceof Error ? e.message : 'Failed' }
    }
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/purchase-orders/${id}/`)
  },

  async reset(): Promise<void> {
    await api.post('/reset/')
  },
}

export const priceHistoryService = {
  async getAll(): Promise<PriceHistoryEntry[]> {
    return api.getList<PriceHistoryEntry>('/price-history/')
  },

  async getBySupplierId(supplierId: string): Promise<PriceHistoryEntry[]> {
    const all = await this.getAll()
    return all.filter((e) => e.supplierId === supplierId)
  },

  async reset(): Promise<void> {
    await api.post('/reset/')
  },
}
