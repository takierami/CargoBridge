/** Same-origin relative path only — blocks protocol-relative //evil.com */
export function sanitizeNextPath(next: string | null | undefined, fallback = '/'): string {
  if (!next) return fallback
  const trimmed = next.trim()
  if (!trimmed.startsWith('/') || trimmed.startsWith('//')) return fallback
  if (trimmed.includes('://')) return fallback
  return trimmed
}

export function loginUrlWithNext(pathWithSearch?: string): string {
  const next = sanitizeNextPath(
    pathWithSearch ?? `${window.location.pathname}${window.location.search}`,
  )
  if (next === '/') return '/login'
  return `/login?next=${encodeURIComponent(next)}`
}
