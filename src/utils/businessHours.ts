import type { BusinessHoursConfig, BusinessStatus } from '../types'

export function parseTimeToMinutes(value: string): number {
  const [hour = '0', minute = '0'] = value.split(':')
  return Number(hour) * 60 + Number(minute)
}

export function getLocalTimeParts(date: Date, ianaTimeZone: string) {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: ianaTimeZone,
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date)
  const value = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value ?? 0)
  return { hour: value('hour'), minute: value('minute') }
}

export function getBusinessStatus(
  now: Date,
  ianaTimeZone: string,
  hours: BusinessHoursConfig,
): BusinessStatus {
  const local = getLocalTimeParts(now, ianaTimeZone)
  const current = local.hour * 60 + local.minute
  const open = parseTimeToMinutes(hours.open)
  const close = parseTimeToMinutes(hours.close)
  const closingSoonEnd = parseTimeToMinutes(hours.closingSoonEnd)
  if (current >= open && current < close) return 'open'
  if (current >= close && current < closingSoonEnd) return 'closing_soon'
  return 'closed'
}

export function mergeBusinessHours(
  defaults: BusinessHoursConfig,
  override?: BusinessHoursConfig,
): BusinessHoursConfig {
  return override ? { ...defaults, ...override } : { ...defaults }
}

export function isDaytime(hour: number): boolean {
  return hour >= 6 && hour < 18
}
