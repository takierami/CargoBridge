import { useState, useMemo, useCallback, useEffect } from 'react'
import {
  ArrowLeftRight, History, Calculator as CalcIcon, Plus, Edit2, Trash2,
  Copy, Check, ChevronDown, RefreshCw, Download, Search, TrendingUp,
  Package, DollarSign, Settings2, X, AlertCircle,
} from 'lucide-react'
import { useAppStore } from '../../../store/appStore'
import {
  currencyService, conversionHistoryService,
  exchangeRateService,
} from '../../../services/currencyService'
import type { Currency, ConversionRecord } from '../../../types'
import { formatDate } from '../../../utils/dateUtils'
import { toast } from 'sonner'

// ── Tab types ─────────────────────────────────────────────────────────────────
type Tab = 'converter' | 'history' | 'calc'
type CalcMode = 'basic' | 'shipment' | 'profit' | 'totals'

// ── Small helpers ─────────────────────────────────────────────────────────────
function fmt(n: number, symbol = ''): string {
  const s = n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 })
  return symbol ? `${s} ${symbol}` : s
}

function CurrencyBadge({ cur }: { cur: Currency }) {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded text-xs font-mono">
      {cur.symbol} {cur.code}
    </span>
  )
}

// ── Currency form modal ───────────────────────────────────────────────────────
interface CurrencyFormProps {
  initial?: Currency | null
  onSave: (data: Omit<Currency, 'id' | 'createdAt'>) => void
  onClose: () => void
  language: string
  t: (k: string) => string
}

function CurrencyForm({ initial, onSave, onClose, language, t }: CurrencyFormProps) {
  const [form, setForm] = useState({
    code: initial?.code ?? '',
    name: initial?.name ?? '',
    nameFr: initial?.nameFr ?? '',
    symbol: initial?.symbol ?? '',
    rateToBase: initial?.rateToBase ?? 1,
    isBase: initial?.isBase ?? false,
    isEnabled: initial?.isEnabled ?? true,
    isDefault: initial?.isDefault ?? false,
  })

  const set = (k: string, v: unknown) => setForm(f => ({ ...f, [k]: v }))
  const isRTL = language === 'ar'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md shadow-xl">
        <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700">
          <h2 className="font-semibold text-gray-900 dark:text-white">
            {initial ? t('calculator.editCurrency') : t('calculator.addCurrency')}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{t('calculator.currencyCode')}</label>
              <input
                value={form.code}
                onChange={e => set('code', e.target.value.toUpperCase())}
                placeholder="USD"
                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{t('calculator.currencySymbol')}</label>
              <input
                value={form.symbol}
                onChange={e => set('symbol', e.target.value)}
                placeholder="$"
                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{t('calculator.currencyName')} (AR)</label>
            <input
              value={form.name}
              onChange={e => set('name', e.target.value)}
              dir="rtl"
              className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{t('calculator.currencyName')} (FR)</label>
            <input
              value={form.nameFr}
              onChange={e => set('nameFr', e.target.value)}
              dir="ltr"
              className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm"
            />
          </div>
          {!form.isBase && (
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                {t('calculator.rateVsDzd')}
              </label>
              <p className="text-xs text-gray-400 mb-1.5">
                {t('calculator.rateHint').replace('{{code}}', form.code || 'X')}
              </p>
              <input
                type="number"
                min="0.0001"
                step="0.01"
                value={form.rateToBase}
                onChange={e => set('rateToBase', parseFloat(e.target.value) || 1)}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm"
              />
            </div>
          )}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isEnabled"
              checked={form.isEnabled}
              onChange={e => set('isEnabled', e.target.checked)}
              className="rounded"
            />
            <label htmlFor="isEnabled" className="text-sm text-gray-700 dark:text-gray-300">{t('calculator.enabled')}</label>
          </div>
        </div>
        <div className={`flex gap-2 p-5 border-t border-gray-200 dark:border-gray-700 ${isRTL ? 'flex-row-reverse' : ''}`}>
          <button
            onClick={() => onSave(form)}
            className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium transition-colors"
          >
            {t('common.save')}
          </button>
          <button onClick={onClose} className="flex-1 py-2.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-medium transition-colors">
            {t('common.cancel')}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Currency select dropdown ──────────────────────────────────────────────────
interface CurrencySelectProps {
  currencies: Currency[]
  selected: Currency
  onChange: (c: Currency) => void
  label: string
  language: string
}

function CurrencySelect({ currencies, selected, onChange, label, language }: CurrencySelectProps) {
  const [open, setOpen] = useState(false)
  const enabled = currencies.filter(c => c.isEnabled)
  const isFr = language === 'fr'

  return (
    <div className="relative">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm"
      >
        <span className="flex items-center gap-2">
          <span className="font-mono text-blue-600 dark:text-blue-400">{selected.symbol}</span>
          <span className="font-semibold">{selected.code}</span>
          <span className="text-gray-500 text-xs">{isFr ? selected.nameFr : selected.name}</span>
        </span>
        <ChevronDown className="w-4 h-4 text-gray-400" />
      </button>
      {open && (
        <div className="absolute z-20 mt-1 w-full bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-lg overflow-hidden">
          {enabled.map(c => (
            <button
              key={c.id}
              onClick={() => { onChange(c); setOpen(false) }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${c.id === selected.id ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}
            >
              <span className="font-mono text-blue-600 dark:text-blue-400 w-6">{c.symbol}</span>
              <span className="font-semibold text-gray-900 dark:text-white">{c.code}</span>
              <span className="text-gray-500 text-xs">{isFr ? c.nameFr : c.name}</span>
              {c.isBase && <span className="ms-auto text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-1.5 py-0.5 rounded">BASE</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Main Calculator page ──────────────────────────────────────────────────────
export function Calculator() {
  const { t, language, goods } = useAppStore()
  const isRTL = language === 'ar'
  const isFr = language === 'fr'

  // ── State ─────────────────────────────────────────────────────────────────
  const [tab, setTab] = useState<Tab>('converter')
  const [currencies, setCurrencies] = useState<Currency[]>(() => currencyService.getAll())
  const [history, setHistory] = useState<ConversionRecord[]>(() => conversionHistoryService.getAll())
  const [historySearch, setHistorySearch] = useState('')

  // Store currency CODES not objects - always look up fresh from localStorage
  const enabledCurrencies = useMemo(() => currencies.filter(c => c.isEnabled), [currencies])
  const dzd = useMemo(() => currencies.find(c => c.isBase) ?? currencies[0]!, [currencies])

  // Initialize with currency codes (not objects) to ensure fresh lookups
  const [fromCode, setFromCode] = useState<string>(() => {
    const nonBase = currencies.find(c => !c.isBase)
    return nonBase?.code ?? currencies[1]?.code ?? currencies[0]?.code ?? 'EUR'
  })
  const [toCode, setToCode] = useState<string>(() => {
    const base = currencies.find(c => c.isBase)
    return base?.code ?? currencies[0]?.code ?? 'DZD'
  })
  const [amount, setAmount] = useState('')
  const [converted, setConverted] = useState<number | null>(null)
  const [copied, setCopied] = useState(false)

  // Get fresh currency objects when needed (always live from localStorage)
  const fromCur = useMemo(() => exchangeRateService.getByCode(fromCode) ?? enabledCurrencies[0], [fromCode, enabledCurrencies])
  const toCur = useMemo(() => exchangeRateService.getByCode(toCode) ?? dzd, [toCode, dzd])

  // Currency management
  const [showCurrencyForm, setShowCurrencyForm] = useState(false)
  const [editingCurrency, setEditingCurrency] = useState<Currency | null>(null)
  const [showCurrencyList, setShowCurrencyList] = useState(false)

  // Calculator state
  const [calcMode, setCalcMode] = useState<CalcMode>('shipment')
  const [calcCurCode, setCalcCurCode] = useState<string>(() => {
    const base = currencies.find(c => c.isBase)
    return base?.code ?? currencies[0]?.code ?? 'DZD'
  })
  const calcCur = useMemo(() => exchangeRateService.getByCode(calcCurCode) ?? dzd, [calcCurCode, dzd])

  // Shipment cost inputs
  const [shipment, setShipment] = useState({
    productsValue: '', transportCost: '', agentCommission: '', packagingCost: '',
    customsCost: '', warehouseCost: '', miscCost: '',
  })

  // Profit inputs
  const [profitForm, setProfitForm] = useState({ sellingPrice: '', totalCost: '' })

  // Totals: select goods
  const [selectedGoodsIds, setSelectedGoodsIds] = useState<string[]>([])

  // Basic calc
  const [basicExpr, setBasicExpr] = useState('')
  const [basicResult, setBasicResult] = useState<number | null>(null)
  const [basicError, setBasicError] = useState('')

  // Force re-render when rates change (listen to storage events)
  useEffect(() => {
    const handleStorageChange = () => {
      setCurrencies(currencyService.getAll())
    }
    window.addEventListener('storage', handleStorageChange)
    // Also poll periodically for same-tab updates
    const interval = setInterval(handleStorageChange, 500)
    return () => {
      window.removeEventListener('storage', handleStorageChange)
      clearInterval(interval)
    }
  }, [])

  // Helper to get currency object from code (always fresh from localStorage)
  const getCurrencyByCode = useCallback((code: string): Currency | undefined => {
    return exchangeRateService.getByCode(code)
  }, [])

  // ── Converter logic ────────────────────────────────────────────────────────
  const doConvert = () => {
    const n = parseFloat(amount.replace(/,/g, ''))
    if (isNaN(n)) return
    // ALWAYS use exchangeRateService for fresh rates from localStorage
    const result = exchangeRateService.convert(n, fromCode, toCode)
    setConverted(result)
    const currentRate = exchangeRateService.getRate(fromCode, toCode)
    const record = conversionHistoryService.add({
      fromCode: fromCode, toCode: toCode,
      fromAmount: n, toAmount: result,
      rate: currentRate,
    })
    setHistory(prev => [record, ...prev].slice(0, 200))
  }

  const swapCurrencies = () => {
    const temp = fromCode
    setFromCode(toCode)
    setToCode(temp)
    setConverted(null)
  }

  const copyResult = () => {
    if (converted === null) return
    navigator.clipboard.writeText(fmt(converted))
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  // ── Currency CRUD ─────────────────────────────────────────────────────────
  const refreshCurrencies = () => {
    const all = currencyService.getAll()
    setCurrencies(all)
  }

  const handleSaveCurrency = (data: Omit<Currency, 'id' | 'createdAt'>) => {
    if (editingCurrency) {
      const result = currencyService.update(editingCurrency.id, data)
      if (!result.success) {
        toast.error(result.error || t('common.error'))
        return
      }
      toast.success(t('calculator.saved'))
    } else {
      const result = currencyService.create(data)
      if ('error' in result) {
        toast.error(result.error)
        return
      }
      toast.success(t('calculator.saved'))
    }
    refreshCurrencies()
    setShowCurrencyForm(false)
    setEditingCurrency(null)
  }

  const handleDeleteCurrency = (id: string) => {
    const deleted = currencyService.delete(id)
    if (!deleted) {
      toast.error('Cannot delete base currency')
      return
    }
    refreshCurrencies()
    toast.success(t('calculator.saved'))
  }

  // ── Shipment cost calc ────────────────────────────────────────────────────
  const shipmentTotal = useMemo(() => {
    const vals = Object.values(shipment).map(v => parseFloat(v) || 0)
    return vals.reduce((a, b) => a + b, 0)
  }, [shipment])

  // ── Profit calc ───────────────────────────────────────────────────────────
  const profitResult = useMemo(() => {
    const selling = parseFloat(profitForm.sellingPrice) || 0
    const cost = parseFloat(profitForm.totalCost) || 0
    const profit = selling - cost
    const margin = selling > 0 ? (profit / selling) * 100 : 0
    return { profit, margin }
  }, [profitForm])

  // ── Goods totals ──────────────────────────────────────────────────────────
  const selectedGoods = useMemo(() => goods.filter(g => selectedGoodsIds.includes(g.id)), [goods, selectedGoodsIds])
  const goodsTotals = useMemo(() => ({
    value: selectedGoods.reduce((a, g) => a + (g.value || 0), 0),
    weight: selectedGoods.reduce((a, g) => a + (g.weight || 0), 0),
    quantity: selectedGoods.reduce((a, g) => a + g.quantity, 0),
  }), [selectedGoods])

  // ── Basic calc ────────────────────────────────────────────────────────────
  const runBasicCalc = () => {
    try {
      // Safe eval: only allow numbers and operators
      if (!/^[\d\s+\-*/().%]+$/.test(basicExpr)) {
        setBasicError(t('common.error'))
        return
      }
      // eslint-disable-next-line no-new-func
      const result = Function(`"use strict"; return (${basicExpr})`)()
      setBasicResult(typeof result === 'number' && isFinite(result) ? result : null)
      setBasicError('')
    } catch {
      setBasicError(t('common.error'))
    }
  }

  // ── Inline rate editing ───────────────────────────────────────────────────
  const [editingRateId, setEditingRateId] = useState<string | null>(null)
  const [editingRateValue, setEditingRateValue] = useState('')
  const [rateError, setRateError] = useState<string | null>(null)

  const startEditRate = (cur: Currency) => {
    setEditingRateId(cur.id)
    setEditingRateValue(String(cur.rateToBase))
    setRateError(null)
  }

  const commitRate = (cur: Currency) => {
    const val = parseFloat(editingRateValue)
    if (isNaN(val) || val <= 0) {
      setRateError(t('calculator.invalidRate') || 'Rate must be a positive number')
      return
    }
    const result = currencyService.updateRate(cur.id, val)
    if (!result.success) {
      setRateError(result.error || 'Invalid rate')
      toast.error(result.error || 'Invalid rate')
      return
    }
    setRateError(null)
    setEditingRateId(null)
    refreshCurrencies()
    toast.success(t('calculator.saved'))
  }

  const cancelEditRate = () => {
    setEditingRateId(null)
    setEditingRateValue('')
    setRateError(null)
  }

  // ── History filter ────────────────────────────────────────────────────────
  const filteredHistory = useMemo(() =>
    history.filter(r =>
      !historySearch || r.fromCode.includes(historySearch.toUpperCase()) || r.toCode.includes(historySearch.toUpperCase())
    ),
    [history, historySearch]
  )

  const exportHistory = () => {
    const csv = conversionHistoryService.exportCSV()
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'conversions.csv'; a.click()
    URL.revokeObjectURL(url)
  }

  const clearHistory = () => {
    conversionHistoryService.clear()
    setHistory([])
  }

  // ── Render ────────────────────────────────────────────────────────────────
  const tabs: { id: Tab; icon: React.ElementType; label: string }[] = [
    { id: 'converter', icon: ArrowLeftRight, label: t('calculator.tabs.converter') },
    { id: 'history', icon: History, label: t('calculator.tabs.history') },
    { id: 'calc', icon: CalcIcon, label: t('calculator.tabs.calc') },
  ]

  return (
    <div className="p-4 lg:p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">{t('calculator.title')}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">{t('calculator.manualRatesNote')}</p>
        </div>
        <button
          onClick={() => { setShowCurrencyList(v => !v) }}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-medium transition-colors"
        >
          <Settings2 className="w-4 h-4" />
          {t('calculator.businessRates')}
        </button>
      </div>

      {/* Currency management panel */}
      {showCurrencyList && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-700">
            <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-blue-500" />
              {t('calculator.currencies')}
            </h2>
            <button
              onClick={() => { setEditingCurrency(null); setShowCurrencyForm(true) }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              {t('calculator.addCurrency')}
            </button>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {currencies.map(cur => (
              <div key={cur.id} className="flex items-center gap-3 px-5 py-3">
                <div className="w-9 h-9 rounded-full bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 font-mono text-sm flex-shrink-0">
                  {cur.symbol}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-gray-900 dark:text-white text-sm">{cur.code}</span>
                    <span className="text-gray-500 text-xs">{isFr ? cur.nameFr : cur.name}</span>
                    {cur.isBase && <span className="text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-1.5 py-0.5 rounded">BASE</span>}
                    {cur.isDefault && !cur.isBase && <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-1.5 py-0.5 rounded">{t('calculator.defaultCurrency')}</span>}
                    {!cur.isEnabled && <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-500 px-1.5 py-0.5 rounded">{t('calculator.disabled')}</span>}
                  </div>
                  {!cur.isBase && (
                    <p className="text-xs text-gray-400 mt-0.5">1 {cur.code} = {fmt(cur.rateToBase)} DZD</p>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  {!cur.isBase && !cur.isDefault && (
                    <button
                      onClick={() => { currencyService.setDefault(cur.id); refreshCurrencies() }}
                      className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-green-600 transition-colors text-xs"
                      title={t('calculator.setDefault')}
                    >
                      <TrendingUp className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button
                    onClick={() => { setEditingCurrency(cur); setShowCurrencyForm(true) }}
                    className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-blue-600 transition-colors"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  {!cur.isBase && (
                    <button
                      onClick={() => handleDeleteCurrency(cur.id)}
                      className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-600 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-xl p-1">
        {tabs.map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-sm font-medium transition-all ${
              tab === id
                ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <Icon className="w-4 h-4 flex-shrink-0" />
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </div>

      {/* ── TAB: Converter ── */}
      {tab === 'converter' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-200 dark:border-gray-700 space-y-4">
            {/* Amount input */}
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">{t('calculator.amount')}</label>
              <input
                type="number"
                value={amount}
                onChange={e => { setAmount(e.target.value); setConverted(null) }}
                placeholder="0.00"
                className="w-full px-4 py-3 text-xl font-mono rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                onKeyDown={e => e.key === 'Enter' && doConvert()}
              />
            </div>

            {/* From / Swap / To */}
            <div className={`flex items-end gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <div className="flex-1">
                <CurrencySelect
                  currencies={enabledCurrencies}
                  selected={fromCur}
                  onChange={c => { setFromCode(c.code); setConverted(null) }}
                  label={t('calculator.from')}
                  language={language}
                />
              </div>
              <button
                onClick={swapCurrencies}
                className="p-2.5 rounded-xl border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-500 hover:text-blue-600 transition-colors mb-0.5"
              >
                <ArrowLeftRight className="w-4 h-4" />
              </button>
              <div className="flex-1">
                <CurrencySelect
                  currencies={enabledCurrencies}
                  selected={toCur}
                  onChange={c => { setToCode(c.code); setConverted(null) }}
                  label={t('calculator.to')}
                  language={language}
                />
              </div>
            </div>

            {/* Convert button */}
            <button
              onClick={doConvert}
              disabled={!amount}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              {t('calculator.convert')}
            </button>

            {/* Result */}
            {converted !== null && (
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-4 border border-blue-100 dark:border-blue-800">
                <div className={`flex items-start justify-between gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <div>
                    <p className="text-xs text-blue-500 dark:text-blue-400 mb-1">{t('calculator.result')}</p>
                    <p className="text-3xl font-bold text-blue-700 dark:text-blue-300 font-mono">
                      {toCur.symbol} {fmt(converted)}
                    </p>
<p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5">
                       {t('calculator.rateUsed')}: 1 {fromCur.code} = {fmt(exchangeRateService.getRate(fromCode, toCode))} {toCur.code}
                     </p>
                  </div>
                  <button
                    onClick={copyResult}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                      copied
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                        : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
                    }`}
                  >
                    {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied ? t('calculator.copied') : t('calculator.copyResult')}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Quick rates — inline editable */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">{t('calculator.businessRates')}</h3>
              <span className="text-xs text-gray-400">{isFr ? 'Cliquez pour modifier' : 'انقر للتعديل'}</span>
            </div>
            <div className="space-y-2">
              {enabledCurrencies.filter(c => !c.isBase).map(cur => (
                <div key={cur.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-700/50 group">
                  <span className="text-sm font-mono text-gray-500 w-8 flex-shrink-0">{cur.symbol}</span>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white flex-shrink-0">1 {cur.code}</span>
                  <span className="text-sm text-gray-400 flex-shrink-0">=</span>
                  {editingRateId === cur.id ? (
                    <>
                      <input
                        type="number"
                        min="0.0001"
                        step="0.01"
                        value={editingRateValue}
                        onChange={e => { setEditingRateValue(e.target.value); setRateError(null) }}
                        onBlur={() => commitRate(cur)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') commitRate(cur)
                          if (e.key === 'Escape') cancelEditRate()
                        }}
                        autoFocus
                        className={`flex-1 px-2 py-1 rounded-lg border ${rateError ? 'border-red-400' : 'border-blue-400'} bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-0`}
                      />
                      {rateError && (
                        <span className="text-xs text-red-500 flex-shrink-0">{rateError}</span>
                      )}
                    </>
                  ) : (
                    <button
                      onClick={() => startEditRate(cur)}
                      className="flex-1 text-start px-2 py-1 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 text-sm font-mono font-semibold text-blue-700 dark:text-blue-300 transition-colors"
                    >
                      {/* Always show LIVE rate from service - never cached */}
                      {fmt(exchangeRateService.getRateToBase(cur.code))}
                    </button>
                  )}
                  <span className="text-xs text-gray-400 flex-shrink-0">{dzd.symbol}</span>
                  {editingRateId !== cur.id && (
                    <Edit2 className="w-3.5 h-3.5 text-gray-300 group-hover:text-blue-400 transition-colors flex-shrink-0" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── TAB: History ── */}
      {tab === 'history' && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="flex items-center gap-3 p-4 border-b border-gray-100 dark:border-gray-700 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className={`absolute top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 ${isRTL ? 'right-3' : 'left-3'}`} />
              <input
                value={historySearch}
                onChange={e => setHistorySearch(e.target.value)}
                placeholder={t('calculator.searchHistory')}
                className={`w-full py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white text-sm ${isRTL ? 'pr-9 pl-3' : 'pl-9 pr-3'}`}
              />
            </div>
            <button
              onClick={exportHistory}
              className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <Download className="w-4 h-4" />
              {t('calculator.exportHistory')}
            </button>
            <button
              onClick={clearHistory}
              className="flex items-center gap-1.5 px-3 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              {t('calculator.clearHistory')}
            </button>
          </div>

          {filteredHistory.length === 0 ? (
            <div className="py-16 text-center">
              <History className="w-12 h-12 mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500 text-sm">{t('calculator.noHistory')}</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-700 max-h-[500px] overflow-y-auto">
              {filteredHistory.map(r => (
                <div key={r.id} className={`flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <div className="flex-1 min-w-0">
                    <div className={`flex items-center gap-2 flex-wrap ${isRTL ? 'flex-row-reverse' : ''}`}>
                      <span className="font-mono text-sm font-semibold text-gray-900 dark:text-white">
                        {fmt(r.fromAmount)} {r.fromCode}
                      </span>
                      <ArrowLeftRight className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                      <span className="font-mono text-sm font-semibold text-blue-600 dark:text-blue-400">
                        {fmt(r.toAmount)} {r.toCode}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {t('calculator.rateUsed')}: {fmt(r.rate)} · {formatDate(r.timestamp, language)}
                    </p>
                  </div>
                  <button
                    onClick={() => { conversionHistoryService.delete(r.id); setHistory(conversionHistoryService.getAll()) }}
                    className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-500 transition-colors flex-shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── TAB: Calculator ── */}
      {tab === 'calc' && (
        <div className="space-y-4">
          {/* Mode selector */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {(['shipment', 'profit', 'totals', 'basic'] as CalcMode[]).map(mode => (
              <button
                key={mode}
                onClick={() => setCalcMode(mode)}
                className={`py-2.5 px-3 rounded-xl text-sm font-medium transition-colors ${
                  calcMode === mode
                    ? 'bg-blue-600 text-white'
                    : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-blue-300'
                }`}
              >
                {t(`calculator.${mode === 'shipment' ? 'shipmentCost' : mode === 'profit' ? 'profitCalc' : mode === 'totals' ? 'shipmentTotals' : 'basicCalc'}`)}
              </button>
            ))}
          </div>

          {/* Currency for calculator */}
          {calcMode !== 'totals' && calcMode !== 'basic' && (
            <div className="max-w-xs">
              <CurrencySelect
                currencies={enabledCurrencies}
                selected={exchangeRateService.getByCode(calcCurCode) ?? dzd}
                onChange={c => setCalcCurCode(c.code)}
                label={t('calculator.currencies')}
                language={language}
              />
            </div>
          )}

          {/* ── Shipment cost ── */}
          {calcMode === 'shipment' && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-200 dark:border-gray-700 space-y-4">
              <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Package className="w-4 h-4 text-blue-500" />
                {t('calculator.shipmentCost')}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {([
                  ['productsValue', t('calculator.productsValue')],
                  ['transportCost', t('calculator.transportCost')],
                  ['agentCommission', t('calculator.agentCommission')],
                  ['packagingCost', t('calculator.packagingCost')],
                  ['customsCost', t('calculator.customsCost')],
                  ['warehouseCost', t('calculator.warehouseCost')],
                  ['miscCost', t('calculator.miscCost')],
                ] as [keyof typeof shipment, string][]).map(([key, label]) => (
                  <div key={key}>
                    <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">{label}</label>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={shipment[key]}
                        onChange={e => setShipment(s => ({ ...s, [key]: e.target.value }))}
                        placeholder="0"
                        className={`w-full px-3 py-2.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white text-sm font-mono ${isRTL ? 'pr-3 pl-12' : 'pr-12 pl-3'}`}
                      />
                      <span className={`absolute top-1/2 -translate-y-1/2 text-xs text-gray-400 font-mono ${isRTL ? 'left-3' : 'right-3'}`}>{calcCur.symbol}</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="pt-3 border-t border-gray-100 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-gray-700 dark:text-gray-300">{t('calculator.totalCost')}</span>
                  <span className="text-2xl font-bold text-blue-600 dark:text-blue-400 font-mono">
                    {calcCur.symbol} {fmt(shipmentTotal)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* ── Profit calc ── */}
          {calcMode === 'profit' && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-200 dark:border-gray-700 space-y-4">
              <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-green-500" />
                {t('calculator.profitCalc')}
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">{t('calculator.sellingPrice')}</label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      value={profitForm.sellingPrice}
                      onChange={e => setProfitForm(f => ({ ...f, sellingPrice: e.target.value }))}
                      placeholder="0"
                      className={`w-full px-3 py-2.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white text-sm font-mono ${isRTL ? 'pr-3 pl-12' : 'pr-12 pl-3'}`}
                    />
                    <span className={`absolute top-1/2 -translate-y-1/2 text-xs text-gray-400 ${isRTL ? 'left-3' : 'right-3'}`}>{calcCur.symbol}</span>
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">{t('calculator.totalCost')}</label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      value={profitForm.totalCost}
                      onChange={e => setProfitForm(f => ({ ...f, totalCost: e.target.value }))}
                      placeholder="0"
                      className={`w-full px-3 py-2.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white text-sm font-mono ${isRTL ? 'pr-3 pl-12' : 'pr-12 pl-3'}`}
                    />
                    <span className={`absolute top-1/2 -translate-y-1/2 text-xs text-gray-400 ${isRTL ? 'left-3' : 'right-3'}`}>{calcCur.symbol}</span>
                  </div>
                </div>
              </div>
              <div className="pt-3 border-t border-gray-100 dark:border-gray-700 space-y-2.5">
                <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <span className="text-sm text-gray-500">{t('calculator.profit')}</span>
                  <span className={`text-xl font-bold font-mono ${profitResult.profit >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    {profitResult.profit >= 0 ? '+' : ''}{calcCur.symbol} {fmt(profitResult.profit)}
                  </span>
                </div>
                <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <span className="text-sm text-gray-500">{t('calculator.profitMargin')}</span>
                  <span className={`text-lg font-bold ${profitResult.margin >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    {profitResult.margin.toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* ── Goods totals ── */}
          {calcMode === 'totals' && (
            <div className="space-y-4">
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-200 dark:border-gray-700">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                  <Package className="w-4 h-4 text-blue-500" />
                  {t('calculator.selectGoods')}
                </h3>
                {goods.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-4">{t('common.noData')}</p>
                ) : (
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {goods.map(g => (
                      <label key={g.id} className={`flex items-center gap-3 p-2.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer ${isRTL ? 'flex-row-reverse' : ''}`}>
                        <input
                          type="checkbox"
                          checked={selectedGoodsIds.includes(g.id)}
                          onChange={e => {
                            setSelectedGoodsIds(ids =>
                              e.target.checked ? [...ids, g.id] : ids.filter(id => id !== g.id)
                            )
                          }}
                          className="rounded"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{g.description}</p>
                          <p className="text-xs text-gray-400 font-mono">{g.trackingNumber}</p>
                        </div>
                        <div className={`text-xs text-gray-500 flex-shrink-0 ${isRTL ? 'text-start' : 'text-end'}`}>
                          <p>{g.quantity} {t('goods.pieces')}</p>
                          {g.value && <p className="text-blue-500">{fmt(g.value)} DZD</p>}
                        </div>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {selectedGoods.length > 0 && (
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl p-5 border border-blue-100 dark:border-blue-800">
                  <h3 className="font-semibold text-blue-700 dark:text-blue-300 mb-4">
                    {t('calculator.shipmentTotals')} ({selectedGoods.length} {isFr ? 'expédition(s)' : 'شحنة'})
                  </h3>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="text-center p-3 bg-white dark:bg-gray-800 rounded-xl">
                      <p className="text-xs text-gray-500 mb-1">{t('calculator.totalValue')}</p>
                      <p className="font-bold text-blue-600 dark:text-blue-400 text-sm font-mono">{fmt(goodsTotals.value)} دج</p>
                    </div>
                    <div className="text-center p-3 bg-white dark:bg-gray-800 rounded-xl">
                      <p className="text-xs text-gray-500 mb-1">{t('calculator.totalWeight')}</p>
                      <p className="font-bold text-gray-900 dark:text-white text-sm font-mono">{fmt(goodsTotals.weight)} كجم</p>
                    </div>
                    <div className="text-center p-3 bg-white dark:bg-gray-800 rounded-xl">
                      <p className="text-xs text-gray-500 mb-1">{t('calculator.totalPackages')}</p>
                      <p className="font-bold text-gray-900 dark:text-white text-sm font-mono">{goodsTotals.quantity}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Basic calc ── */}
          {calcMode === 'basic' && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-200 dark:border-gray-700 space-y-4">
              <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <CalcIcon className="w-4 h-4 text-purple-500" />
                {t('calculator.basicCalc')}
              </h3>
              <div className="flex gap-2">
                <input
                  value={basicExpr}
                  onChange={e => { setBasicExpr(e.target.value); setBasicResult(null); setBasicError('') }}
                  onKeyDown={e => e.key === 'Enter' && runBasicCalc()}
                  placeholder="100 * 260 + 500"
                  dir="ltr"
                  className="flex-1 px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white font-mono text-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <button
                  onClick={runBasicCalc}
                  className="px-5 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-medium transition-colors"
                >
                  =
                </button>
              </div>
              {basicError && <p className="text-sm text-red-500">{basicError}</p>}
              {basicResult !== null && !basicError && (
                <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl border border-purple-100 dark:border-purple-800">
                  <p className="text-xs text-purple-500 mb-1">{t('calculator.result')}</p>
                  <p className="text-3xl font-bold text-purple-700 dark:text-purple-300 font-mono">{fmt(basicResult)}</p>
                </div>
              )}
              <div className="grid grid-cols-4 gap-2">
                {['7','8','9','/','4','5','6','*','1','2','3','-','0','.','(',')'].map(k => (
                  <button
                    key={k}
                    onClick={() => setBasicExpr(e => e + k)}
                    className="py-3 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-white font-mono text-sm font-medium transition-colors"
                  >
                    {k}
                  </button>
                ))}
                <button
                  onClick={() => setBasicExpr(e => e + '+')}
                  className="py-3 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-white font-mono text-sm font-medium transition-colors col-span-2"
                >
                  +
                </button>
                <button
                  onClick={() => { setBasicExpr(''); setBasicResult(null) }}
                  className="py-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900 text-red-600 font-mono text-sm font-medium transition-colors col-span-2"
                >
                  {t('calculator.clear')} C
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Currency form modal */}
      {showCurrencyForm && (
        <CurrencyForm
          initial={editingCurrency}
          onSave={handleSaveCurrency}
          onClose={() => { setShowCurrencyForm(false); setEditingCurrency(null) }}
          language={language}
          t={t}
        />
      )}
    </div>
  )
}
