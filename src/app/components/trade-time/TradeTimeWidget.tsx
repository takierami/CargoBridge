import { Clock3, Settings2 } from 'lucide-react'
import { useNavigate } from 'react-router'
import { TRADE_CITIES } from '../../../constants/tradeCities'
import { useTradeClock } from '../../../hooks/useTradeClock'
import { buildCitySnapshot, getDashboardCities } from '../../../services/timezoneService'
import { useAppStore } from '../../../store/appStore'
import { useTradeTimeStore } from '../../../store/tradeTimeStore'
import { TimeZoneCard } from './TimeZoneCard'

export function TradeTimeWidget() {
  const navigate = useNavigate()
  const language = useAppStore((state) => state.language)
  const preferences = useTradeTimeStore()
  const now = useTradeClock()
  const cities = getDashboardCities(TRADE_CITIES, preferences)
  const title = language === 'ar' ? 'مناطق توقيت التجارة العالمية' : 'Fuseaux horaires du commerce mondial'

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-900/25 dark:text-blue-300">
            <Clock3 className="h-4.5 w-4.5" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">{title}</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {language === 'ar' ? 'اعرف الوقت المناسب للتواصل مع شركائك' : 'Le bon moment pour contacter vos partenaires'}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => navigate('/settings')}
          className="rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-blue-600 dark:hover:bg-gray-700"
          aria-label={language === 'ar' ? 'إعدادات المناطق الزمنية' : 'Paramètres des fuseaux horaires'}
        >
          <Settings2 className="h-4 w-4" />
        </button>
      </div>

      {cities.length ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {cities.map((city) => (
            <TimeZoneCard
              key={city.id}
              snapshot={buildCitySnapshot(city, preferences, now, language)}
              language={language}
              pinned={preferences.pinnedCityIds.includes(city.id)}
            />
          ))}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => navigate('/settings')}
          className="w-full rounded-xl border border-dashed border-gray-300 p-6 text-sm text-gray-500 hover:border-blue-400 hover:text-blue-600 dark:border-gray-600"
        >
          {language === 'ar' ? 'فعّل المدن من الإعدادات' : 'Activez des villes dans les paramètres'}
        </button>
      )}
    </section>
  )
}
