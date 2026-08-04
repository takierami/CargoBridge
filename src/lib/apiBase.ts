/** Django API base URL (must end with /api, no trailing slash after normalize).
 * Contabo / local: use relative `/api` (Vite proxies in dev; nginx in production).
 * Production builds fail closed when VITE_API_URL is missing.
 */
function resolveApiBase(): string {
  const fromEnv = import.meta.env.VITE_API_URL as string | undefined
  if (fromEnv && String(fromEnv).trim()) {
    return String(fromEnv).trim().replace(/\/$/, '')
  }
  if (import.meta.env.DEV) {
    return '/api'
  }
  throw new Error(
    'VITE_API_URL is required for production builds. Set it at build time (e.g. /api for same-origin VPS deploy) and rebuild.',
  )
}

export const API_BASE: string = resolveApiBase()
