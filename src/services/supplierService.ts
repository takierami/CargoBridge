import type { Supplier, SupplierProduct } from '../types'
import { api } from '../lib/apiClient'

export const supplierService = {
  async getAll(): Promise<Supplier[]> {
    return api.getList<Supplier>('/suppliers/')
  },

  async getById(id: string): Promise<Supplier | undefined> {
    try {
      return await api.get<Supplier>(`/suppliers/${id}/`)
    } catch {
      return undefined
    }
  },

  async getByCode(code: string): Promise<Supplier | undefined> {
    const all = await this.getAll()
    return all.find((s) => s.code === code)
  },

  async create(data: Omit<Supplier, 'id' | 'code' | 'createdAt' | 'updatedAt'>): Promise<Supplier> {
    return api.post<Supplier>('/suppliers/', data)
  },

  async update(id: string, data: Partial<Supplier>): Promise<Supplier | null> {
    try {
      return await api.patch<Supplier>(`/suppliers/${id}/`, data)
    } catch {
      return null
    }
  },

  async delete(id: string): Promise<boolean> {
    try {
      await api.delete(`/suppliers/${id}/`)
      return true
    } catch {
      return false
    }
  },

  async reset(): Promise<void> {
    await api.post('/reset/')
  },
}

export const supplierProductService = {
  async getAll(): Promise<SupplierProduct[]> {
    return api.getList<SupplierProduct>('/supplier-products/')
  },

  async create(data: Omit<SupplierProduct, 'id' | 'createdAt' | 'updatedAt'>): Promise<SupplierProduct> {
    return api.post<SupplierProduct>('/supplier-products/', data)
  },

  async update(id: string, data: Partial<SupplierProduct>): Promise<SupplierProduct | null> {
    try {
      return await api.patch<SupplierProduct>(`/supplier-products/${id}/`, data)
    } catch {
      return null
    }
  },

  async delete(id: string): Promise<boolean> {
    try {
      await api.delete(`/supplier-products/${id}/`)
      return true
    } catch {
      return false
    }
  },

  async reset(): Promise<void> {
    await api.post('/reset/')
  },
}
