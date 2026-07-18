import type { UserRole } from '../types'

/** Both office admins share the same write privileges. */
export function isOrgAdmin(role: UserRole | string | null | undefined): boolean {
  return role === 'china_admin' || role === 'algeria_admin'
}
