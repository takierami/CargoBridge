import { useState, useMemo, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router'
import { ArrowLeft, Download, FileText } from 'lucide-react'
import { toast } from 'sonner'
import { useAppStore } from '../../../store/appStore'
import { cn } from '../../utils/cn'
import { buildLedger } from '../../../services/paymentService'
import type { LedgerEntry, LedgerEntryType } from '../../../types'
import { ResponsiveDataList } from '../ui/ResponsiveDataList'

const LEDGER_TYPES: LedgerEntryType[] = ['order', 'payment', 'credit_adjustment', 'debit_adjustment']

export function AccountStatement() {
  const { t, suppliers, loadSuppliers } = useAppStore()
  const { id } = useParams()
  const navigate = useNavigate()
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [rawLedger, setRawLedger] = useState<LedgerEntry[]>([])
  const [loading, setLoading] = useState(true)

  const supplier = useMemo(() => suppliers.find(s => s.id === id), [suppliers, id])

  useEffect(() => {
    if (!id) return
    let cancelled = false
    setLoading(true)
    ;(async () => {
      try {
        await loadSuppliers()
        const entries = await buildLedger(id)
        if (!cancelled) setRawLedger(entries)
      } catch {
        if (!cancelled) {
          setRawLedger([])
          toast.error(t('common.error'))
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [id, loadSuppliers, t])

  const ledger = useMemo(() => {
    let entries = rawLedger
    if (dateFrom) entries = entries.filter(e => e.date >= dateFrom)
    if (dateTo) entries = entries.filter(e => e.date <= dateTo)
    if (typeFilter !== 'all') entries = entries.filter(e => e.type === typeFilter)
    return entries
  }, [rawLedger, dateFrom, dateTo, typeFilter])

  const formatCurrency = (amount: number, currency: string) => {
    const symbols: Record<string, string> = { USD: '$', CNY: '¥', EUR: '€', DZD: 'دج' }
    return symbols[currency] + ' ' + amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  }

  const handleExportCSV = () => {
    if (!supplier || ledger.length === 0) return
    const headers = [t('suppliers.ledgerCols.date'), t('suppliers.ledgerCols.type'), t('suppliers.ledgerCols.reference'), t('suppliers.ledgerCols.debit'), t('suppliers.ledgerCols.credit'), t('suppliers.ledgerCols.runningBalance')]
    const rows = ledger.map(e => [
      e.date,
      t('suppliers.ledgerTypes.' + e.type),
      e.reference,
      e.debit.toString(),
      e.credit.toString(),
      e.runningBalance.toString(),
    ])
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'statement-' + supplier.code + '.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  if (!supplier) {
    return (
      <div className="p-4 lg:p-6">
        <button onClick={() => navigate('/suppliers')} className="flex items-center gap-2 text-blue-500 hover:text-blue-600 mb-4">
          <ArrowLeft className="w-4 h-4" /> {t('common.back')}
        </button>
        <div className="text-center py-16 text-gray-500">{loading ? t('common.loading') : t('common.noData')}</div>
      </div>
    )
  }

  return (
    <div className="p-4 lg:p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/suppliers/' + id)} className="flex items-center gap-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">{t('common.back')}</span>
          </button>
          <div>
            <h1 className="text-lg font-bold text-gray-900 dark:text-white sm:text-xl">{t('suppliers.accountStatement')}</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">{supplier.name} — {supplier.code}</p>
          </div>
        </div>
        <button onClick={handleExportCSV} disabled={ledger.length === 0} className="flex items-center gap-1.5 px-3 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg text-sm font-medium transition-colors">
          <Download className="w-4 h-4" /> {t('suppliers.exportCSV')}
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-4 space-y-4">
        <div className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="block text-xs text-gray-500 mb-1">{t('suppliers.statementFrom')}</label>
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">{t('suppliers.statementTo')}</label>
            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500" />
          </div>
          <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm focus:ring-2 focus:ring-blue-500">
            <option value="all">{t('suppliers.allTypes')}</option>
            {LEDGER_TYPES.map(tp => <option key={tp} value={tp}>{t('suppliers.ledgerTypes.' + tp)}</option>)}
          </select>
          {(dateFrom || dateTo || typeFilter !== 'all') && (
            <button onClick={() => { setDateFrom(''); setDateTo(''); setTypeFilter('all') }} className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
              {t('common.clear')}
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[120px]">
            <p className="text-xs text-gray-500">{t('suppliers.totalPurchased')}</p>
            <p className="text-base font-bold text-gray-900 dark:text-white">{formatCurrency(supplier.totalPurchased || 0, supplier.balanceCurrency || 'USD')}</p>
          </div>
          <div className="flex-1 min-w-[120px]">
            <p className="text-xs text-gray-500">{t('suppliers.totalPaid')}</p>
            <p className="text-base font-bold text-gray-900 dark:text-white">{formatCurrency(supplier.totalPaid || 0, supplier.balanceCurrency || 'USD')}</p>
          </div>
          <div className="flex-1 min-w-[120px]">
            <p className="text-xs text-gray-500">{t('suppliers.outstandingBalance')}</p>
            <p className={cn('text-base font-bold', (supplier.outstanding || 0) > 0 ? 'text-red-600' : 'text-green-600')}>
              {formatCurrency(supplier.outstanding || 0, supplier.balanceCurrency || 'USD')}
            </p>
          </div>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400">{t('suppliers.balanceHelper')}</p>
      </div>

      {loading ? (
        <div className="text-center py-16 text-gray-500 dark:text-gray-400">
          <p>{t('common.loading')}</p>
        </div>
      ) : ledger.length === 0 ? (
        <div className="text-center py-16 text-gray-500 dark:text-gray-400">
          <FileText className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p>{t('suppliers.noStatementEntries')}</p>
          <p className="text-xs mt-2 max-w-sm mx-auto opacity-80">{t('suppliers.statementEmptyHint')}</p>
        </div>
      ) : (
        <ResponsiveDataList
          rows={ledger}
          keyField={(entry, idx) => `${entry.reference}-${entry.date}-${idx}`}
          table={(
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-900/50">
                <tr>
                  <th className="px-5 py-3 text-start text-xs font-medium text-gray-500 uppercase">{t('suppliers.ledgerCols.date')}</th>
                  <th className="px-5 py-3 text-start text-xs font-medium text-gray-500 uppercase">{t('suppliers.ledgerCols.type')}</th>
                  <th className="px-5 py-3 text-start text-xs font-medium text-gray-500 uppercase">{t('suppliers.ledgerCols.reference')}</th>
                  <th className="px-5 py-3 text-end text-xs font-medium text-gray-500 uppercase">{t('suppliers.ledgerCols.debit')}</th>
                  <th className="px-5 py-3 text-end text-xs font-medium text-gray-500 uppercase">{t('suppliers.ledgerCols.credit')}</th>
                  <th className="px-5 py-3 text-end text-xs font-medium text-gray-500 uppercase">{t('suppliers.ledgerCols.runningBalance')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {ledger.map((entry, idx) => (
                  <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-900/50">
                    <td className="px-5 py-4 text-sm text-gray-500 dark:text-gray-400">{entry.date}</td>
                    <td className="px-5 py-4 text-sm">
                      <span className={cn(
                        'px-2.5 py-1 rounded-full text-xs font-medium',
                        entry.type === 'order' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' :
                        entry.type === 'payment' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' :
                        entry.type === 'credit_adjustment' ? 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300' :
                        'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
                      )}>
                        {t('suppliers.ledgerTypes.' + entry.type)}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-sm font-mono text-gray-900 dark:text-white">{entry.reference}</td>
                    <td className="px-5 py-4 text-end text-sm font-mono text-red-600 dark:text-red-400">{entry.debit > 0 ? formatCurrency(entry.debit, entry.currency) : '—'}</td>
                    <td className="px-5 py-4 text-end text-sm font-mono text-green-600 dark:text-green-400">{entry.credit > 0 ? formatCurrency(entry.credit, entry.currency) : '—'}</td>
                    <td className="px-5 py-4 text-end text-sm font-mono font-bold text-gray-900 dark:text-white">{formatCurrency(entry.runningBalance, entry.currency)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          renderCard={(entry) => (
            <>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-mono text-sm font-semibold text-gray-900 dark:text-white">{entry.reference}</p>
                  <p className="mt-0.5 text-xs text-gray-500">{entry.date}</p>
                </div>
                <span className={cn(
                  'rounded-full px-2.5 py-1 text-xs font-medium',
                  entry.type === 'order' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' :
                  entry.type === 'payment' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' :
                  entry.type === 'credit_adjustment' ? 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300' :
                  'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
                )}>
                  {t('suppliers.ledgerTypes.' + entry.type)}
                </span>
              </div>
              <div className="mt-3 grid grid-cols-1 gap-2 text-center text-xs sm:grid-cols-3">
                <div>
                  <p className="text-gray-500">{t('suppliers.ledgerCols.debit')}</p>
                  <p className="mt-0.5 font-mono text-red-600">{entry.debit > 0 ? formatCurrency(entry.debit, entry.currency) : '—'}</p>
                </div>
                <div>
                  <p className="text-gray-500">{t('suppliers.ledgerCols.credit')}</p>
                  <p className="mt-0.5 font-mono text-green-600">{entry.credit > 0 ? formatCurrency(entry.credit, entry.currency) : '—'}</p>
                </div>
                <div>
                  <p className="text-gray-500">{t('suppliers.ledgerCols.runningBalance')}</p>
                  <p className="mt-0.5 font-mono font-bold text-gray-900 dark:text-white">{formatCurrency(entry.runningBalance, entry.currency)}</p>
                </div>
              </div>
            </>
          )}
        />
      )}
    </div>
  )
}
