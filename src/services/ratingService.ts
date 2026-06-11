import type { SupplierRating } from '../types'

const RATING_KEY = 'cargobridge_supplier_ratings'

export const ratingService = {
  getAll(): SupplierRating[] {
    const stored = localStorage.getItem(RATING_KEY)
    if (!stored) return []
    try {
      return JSON.parse(stored) as SupplierRating[]
    } catch {
      return []
    }
  },

  getById(id: string): SupplierRating | undefined {
    return this.getAll().find(r => r.id === id)
  },

  getBySupplierId(supplierId: string): SupplierRating | undefined {
    return this.getAll().find(r => r.supplierId === supplierId)
  },

  create(data: Omit<SupplierRating, 'id' | 'createdAt' | 'updatedAt'>): SupplierRating {
    const all = this.getAll()
    const now = new Date().toISOString()
    const newRating: SupplierRating = {
      ...data,
      id: `rating-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      ratedAt: now,
      createdAt: now,
      updatedAt: now,
    }
    all.push(newRating)
    localStorage.setItem(RATING_KEY, JSON.stringify(all))
    return newRating
  },

  upsert(supplierId: string, data: Omit<SupplierRating, 'id' | 'supplierId' | 'overall' | 'ratedAt' | 'createdAt' | 'updatedAt'>): SupplierRating {
    const existing = this.getBySupplierId(supplierId)
    const now = new Date().toISOString()
    const overall = Math.round(((data.quality + data.communication + data.deliverySpeed + data.reliability + data.pricing + data.flexibility) / 6) * 10) / 10

    if (existing) {
      const all = this.getAll()
      const idx = all.findIndex(r => r.supplierId === supplierId)
      all[idx] = { ...all[idx], ...data, overall, ratedAt: now, updatedAt: now }
      localStorage.setItem(RATING_KEY, JSON.stringify(all))
      return all[idx]
    }

    return this.create({ ...data, supplierId, overall })
  },

  delete(id: string): boolean {
    const all = this.getAll()
    const idx = all.findIndex(r => r.id === id)
    if (idx === -1) return false
    const filtered = all.filter(r => r.id !== id)
    localStorage.setItem(RATING_KEY, JSON.stringify(filtered))
    return true
  },

  reset(): void {
    localStorage.setItem(RATING_KEY, JSON.stringify([]))
  },
}