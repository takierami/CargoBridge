import type { SupplierDocument } from '../types'
import { api } from '../lib/apiClient'

export const documentService = {
  async getAll(): Promise<SupplierDocument[]> {
    return api.getList<SupplierDocument>('/supplier-documents/')
  },

  async create(data: Omit<SupplierDocument, 'id' | 'uploadedAt'>): Promise<SupplierDocument> {
    return api.post<SupplierDocument>('/supplier-documents/', data)
  },

  async update(id: string, data: Partial<SupplierDocument>): Promise<SupplierDocument | null> {
    try {
      return await api.patch<SupplierDocument>(`/supplier-documents/${id}/`, data)
    } catch {
      return null
    }
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/supplier-documents/${id}/`)
  },

  async reset(): Promise<void> {
    await api.post('/reset/')
  },
}
