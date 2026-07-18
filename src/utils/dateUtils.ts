import type { Language } from '../types'

export function formatDistanceToNow(timestamp: string, language: Language): string {
  const now = new Date()
  const date = new Date(timestamp)
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (language === 'ar') {
    if (diffMins < 1) return 'الآن'
    if (diffMins < 60) return `منذ ${diffMins} دقيقة`
    if (diffHours < 24) return `منذ ${diffHours} ساعة`
    if (diffDays === 1) return 'أمس'
    if (diffDays < 30) return `منذ ${diffDays} يوم`
    return date.toLocaleDateString('ar-DZ')
  } else {
    if (diffMins < 1) return "À l'instant"
    if (diffMins < 60) return `il y a ${diffMins} min`
    if (diffHours < 24) return `il y a ${diffHours}h`
    if (diffDays === 1) return 'Hier'
    if (diffDays < 30) return `il y a ${diffDays} jours`
    return date.toLocaleDateString('fr-FR')
  }
}

export function formatDate(dateString: string | undefined, language: Language): string {
  if (!dateString) return '—'
  const date = new Date(dateString)
  if (isNaN(date.getTime())) return '—'
  return date.toLocaleDateString(language === 'ar' ? 'ar-DZ' : 'fr-FR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function formatTime(dateString: string, language: Language): string {
  const date = new Date(dateString)
  return date.toLocaleTimeString(language === 'ar' ? 'ar-DZ' : 'fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

/** Wrap text in Unicode LTR isolates so digits/latin stay ordered inside RTL. */
export function ltrIsolate(value: string): string {
  if (!value || value === '—') return value
  return `\u2066${value}\u2069`
}

export function formatDateTime(language: Language, at: Date = new Date()): string {
  const locale = language === 'ar' ? 'ar-DZ' : 'fr-FR'
  const date = at.toLocaleDateString(locale)
  const time = at.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })
  return `${date} — ${time}`
}

/** DateTime wrapped for safe embedding in Arabic template bodies. */
export function formatDateTimeIsolated(language: Language, at: Date = new Date()): string {
  return ltrIsolate(formatDateTime(language, at))
}

export function isSameDay(d1: string, d2: string): boolean {
  const date1 = new Date(d1)
  const date2 = new Date(d2)
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  )
}

export function isToday(dateString: string): boolean {
  return isSameDay(dateString, new Date().toISOString())
}

export function isYesterday(dateString: string): boolean {
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  return isSameDay(dateString, yesterday.toISOString())
}
