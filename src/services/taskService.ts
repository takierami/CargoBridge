import type { SupplierTask } from '../types'
import { api } from '../lib/apiClient'

export function isOverdue(task: SupplierTask): boolean {
  if (task.status === 'completed' || task.isDeleted) return false
  return task.dueDate < new Date().toISOString().split('T')[0]
}

export const taskService = {
  async getAll(): Promise<SupplierTask[]> {
    return api.getList<SupplierTask>('/supplier-tasks/')
  },

  async create(data: Omit<SupplierTask, 'id' | 'isDeleted' | 'createdAt' | 'updatedAt'>): Promise<SupplierTask> {
    return api.post<SupplierTask>('/supplier-tasks/', data)
  },

  async update(id: string, data: Partial<SupplierTask>): Promise<SupplierTask | null> {
    try {
      return await api.patch<SupplierTask>(`/supplier-tasks/${id}/`, data)
    } catch {
      return null
    }
  },

  async markComplete(id: string): Promise<SupplierTask | null> {
    try {
      return await api.post<SupplierTask>(`/supplier-tasks/${id}/complete/`)
    } catch {
      return null
    }
  },

  async delete(id: string): Promise<boolean> {
    try {
      await api.delete(`/supplier-tasks/${id}/`)
      return true
    } catch {
      return false
    }
  },

  async reset(): Promise<void> {
    await api.post('/reset/')
  },
}
