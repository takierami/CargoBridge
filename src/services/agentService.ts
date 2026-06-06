import type { Agent } from '../types'
import { mockAgents } from '../mock-data'

const KEY = 'cargobridge_agents'

export const agentService = {
  getAll(): Agent[] {
    const stored = localStorage.getItem(KEY)
    if (!stored) {
      localStorage.setItem(KEY, JSON.stringify(mockAgents))
      return mockAgents
    }
    try {
      return JSON.parse(stored) as Agent[]
    } catch {
      localStorage.setItem(KEY, JSON.stringify(mockAgents))
      return mockAgents
    }
  },

  getById(id: string): Agent | undefined {
    return this.getAll().find((a) => a.id === id)
  },

  create(data: Omit<Agent, 'id' | 'createdAt'>): Agent {
    const all = this.getAll()
    const newAgent: Agent = {
      ...data,
      id: `agent-${Date.now()}`,
      createdAt: new Date().toISOString(),
    }
    all.push(newAgent)
    localStorage.setItem(KEY, JSON.stringify(all))
    return newAgent
  },

  update(id: string, data: Partial<Agent>): Agent | null {
    const all = this.getAll()
    const idx = all.findIndex((a) => a.id === id)
    if (idx === -1) return null
    all[idx] = { ...all[idx], ...data }
    localStorage.setItem(KEY, JSON.stringify(all))
    return all[idx]
  },

  delete(id: string): boolean {
    const all = this.getAll()
    const idx = all.findIndex(a => a.id === id)
    if (idx === -1) return false
    const filtered = all.filter((a) => a.id !== id)
    localStorage.setItem(KEY, JSON.stringify(filtered))
    return true
  },

  reset(): void {
    localStorage.setItem(KEY, JSON.stringify(mockAgents))
  },
}
