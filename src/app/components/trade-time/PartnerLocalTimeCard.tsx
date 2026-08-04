import { Clock3 } from 'lucide-react'
import { useTradeClock } from '../../../hooks/useTradeClock'
import {
  buildCitySnapshot,
  getTradeCityName,
  resolveTradeCityFromLocation,
} from '../../../services/timezoneService'
import { useAppStore } from '../../../store/appStore'
import { useTradeTimeStore } from '../../../store/tradeTimeStore'
import { cn } from '../../utils/cn'

export function PartnerLocalTimeCard({ country, city }: { country?: string; city?: string }) {
  const language = useAppStore((state) => state.language)
  const preferences = useTradeTimeStore()
  const now = useTradeClock()
  const tradeCity = resolveTradeCityFromLocation({ country, city })
  if (!tradeCity) return null
  const snapshot = buildCitySnapshot(tradeCity, preferences, now, language)
  const labels = language === 'ar'
    ? { title: 'الوقت المحلي الحالي', open: 'مفتوح', closing_soon: 'يغلق قريباً', closed: 'مغلق' }
    : { title: 'Heure locale actuelle', open: 'Ouvert', closing_soon: 'Ferme bientôt', closed: 'Fermé' }
  const colors = {
    open: 'text-green-600 dark:text-green-400',
    closing_soon: 'text-amber-600 dark:text-amber-400',
    closed: 'text-red-600 dark:text-red-400',
  }
  const dots = { open: '🟢', closing_soon: '🟡', closed: '🔴' }

  return (
    <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-4 dark:border-blue-900/50 dark:bg-blue-900/10">
      <div className="flex items-center gap-2 text-xs font-medium text-blue-700 dark:text-blue-300">
        <Clock3 className="h-3.5 w-3.5" />
        {labels.title}
      </div>
      <div className="mt-2 flex items-end justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {tradeCity.flag} {getTradeCityName(tradeCity, language)}
          </p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-gray-900 dark:text-white" dir="ltr">
            {snapshot.localTime}
          </p>
        </div>
        <p className={cn('text-xs font-medium', colors[snapshot.businessStatus])}>
          {dots[snapshot.businessStatus]} {labels[snapshot.businessStatus]}
        </p>
      </div>
    </div>
  )
}
