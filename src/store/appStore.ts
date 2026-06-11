import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Agent, Goods, Notification, DocumentTemplate, Language, Theme, UserRole, TemplateType, Supplier, SupplierProduct, SupplierCategoryEntity, PurchaseOrder, PurchaseOrderItem, PriceHistoryEntry, POStatus, SupplierPayment, SupplierAdjustment, SupplierAdjustmentInput, SupplierDocument, SupplierCommunication, SupplierTask, SupplierRating, SupplierDocumentTemplate } from '../types'
// Note: SupplierDocument now uses uploadedAt (not isDeleted/createdAt/updatedAt)
import { goodsService } from '../services/goodsService'
import { agentService } from '../services/agentService'
import { notificationService } from '../services/notificationService'
import { templateService } from '../services/templateService'
import { supplierTemplateService } from '../services/supplierTemplateService'
import { currencyService, conversionHistoryService, calcRecordService } from '../services/currencyService'
import { supplierService, supplierProductService } from '../services/supplierService'
import { supplierCategoryService } from '../services/supplierCategoryService'
import { purchaseOrderService, priceHistoryService } from '../services/purchaseOrderService'
import { paymentService, adjustmentService } from '../services/paymentService'
import { documentService } from '../services/documentService'
import { communicationService } from '../services/communicationService'
import { taskService } from '../services/taskService'
import { ratingService } from '../services/ratingService'
import { createT, type TFunction } from '../locales'

interface AppStore {
  language: Language
  theme: Theme
  role: UserRole
  companyName: string
  companyNameFr: string
  sidebarOpen: boolean

  goods: Goods[]
  agents: Agent[]
  notifications: Notification[]
  templates: DocumentTemplate[]
  supplierTemplates: SupplierDocumentTemplate[]

  suppliers: Supplier[]
  supplierProducts: SupplierProduct[]
  supplierCategories: SupplierCategoryEntity[]
  purchaseOrders: PurchaseOrder[]
  purchaseOrderItems: PurchaseOrderItem[]
  priceHistory: PriceHistoryEntry[]
  supplierPayments: SupplierPayment[]
  supplierAdjustments: SupplierAdjustment[]
  supplierDocuments: SupplierDocument[]
  supplierCommunications: SupplierCommunication[]
  supplierTasks: SupplierTask[]
  supplierRatings: SupplierRating[]

  t: TFunction

  setLanguage: (lang: Language) => void
  setTheme: (theme: Theme) => void
  setRole: (role: UserRole) => void
  setCompanyName: (name: string) => void
  setCompanyNameFr: (name: string) => void
  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void

  loadGoods: () => void
  addGoods: (data: Omit<Goods, 'id' | 'createdAt' | 'trackingNumber'>) => Goods
  updateGoods: (id: string, data: Partial<Goods>) => void
  deleteGoods: (id: string) => void

  loadAgents: () => void
  addAgent: (data: Omit<Agent, 'id' | 'createdAt'>) => Agent
  updateAgent: (id: string, data: Partial<Agent>) => void
  deleteAgent: (id: string) => void

  loadNotifications: () => void
  markNotificationRead: (id: string) => void
  markAllNotificationsRead: () => void

  loadTemplates: () => void
  addTemplate: (data: Omit<DocumentTemplate, 'id' | 'createdAt' | 'updatedAt'>) => DocumentTemplate
  updateTemplate: (id: string, data: Partial<DocumentTemplate>) => void
  deleteTemplate: (id: string) => void
  duplicateTemplate: (id: string) => DocumentTemplate | null
  setDefaultTemplate: (id: string, type: TemplateType) => void
  getDefaultTemplate: (type: TemplateType) => DocumentTemplate | undefined

  loadSupplierTemplates: () => void
  addSupplierTemplate: (data: Omit<SupplierDocumentTemplate, 'id' | 'createdAt'>) => SupplierDocumentTemplate
  updateSupplierTemplate: (id: string, data: Partial<SupplierDocumentTemplate>) => SupplierDocumentTemplate | null
  deleteSupplierTemplate: (id: string) => void

  loadSuppliers: () => void
  addSupplier: (data: Omit<Supplier, 'id' | 'code' | 'createdAt' | 'updatedAt'>) => Supplier
  updateSupplier: (id: string, data: Partial<Supplier>) => void
  deleteSupplier: (id: string) => void

  loadSupplierProducts: () => void
  addSupplierProduct: (data: Omit<SupplierProduct, 'id' | 'createdAt' | 'updatedAt'>) => SupplierProduct
  updateSupplierProduct: (id: string, data: Partial<SupplierProduct>) => void
  deleteSupplierProduct: (id: string) => void

  loadSupplierCategories: () => void
  addSupplierCategory: (data: Omit<SupplierCategoryEntity, 'id' | 'createdAt'>) => SupplierCategoryEntity
  updateSupplierCategory: (id: string, data: Partial<SupplierCategoryEntity>) => void
  deleteSupplierCategory: (id: string) => void

  loadPurchaseOrders: () => void
  addPurchaseOrder: (data: Omit<PurchaseOrder, 'id' | 'poNumber' | 'totalAmount' | 'isDeleted' | 'createdAt' | 'updatedAt'> & { items?: Omit<PurchaseOrderItem, 'id' | 'purchaseOrderId' | 'createdAt' | 'updatedAt'>[] }) => PurchaseOrder
  updatePurchaseOrder: (id: string, data: Partial<PurchaseOrder> & { items?: (Partial<PurchaseOrderItem> & { id?: string })[] }) => PurchaseOrder | null
  updatePurchaseOrderStatus: (id: string, newStatus: POStatus) => { success: boolean; error?: string }
  deletePurchaseOrder: (id: string) => void

  loadPriceHistory: () => void

  loadSupplierPayments: () => void
  addSupplierPayment: (data: Omit<SupplierPayment, 'id' | 'paymentNumber' | 'isDeleted' | 'createdAt' | 'updatedAt'>) => SupplierPayment
  updateSupplierPayment: (id: string, data: Partial<SupplierPayment>) => SupplierPayment | null
  markPaymentAsFullyPaid: (id: string) => SupplierPayment | null
  deleteSupplierPayment: (id: string) => void
  getPOBalance: (purchaseOrderId: string) => { total: number; paid: number; remaining: number }

  loadSupplierAdjustments: () => void
  addSupplierAdjustment: (data: SupplierAdjustmentInput) => SupplierAdjustment
  updateSupplierAdjustment: (id: string, data: Partial<SupplierAdjustment>) => SupplierAdjustment | null
  deleteSupplierAdjustment: (id: string) => void

  // Phase 4: Documents (new model uses uploadedAt, no isDeleted)
  loadSupplierDocuments: () => void
  addSupplierDocument: (data: Omit<SupplierDocument, 'id' | 'uploadedAt'>) => SupplierDocument
  updateSupplierDocument: (id: string, data: Partial<SupplierDocument>) => SupplierDocument | null
  deleteSupplierDocument: (id: string) => void

  // Phase 4: Communications
  loadSupplierCommunications: () => void
  addSupplierCommunication: (data: Omit<SupplierCommunication, 'id' | 'isDeleted' | 'createdAt' | 'updatedAt'>) => SupplierCommunication
  updateSupplierCommunication: (id: string, data: Partial<SupplierCommunication>) => SupplierCommunication | null
  deleteSupplierCommunication: (id: string) => void

  // Phase 4: Tasks
  loadSupplierTasks: () => void
  addSupplierTask: (data: Omit<SupplierTask, 'id' | 'isDeleted' | 'createdAt' | 'updatedAt'>) => SupplierTask
  updateSupplierTask: (id: string, data: Partial<SupplierTask>) => SupplierTask | null
  markTaskComplete: (id: string) => SupplierTask | null
  deleteSupplierTask: (id: string) => void

  // Phase 5: Ratings
  loadSupplierRatings: () => void
  upsertSupplierRating: (supplierId: string, data: Omit<SupplierRating, 'id' | 'supplierId' | 'overall' | 'ratedAt' | 'createdAt' | 'updatedAt'>) => SupplierRating
  getSupplierRating: (supplierId: string) => SupplierRating | undefined

  initializeData: () => void
  resetData: () => void
}

export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      language: 'ar',
      theme: 'light',
      role: 'china_admin',
      companyName: 'كارغو بريدج',
      companyNameFr: 'CargoBridge',
      sidebarOpen: true,
      goods: [],
      agents: [],
      notifications: [],
      templates: [],
      supplierTemplates: [],
      suppliers: [],
      supplierProducts: [],
      supplierCategories: [],
      purchaseOrders: [],
      purchaseOrderItems: [],
      priceHistory: [],
      supplierPayments: [],
      supplierAdjustments: [],
      supplierDocuments: [],
      supplierCommunications: [],
      supplierTasks: [],
      supplierRatings: [],
      t: createT('ar'),

      setLanguage: (language) => {
        set({ language, t: createT(language) })
        document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr'
        document.documentElement.lang = language
      },

      setTheme: (theme) => {
        set({ theme })
        document.documentElement.classList.toggle('dark', theme === 'dark')
      },

      setRole: (role) => set({ role }),
      setCompanyName: (companyName) => set({ companyName }),
      setCompanyNameFr: (companyNameFr) => set({ companyNameFr }),
      toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
      setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),

      loadGoods: () => set({ goods: goodsService.getAll() }),
      addGoods: (data) => { const c = goodsService.create(data); get().loadGoods(); return c },
      updateGoods: (id, data) => { goodsService.update(id, data); get().loadGoods() },
      deleteGoods: (id) => { goodsService.delete(id); get().loadGoods() },

      loadAgents: () => set({ agents: agentService.getAll() }),
      addAgent: (data) => { const c = agentService.create(data); get().loadAgents(); return c },
      updateAgent: (id, data) => { agentService.update(id, data); get().loadAgents() },
      deleteAgent: (id) => { agentService.delete(id); get().loadAgents() },

      loadNotifications: () => set({ notifications: notificationService.getAll() }),
      markNotificationRead: (id) => { notificationService.markRead(id); get().loadNotifications() },
      markAllNotificationsRead: () => { notificationService.markAllRead(); get().loadNotifications() },

      loadTemplates: () => set({ templates: templateService.getAll() }),
      addTemplate: (data) => { const c = templateService.create(data); get().loadTemplates(); return c },
      updateTemplate: (id, data) => { templateService.update(id, data); get().loadTemplates() },
      deleteTemplate: (id) => { templateService.delete(id); get().loadTemplates() },
      duplicateTemplate: (id) => { const c = templateService.duplicate(id); get().loadTemplates(); return c },
      setDefaultTemplate: (id, type) => { templateService.setDefault(id, type); get().loadTemplates() },
      getDefaultTemplate: (type) => templateService.getDefault(type),

      loadSupplierTemplates: () => set({ supplierTemplates: supplierTemplateService.getAll() }),
      addSupplierTemplate: (data) => { const c = supplierTemplateService.create(data); get().loadSupplierTemplates(); return c },
      updateSupplierTemplate: (id, data) => { const c = supplierTemplateService.update(id, data); get().loadSupplierTemplates(); return c },
      deleteSupplierTemplate: (id) => { supplierTemplateService.delete(id); get().loadSupplierTemplates() },

      loadSuppliers: () => {
        const list = supplierService.getAll()
        list.forEach(s => {
          paymentService.updateSupplierBalance(s.id)
        })
        set({ suppliers: supplierService.getAll() })
      },
      addSupplier: (data) => { const c = supplierService.create(data); get().loadSuppliers(); return c },
      updateSupplier: (id, data) => { supplierService.update(id, data); get().loadSuppliers() },
      deleteSupplier: (id) => { supplierService.delete(id); get().loadSuppliers() },

      loadSupplierProducts: () => set({ supplierProducts: supplierProductService.getAll() }),
      addSupplierProduct: (data) => { const c = supplierProductService.create(data); get().loadSupplierProducts(); return c },
      updateSupplierProduct: (id, data) => { supplierProductService.update(id, data); get().loadSupplierProducts() },
      deleteSupplierProduct: (id) => { supplierProductService.delete(id); get().loadSupplierProducts() },

      loadSupplierCategories: () => set({ supplierCategories: supplierCategoryService.getAll() }),
      addSupplierCategory: (data) => { const c = supplierCategoryService.create(data); get().loadSupplierCategories(); return c },
      updateSupplierCategory: (id, data) => { supplierCategoryService.update(id, data); get().loadSupplierCategories() },
      deleteSupplierCategory: (id) => { supplierCategoryService.delete(id); get().loadSupplierCategories() },

      loadPurchaseOrders: () => {
        set({
          purchaseOrders: purchaseOrderService.getAll().filter(po => !po.isDeleted),
          purchaseOrderItems: purchaseOrderService.getAllItems(),
        })
      },
      addPurchaseOrder: (data) => {
        const c = purchaseOrderService.create(data)
        get().loadPurchaseOrders()
        paymentService.updateSupplierBalance(data.supplierId)
        get().loadSuppliers()
        return c
      },
      updatePurchaseOrder: (id, data) => {
        const c = purchaseOrderService.update(id, data)
        get().loadPurchaseOrders()
        if (c) {
          paymentService.updateSupplierBalance(c.supplierId)
          get().loadSuppliers()
        }
        return c
      },
      updatePurchaseOrderStatus: (id, newStatus) => {
        const result = purchaseOrderService.updateStatus(id, newStatus)
        if (result.success) {
          get().loadPurchaseOrders()
          get().loadPriceHistory()
          const po = purchaseOrderService.getById(id)
          if (po) {
            paymentService.updateSupplierBalance(po.supplierId)
            get().loadSuppliers()
          }
        }
        return { success: result.success, error: result.error }
      },
      deletePurchaseOrder: (id) => {
        const po = purchaseOrderService.getById(id)
        purchaseOrderService.delete(id)
        get().loadPurchaseOrders()
        if (po) {
          paymentService.updateSupplierBalance(po.supplierId)
          get().loadSuppliers()
        }
      },

      loadPriceHistory: () => {
        set({ priceHistory: priceHistoryService.getAll() })
      },

      loadSupplierPayments: () => {
        set({ supplierPayments: paymentService.getAll().filter(p => !p.isDeleted) })
      },
      addSupplierPayment: (data) => {
        const c = paymentService.create(data)
        get().loadSupplierPayments()
        get().loadSuppliers()
        return c
      },
      updateSupplierPayment: (id, data) => {
        const c = paymentService.update(id, data)
        get().loadSupplierPayments()
        get().loadSuppliers()
        return c
      },
      markPaymentAsFullyPaid: (id) => {
        const c = paymentService.markAsFullyPaid(id)
        get().loadSupplierPayments()
        get().loadSuppliers()
        return c
      },
      deleteSupplierPayment: (id) => {
        paymentService.delete(id)
        get().loadSupplierPayments()
        get().loadSuppliers()
      },
      getPOBalance: (purchaseOrderId) => paymentService.getPOBalance(purchaseOrderId),

      loadSupplierAdjustments: () => {
        set({ supplierAdjustments: adjustmentService.getAll().filter(a => !a.isDeleted) })
      },
      addSupplierAdjustment: (data) => {
        const c = adjustmentService.create(data)
        get().loadSupplierAdjustments()
        return c
      },
      updateSupplierAdjustment: (id, data) => {
        const c = adjustmentService.update(id, data)
        get().loadSupplierAdjustments()
        return c
      },
      deleteSupplierAdjustment: (id) => {
        adjustmentService.delete(id)
        get().loadSupplierAdjustments()
      },

      // Phase 4: Documents (new model – no isDeleted flag)
      loadSupplierDocuments: () => {
        set({ supplierDocuments: documentService.getAll() })
      },
      addSupplierDocument: (data) => {
        const c = documentService.create(data)
        get().loadSupplierDocuments()
        return c
      },
      updateSupplierDocument: (id, data) => {
        const c = documentService.update(id, data)
        get().loadSupplierDocuments()
        return c
      },
      deleteSupplierDocument: (id) => {
        documentService.delete(id)
        get().loadSupplierDocuments()
      },

      // Phase 4: Communications
      loadSupplierCommunications: () => {
        set({ supplierCommunications: communicationService.getAll().filter(c => !c.isDeleted) })
      },
      addSupplierCommunication: (data) => {
        const c = communicationService.create(data)
        get().loadSupplierCommunications()
        return c
      },
      updateSupplierCommunication: (id, data) => {
        const c = communicationService.update(id, data)
        get().loadSupplierCommunications()
        return c
      },
      deleteSupplierCommunication: (id) => {
        communicationService.delete(id)
        get().loadSupplierCommunications()
      },

      // Phase 4: Tasks
      loadSupplierTasks: () => {
        set({ supplierTasks: taskService.getAll().filter(t => !t.isDeleted) })
      },
      addSupplierTask: (data) => {
        const c = taskService.create(data)
        get().loadSupplierTasks()
        return c
      },
      updateSupplierTask: (id, data) => {
        const c = taskService.update(id, data)
        get().loadSupplierTasks()
        return c
      },
      markTaskComplete: (id) => {
        const c = taskService.markComplete(id)
        get().loadSupplierTasks()
        return c
      },
      deleteSupplierTask: (id) => {
        taskService.delete(id)
        get().loadSupplierTasks()
      },

      // Phase 5: Ratings
      loadSupplierRatings: () => {
        set({ supplierRatings: ratingService.getAll() })
      },
      upsertSupplierRating: (supplierId, data) => {
        const c = ratingService.upsert(supplierId, data)
        get().loadSupplierRatings()
        return c
      },
      getSupplierRating: (supplierId) => ratingService.getBySupplierId(supplierId),

      initializeData: () => {
        const { language, theme, loadGoods, loadAgents, loadNotifications, loadTemplates, loadSupplierTemplates, loadSuppliers, loadSupplierProducts, loadSupplierCategories, loadPurchaseOrders, loadPriceHistory, loadSupplierPayments, loadSupplierAdjustments, loadSupplierDocuments, loadSupplierCommunications, loadSupplierTasks, loadSupplierRatings } = get()
        document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr'
        document.documentElement.lang = language
        document.documentElement.classList.toggle('dark', theme === 'dark')
        loadGoods(); loadAgents(); loadNotifications(); loadTemplates()
        loadSuppliers(); loadSupplierProducts(); loadSupplierCategories(); loadSupplierTemplates()
        loadPurchaseOrders(); loadPriceHistory()
        loadSupplierPayments(); loadSupplierAdjustments()
        loadSupplierDocuments(); loadSupplierCommunications(); loadSupplierTasks()
        loadSupplierRatings()
      },

      resetData: () => {
        goodsService.reset(); agentService.reset()
        notificationService.reset(); templateService.reset(); supplierTemplateService.reset()
        currencyService.reset(); conversionHistoryService.clear(); calcRecordService.reset()
        supplierService.reset(); supplierProductService.reset(); supplierCategoryService.reset()
        purchaseOrderService.reset(); priceHistoryService.reset()
        paymentService.reset(); adjustmentService.reset()
        documentService.reset(); communicationService.reset(); taskService.reset()
        ratingService.reset()
        get().initializeData()
      },
    }),
    {
      name: 'cargobridge_settings',
      partialize: (state) => ({
        language: state.language, theme: state.theme,
        role: state.role, companyName: state.companyName,
        companyNameFr: state.companyNameFr, sidebarOpen: state.sidebarOpen,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) state.t = createT(state.language)
      },
    }
  )
)
