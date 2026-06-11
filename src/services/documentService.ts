import type { SupplierDocument } from '../types'

const DOC_KEY = 'cargobridge_supplier_documents'

export const documentService = {
  getAll(): SupplierDocument[] {
    const stored = localStorage.getItem(DOC_KEY)
    if (!stored) return []
    try {
      return JSON.parse(stored) as SupplierDocument[]
    } catch {
      return []
    }
  },

  getById(id: string): SupplierDocument | undefined {
    return this.getAll().find(d => d.id === id)
  },

  getBySupplierId(supplierId: string): SupplierDocument[] {
    return this.getAll()
      .filter(d => d.supplierId === supplierId)
      .sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime())
  },

  create(data: Omit<SupplierDocument, 'id' | 'uploadedAt'>): SupplierDocument {
    const all = this.getAll()
    const newDoc: SupplierDocument = {
      ...data,
      id: `doc-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      uploadedAt: new Date().toISOString(),
    }
    all.push(newDoc)
    localStorage.setItem(DOC_KEY, JSON.stringify(all))
    return newDoc
  },

  update(id: string, data: Partial<SupplierDocument>): SupplierDocument | null {
    const all = this.getAll()
    const idx = all.findIndex(d => d.id === id)
    if (idx === -1) return null
    all[idx] = { ...all[idx], ...data }
    localStorage.setItem(DOC_KEY, JSON.stringify(all))
    return all[idx]
  },

  delete(id: string): boolean {
    const all = this.getAll()
    const idx = all.findIndex(d => d.id === id)
    if (idx === -1) return false
    localStorage.setItem(DOC_KEY, JSON.stringify(all.filter(d => d.id !== id)))
    return true
  },

  reset(): void {
    localStorage.setItem(DOC_KEY, JSON.stringify([]))
  },
}