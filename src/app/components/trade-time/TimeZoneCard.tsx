import { Moon, Pin, Sun } from 'lucide-react'
import type { CityTimeSnapshot, Language } from '../../../types'
import { getTradeCityName } from '../../../services/timezoneService'
import { cn } from '../../utils/cn'

const statusStyles = {
  open: 'bg-green-50 text-green-700 dark:bg-green-900/25 dark:text-green-300',
  closing_soon: 'bg-amber-50 text-amber-700 dark:bg-amber-900/25 dark:text-amber-300',
  closed: 'bg-red-50 text-red-700 dark:bg-red-900/25 dark:text-red-300',
}

const statusDots = { open: '🟢', closing_soon: '🟡', closed: '🔴' }

export function TimeZoneCard({
  snapshot,
  language,
  pinned = false,
}: {
  snapshot: CityTimeSnapshot
  language: Language
  pinned?: boolean
}) {
  const labels = language === 'ar'
    ? { open: 'مفتوح', closing_soon: 'يغلق قريباً', closed: 'مغلق', hours: 'ساعات العمل' }
    : { open: 'Ouvert', closing_soon: 'Ferme bientôt', closed: 'Fermé', hours: 'Horaires' }
  const { city, businessStatus, businessHours } = snapshot

  return (
    <article className="rounded-xl border border-gray-200 bg-gray-50/70 p-4 dark:border-gray-700 dark:bg-gray-900/35">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-2xl" aria-hidden>{city.flag}</span>
          <div className="min-w-0">
            <h4 className="truncate text-sm font-semibold text-gray-900 dark:text-white">
              {getTradeCityName(city, language)}
            </h4>
            <p className="text-xs text-gray-500 dark:text-gray-400">{snapshot.utcOffset}</p>
          </div>
        </div>
        <div className="flex items-center gap-1 text-gray-400">
          {pinned && <Pin className="h-3.5 w-3.5 text-blue-500" />}
          {snapshot.isDaytime ? <Sun className="h-4 w-4 text-amber-500" /> : <Moon className="h-4 w-4 text-indigo-400" />}
        </div>
      </div>

      <p className="mt-3 text-2xl font-bold tabular-nums text-gray-900 dark:text-white" dir="ltr">
        {snapshot.localTime}
      </p>
      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{snapshot.offsetLabel}</p>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <span className={cn('rounded-full px-2.5 py-1 text-xs font-medium', statusStyles[businessStatus])}>
          {statusDots[businessStatus]} {labels[businessStatus]}
        </span>
        <span className="text-[11px] text-gray-500 dark:text-gray-400" dir="ltr">
          {labels.hours}: {businessHours.open}–{businessHours.closingSoonEnd}
        </span>
      </div>
    </article>
  )
}
