import type { SupplierDocumentTemplate } from '../types'
import { api } from '../lib/apiClient'

export const supplierTemplateService = {
  async getAll(): Promise<SupplierDocumentTemplate[]> {
    return api.getList<SupplierDocumentTemplate>('/supplier-templates/')
  },

  async create(data: Omit<SupplierDocumentTemplate, 'id' | 'createdAt'>): Promise<SupplierDocumentTemplate> {
    return api.post<SupplierDocumentTemplate>('/supplier-templates/', data)
  },

  async update(id: string, data: Partial<SupplierDocumentTemplate>): Promise<SupplierDocumentTemplate | null> {
    try {
      return await api.patch<SupplierDocumentTemplate>(`/supplier-templates/${id}/`, data)
    } catch {
      return null
    }
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/supplier-templates/${id}/`)
  },

  async duplicate(id: string): Promise<SupplierDocumentTemplate> {
    return api.post<SupplierDocumentTemplate>(`/supplier-templates/${id}/duplicate/`, {})
  },

  async reset(): Promise<void> {
    await api.post('/reset/')
  },
}
