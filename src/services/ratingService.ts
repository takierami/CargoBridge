import type { SupplierRating } from '../types'
import { api } from '../lib/apiClient'

export const ratingService = {
  async getAll(): Promise<SupplierRating[]> {
    return api.getList<SupplierRating>('/supplier-ratings/')
  },

  async getBySupplierId(supplierId: string): Promise<SupplierRating | undefined> {
    const all = await this.getAll()
    return all.find((r) => r.supplierId === supplierId)
  },

  async upsert(
    supplierId: string,
    data: Omit<SupplierRating, 'id' | 'supplierId' | 'overall' | 'ratedAt' | 'createdAt' | 'updatedAt'>,
  ): Promise<SupplierRating> {
    return api.post<SupplierRating>('/supplier-ratings/upsert/', { supplierId, ...data })
  },

  async reset(): Promise<void> {
    await api.post('/reset/')
  },
}
