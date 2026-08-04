import { buildCitySnapshot, resolveTradeCityFromLocation } from '../../../services/timezoneService'
import { useAppStore } from '../../../store/appStore'
import { useTradeTimeStore } from '../../../store/tradeTimeStore'
import { useTradeClock } from '../../../hooks/useTradeClock'
import { cn } from '../../utils/cn'

export function ContactTimeBadge({ country, city }: { country?: string; city?: string }) {
  const language = useAppStore((state) => state.language)
  const preferences = useTradeTimeStore()
  const now = useTradeClock()
  const tradeCity = resolveTradeCityFromLocation({ country, city })
  if (!tradeCity) return null
  const snapshot = buildCitySnapshot(tradeCity, preferences, now, language)
  const safe = snapshot.businessStatus === 'open'
  const warning = snapshot.businessStatus === 'closing_soon'
  const label = language === 'ar'
    ? safe ? 'وقت مناسب للتواصل' : warning ? 'يغلق قريباً' : 'خارج ساعات العمل'
    : safe ? 'Bon moment pour contacter' : warning ? 'Ferme bientôt' : 'Hors heures de travail'

  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-[11px] font-medium',
      safe
        ? 'bg-green-50 text-green-700 dark:bg-green-900/25 dark:text-green-300'
        : warning
          ? 'bg-amber-50 text-amber-700 dark:bg-amber-900/25 dark:text-amber-300'
          : 'bg-red-50 text-red-700 dark:bg-red-900/25 dark:text-red-300',
    )}>
      <span dir="ltr">{snapshot.localTime}</span>
      <span>·</span>
      {label}
    </span>
  )
}
