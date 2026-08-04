/** Pure agent commission tax helpers (mirror backend apply_agent_tax). */

export type AgentTaxBreakdown = {
  base: number
  taxPercent: number
  taxAmount: number
  totalPayable: number
}

export function applyAgentTax(commission: number, rate: number): AgentTaxBreakdown {
  const base = Number.isFinite(commission) ? commission : 0
  const taxPercent = Number.isFinite(rate) ? rate : 0
  const taxAmount = Math.round(base * taxPercent) / 100
  // Match backend Decimal ROUND_HALF_UP to 2 places approximately for UI
  const taxRounded = Math.round(taxAmount * 100) / 100
  const totalPayable = Math.round((base + taxRounded) * 100) / 100
  return {
    base,
    taxPercent,
    taxAmount: taxRounded,
    totalPayable,
  }
}

export function parseTaxRate(value: number | string | null | undefined): number {
  if (value == null || value === '') return 0
  const n = typeof value === 'number' ? value : parseFloat(value)
  return Number.isFinite(n) ? n : 0
}
