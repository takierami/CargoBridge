import {
  CITY_LOCATION_ALIASES,
  COUNTRY_CITY_FALLBACKS,
  REFERENCE_TIMEZONE,
  TRADE_CITIES,
} from '../constants/tradeCities'
import type {
  CityTimeSnapshot,
  Language,
  TimeFormat,
  TradeCity,
  TradeTimePreferences,
} from '../types'
import {
  getBusinessStatus,
  getLocalTimeParts,
  isDaytime,
  mergeBusinessHours,
} from '../utils/businessHours'

const localeFor = (language: Language) => language === 'ar' ? 'ar-DZ' : 'fr-FR'

export function getTradeCityName(city: TradeCity, language: Language): string {
  return language === 'ar' ? city.nameAr : city.nameFr
}

export function formatCityLocalTime(
  date: Date,
  ianaTimeZone: string,
  format: TimeFormat,
  language: Language,
): string {
  return new Intl.DateTimeFormat(localeFor(language), {
    timeZone: ianaTimeZone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: format === '12h',
  }).format(date)
}

function getOffsetMinutes(date: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date)
  const read = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value)
  const asUtc = Date.UTC(
    read('year'),
    read('month') - 1,
    read('day'),
    read('hour'),
    read('minute'),
    read('second'),
  )
  return Math.round((asUtc - date.getTime()) / 60000)
}

export function getOffsetFromReference(
  date: Date,
  targetZone: string,
  referenceZone = REFERENCE_TIMEZONE,
): number {
  return (getOffsetMinutes(date, targetZone) - getOffsetMinutes(date, referenceZone)) / 60
}

export function formatOffsetLabel(offset: number, language: Language): string {
  if (offset === 0) return language === 'ar' ? 'نفس توقيت الجزائر' : 'Même heure que l’Algérie'
  const sign = offset > 0 ? '+' : '−'
  const amount = Math.abs(offset)
  if (language === 'ar') return `${sign}${amount} ${amount === 1 ? 'ساعة' : 'ساعات'} عن الجزائر`
  return `${sign}${amount} ${amount === 1 ? 'heure' : 'heures'} par rapport à l’Algérie`
}

export function formatUtcOffsetLabel(date: Date, ianaTimeZone: string): string {
  const offset = getOffsetMinutes(date, ianaTimeZone) / 60
  return `UTC${offset >= 0 ? '+' : '−'}${Math.abs(offset)}`
}

function normalize(value?: string): string {
  return (value ?? '').trim().toLocaleLowerCase()
}

export function resolveTradeCityFromLocation(location: {
  country?: string
  city?: string
}): TradeCity | null {
  const cityId = CITY_LOCATION_ALIASES[normalize(location.city)]
  const fallbackId = COUNTRY_CITY_FALLBACKS[normalize(location.country)]
  const id = cityId ?? fallbackId
  return TRADE_CITIES.find((city) => city.id === id) ?? null
}

export function buildCitySnapshot(
  city: TradeCity,
  preferences: TradeTimePreferences,
  now: Date,
  language: Language,
): CityTimeSnapshot {
  const businessHours = mergeBusinessHours(
    city.defaultBusinessHours,
    preferences.businessHoursOverrides[city.id],
  )
  const local = getLocalTimeParts(now, city.ianaTimeZone)
  const offsetFromAlgiers = getOffsetFromReference(now, city.ianaTimeZone)
  return {
    city,
    localTime: formatCityLocalTime(now, city.ianaTimeZone, preferences.timeFormat, language),
    utcOffset: formatUtcOffsetLabel(now, city.ianaTimeZone),
    offsetFromAlgiers,
    offsetLabel: formatOffsetLabel(offsetFromAlgiers, language),
    businessStatus: getBusinessStatus(now, city.ianaTimeZone, businessHours),
    businessHours,
    isDaytime: isDaytime(local.hour),
  }
}

export function getDashboardCities(
  cities: TradeCity[],
  preferences: TradeTimePreferences,
): TradeCity[] {
  const order = new Map(preferences.cityOrder.map((id, index) => [id, index]))
  const pinned = new Set(preferences.pinnedCityIds)
  return cities
    .filter((city) => preferences.enabledCityIds.includes(city.id))
    .sort((a, b) => {
      if (pinned.has(a.id) !== pinned.has(b.id)) return pinned.has(a.id) ? -1 : 1
      return (order.get(a.id) ?? 999) - (order.get(b.id) ?? 999)
    })
}
