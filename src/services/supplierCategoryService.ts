import type { SupplierCategoryEntity } from '../types'
import { api } from '../lib/apiClient'

export const supplierCategoryService = {
  async getAll(): Promise<SupplierCategoryEntity[]> {
    return api.getList<SupplierCategoryEntity>('/supplier-categories/')
  },

  async create(data: Omit<SupplierCategoryEntity, 'id' | 'createdAt'>): Promise<SupplierCategoryEntity> {
    return api.post<SupplierCategoryEntity>('/supplier-categories/', data)
  },

  async update(id: string, data: Partial<SupplierCategoryEntity>): Promise<SupplierCategoryEntity | null> {
    try {
      return await api.patch<SupplierCategoryEntity>(`/supplier-categories/${id}/`, data)
    } catch {
      return null
    }
  },

  async delete(id: string): Promise<boolean> {
    try {
      await api.delete(`/supplier-categories/${id}/`)
      return true
    } catch {
      return false
    }
  },

  async reset(): Promise<void> {
    await api.post('/reset/')
  },
}
