/** Same-origin relative path only — blocks protocol-relative //evil.com */
export function sanitizeNextPath(next: string | null | undefined, fallback = '/dashboard'): string {
  if (!next) return fallback
  const trimmed = next.trim()
  if (!trimmed.startsWith('/') || trimmed.startsWith('//')) return fallback
  if (trimmed.includes('://')) return fallback
  // Public marketing home is not a workspace destination
  if (trimmed === '/') return fallback
  return trimmed
}

export function loginUrlWithNext(pathWithSearch?: string): string {
  const raw = (pathWithSearch ?? `${window.location.pathname}${window.location.search}`).trim()
  if (!raw.startsWith('/') || raw.startsWith('//') || raw.includes('://') || raw === '/') {
    return '/login'
  }
  return `/login?next=${encodeURIComponent(raw)}`
}
