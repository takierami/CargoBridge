import type { SupplierCommunication } from '../types'
import { api } from '../lib/apiClient'

export const communicationService = {
  async getAll(): Promise<SupplierCommunication[]> {
    return api.getList<SupplierCommunication>('/supplier-communications/')
  },

  async create(
    data: Omit<SupplierCommunication, 'id' | 'isDeleted' | 'createdAt' | 'updatedAt'>,
  ): Promise<SupplierCommunication> {
    return api.post<SupplierCommunication>('/supplier-communications/', data)
  },

  async update(id: string, data: Partial<SupplierCommunication>): Promise<SupplierCommunication | null> {
    try {
      return await api.patch<SupplierCommunication>(`/supplier-communications/${id}/`, data)
    } catch {
      return null
    }
  },

  async delete(id: string): Promise<boolean> {
    try {
      await api.delete(`/supplier-communications/${id}/`)
      return true
    } catch {
      return false
    }
  },

  async reset(): Promise<void> {
    await api.post('/reset/')
  },
}
