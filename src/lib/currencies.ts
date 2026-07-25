/** Transaction currencies for PO / payment forms. DZD is primary. */
import { exchangeRateService } from '../services/currencyService'

export interface TransactionCurrency {
  code: string
  symbol: string
  labelAr: string
  labelFr: string
}

export const TRANSACTION_CURRENCIES: TransactionCurrency[] = [
  { code: 'DZD', symbol: 'دج', labelAr: 'دينار جزائري', labelFr: 'Dinar algérien' },
  { code: 'USD', symbol: '$', labelAr: 'دولار أمريكي', labelFr: 'Dollar américain' },
  { code: 'EUR', symbol: '€', labelAr: 'يورو', labelFr: 'Euro' },
  { code: 'TRY', symbol: '₺', labelAr: 'ليرة تركية', labelFr: 'Livre turque' },
  { code: 'AED', symbol: 'د.إ', labelAr: 'درهم إماراتي', labelFr: 'Dirham émirati' },
  { code: 'CNY', symbol: '¥', labelAr: 'يوان صيني', labelFr: 'Yuan chinois' },
  { code: 'SAR', symbol: 'ر.س', labelAr: 'ريال سعودي', labelFr: 'Riyal saoudien' },
  { code: 'GBP', symbol: '£', labelAr: 'جنيه إسترليني', labelFr: 'Livre sterling' },
  { code: 'MAD', symbol: 'د.م.', labelAr: 'درهم مغربي', labelFr: 'Dirham marocain' },
  { code: 'TND', symbol: 'د.ت', labelAr: 'دينار تونسي', labelFr: 'Dinar tunisien' },
  { code: 'CHF', symbol: 'CHF', labelAr: 'فرنك سويسري', labelFr: 'Franc suisse' },
  { code: 'CAD', symbol: 'C$', labelAr: 'دولار كندي', labelFr: 'Dollar canadien' },
]

export const DEFAULT_TRANSACTION_CURRENCY = 'DZD'

const SYMBOL_BY_CODE: Record<string, string> = Object.fromEntries(
  TRANSACTION_CURRENCIES.map((c) => [c.code, c.symbol]),
)

export function currencySymbol(code: string): string {
  return SYMBOL_BY_CODE[code] || code
}

export function currencyOptionLabel(code: string, language: 'ar' | 'fr' = 'ar'): string {
  const row = TRANSACTION_CURRENCIES.find((c) => c.code === code)
  if (!row) return code
  const name = language === 'ar' ? row.labelAr : row.labelFr
  return `${row.code} — ${name}`
}

/** Include an unknown/legacy code so existing records stay selectable.
 * Also merges enabled currencies from currencyService (Calculator FX list). */
export function currenciesForSelect(current?: string): TransactionCurrency[] {
  const fromService = exchangeRateService
    .getAll()
    .filter((c) => c.isEnabled)
    .map((c) => ({
      code: c.code,
      symbol: c.symbol || c.code,
      labelAr: c.name || c.code,
      labelFr: c.nameFr || c.name || c.code,
    }))

  const byCode = new Map<string, TransactionCurrency>()
  for (const row of TRANSACTION_CURRENCIES) byCode.set(row.code, row)
  for (const row of fromService) {
    if (!byCode.has(row.code)) byCode.set(row.code, row)
  }
  if (current && !byCode.has(current)) {
    byCode.set(current, { code: current, symbol: current, labelAr: current, labelFr: current })
  }
  return Array.from(byCode.values())
}
