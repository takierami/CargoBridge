import type { Notification } from '../types'
import { api } from '../lib/apiClient'

export const notificationService = {
  async getAll(): Promise<Notification[]> {
    return api.getList<Notification>('/notifications/')
  },

  async markRead(id: string): Promise<void> {
    await api.patch(`/notifications/${id}/`, { read: true })
  },

  async markAllRead(): Promise<void> {
    await api.post('/notifications/mark_all_read/')
  },

  async reset(): Promise<void> {
    await api.post('/reset/')
  },
}
