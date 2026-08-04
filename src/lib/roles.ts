import type { UserOffice, UserRole } from '../types'

const ORG_ADMIN_ROLES: ReadonlySet<string> = new Set([
  'owner',
  'admin',
  // Legacy labels still seen in old persisted state
  'china_admin',
  'algeria_admin',
])

const DOMAIN_WRITE_ROLES: ReadonlySet<string> = new Set([
  'owner',
  'admin',
  'manager',
  'employee',
  'china_admin',
  'algeria_admin',
])

/** Owners and admins (settings, invites, company profile). */
export function isOrgAdmin(role: UserRole | string | null | undefined): boolean {
  return !!role && ORG_ADMIN_ROLES.has(role)
}

/** Can mutate domain data (not readonly). */
export function canWriteDomain(role: UserRole | string | null | undefined): boolean {
  return !!role && DOMAIN_WRITE_ROLES.has(role)
}

export function isReadonly(role: UserRole | string | null | undefined): boolean {
  return role === 'readonly'
}

export function officeFromRole(
  role: UserRole | string | null | undefined,
  office?: UserOffice | string | null,
): UserOffice {
  if (office === 'china' || office === 'algeria') return office
  if (role === 'algeria_admin') return 'algeria'
  return 'china'
}
