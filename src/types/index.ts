export type TransportType = 'air' | 'sea' | 'land' | 'express' | 'other'

export type GoodsStatus =
  | 'draft'
  | 'assigned'
  | 'ready_for_departure'
  | 'in_transit'
  | 'arrived'
  | 'delivered'
  | 'delayed'
  | 'cancelled'

export type AgentStatus = 'active' | 'traveling' | 'delivered' | 'delayed' | 'inactive'
export type Language = 'ar' | 'fr'
export type Theme = 'light' | 'dark'
export type UserRole = 'china_admin' | 'algeria_admin'
export type Priority = 'low' | 'medium' | 'high'
export type NotificationType = 'goods' | 'agent' | 'chat' | 'system'
export type TemplateType = 'reception' | 'delivery' | 'general'

export interface Agent {
  id: string
  name: string        // Arabic name (primary)
  nameFr?: string     // French transliteration
  phone: string
  passport: string
  country: string
  status: AgentStatus
  reliabilityScore: number
  totalDeliveries: number
  delayedDeliveries: number
  createdAt: string
  lastActive?: string
  notes?: string
}

export interface Goods {
  id: string
  trackingNumber: string
  description: string      // Arabic description (primary)
  descriptionFr?: string   // French description
  category: string
  quantity: number
  weight?: number
  agentId?: string
  status: GoodsStatus
  priority: Priority
  createdAt: string
  departureDate?: string
  expectedArrivalDate?: string
  arrivalDate?: string
  transportType?: TransportType
  notes?: string           // Arabic notes
  notesFr?: string         // French notes
  photos?: string[]
  value?: number
}

export interface Message {
  id: string
  conversationId: string
  senderId: string
  senderName: string
  senderRole: UserRole
  content: string
  timestamp: string
  type: 'text' | 'image' | 'voice'
  read: boolean
}

export interface Notification {
  id: string
  type: NotificationType
  titleAr: string
  titleFr: string
  messageAr: string
  messageFr: string
  read: boolean
  timestamp: string
  relatedId?: string
}

export interface DocumentTemplate {
  id: string
  name: string
  type: TemplateType
  content: string
  isDefault: boolean
  createdAt: string
  updatedAt: string
}

export interface AppSettings {
  language: Language
  theme: Theme
  role: UserRole
  companyName: string
}

export interface TemplateVariable {
  key: string
  labelAr: string
  labelFr: string
  example: string
}

export const TEMPLATE_VARIABLES: TemplateVariable[] = [
  { key: 'trackingNumber',      labelAr: 'رقم التتبع',          labelFr: 'Numéro de suivi',       example: 'CB-2025-001' },
  { key: 'goodsDescription',    labelAr: 'وصف البضاعة',          labelFr: 'Description',            example: 'هواتف ذكية سامسونج' },
  { key: 'quantity',            labelAr: 'الكمية',               labelFr: 'Quantité',               example: '50' },
  { key: 'category',            labelAr: 'الفئة',                labelFr: 'Catégorie',              example: 'إلكترونيات' },
  { key: 'weight',              labelAr: 'الوزن',                labelFr: 'Poids',                  example: '25 كجم' },
  { key: 'value',               labelAr: 'القيمة',               labelFr: 'Valeur',                 example: '15000 دج' },
  { key: 'agentName',           labelAr: 'اسم الوكيل',           labelFr: "Nom de l'agent",         example: 'أحمد بن علي' },
  { key: 'agentPhone',          labelAr: 'هاتف الوكيل',          labelFr: "Téléphone de l'agent",   example: '+86-138-0000-1234' },
  { key: 'passportNumber',      labelAr: 'رقم جواز السفر',       labelFr: 'Numéro de passeport',    example: 'DZ-1234567' },
  { key: 'departureDate',       labelAr: 'تاريخ المغادرة',        labelFr: 'Date de départ',         example: '01/06/2025' },
  { key: 'expectedArrivalDate', labelAr: 'الوصول المتوقع',       labelFr: 'Arrivée prévue',         example: '08/06/2025' },
  { key: 'arrivalDate',         labelAr: 'تاريخ الوصول الفعلي',  labelFr: "Date d'arrivée réelle",  example: '07/06/2025' },
  { key: 'creationDate',        labelAr: 'تاريخ الإنشاء',        labelFr: 'Date de création',       example: '25/05/2025' },
  { key: 'currentDate',         labelAr: 'التاريخ الحالي',       labelFr: 'Date actuelle',          example: '05/06/2025' },
  { key: 'currentTime',         labelAr: 'الوقت الحالي',         labelFr: 'Heure actuelle',         example: '14:30' },
  { key: 'currentDateTime',     labelAr: 'التاريخ والوقت',       labelFr: 'Date et heure',          example: '05/06/2025 — 14:30' },
  { key: 'status',              labelAr: 'الحالة',               labelFr: 'Statut',                 example: 'في الطريق' },
  { key: 'transportType',       labelAr: 'نوع النقل',            labelFr: 'Type de transport',      example: 'طيران' },
  { key: 'notes',               labelAr: 'ملاحظات',              labelFr: 'Notes',                  example: 'يحتوي على ضمان سنة' },
  { key: 'companyName',         labelAr: 'اسم الشركة',           labelFr: 'Nom de la société',      example: 'كارغو بريدج' },
]

// ─── Currency / Calculator types ─────────────────────────────────────────────

export interface Currency {
  id: string
  code: string         // e.g. 'DZD'
  name: string         // e.g. 'دينار جزائري'
  nameFr: string       // e.g. 'Dinar algérien'
  symbol: string       // e.g. 'دج'
  rateToBase: number   // how many units of this currency = 1 DZD (base)
  isBase: boolean
  isEnabled: boolean
  isDefault: boolean
  createdAt: string
}

export interface ConversionRecord {
  id: string
  fromCode: string
  toCode: string
  fromAmount: number
  toAmount: number
  rate: number         // from→to rate used
  timestamp: string
}

export interface CalculatorRecord {
  id: string
  type: 'shipment_cost' | 'profit' | 'basic'
  label: string
  inputs: Record<string, number>
  result: number
  currency: string
  timestamp: string
}
