import type { Currency, ConversionRecord, CalculatorRecord } from '../types'

const CURRENCIES_KEY = 'cargobridge_currencies_v1'
const HISTORY_KEY = 'cargobridge_conversion_history_v1'
const CALC_KEY = 'cargobridge_calc_records_v1'

// ── Default currencies (DZD = base, rateToBase = 1) ──────────────────────────
const DEFAULT_CURRENCIES: Currency[] = [
  { id: 'cur-dzd', code: 'DZD', name: 'دينار جزائري', nameFr: 'Dinar algérien', symbol: 'دج', rateToBase: 1, isBase: true, isEnabled: true, isDefault: true, createdAt: '2025-01-01T00:00:00Z' },
  { id: 'cur-eur', code: 'EUR', name: 'يورو', nameFr: 'Euro', symbol: '€', rateToBase: 260, isBase: false, isEnabled: true, isDefault: false, createdAt: '2025-01-01T00:00:00Z' },
  { id: 'cur-cny', code: 'CNY', name: 'يوان صيني', nameFr: 'Yuan chinois', symbol: '¥', rateToBase: 21, isBase: false, isEnabled: true, isDefault: false, createdAt: '2025-01-01T00:00:00Z' },
  { id: 'cur-usd', code: 'USD', name: 'دولار أمريكي', nameFr: 'Dollar américain', symbol: '$', rateToBase: 235, isBase: false, isEnabled: true, isDefault: false, createdAt: '2025-01-01T00:00:00Z' },
  { id: 'cur-aed', code: 'AED', name: 'درهم إماراتي', nameFr: 'Dirham des EAU', symbol: 'د.إ', rateToBase: 64, isBase: false, isEnabled: true, isDefault: false, createdAt: '2025-01-01T00:00:00Z' },
]

// ── Centralized Exchange Rate Service ────────────────────────────────────────
// This is the SINGLE SOURCE OF TRUTH for all currency conversions.
// Always fetches fresh rates from localStorage - no caching.
export const exchangeRateService = {
  getAll(): Currency[] {
    const stored = localStorage.getItem(CURRENCIES_KEY)
    if (!stored) {
      localStorage.setItem(CURRENCIES_KEY, JSON.stringify(DEFAULT_CURRENCIES))
      return DEFAULT_CURRENCIES
    }
    try {
      return JSON.parse(stored) as Currency[]
    } catch {
      localStorage.setItem(CURRENCIES_KEY, JSON.stringify(DEFAULT_CURRENCIES))
      return DEFAULT_CURRENCIES
    }
  },

  getByCode(code: string): Currency | undefined {
    return this.getAll().find(c => c.code === code)
  },

  getRateToBase(code: string): number {
    const currency = this.getByCode(code)
    if (!currency) {
      console.warn(`ExchangeRateService: Currency ${code} not found, using 1`)
      return 1
    }
    return currency.rateToBase
  },

  // Convert amount using LIVE rates from localStorage - always fresh
  convert(amount: number, fromCode: string, toCode: string): number {
    if (fromCode === toCode) return amount
    const fromRate = this.getRateToBase(fromCode)
    const toRate = this.getRateToBase(toCode)
    if (toRate === 0) {
      console.error('ExchangeRateService: Cannot convert to currency with rate 0')
      return 0
    }
    const dzd = amount * fromRate
    return dzd / toRate
  },

  // Get exchange rate between two currencies using LIVE rates
  getRate(fromCode: string, toCode: string): number {
    if (fromCode === toCode) return 1
    const fromRate = this.getRateToBase(fromCode)
    const toRate = this.getRateToBase(toCode)
    if (toRate === 0) return 0
    return fromRate / toRate
  },

  // Validate a rate value
  validateRate(value: number): { valid: boolean; error?: string } {
    if (value <= 0) {
      return { valid: false, error: 'Rate must be positive' }
    }
    if (!isFinite(value)) {
      return { valid: false, error: 'Rate must be a finite number' }
    }
    return { valid: true }
  },

  // Check if currency code already exists (for duplicate prevention)
  codeExists(code: string, excludeId?: string): boolean {
    return this.getAll().some(c => c.code === code && c.id !== excludeId)
  },

  // Update a rate with validation
  updateRate(id: string, newRate: number): { success: boolean; error?: string } {
    const validation = this.validateRate(newRate)
    if (!validation.valid) {
      return { success: false, error: validation.error }
    }

    const currencies = this.getAll()
    const currency = currencies.find(c => c.id === id)
    if (!currency) {
      return { success: false, error: 'Currency not found' }
    }

    const updated = currencies.map(c =>
      c.id === id ? { ...c, rateToBase: newRate } : c
    )
    localStorage.setItem(CURRENCIES_KEY, JSON.stringify(updated))
    return { success: true }
  },
}

// ── Convert: from → to using DZD as pivot ────────────────────────────────────
// DEPRECATED: Use exchangeRateService.convert() instead for guaranteed fresh rates
export function convertAmount(amount: number, from: Currency, to: Currency): number {
  if (from.id === to.id) return amount
  const dzd = amount * from.rateToBase
  return dzd / to.rateToBase
}

// DEPRECATED: Use exchangeRateService.getRate() instead
export function getRate(from: Currency, to: Currency): number {
  if (from.id === to.id) return 1
  return from.rateToBase / to.rateToBase
}

// ── Currency CRUD ─────────────────────────────────────────────────────────────
export const currencyService = {
  getAll(): Currency[] {
    return exchangeRateService.getAll()
  },

  save(currencies: Currency[]): void {
    localStorage.setItem(CURRENCIES_KEY, JSON.stringify(currencies))
  },

  create(data: Omit<Currency, 'id' | 'createdAt'>): Currency | { error: string } {
    if (!data.code || data.code.trim() === '') {
      return { error: 'Currency code is required' }
    }
    if (exchangeRateService.codeExists(data.code.toUpperCase())) {
      return { error: `Currency with code ${data.code.toUpperCase()} already exists` }
    }
    if (!data.isBase && data.rateToBase <= 0) {
      return { error: 'Exchange rate must be positive' }
    }

    const all = this.getAll()
    const c: Currency = {
      ...data,
      code: data.code.toUpperCase(),
      id: `cur-${Date.now()}`,
      createdAt: new Date().toISOString()
    }
    all.push(c)
    this.save(all)
    return c
  },

  update(id: string, data: Partial<Currency>): { success: boolean; error?: string } {
    const all = this.getAll()
    const currency = all.find(c => c.id === id)
    if (!currency) {
      return { success: false, error: 'Currency not found' }
    }

    // Check for duplicate code if code is being changed
    if (data.code && data.code !== currency.code) {
      if (exchangeRateService.codeExists(data.code.toUpperCase(), id)) {
        return { success: false, error: `Currency with code ${data.code.toUpperCase()} already exists` }
      }
    }

    // Validate rate if being updated
    if (data.rateToBase !== undefined) {
      if (data.rateToBase <= 0) {
        return { success: false, error: 'Exchange rate must be positive' }
      }
    }

    const updated = all.map(c => c.id === id ? { ...c, ...data, code: data.code?.toUpperCase() || c.code } : c)
    this.save(updated)
    return { success: true }
  },

  updateRate(id: string, rate: number): { success: boolean; error?: string } {
    return exchangeRateService.updateRate(id, rate)
  },

  delete(id: string): boolean {
    const all = this.getAll()
    const currency = all.find(c => c.id === id)
    if (!currency || currency.isBase) return false
    const filtered = all.filter(c => c.id !== id)
    this.save(filtered)
    return true
  },

  setDefault(id: string): void {
    const all = this.getAll().map(c => ({ ...c, isDefault: c.id === id }))
    this.save(all)
  },

  reset(): void {
    localStorage.setItem(CURRENCIES_KEY, JSON.stringify(DEFAULT_CURRENCIES))
  },

  codeExists(code: string, excludeId?: string): boolean {
    return exchangeRateService.codeExists(code, excludeId)
  },
}

// ── Conversion history ────────────────────────────────────────────────────────
export const conversionHistoryService = {
  getAll(): ConversionRecord[] {
    const stored = localStorage.getItem(HISTORY_KEY)
    if (!stored) return []
    try {
      return JSON.parse(stored) as ConversionRecord[]
    } catch {
      return []
    }
  },

  add(record: Omit<ConversionRecord, 'id' | 'timestamp'>): ConversionRecord {
    const all = this.getAll()
    const r: ConversionRecord = { ...record, id: `conv-${Date.now()}`, timestamp: new Date().toISOString() }
    all.unshift(r)
    // Keep last 200 entries
    localStorage.setItem(HISTORY_KEY, JSON.stringify(all.slice(0, 200)))
    return r
  },

  delete(id: string): void {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(this.getAll().filter(r => r.id !== id)))
  },

  clear(): void {
    localStorage.setItem(HISTORY_KEY, '[]')
  },

  exportCSV(): string {
    const records = this.getAll()
    const header = 'Date,From,To,Amount,Result,Rate'
    const rows = records.map(r =>
      `"${r.timestamp}","${r.fromCode}","${r.toCode}",${r.fromAmount},${r.toAmount},${r.rate}`
    )
    return [header, ...rows].join('\n')
  },
}

// ── Calculator records ────────────────────────────────────────────────────────
export const calcRecordService = {
  getAll(): CalculatorRecord[] {
    const stored = localStorage.getItem(CALC_KEY)
    if (!stored) return []
    try {
      return JSON.parse(stored) as CalculatorRecord[]
    } catch {
      return []
    }
  },

  add(record: Omit<CalculatorRecord, 'id' | 'timestamp'>): CalculatorRecord {
    const all = this.getAll()
    const r: CalculatorRecord = { ...record, id: `calc-${Date.now()}`, timestamp: new Date().toISOString() }
    all.unshift(r)
    localStorage.setItem(CALC_KEY, JSON.stringify(all.slice(0, 100)))
    return r
  },

  delete(id: string): void {
    localStorage.setItem(CALC_KEY, JSON.stringify(this.getAll().filter(r => r.id !== id)))
  },

  reset(): void {
    localStorage.setItem(CALC_KEY, '[]')
  },
}
