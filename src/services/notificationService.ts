import type { Notification } from '../types'
import { mockNotifications } from '../mock-data'

const KEY = 'cargobridge_notifications'

export const notificationService = {
  getAll(): Notification[] {
    const stored = localStorage.getItem(KEY)
    if (!stored) {
      localStorage.setItem(KEY, JSON.stringify(mockNotifications))
      return mockNotifications
    }
    try {
      return JSON.parse(stored) as Notification[]
    } catch {
      localStorage.setItem(KEY, JSON.stringify(mockNotifications))
      return mockNotifications
    }
  },

  getUnreadCount(): number {
    return this.getAll().filter((n) => !n.read).length
  },

  create(data: Omit<Notification, 'id' | 'timestamp' | 'read'>): Notification {
    const all = this.getAll()
    const notif: Notification = {
      ...data,
      id: `notif-${Date.now()}`,
      timestamp: new Date().toISOString(),
      read: false,
    }
    all.unshift(notif)
    localStorage.setItem(KEY, JSON.stringify(all))
    return notif
  },

  markRead(id: string): void {
    const all = this.getAll().map((n) =>
      n.id === id ? { ...n, read: true } : n
    )
    localStorage.setItem(KEY, JSON.stringify(all))
  },

  markAllRead(): void {
    const all = this.getAll().map((n) => ({ ...n, read: true }))
    localStorage.setItem(KEY, JSON.stringify(all))
  },

  reset(): void {
    localStorage.setItem(KEY, JSON.stringify(mockNotifications))
  },
}
