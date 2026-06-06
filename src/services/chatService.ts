import type { Message } from '../types'
import { mockMessages } from '../mock-data'

const KEY = 'cargobridge_messages'

export const chatService = {
  getAll(): Message[] {
    const stored = localStorage.getItem(KEY)
    if (!stored) {
      localStorage.setItem(KEY, JSON.stringify(mockMessages))
      return mockMessages
    }
    try {
      return JSON.parse(stored) as Message[]
    } catch {
      localStorage.setItem(KEY, JSON.stringify(mockMessages))
      return mockMessages
    }
  },

  getByConversation(conversationId: string): Message[] {
    return this.getAll().filter((m) => m.conversationId === conversationId)
  },

  create(data: Omit<Message, 'id' | 'timestamp' | 'read'>): Message {
    const all = this.getAll()
    const newMsg: Message = {
      ...data,
      id: `msg-${Date.now()}`,
      timestamp: new Date().toISOString(),
      read: false,
    }
    all.push(newMsg)
    localStorage.setItem(KEY, JSON.stringify(all))
    return newMsg
  },

  markRead(conversationId: string, role: string): void {
    const all = this.getAll().map((m) =>
      m.conversationId === conversationId && m.senderRole !== role
        ? { ...m, read: true }
        : m
    )
    localStorage.setItem(KEY, JSON.stringify(all))
  },

  getUnreadCount(role: string): number {
    return this.getAll().filter((m) => m.senderRole !== role && !m.read).length
  },

  reset(): void {
    localStorage.setItem(KEY, JSON.stringify(mockMessages))
  },
}
