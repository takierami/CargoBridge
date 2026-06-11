import type { SupplierDocumentTemplate } from '../types'

const KEY = 'cargobridge_supplier_templates'

export const supplierTemplateService = {
  getAll(): SupplierDocumentTemplate[] {
    const stored = localStorage.getItem(KEY)
    if (!stored) return []
    try {
      return JSON.parse(stored) as SupplierDocumentTemplate[]
    } catch {
      return []
    }
  },

  getById(id: string): SupplierDocumentTemplate | undefined {
    return this.getAll().find(template => template.id === id)
  },

  create(data: Omit<SupplierDocumentTemplate, 'id' | 'createdAt'>): SupplierDocumentTemplate {
    const all = this.getAll()
    const template: SupplierDocumentTemplate = {
      ...data,
      id: `supplier-template-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      createdAt: new Date().toISOString(),
    }
    all.push(template)
    localStorage.setItem(KEY, JSON.stringify(all))
    return template
  },

  update(id: string, data: Partial<SupplierDocumentTemplate>): SupplierDocumentTemplate | null {
    const all = this.getAll()
    const index = all.findIndex(template => template.id === id)
    if (index === -1) return null
    all[index] = { ...all[index], ...data }
    localStorage.setItem(KEY, JSON.stringify(all))
    return all[index]
  },

  delete(id: string): boolean {
    const all = this.getAll()
    const filtered = all.filter(template => template.id !== id)
    if (filtered.length === all.length) return false
    localStorage.setItem(KEY, JSON.stringify(filtered))
    return true
  },

  reset(): void {
    localStorage.setItem(KEY, JSON.stringify([]))
  },
}