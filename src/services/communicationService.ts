import type { SupplierCommunication, CommunicationType } from '../types'

const COMM_KEY = 'cargobridge_supplier_communications'
const COMM_COUNTER_KEY = 'cargobridge_communication_counter'

function generateCommId(): string {
  const stored = localStorage.getItem(COMM_COUNTER_KEY)
  const counterData = stored ? JSON.parse(stored) : { count: 0 }
  counterData.count += 1
  localStorage.setItem(COMM_COUNTER_KEY, JSON.stringify(counterData))
  return `comm-${Date.now()}-${counterData.count}`
}

export const communicationService = {
  getAll(): SupplierCommunication[] {
    const stored = localStorage.getItem(COMM_KEY)
    if (!stored) return []
    try {
      return JSON.parse(stored) as SupplierCommunication[]
    } catch {
      return []
    }
  },

  getById(id: string): SupplierCommunication | undefined {
    return this.getAll().find(c => c.id === id)
  },

  getBySupplierId(supplierId: string): SupplierCommunication[] {
    return this.getAll()
      .filter(c => c.supplierId === supplierId && !c.isDeleted)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  },

  create(data: Omit<SupplierCommunication, 'id' | 'isDeleted' | 'createdAt' | 'updatedAt'>): SupplierCommunication {
    const all = this.getAll()
    const now = new Date().toISOString()
    const newComm: SupplierCommunication = {
      ...data,
      id: generateCommId(),
      isDeleted: false,
      createdAt: now,
      updatedAt: now,
    }
    all.push(newComm)
    localStorage.setItem(COMM_KEY, JSON.stringify(all))
    return newComm
  },

  update(id: string, data: Partial<SupplierCommunication>): SupplierCommunication | null {
    const all = this.getAll()
    const idx = all.findIndex(c => c.id === id)
    if (idx === -1) return null
    const now = new Date().toISOString()
    all[idx] = { ...all[idx], ...data, updatedAt: now }
    localStorage.setItem(COMM_KEY, JSON.stringify(all))
    return all[idx]
  },

  delete(id: string): boolean {
    const all = this.getAll()
    const idx = all.findIndex(c => c.id === id)
    if (idx === -1) return false
    all[idx] = { ...all[idx], isDeleted: true, updatedAt: new Date().toISOString() }
    localStorage.setItem(COMM_KEY, JSON.stringify(all))
    return true
  },

  reset(): void {
    localStorage.setItem(COMM_KEY, JSON.stringify([]))
    localStorage.setItem(COMM_COUNTER_KEY, JSON.stringify({ count: 0 }))
  },
}