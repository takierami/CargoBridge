import type { SupplierCategoryEntity } from '../types'

const KEY = 'cargobridge_supplier_categories'

const DEFAULT_CATEGORIES: SupplierCategoryEntity[] = [
  { id: 'cat-shoes', name: 'أحذية', nameFr: 'Shoes', isEditable: false, createdAt: '2024-01-01T00:00:00Z' },
  { id: 'cat-clothing', name: 'ملابس', nameFr: 'Clothing', isEditable: false, createdAt: '2024-01-01T00:00:00Z' },
  { id: 'cat-electronics', name: 'إلكترونيات', nameFr: 'Electronics', isEditable: false, createdAt: '2024-01-01T00:00:00Z' },
  { id: 'cat-furniture', name: 'أثاث', nameFr: 'Furniture', isEditable: false, createdAt: '2024-01-01T00:00:00Z' },
  { id: 'cat-accessories', name: 'إكسسوارات', nameFr: 'Accessories', isEditable: false, createdAt: '2024-01-01T00:00:00Z' },
  { id: 'cat-other', name: 'أخرى', nameFr: 'Other', isEditable: false, createdAt: '2024-01-01T00:00:00Z' },
]

export const supplierCategoryService = {
  getAll(): SupplierCategoryEntity[] {
    const stored = localStorage.getItem(KEY)
    if (!stored) {
      localStorage.setItem(KEY, JSON.stringify(DEFAULT_CATEGORIES))
      return DEFAULT_CATEGORIES
    }
    try {
      return JSON.parse(stored) as SupplierCategoryEntity[]
    } catch {
      localStorage.setItem(KEY, JSON.stringify(DEFAULT_CATEGORIES))
      return DEFAULT_CATEGORIES
    }
  },

  getById(id: string): SupplierCategoryEntity | undefined {
    return this.getAll().find(c => c.id === id)
  },

  create(data: Omit<SupplierCategoryEntity, 'id' | 'createdAt'>): SupplierCategoryEntity {
    const all = this.getAll()
    const newCat: SupplierCategoryEntity = {
      ...data,
      id: `cat-${Date.now()}`,
      createdAt: new Date().toISOString(),
    }
    all.push(newCat)
    localStorage.setItem(KEY, JSON.stringify(all))
    return newCat
  },

  update(id: string, data: Partial<SupplierCategoryEntity>): SupplierCategoryEntity | null {
    const all = this.getAll()
    const idx = all.findIndex(c => c.id === id)
    if (idx === -1) return null
    all[idx] = { ...all[idx], ...data }
    localStorage.setItem(KEY, JSON.stringify(all))
    return all[idx]
  },

  delete(id: string): boolean {
    const all = this.getAll()
    const cat = all.find(c => c.id === id)
    if (!cat?.isEditable) return false
    const filtered = all.filter(c => c.id !== id)
    localStorage.setItem(KEY, JSON.stringify(filtered))
    return true
  },

  reset(): void {
    localStorage.setItem(KEY, JSON.stringify(DEFAULT_CATEGORIES))
  },
}