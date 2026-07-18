import type { Agent } from '../types'
import { api } from '../lib/apiClient'

export const agentService = {
  async getAll(): Promise<Agent[]> {
    return api.getList<Agent>('/agents/')
  },

  async getById(id: string): Promise<Agent | undefined> {
    try {
      return await api.get<Agent>(`/agents/${id}/`)
    } catch {
      return undefined
    }
  },

  async create(data: Omit<Agent, 'id' | 'createdAt'>): Promise<Agent> {
    return api.post<Agent>('/agents/', data)
  },

  async update(id: string, data: Partial<Agent>): Promise<Agent | null> {
    try {
      return await api.patch<Agent>(`/agents/${id}/`, data)
    } catch {
      return null
    }
  },

  async delete(id: string): Promise<boolean> {
    try {
      await api.delete(`/agents/${id}/`)
      return true
    } catch {
      return false
    }
  },

  async reset(): Promise<void> {
    await api.post('/reset/')
  },
}
