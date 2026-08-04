import { ArrowDown, ArrowUp, RotateCcw, Star } from 'lucide-react'
import { TRADE_CITIES } from '../../../constants/tradeCities'
import { getTradeCityName } from '../../../services/timezoneService'
import { useAppStore } from '../../../store/appStore'
import { useTradeTimeStore } from '../../../store/tradeTimeStore'
import { cn } from '../../utils/cn'

export function TradeTimeSettings() {
  const language = useAppStore((state) => state.language)
  const store = useTradeTimeStore()
  const orderedCities = [...TRADE_CITIES].sort(
    (a, b) => store.cityOrder.indexOf(a.id) - store.cityOrder.indexOf(b.id),
  )
  const text = language === 'ar'
    ? {
        format: 'تنسيق الوقت',
        cities: 'المدن وساعات العمل',
        enabled: 'مفعّلة',
        open: 'فتح',
        close: 'إغلاق',
        soon: 'نهاية فترة الإغلاق قريباً',
        reset: 'إعادة الإعدادات الافتراضية',
      }
    : {
        format: 'Format de l’heure',
        cities: 'Villes et horaires de travail',
        enabled: 'Activée',
        open: 'Ouverture',
        close: 'Fermeture',
        soon: 'Fin de fermeture prochaine',
        reset: 'Rétablir les valeurs par défaut',
      }

  return (
    <div className="space-y-5">
      <div>
        <p className="mb-2 text-xs font-medium text-gray-500">{text.format}</p>
        <div className="grid grid-cols-2 gap-2">
          {(['24h', '12h'] as const).map((format) => (
            <button
              key={format}
              type="button"
              onClick={() => store.setTimeFormat(format)}
              className={cn(
                'min-h-11 rounded-lg border px-3 py-2 text-sm font-medium',
                store.timeFormat === format
                  ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300'
                  : 'border-gray-200 text-gray-600 dark:border-gray-600 dark:text-gray-300',
              )}
            >
              {format === '24h' ? '24 h' : '12 h'}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-2 text-xs font-medium text-gray-500">{text.cities}</p>
        <div className="space-y-2">
          {orderedCities.map((city, index) => {
            const enabled = store.enabledCityIds.includes(city.id)
            const pinned = store.pinnedCityIds.includes(city.id)
            const hours = store.businessHoursOverrides[city.id] ?? city.defaultBusinessHours
            return (
              <div key={city.id} className="rounded-xl border border-gray-200 p-3 dark:border-gray-700">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => store.toggleCity(city.id)}
                    className={cn(
                      'relative h-6 w-11 rounded-full transition-colors',
                      enabled ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-600',
                    )}
                    aria-label={`${text.enabled}: ${getTradeCityName(city, language)}`}
                  >
                    <span className={cn(
                      'absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all',
                      enabled ? 'start-5' : 'start-0.5',
                    )} />
                  </button>
                  <span className="text-lg">{city.flag}</span>
                  <span className="min-w-0 flex-1 truncate text-sm font-medium text-gray-900 dark:text-white">
                    {getTradeCityName(city, language)}
                  </span>
                  <button type="button" onClick={() => store.pinCity(city.id)} className="p-1 text-gray-400 hover:text-amber-500">
                    <Star className={cn('h-4 w-4', pinned && 'fill-amber-400 text-amber-400')} />
                  </button>
                  <button type="button" disabled={index === 0} onClick={() => store.moveCity(city.id, 'up')} className="p-1 text-gray-400 disabled:opacity-25">
                    <ArrowUp className="h-4 w-4" />
                  </button>
                  <button type="button" disabled={index === orderedCities.length - 1} onClick={() => store.moveCity(city.id, 'down')} className="p-1 text-gray-400 disabled:opacity-25">
                    <ArrowDown className="h-4 w-4" />
                  </button>
                </div>
                {enabled && (
                  <div className="mt-3 grid grid-cols-3 gap-2">
                    {([
                      ['open', text.open],
                      ['close', text.close],
                      ['closingSoonEnd', text.soon],
                    ] as const).map(([field, label]) => (
                      <label key={field} className="text-[11px] text-gray-500">
                        <span className="mb-1 block truncate">{label}</span>
                        <input
                          type="time"
                          value={hours[field]}
                          onChange={(event) => store.setBusinessHours(city.id, { ...hours, [field]: event.target.value })}
                          className="w-full min-h-11 rounded-lg border border-gray-200 bg-white px-2 py-2 text-base text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-white sm:text-xs"
                        />
                      </label>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      <button
        type="button"
        onClick={store.resetToDefaults}
        className="flex items-center gap-2 text-xs font-medium text-gray-500 hover:text-blue-600"
      >
        <RotateCcw className="h-3.5 w-3.5" />
        {text.reset}
      </button>
    </div>
  )
}
