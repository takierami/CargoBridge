export type TransportType = 'air' | 'sea' | 'land' | 'express' | 'other'

export type GoodsStatus =
  | 'draft'
  | 'assigned'
  | 'ready_for_departure'
  | 'in_transit'
  | 'arrived'
  | 'warehouse'
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
  valueCurrency?: string
  hsCode?: string
  incoterm?: string
  freightCost?: number
  insuranceCost?: number
  dutyAmount?: number
  dutyRate?: number
  customsStatus?: 'not_started' | 'pending' | 'held' | 'cleared'
  landedCost?: number
  isDeleted?: boolean
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

// ─── Supplier types ──────────────────────────────────────────────────────────

export type SupplierStatus = 'active' | 'inactive' | 'suspended' | 'blacklisted'

export type SupplierCategory =
  | 'shoes'
  | 'clothing'
  | 'electronics'
  | 'furniture'
  | 'accessories'
  | 'other'

export interface SupplierPhone {
  label: string
  number: string
}

export interface Supplier {
  id: string
  code: string
  name: string
  nameFr?: string
  country: string
  city: string
  address: string
  phones: SupplierPhone[]
  email?: string
  whatsapp?: string
  wechat?: string
  website?: string
  primaryContact: string
  secondaryContact?: string
  categories: SupplierCategory[]
  paymentPreferences: string
  preferredCurrency: string
  leadTimeDays: number
  minimumOrderQty: number
  businessNotes?: string
  status: SupplierStatus
  // Cached balance fields (Phase 3 - recomputed via signals)
  totalPurchased: number
  totalPaid: number
  outstanding: number
  balanceCurrency: string
  createdAt: string
  updatedAt: string
}

export interface SupplierProduct {
  id: string
  supplierId: string
  name: string
  category: string
  sku?: string
  unitCost: number
  currency: string
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface SupplierCategoryEntity {
  id: string
  name: string
  nameFr: string
  isEditable: boolean
  createdAt: string
}

export type SupplierDocumentType =
  | 'invoice'
  | 'contract'
  | 'certificate_of_origin'
  | 'packing_list'
  | 'bill_of_lading'
  | 'customs_declaration'
  | 'power_of_attorney'
  | 'other'

export interface SupplierDocument {
  id: string
  supplierId: string
  documentType: SupplierDocumentType
  customDocumentTypeLabel?: string
  documentNumber: string
  documentDate: string
  expiryDate?: string
  notes?: string
  fileName: string
  fileType: string
  fileSize: number
  fileDataUrl: string
  uploadedAt: string
}

export interface SupplierDocumentTemplate {
  id: string
  templateName: string
  templateBody: string
  createdAt: string
}

// ─── Purchase Order types (Phase 2) ────────────────────────────────────────────

export type POStatus =
  | 'draft'
  | 'sent'
  | 'confirmed'
  | 'in_production'
  | 'ready'
  | 'shipped'
  | 'received'
  | 'cancelled'

export interface PurchaseOrderItem {
  id: string
  purchaseOrderId: string
  productName: string
  quantity: number
  unitCost: number
  totalCost: number
  createdAt: string
  updatedAt: string
}

export interface PurchaseOrder {
  id: string
  poNumber: string
  supplierId: string
  orderDate: string
  expectedCompletionDate?: string
  receivedDate?: string
  currency: string
  status: POStatus
  notes?: string
  linkedShipmentId?: string
  totalAmount: number
  isDeleted: boolean
  createdAt: string
  updatedAt: string
}

export interface PriceHistoryEntry {
  id: string
  supplierId: string
  productName: string
  unitCost: number
  currency: string
  sourcePoId: string
  recordedAt: string
  createdAt: string
}

// ─── Status transition rules (Phase 2) ─────────────────────────────────────────

export const PO_STATUS_FLOW: Record<POStatus, POStatus[]> = {
  draft: ['sent', 'cancelled'],
  sent: ['confirmed', 'cancelled'],
  confirmed: ['in_production', 'cancelled'],
  in_production: ['ready', 'cancelled'],
  ready: ['shipped', 'cancelled'],
  shipped: ['received', 'cancelled'],
  received: [],
  cancelled: [],
}

export const PO_STATUS_LABELS_AR: Record<POStatus, string> = {
  draft: 'مسودة',
  sent: 'مرسل',
  confirmed: 'مؤكد',
  in_production: 'قيد الإنتاج',
  ready: 'جاهز',
  shipped: 'تم الشحن',
  received: 'مستلم',
  cancelled: 'ملغي',
}

export const PO_STATUS_LABELS_FR: Record<POStatus, string> = {
  draft: 'Brouillon',
  sent: 'Envoyé',
  confirmed: 'Confirmé',
  in_production: 'En production',
  ready: 'Prêt',
  shipped: 'Expédié',
  received: 'Reçu',
  cancelled: 'Annulé',
}

export const PO_STATUS_COLORS: Record<POStatus, string> = {
  draft: 'bg-gray-500',
  sent: 'bg-blue-500',
  confirmed: 'bg-indigo-500',
  in_production: 'bg-purple-500',
  ready: 'bg-teal-500',
  shipped: 'bg-amber-500',
  received: 'bg-green-500',
  cancelled: 'bg-red-500',
}

// ─── Payment types (Phase 3) ───────────────────────────────────────────────

export type PaymentStatus = 'pending' | 'partially_paid' | 'fully_paid' | 'overdue'
export type PaymentMethod = 'bank_transfer' | 'cash' | 'wise' | 'western_union' | 'paypal' | 'other'
export type AdjustmentType = 'credit' | 'debit'

export interface SupplierPayment {
  id: string
  paymentNumber: string
  supplierId: string
  purchaseOrderId?: string
  amount: number
  amountPaid: number
  currency: string
  paymentMethod: PaymentMethod
  paymentDate: string
  status: PaymentStatus
  notes?: string
  isDeleted: boolean
  createdAt: string
  updatedAt: string
}

export interface SupplierAdjustment {
  id: string
  supplierId: string
  date: string
  type: AdjustmentType
  amount: number
  currency: string
  reason: string
  isDeleted: boolean
  createdAt: string
  updatedAt: string
}

export type SupplierAdjustmentInput = Omit<SupplierAdjustment, 'id' | 'isDeleted' | 'createdAt' | 'updatedAt'>

// Computed balance per supplier (cached on Supplier model)
export interface SupplierBalance {
  totalPurchased: number
  totalPaid: number
  outstanding: number
  currency: string
}

// Ledger entry for statement view
export type LedgerEntryType = 'order' | 'payment' | 'credit_adjustment' | 'debit_adjustment'

export interface LedgerEntry {
  date: string
  type: LedgerEntryType
  reference: string
  debit: number
  credit: number
  runningBalance: number
  currency: string
}

export const PAYMENT_STATUS_LABELS_AR: Record<PaymentStatus, string> = {
  pending: 'قيد الانتظار',
  partially_paid: 'مدفوع جزئيا',
  fully_paid: 'مدفوع بالكامل',
  overdue: 'متأخر',
}

export const PAYMENT_STATUS_LABELS_FR: Record<PaymentStatus, string> = {
  pending: 'En attente',
  partially_paid: 'Partiellement payé',
  fully_paid: 'Payé entièrement',
  overdue: 'En retard',
}

export const PAYMENT_METHOD_LABELS_AR: Record<PaymentMethod, string> = {
  bank_transfer: 'تحويل بنكي',
  cash: 'نقدا',
  wise: 'Wise',
  western_union: 'Western Union',
  paypal: 'PayPal',
  other: 'أخرى',
}

export const PAYMENT_METHOD_LABELS_FR: Record<PaymentMethod, string> = {
  bank_transfer: 'Virement bancaire',
  cash: 'Espèces',
  wise: 'Wise',
  western_union: 'Western Union',
  paypal: 'PayPal',
  other: 'Autre',
}

export const PAYMENT_STATUS_COLORS: Record<PaymentStatus, string> = {
  pending: 'bg-blue-500',
  partially_paid: 'bg-amber-500',
  fully_paid: 'bg-green-500',
  overdue: 'bg-red-500',
}

// ─── Document type labels (Phase 4) ──────────────────────────────────────────
// The SupplierDocument interface is defined above alongside SupplierDocumentType.
// These label maps are kept for backward compatibility with any UI that references them.

export const DOCUMENT_TYPE_LABELS_AR: Record<SupplierDocumentType, string> = {
  invoice: 'فاتورة',
  contract: 'عقد',
  certificate_of_origin: 'شهادة منشأ',
  packing_list: 'قائمة التعبئة',
  bill_of_lading: 'بوليصة شحن',
  customs_declaration: 'تصريح جمركي',
  power_of_attorney: 'تفويض',
  other: 'أخرى',
}

export const DOCUMENT_TYPE_LABELS_FR: Record<SupplierDocumentType, string> = {
  invoice: 'Facture',
  contract: 'Contrat',
  certificate_of_origin: 'Certificat d\'origine',
  packing_list: 'Liste de colisage',
  bill_of_lading: 'Connaissement',
  customs_declaration: 'Déclaration douanière',
  power_of_attorney: 'Procuration',
  other: 'Autre',
}

// ─── Communication types (Phase 4) ──────────────────────────────────────────

export type CommunicationType = 'phone_call' | 'meeting' | 'email' | 'wechat' | 'whatsapp' | 'other'

export interface SupplierCommunication {
  id: string
  supplierId: string
  date: string
  type: CommunicationType
  summary: string
  followUpRequired: boolean
  followUpDate?: string
  isDeleted: boolean
  createdAt: string
  updatedAt: string
}

export const COMMUNICATION_TYPE_LABELS_AR: Record<CommunicationType, string> = {
  phone_call: 'مكالمة',
  meeting: 'اجتماع',
  email: 'بريد إلكتروني',
  wechat: 'WeChat',
  whatsapp: 'WhatsApp',
  other: 'أخرى',
}

export const COMMUNICATION_TYPE_LABELS_FR: Record<CommunicationType, string> = {
  phone_call: 'Appel téléphonique',
  meeting: 'Réunion',
  email: 'Email',
  wechat: 'WeChat',
  whatsapp: 'WhatsApp',
  other: 'Autre',
}

// ─── Task types (Phase 4) ────────────────────────────────────────────────────

export type TaskStatus = 'pending' | 'completed'

export interface SupplierTask {
  id: string
  supplierId?: string
  purchaseOrderId?: string
  paymentId?: string
  title: string
  description: string
  dueDate: string
  priority: Priority
  status: TaskStatus
  completedAt?: string
  isDeleted: boolean
  createdAt: string
  updatedAt: string
}

export const TASK_STATUS_LABELS_AR: Record<TaskStatus, string> = {
  pending: 'قيد الانتظار',
  completed: 'مكتمل',
}

export const TASK_STATUS_LABELS_FR: Record<TaskStatus, string> = {
  pending: 'En attente',
  completed: 'Terminé',
}

export const TASK_STATUS_COLORS: Record<TaskStatus, string> = {
  pending: 'bg-blue-500',
  completed: 'bg-green-500',
}

// ─── Rating types (Phase 5) ───────────────────────────────────────────────────

export interface SupplierRating {
  id: string
  supplierId: string
  quality: number
  communication: number
  deliverySpeed: number
  reliability: number
  pricing: number
  flexibility: number
  overall: number
  note: string
  ratedAt: string
  createdAt: string
  updatedAt: string
}

// ─── Performance analytics (Phase 5) ────────────────────────────────────────

export interface SupplierPerformance {
  totalOrders: number
  totalPurchaseValue: number
  outstandingBalance: number
  avgDeliveryDays: number
  onTimeDeliveryRate: number
  delayCount: number
  disputeCount: number
  shippedCount: number
}

export interface AnalyticsReport {
  topSuppliersByValue: { supplierId: string; supplierName: string; code: string; orderCount: number; totalValue: number; outstanding: number; rating?: number }[]
  topSuppliersByReliability: { supplierId: string; supplierName: string; receivedCount: number; onTimeRate: number; avgDeliveryDays: number; rating?: number }[]
  largestBalances: { supplierId: string; supplierName: string; totalPurchased: number; totalPaid: number; outstanding: number; overduePayments: number }[]
  avgLeadTime: { supplierId: string; supplierName: string; receivedCount: number; avgDays: number; minDays: number; maxDays: number }[]
  purchaseVolume: { supplierId: string; supplierName: string; volume: number; percentage: number }[]
}

export const RATING_CRITERIA = ['quality', 'communication', 'deliverySpeed', 'reliability', 'pricing', 'flexibility'] as const
export type RatingCriterion = typeof RATING_CRITERIA[number]

export const RATING_CRITERIA_LABELS_AR: Record<RatingCriterion, string> = {
  quality: 'الجودة',
  communication: 'التواصل',
  deliverySpeed: 'سرعة التوصيل',
  reliability: 'الموثوقية',
  pricing: 'السعر',
  flexibility: 'المرونة',
}

export const RATING_CRITERIA_LABELS_FR: Record<RatingCriterion, string> = {
  quality: 'Qualité',
  communication: 'Communication',
  deliverySpeed: 'Délai de livraison',
  reliability: 'Fiabilité',
  pricing: 'Prix',
  flexibility: 'Flexibilité',
}
