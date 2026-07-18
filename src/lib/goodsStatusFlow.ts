import type { GoodsStatus, UserRole } from '../types'

/** Mirrors backend GOODS_STATUS_FLOW — UX only; server enforces. */
export const GOODS_STATUS_FLOW: Record<GoodsStatus, GoodsStatus[]> = {
  draft: ['assigned', 'cancelled'],
  assigned: ['ready_for_departure', 'cancelled'],
  ready_for_departure: ['in_transit', 'cancelled'],
  in_transit: ['arrived', 'delayed', 'cancelled'],
  arrived: ['warehouse', 'delayed'],
  warehouse: ['delivered', 'delayed'],
  delayed: ['in_transit', 'arrived', 'warehouse', 'cancelled'],
  delivered: ['warehouse'],
  cancelled: ['draft'],
}

/** Mirrors backend GOODS_ROLE_ALLOWED_STATUSES — both admins share the full set. */
const ADMIN_GOODS_STATUSES = new Set<GoodsStatus>([
  'assigned',
  'ready_for_departure',
  'in_transit',
  'cancelled',
  'draft',
  'arrived',
  'delayed',
  'warehouse',
  'delivered',
])

export const GOODS_ROLE_ALLOWED_STATUSES: Record<UserRole, Set<GoodsStatus>> = {
  china_admin: new Set(ADMIN_GOODS_STATUSES),
  algeria_admin: new Set(ADMIN_GOODS_STATUSES),
}

export const GOODS_STATUS_ACTION_KEYS: Record<string, string> = {
  assigned: 'assignAgent',
  ready_for_departure: 'readyForDeparture',
  in_transit: 'markInTransit',
  arrived: 'markArrived',
  warehouse: 'markWarehouse',
  delayed: 'markDelayed',
  delivered: 'markDelivered',
  cancelled: 'cancel',
  draft: 'reopenDraft',
}

export const GOODS_AGENT_REQUIRED_STATUSES = new Set<GoodsStatus>([
  'assigned',
  'ready_for_departure',
  'in_transit',
  'arrived',
  'warehouse',
  'delayed',
  'delivered',
])

export interface GoodsStatusAction {
  status: GoodsStatus
  actionKey: string
}

export function allowedGoodsActions(
  current: GoodsStatus,
  role: UserRole | null | undefined,
): GoodsStatusAction[] {
  const candidates = GOODS_STATUS_FLOW[current] || []
  const roleSet = role ? GOODS_ROLE_ALLOWED_STATUSES[role] : null
  return candidates
    .filter((s) => !roleSet || roleSet.has(s))
    .map((status) => {
      let actionKey = GOODS_STATUS_ACTION_KEYS[status] || status
      if (current === 'delivered' && status === 'warehouse') actionKey = 'reopenWarehouse'
      if (current === 'cancelled' && status === 'draft') actionKey = 'reopenDraft'
      return { status, actionKey }
    })
}
