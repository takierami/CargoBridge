import type { DocumentTemplate, TemplateType } from '../types'
import { api } from '../lib/apiClient'

export const templateService = {
  async getAll(): Promise<DocumentTemplate[]> {
    return api.getList<DocumentTemplate>('/templates/')
  },

  async create(data: Omit<DocumentTemplate, 'id' | 'createdAt' | 'updatedAt'>): Promise<DocumentTemplate> {
    return api.post<DocumentTemplate>('/templates/', data)
  },

  async update(id: string, data: Partial<DocumentTemplate>): Promise<void> {
    await api.patch(`/templates/${id}/`, data)
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/templates/${id}/`)
  },

  async duplicate(id: string): Promise<DocumentTemplate | null> {
    try {
      return await api.post<DocumentTemplate>(`/templates/${id}/duplicate/`)
    } catch {
      return null
    }
  },

  async setDefault(id: string, _type: TemplateType): Promise<void> {
    await api.post(`/templates/${id}/set_default/`)
  },

  async getDefault(type: TemplateType): Promise<DocumentTemplate | undefined> {
    const all = await this.getAll()
    return all.find((t) => t.type === type && t.isDefault)
  },

  async reset(): Promise<void> {
    await api.post('/reset/')
  },
}
