/** Single source for the Django API base URL (must end with /api). */
export const API_BASE: string =
  import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:8001/api'

/** True when the baked URL cannot reach a production browser (localhost / missing). */
export function isApiBaseUnreachableFromBrowser(): boolean {
  try {
    const host = new URL(API_BASE).hostname
    return host === 'localhost' || host === '127.0.0.1' || host === '::1'
  } catch {
    return true
  }
}
