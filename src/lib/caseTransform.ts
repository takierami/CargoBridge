const FK_REMAP: Record<string, string> = {
  agent: 'agentId',
  supplier: 'supplierId',
  purchaseOrder: 'purchaseOrderId',
  linkedShipment: 'linkedShipmentId',
  sourcePo: 'sourcePoId',
  payment: 'paymentId',
}

export function snakeToCamel(str: string): string {
  return str.replace(/_([a-z])/g, (_, c) => c.toUpperCase())
}

export function camelToSnake(str: string): string {
  return str.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`)
}

export function mapFromApi<T = unknown>(data: unknown): T {
  if (data === null || data === undefined) return data as T
  if (Array.isArray(data)) return data.map(mapFromApi) as T
  if (typeof data !== 'object') return data as T

  const obj = data as Record<string, unknown>
  const result: Record<string, unknown> = {}

  for (const [key, value] of Object.entries(obj)) {
    let camelKey = snakeToCamel(key)
    if (FK_REMAP[camelKey]) camelKey = FK_REMAP[camelKey]
    if (camelKey.endsWith('At') || camelKey.endsWith('Date') || camelKey === 'timestamp' || camelKey === 'ratedAt' || camelKey === 'uploadedAt' || camelKey === 'lastActive' || camelKey === 'completedAt') {
      result[camelKey] = typeof value === 'string' ? value : value
    } else if (camelKey === 'id' && value != null) {
      result[camelKey] = String(value)
    } else {
      result[camelKey] = mapFromApi(value)
    }
  }

  return result as T
}

export function mapToApi(data: unknown): unknown {
  if (data === null || data === undefined) return data
  if (Array.isArray(data)) return data.map(mapToApi)
  if (typeof data !== 'object') return data

  const obj = data as Record<string, unknown>
  const result: Record<string, unknown> = {}

  const reverseFk: Record<string, string> = {
    agentId: 'agent',
    supplierId: 'supplier',
    purchaseOrderId: 'purchase_order',
    linkedShipmentId: 'linked_shipment',
    sourcePoId: 'source_po',
    paymentId: 'payment',
  }

  for (const [key, value] of Object.entries(obj)) {
    if (value === undefined) continue
    const snakeKey = reverseFk[key] ?? camelToSnake(key)
    result[snakeKey] = mapToApi(value)
  }

  return result
}
