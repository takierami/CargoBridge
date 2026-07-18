import type { Currency, ConversionRecord, CalculatorRecord } from '../types'
import { api } from '../lib/apiClient'

let currencyCache: Currency[] = []
let historyCache: ConversionRecord[] = []
let calcCache: CalculatorRecord[] = []

export function setCurrencyCache(currencies: Currency[]) {
  currencyCache = currencies
}

export function setConversionCache(records: ConversionRecord[]) {
  historyCache = records
}

export function setCalcCache(records: CalculatorRecord[]) {
  calcCache = records
}

export const exchangeRateService = {
  getAll(): Currency[] {
    return currencyCache
  },

  getByCode(code: string): Currency | undefined {
    return currencyCache.find((c) => c.code === code)
  },

  getRateToBase(code: string): number {
    const currency = this.getByCode(code)
    return currency?.rateToBase ?? 1
  },

  convert(amount: number, fromCode: string, toCode: string): number {
    if (fromCode === toCode) return amount
    const fromRate = this.getRateToBase(fromCode)
    const toRate = this.getRateToBase(toCode)
    if (toRate === 0) return 0
    return (amount * fromRate) / toRate
  },

  getRate(fromCode: string, toCode: string): number {
    if (fromCode === toCode) return 1
    const fromRate = this.getRateToBase(fromCode)
    const toRate = this.getRateToBase(toCode)
    if (toRate === 0) return 0
    return fromRate / toRate
  },

  codeExists(code: string, excludeId?: string): boolean {
    return currencyCache.some((c) => c.code === code && c.id !== excludeId)
  },
}

export const currencyService = {
  getAll(): Currency[] {
    return currencyCache
  },

  async loadAll(): Promise<Currency[]> {
    currencyCache = await api.getList<Currency>('/currencies/')
    return currencyCache
  },

  async create(data: Omit<Currency, 'id' | 'createdAt'>): Promise<Currency | { error: string }> {
    if (!data.code?.trim()) return { error: 'Currency code is required' }
    if (exchangeRateService.codeExists(data.code.toUpperCase())) {
      return { error: `Currency with code ${data.code.toUpperCase()} already exists` }
    }
    const c = await api.post<Currency>('/currencies/', { ...data, code: data.code.toUpperCase() })
    currencyCache = [...currencyCache, c]
    return c
  },

  async update(id: string, data: Partial<Currency>): Promise<{ success: boolean; error?: string }> {
    try {
      const updated = await api.patch<Currency>(`/currencies/${id}/`, data)
      currencyCache = currencyCache.map((c) => (c.id === id ? updated : c))
      return { success: true }
    } catch (e) {
      return { success: false, error: e instanceof Error ? e.message : 'Failed' }
    }
  },

  async updateRate(id: string, rate: number): Promise<{ success: boolean; error?: string }> {
    return this.update(id, { rateToBase: rate })
  },

  async delete(id: string): Promise<boolean> {
    const currency = currencyCache.find((c) => c.id === id)
    if (!currency || currency.isBase) return false
    await api.delete(`/currencies/${id}/`)
    currencyCache = currencyCache.filter((c) => c.id !== id)
    return true
  },

  async setDefault(id: string): Promise<void> {
    await api.post(`/currencies/${id}/set_default/`)
    await this.loadAll()
  },

  async reset(): Promise<void> {
    await api.post('/reset/')
    await this.loadAll()
  },

  codeExists(code: string, excludeId?: string): boolean {
    return exchangeRateService.codeExists(code, excludeId)
  },
}

export const conversionHistoryService = {
  getAll(): ConversionRecord[] {
    return historyCache
  },

  async loadAll(): Promise<ConversionRecord[]> {
    historyCache = await api.getList<ConversionRecord>('/conversion-records/')
    return historyCache
  },

  async add(record: Omit<ConversionRecord, 'id' | 'timestamp'>): Promise<ConversionRecord> {
    const r = await api.post<ConversionRecord>('/conversion-records/', record)
    historyCache = [r, ...historyCache].slice(0, 200)
    return r
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/conversion-records/${id}/`)
    historyCache = historyCache.filter((r) => r.id !== id)
  },

  async clear(): Promise<void> {
    await api.post('/conversion-records/clear/')
    historyCache = []
  },

  exportCSV(): string {
    const header = 'Date,From,To,Amount,Result,Rate'
    const rows = historyCache.map(
      (r) => `"${r.timestamp}","${r.fromCode}","${r.toCode}",${r.fromAmount},${r.toAmount},${r.rate}`,
    )
    return [header, ...rows].join('\n')
  },
}

export const calcRecordService = {
  getAll(): CalculatorRecord[] {
    return calcCache
  },

  async loadAll(): Promise<CalculatorRecord[]> {
    calcCache = await api.getList<CalculatorRecord>('/calculator-records/')
    return calcCache
  },

  async add(record: Omit<CalculatorRecord, 'id' | 'timestamp'>): Promise<CalculatorRecord> {
    const r = await api.post<CalculatorRecord>('/calculator-records/', record)
    calcCache = [r, ...calcCache].slice(0, 100)
    return r
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/calculator-records/${id}/`)
    calcCache = calcCache.filter((r) => r.id !== id)
  },

  async reset(): Promise<void> {
    await api.post('/calculator-records/clear/')
    calcCache = []
  },
}
