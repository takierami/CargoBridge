import type { SupplierPayment, SupplierAdjustment, SupplierAdjustmentInput, LedgerEntry } from '../types'
import { api } from '../lib/apiClient'

export const paymentService = {
  async getAll(): Promise<SupplierPayment[]> {
    return api.getList<SupplierPayment>('/supplier-payments/')
  },

  async getById(id: string): Promise<SupplierPayment | undefined> {
    try {
      return await api.get<SupplierPayment>(`/supplier-payments/${id}/`)
    } catch {
      return undefined
    }
  },

  async getBySupplierId(supplierId: string): Promise<SupplierPayment[]> {
    const all = await this.getAll()
    return all.filter((p) => p.supplierId === supplierId && !p.isDeleted)
  },

  async create(
    data: Omit<SupplierPayment, 'id' | 'paymentNumber' | 'isDeleted' | 'createdAt' | 'updatedAt'>,
  ): Promise<SupplierPayment> {
    return api.post<SupplierPayment>('/supplier-payments/', data)
  },

  async update(id: string, data: Partial<SupplierPayment>): Promise<SupplierPayment> {
    return api.patch<SupplierPayment>(`/supplier-payments/${id}/`, data)
  },

  async markAsFullyPaid(id: string): Promise<SupplierPayment> {
    return api.post<SupplierPayment>(`/supplier-payments/${id}/mark_fully_paid/`)
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/supplier-payments/${id}/`)
  },

  async getPOBalance(purchaseOrderId: string): Promise<{ total: number; paid: number; remaining: number }> {
    return api.get(`/supplier-payments/po_balance/?purchase_order_id=${purchaseOrderId}`)
  },

  async updateSupplierBalance(_supplierId: string): Promise<void> {
    // Balances recomputed server-side
  },

  async reset(): Promise<void> {
    await api.post('/reset/')
  },
}

export const adjustmentService = {
  async getAll(): Promise<SupplierAdjustment[]> {
    return api.getList<SupplierAdjustment>('/supplier-adjustments/')
  },

  async getBySupplierId(supplierId: string): Promise<SupplierAdjustment[]> {
    const all = await this.getAll()
    return all.filter((a) => a.supplierId === supplierId && !a.isDeleted)
  },

  async create(data: SupplierAdjustmentInput): Promise<SupplierAdjustment> {
    return api.post<SupplierAdjustment>('/supplier-adjustments/', data)
  },

  async update(id: string, data: Partial<SupplierAdjustment>): Promise<SupplierAdjustment> {
    return api.patch<SupplierAdjustment>(`/supplier-adjustments/${id}/`, data)
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/supplier-adjustments/${id}/`)
  },

  async reset(): Promise<void> {
    await api.post('/reset/')
  },
}

export async function buildLedger(supplierId: string): Promise<LedgerEntry[]> {
  return api.get<LedgerEntry[]>(`/suppliers/${supplierId}/ledger/`)
}
