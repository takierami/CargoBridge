import type { Goods } from '../types'
import { mockGoods } from '../mock-data'

const KEY = 'cargobridge_goods'

function generateTrackingNumber(): string {
  const year = new Date().getFullYear()
  const num = String(Math.floor(Math.random() * 900) + 100)
  return `CB-${year}-${num}`
}

export const goodsService = {
  getAll(): Goods[] {
    const stored = localStorage.getItem(KEY)
    if (!stored) {
      localStorage.setItem(KEY, JSON.stringify(mockGoods))
      return mockGoods
    }
    try {
      return JSON.parse(stored) as Goods[]
    } catch {
      localStorage.setItem(KEY, JSON.stringify(mockGoods))
      return mockGoods
    }
  },

  getById(id: string): Goods | undefined {
    return this.getAll().find((g) => g.id === id)
  },

  getByTrackingNumber(tn: string): Goods | undefined {
    return this.getAll().find(
      (g) => g.trackingNumber.toLowerCase() === tn.toLowerCase()
    )
  },

  getByAgentId(agentId: string): Goods[] {
    return this.getAll().filter((g) => g.agentId === agentId)
  },

  create(data: Omit<Goods, 'id' | 'createdAt' | 'trackingNumber'>): Goods {
    const all = this.getAll()
    const newGoods: Goods = {
      ...data,
      id: `goods-${Date.now()}`,
      trackingNumber: generateTrackingNumber(),
      createdAt: new Date().toISOString(),
    }
    all.push(newGoods)
    localStorage.setItem(KEY, JSON.stringify(all))
    return newGoods
  },

  update(id: string, data: Partial<Goods>): Goods | null {
    const all = this.getAll()
    const idx = all.findIndex((g) => g.id === id)
    if (idx === -1) return null
    all[idx] = { ...all[idx], ...data }
    localStorage.setItem(KEY, JSON.stringify(all))
    return all[idx]
  },

  delete(id: string): boolean {
    const all = this.getAll()
    const idx = all.findIndex(g => g.id === id)
    if (idx === -1) return false
    const filtered = all.filter((g) => g.id !== id)
    localStorage.setItem(KEY, JSON.stringify(filtered))
    return true
  },

  reset(): void {
    localStorage.setItem(KEY, JSON.stringify(mockGoods))
  },
}
