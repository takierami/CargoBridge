import type { Supplier, SupplierProduct } from '../types'

const SUPPLIER_KEY = 'cargobridge_suppliers'
const PRODUCT_KEY = 'cargobridge_supplier_products'
const COUNTER_KEY = 'cargobridge_supplier_counter'

function generateSupplierCode(): string {
  const year = new Date().getFullYear()
  const stored = localStorage.getItem(COUNTER_KEY)
  const counterData = stored ? JSON.parse(stored) : { year, count: 0 }
  if (counterData.year !== year) {
    counterData.year = year
    counterData.count = 0
  }
  counterData.count += 1
  localStorage.setItem(COUNTER_KEY, JSON.stringify(counterData))
  return `SUP-${year}-${String(counterData.count).padStart(4, '0')}`
}

export const supplierService = {
  getAll(): Supplier[] {
    const stored = localStorage.getItem(SUPPLIER_KEY)
    if (!stored) return []
    try {
      return JSON.parse(stored) as Supplier[]
    } catch {
      return []
    }
  },

  getById(id: string): Supplier | undefined {
    return this.getAll().find(s => s.id === id)
  },

  getByCode(code: string): Supplier | undefined {
    return this.getAll().find(s => s.code === code)
  },

  create(data: Omit<Supplier, 'id' | 'code' | 'createdAt' | 'updatedAt'>): Supplier {
    const all = this.getAll()
    const now = new Date().toISOString()
    const newSupplier: Supplier = {
      ...data,
      id: `supplier-${Date.now()}`,
      code: generateSupplierCode(),
      totalPurchased: data.totalPurchased ?? 0,
      totalPaid: data.totalPaid ?? 0,
      outstanding: data.outstanding ?? 0,
      balanceCurrency: data.balanceCurrency || data.preferredCurrency || 'USD',
      createdAt: now,
      updatedAt: now,
    }
    all.push(newSupplier)
    localStorage.setItem(SUPPLIER_KEY, JSON.stringify(all))
    return newSupplier
  },

  update(id: string, data: Partial<Supplier>): Supplier | null {
    const all = this.getAll()
    const idx = all.findIndex(s => s.id === id)
    if (idx === -1) return null
    all[idx] = { ...all[idx], ...data, updatedAt: new Date().toISOString() }
    localStorage.setItem(SUPPLIER_KEY, JSON.stringify(all))
    return all[idx]
  },

  delete(id: string): boolean {
    const all = this.getAll()
    const idx = all.findIndex(s => s.id === id)
    if (idx === -1) return false
    const filtered = all.filter(s => s.id !== id)
    localStorage.setItem(SUPPLIER_KEY, JSON.stringify(filtered))
    return true
  },

  reset(): void {
    localStorage.setItem(SUPPLIER_KEY, JSON.stringify([]))
    localStorage.setItem(COUNTER_KEY, JSON.stringify({ year: new Date().getFullYear(), count: 0 }))
  },
}

export const supplierProductService = {
  getAll(): SupplierProduct[] {
    const stored = localStorage.getItem(PRODUCT_KEY)
    if (!stored) return []
    try {
      return JSON.parse(stored) as SupplierProduct[]
    } catch {
      return []
    }
  },

  getById(id: string): SupplierProduct | undefined {
    return this.getAll().find(p => p.id === id)
  },

  getBySupplierId(supplierId: string): SupplierProduct[] {
    return this.getAll().filter(p => p.supplierId === supplierId)
  },

  create(data: Omit<SupplierProduct, 'id' | 'createdAt' | 'updatedAt'>): SupplierProduct {
    const all = this.getAll()
    const now = new Date().toISOString()
    const newProduct: SupplierProduct = {
      ...data,
      id: `supprod-${Date.now()}`,
      createdAt: now,
      updatedAt: now,
    }
    all.push(newProduct)
    localStorage.setItem(PRODUCT_KEY, JSON.stringify(all))
    return newProduct
  },

  update(id: string, data: Partial<SupplierProduct>): SupplierProduct | null {
    const all = this.getAll()
    const idx = all.findIndex(p => p.id === id)
    if (idx === -1) return null
    all[idx] = { ...all[idx], ...data, updatedAt: new Date().toISOString() }
    localStorage.setItem(PRODUCT_KEY, JSON.stringify(all))
    return all[idx]
  },

  delete(id: string): boolean {
    const all = this.getAll()
    const idx = all.findIndex(p => p.id === id)
    if (idx === -1) return false
    const filtered = all.filter(p => p.id !== id)
    localStorage.setItem(PRODUCT_KEY, JSON.stringify(filtered))
    return true
  },

  deleteBySupplierId(supplierId: string): void {
    const all = this.getAll()
    const filtered = all.filter(p => p.supplierId !== supplierId)
    localStorage.setItem(PRODUCT_KEY, JSON.stringify(filtered))
  },

  reset(): void {
    localStorage.setItem(PRODUCT_KEY, JSON.stringify([]))
  },
}