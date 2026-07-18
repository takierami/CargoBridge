import type { Goods } from '../types'
import { api } from '../lib/apiClient'

export const goodsService = {
  async getAll(): Promise<Goods[]> {
    return api.getList<Goods>('/goods/')
  },

  async getById(id: string): Promise<Goods | undefined> {
    try {
      return await api.get<Goods>(`/goods/${id}/`)
    } catch {
      return undefined
    }
  },

  async getByTrackingNumber(tn: string): Promise<Goods | undefined> {
    const all = await this.getAll()
    return all.find((g) => g.trackingNumber.toLowerCase() === tn.toLowerCase())
  },

  async getByAgentId(agentId: string): Promise<Goods[]> {
    const all = await this.getAll()
    return all.filter((g) => g.agentId === agentId)
  },

  async create(data: Omit<Goods, 'id' | 'createdAt' | 'trackingNumber'>): Promise<Goods> {
    return api.post<Goods>('/goods/', data)
  },

  async update(id: string, data: Partial<Goods>): Promise<Goods | null> {
    try {
      return await api.patch<Goods>(`/goods/${id}/`, data)
    } catch {
      return null
    }
  },

  async updateStatus(id: string, status: string): Promise<{ success: boolean; error?: string }> {
    try {
      return await api.post<{ success: boolean; error?: string }>(
        `/goods/${id}/update_status/`,
        { status },
      )
    } catch (e) {
      return { success: false, error: e instanceof Error ? e.message : 'Failed' }
    }
  },

  async getAllowedStatuses(id: string): Promise<{
    status: string
    statusConsistent: boolean
    lastEventStatus: string | null
    allowedActions: { status: string; actionKey: string }[]
  }> {
    return api.get(`/goods/${id}/allowed_statuses/`)
  },

  async updateCustomsStatus(
    id: string,
    customsStatus: string,
    notes = '',
  ): Promise<{ success: boolean; error?: string; goods?: Goods }> {
    try {
      return await api.post<{ success: boolean; error?: string; goods?: Goods }>(
        `/goods/${id}/update_customs_status/`,
        { customs_status: customsStatus, notes },
      )
    } catch (e) {
      return { success: false, error: e instanceof Error ? e.message : 'Failed' }
    }
  },

  async delete(id: string): Promise<boolean> {
    try {
      await api.delete(`/goods/${id}/`)
      return true
    } catch {
      return false
    }
  },

  async reset(): Promise<void> {
    await api.post('/reset/')
  },
}
