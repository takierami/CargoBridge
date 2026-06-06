import type { DocumentTemplate, TemplateType } from '../types'
import { mockTemplates } from '../mock-data/templates'

const KEY = 'cargobridge_templates_v2'

export const templateService = {
  getAll(): DocumentTemplate[] {
    const stored = localStorage.getItem(KEY)
    if (!stored) {
      localStorage.setItem(KEY, JSON.stringify(mockTemplates))
      return mockTemplates
    }
    try {
      return JSON.parse(stored) as DocumentTemplate[]
    } catch {
      localStorage.setItem(KEY, JSON.stringify(mockTemplates))
      return mockTemplates
    }
  },

  getById(id: string): DocumentTemplate | undefined {
    return this.getAll().find(t => t.id === id)
  },

  getDefault(type: TemplateType): DocumentTemplate | undefined {
    return this.getAll().find(t => t.type === type && t.isDefault)
      ?? this.getAll().find(t => t.type === type)
  },

  getByType(type: TemplateType): DocumentTemplate[] {
    return this.getAll().filter(t => t.type === type)
  },

  create(data: Omit<DocumentTemplate, 'id' | 'createdAt' | 'updatedAt'>): DocumentTemplate {
    const all = this.getAll()
    const tpl: DocumentTemplate = {
      ...data,
      id: `tpl-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    all.push(tpl)
    localStorage.setItem(KEY, JSON.stringify(all))
    return tpl
  },

  update(id: string, data: Partial<DocumentTemplate>): DocumentTemplate | null {
    const all = this.getAll()
    const idx = all.findIndex(t => t.id === id)
    if (idx === -1) return null
    all[idx] = { ...all[idx], ...data, updatedAt: new Date().toISOString() }
    localStorage.setItem(KEY, JSON.stringify(all))
    return all[idx]
  },

  setDefault(id: string, type: TemplateType): void {
    const all = this.getAll().map(t => ({
      ...t,
      isDefault: t.type === type ? t.id === id : t.isDefault,
    }))
    localStorage.setItem(KEY, JSON.stringify(all))
  },

  duplicate(id: string): DocumentTemplate | null {
    const original = this.getById(id)
    if (!original) return null
    return this.create({
      ...original,
      name: original.name + ' (نسخة)',
      isDefault: false,
    })
  },

  delete(id: string): boolean {
    const all = this.getAll()
    const idx = all.findIndex(t => t.id === id)
    if (idx === -1) return false
    const filtered = all.filter(t => t.id !== id)
    localStorage.setItem(KEY, JSON.stringify(filtered))
    return true
  },

  reset(): void {
    localStorage.setItem(KEY, JSON.stringify(mockTemplates))
  },
}
