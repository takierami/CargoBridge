import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type {
  Agent, Goods, Notification, DocumentTemplate, Language, Theme, UserRole,
  TemplateType, Supplier, SupplierProduct, SupplierCategoryEntity, PurchaseOrder,
  PurchaseOrderItem, PriceHistoryEntry, POStatus, SupplierPayment, SupplierAdjustment,
  SupplierAdjustmentInput, SupplierDocument, SupplierCommunication, SupplierTask,
  SupplierRating, SupplierDocumentTemplate,
} from '../types'
import { fetchBootstrap } from '../lib/apiClient'
import { goodsService } from '../services/goodsService'
import { agentService } from '../services/agentService'
import { notificationService } from '../services/notificationService'
import { templateService } from '../services/templateService'
import { supplierTemplateService } from '../services/supplierTemplateService'
import { setCurrencyCache, setConversionCache, setCalcCache } from '../services/currencyService'
import { supplierService, supplierProductService } from '../services/supplierService'
import { supplierCategoryService } from '../services/supplierCategoryService'
import { purchaseOrderService, priceHistoryService } from '../services/purchaseOrderService'
import { paymentService, adjustmentService } from '../services/paymentService'
import { documentService } from '../services/documentService'
import { communicationService } from '../services/communicationService'
import { taskService } from '../services/taskService'
import { ratingService } from '../services/ratingService'
import { createT, type TFunction } from '../locales'
import type { Currency, ConversionRecord, CalculatorRecord } from '../types'

interface AppStore {
  language: Language
  theme: Theme
  role: UserRole
  office: import('../types').UserOffice
  companyName: string
  companyNameFr: string
  /** Desktop rail collapsed (persisted). */
  sidebarCollapsed: boolean
  /** Mobile drawer open (ephemeral, not persisted). */
  mobileNavOpen: boolean
  isDataLoading: boolean
  dataError: string | null

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
  setOffice: (office: import('../types').UserOffice) => void
  setCompanyName: (name: string) => void
  setCompanyNameFr: (name: string) => void
  clearTenantState: () => void
  toggleSidebarCollapsed: () => void
  setSidebarCollapsed: (collapsed: boolean) => void
  setMobileNavOpen: (open: boolean) => void
  toggleMobileNav: () => void

  loadGoods: () => Promise<void>
  addGoods: (data: Omit<Goods, 'id' | 'createdAt' | 'trackingNumber'>) => Promise<Goods>
  updateGoods: (id: string, data: Partial<Goods>) => Promise<void>
  updateGoodsStatus: (id: string, newStatus: Goods['status']) => Promise<{ success: boolean; error?: string }>
  deleteGoods: (id: string) => Promise<void>

  loadAgents: () => Promise<void>
  addAgent: (data: Omit<Agent, 'id' | 'createdAt'>) => Promise<Agent>
  updateAgent: (id: string, data: Partial<Agent>) => Promise<void>
  deleteAgent: (id: string) => Promise<void>

  loadNotifications: () => Promise<void>
  markNotificationRead: (id: string) => Promise<void>
  markAllNotificationsRead: () => Promise<void>

  loadTemplates: () => Promise<void>
  addTemplate: (data: Omit<DocumentTemplate, 'id' | 'createdAt' | 'updatedAt'>) => Promise<DocumentTemplate>
  updateTemplate: (id: string, data: Partial<DocumentTemplate>) => Promise<void>
  deleteTemplate: (id: string) => Promise<void>
  duplicateTemplate: (id: string) => Promise<DocumentTemplate | null>
  setDefaultTemplate: (id: string, type: TemplateType) => Promise<void>
  getDefaultTemplate: (type: TemplateType) => DocumentTemplate | undefined

  loadSupplierTemplates: () => Promise<void>
  addSupplierTemplate: (data: Omit<SupplierDocumentTemplate, 'id' | 'createdAt'>) => Promise<SupplierDocumentTemplate>
  updateSupplierTemplate: (id: string, data: Partial<SupplierDocumentTemplate>) => Promise<SupplierDocumentTemplate | null>
  deleteSupplierTemplate: (id: string) => Promise<void>
  duplicateSupplierTemplate: (id: string) => Promise<SupplierDocumentTemplate>

  loadSuppliers: () => Promise<void>
  addSupplier: (data: Omit<Supplier, 'id' | 'code' | 'createdAt' | 'updatedAt'>) => Promise<Supplier>
  updateSupplier: (id: string, data: Partial<Supplier>) => Promise<void>
  deleteSupplier: (id: string) => Promise<void>

  loadSupplierProducts: () => Promise<void>
  addSupplierProduct: (data: Omit<SupplierProduct, 'id' | 'createdAt' | 'updatedAt'>) => Promise<SupplierProduct>
  updateSupplierProduct: (id: string, data: Partial<SupplierProduct>) => Promise<void>
  deleteSupplierProduct: (id: string) => Promise<void>

  loadSupplierCategories: () => Promise<void>
  addSupplierCategory: (data: Omit<SupplierCategoryEntity, 'id' | 'createdAt'>) => Promise<SupplierCategoryEntity>
  updateSupplierCategory: (id: string, data: Partial<SupplierCategoryEntity>) => Promise<void>
  deleteSupplierCategory: (id: string) => Promise<void>

  loadPurchaseOrders: () => Promise<void>
  addPurchaseOrder: (data: Omit<PurchaseOrder, 'id' | 'poNumber' | 'totalAmount' | 'isDeleted' | 'createdAt' | 'updatedAt'> & { items?: Omit<PurchaseOrderItem, 'id' | 'purchaseOrderId' | 'createdAt' | 'updatedAt'>[] }) => Promise<PurchaseOrder>
  updatePurchaseOrder: (id: string, data: Partial<PurchaseOrder> & { items?: (Partial<PurchaseOrderItem> & { id?: string })[] }) => Promise<PurchaseOrder | null>
  updatePurchaseOrderStatus: (id: string, newStatus: POStatus) => Promise<{ success: boolean; error?: string }>
  deletePurchaseOrder: (id: string) => Promise<void>

  loadPriceHistory: () => Promise<void>

  loadSupplierPayments: () => Promise<void>
  addSupplierPayment: (data: Omit<SupplierPayment, 'id' | 'paymentNumber' | 'isDeleted' | 'createdAt' | 'updatedAt'>) => Promise<SupplierPayment>
  updateSupplierPayment: (id: string, data: Partial<SupplierPayment>) => Promise<SupplierPayment | null>
  markPaymentAsFullyPaid: (id: string) => Promise<SupplierPayment | null>
  deleteSupplierPayment: (id: string) => Promise<void>
  getPOBalance: (purchaseOrderId: string) => Promise<{ total: number; paid: number; remaining: number }>

  loadSupplierAdjustments: () => Promise<void>
  addSupplierAdjustment: (data: SupplierAdjustmentInput) => Promise<SupplierAdjustment>
  updateSupplierAdjustment: (id: string, data: Partial<SupplierAdjustment>) => Promise<SupplierAdjustment | null>
  deleteSupplierAdjustment: (id: string) => Promise<void>

  loadSupplierDocuments: () => Promise<void>
  addSupplierDocument: (data: Omit<SupplierDocument, 'id' | 'uploadedAt'>) => Promise<SupplierDocument>
  updateSupplierDocument: (id: string, data: Partial<SupplierDocument>) => Promise<SupplierDocument | null>
  deleteSupplierDocument: (id: string) => Promise<void>

  loadSupplierCommunications: () => Promise<void>
  addSupplierCommunication: (data: Omit<SupplierCommunication, 'id' | 'isDeleted' | 'createdAt' | 'updatedAt'>) => Promise<SupplierCommunication>
  updateSupplierCommunication: (id: string, data: Partial<SupplierCommunication>) => Promise<SupplierCommunication | null>
  deleteSupplierCommunication: (id: string) => Promise<void>

  loadSupplierTasks: () => Promise<void>
  addSupplierTask: (data: Omit<SupplierTask, 'id' | 'isDeleted' | 'createdAt' | 'updatedAt'>) => Promise<SupplierTask>
  updateSupplierTask: (id: string, data: Partial<SupplierTask>) => Promise<SupplierTask | null>
  markTaskComplete: (id: string) => Promise<SupplierTask | null>
  deleteSupplierTask: (id: string) => Promise<void>

  loadSupplierRatings: () => Promise<void>
  upsertSupplierRating: (supplierId: string, data: Omit<SupplierRating, 'id' | 'supplierId' | 'overall' | 'ratedAt' | 'createdAt' | 'updatedAt'>) => Promise<SupplierRating>
  getSupplierRating: (supplierId: string) => SupplierRating | undefined

  initializeData: () => Promise<void>
  resetData: () => Promise<void>
}

export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      language: 'ar',
      theme: 'light',
      role: 'admin',
      office: 'china',
      companyName: 'كارغو بريدج',
      companyNameFr: 'CargoBridge',
      sidebarCollapsed: false,
      mobileNavOpen: false,
      isDataLoading: false,
      dataError: null,
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
      setOffice: (office) => set({ office }),
      setCompanyName: (companyName) => set({ companyName }),
      setCompanyNameFr: (companyNameFr) => set({ companyNameFr }),
      clearTenantState: () => set({
        role: 'admin',
        office: 'china',
        companyName: '',
        companyNameFr: '',
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
        dataError: null,
        isDataLoading: false,
        mobileNavOpen: false,
      }),
      toggleSidebarCollapsed: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      setSidebarCollapsed: (sidebarCollapsed) => set({ sidebarCollapsed }),
      setMobileNavOpen: (mobileNavOpen) => set({ mobileNavOpen }),
      toggleMobileNav: () => set((s) => ({ mobileNavOpen: !s.mobileNavOpen })),

      loadGoods: async () => set({ goods: await goodsService.getAll() }),
      addGoods: async (data) => { const c = await goodsService.create(data); await get().loadGoods(); return c },
      updateGoods: async (id, data) => { await goodsService.update(id, data); await get().loadGoods() },
      updateGoodsStatus: async (id, newStatus) => {
        const result = await goodsService.updateStatus(id, newStatus)
        if (result.success) {
          await get().loadGoods()
          await get().loadAgents()
        }
        return result
      },
      deleteGoods: async (id) => { await goodsService.delete(id); await get().loadGoods() },

      loadAgents: async () => set({ agents: await agentService.getAll() }),
      addAgent: async (data) => { const c = await agentService.create(data); await get().loadAgents(); return c },
      updateAgent: async (id, data) => { await agentService.update(id, data); await get().loadAgents() },
      deleteAgent: async (id) => { await agentService.delete(id); await get().loadAgents() },

      loadNotifications: async () => set({ notifications: await notificationService.getAll() }),
      markNotificationRead: async (id) => { await notificationService.markRead(id); await get().loadNotifications() },
      markAllNotificationsRead: async () => { await notificationService.markAllRead(); await get().loadNotifications() },

      loadTemplates: async () => set({ templates: await templateService.getAll() }),
      addTemplate: async (data) => { const c = await templateService.create(data); await get().loadTemplates(); return c },
      updateTemplate: async (id, data) => { await templateService.update(id, data); await get().loadTemplates() },
      deleteTemplate: async (id) => { await templateService.delete(id); await get().loadTemplates() },
      duplicateTemplate: async (id) => { const c = await templateService.duplicate(id); await get().loadTemplates(); return c },
      setDefaultTemplate: async (id, type) => { await templateService.setDefault(id, type); await get().loadTemplates() },
      getDefaultTemplate: (type) => get().templates.find((t) => t.type === type && t.isDefault),

      loadSupplierTemplates: async () => set({ supplierTemplates: await supplierTemplateService.getAll() }),
      addSupplierTemplate: async (data) => { const c = await supplierTemplateService.create(data); await get().loadSupplierTemplates(); return c },
      updateSupplierTemplate: async (id, data) => { const c = await supplierTemplateService.update(id, data); await get().loadSupplierTemplates(); return c },
      deleteSupplierTemplate: async (id) => { await supplierTemplateService.delete(id); await get().loadSupplierTemplates() },
      duplicateSupplierTemplate: async (id) => { const c = await supplierTemplateService.duplicate(id); await get().loadSupplierTemplates(); return c },

      loadSuppliers: async () => set({ suppliers: await supplierService.getAll() }),
      addSupplier: async (data) => { const c = await supplierService.create(data); await get().loadSuppliers(); return c },
      updateSupplier: async (id, data) => { await supplierService.update(id, data); await get().loadSuppliers() },
      deleteSupplier: async (id) => { await supplierService.delete(id); await get().loadSuppliers() },

      loadSupplierProducts: async () => set({ supplierProducts: await supplierProductService.getAll() }),
      addSupplierProduct: async (data) => { const c = await supplierProductService.create(data); await get().loadSupplierProducts(); return c },
      updateSupplierProduct: async (id, data) => { await supplierProductService.update(id, data); await get().loadSupplierProducts() },
      deleteSupplierProduct: async (id) => { await supplierProductService.delete(id); await get().loadSupplierProducts() },

      loadSupplierCategories: async () => set({ supplierCategories: await supplierCategoryService.getAll() }),
      addSupplierCategory: async (data) => { const c = await supplierCategoryService.create(data); await get().loadSupplierCategories(); return c },
      updateSupplierCategory: async (id, data) => { await supplierCategoryService.update(id, data); await get().loadSupplierCategories() },
      deleteSupplierCategory: async (id) => { await supplierCategoryService.delete(id); await get().loadSupplierCategories() },

      loadPurchaseOrders: async () => {
        const orders = await purchaseOrderService.getAll()
        set({
          purchaseOrders: orders.filter((po) => !po.isDeleted),
          purchaseOrderItems: await purchaseOrderService.getAllItems(),
        })
      },
      addPurchaseOrder: async (data) => {
        const c = await purchaseOrderService.create(data)
        await get().loadPurchaseOrders()
        await get().loadSuppliers()
        return c
      },
      updatePurchaseOrder: async (id, data) => {
        const c = await purchaseOrderService.update(id, data)
        await get().loadPurchaseOrders()
        await get().loadSuppliers()
        return c
      },
      updatePurchaseOrderStatus: async (id, newStatus) => {
        const result = await purchaseOrderService.updateStatus(id, newStatus)
        if (result.success) {
          await get().loadPurchaseOrders()
          await get().loadPriceHistory()
          await get().loadSuppliers()
        }
        return { success: result.success, error: result.error }
      },
      deletePurchaseOrder: async (id) => {
        await purchaseOrderService.delete(id)
        await get().loadPurchaseOrders()
        await get().loadSuppliers()
      },

      loadPriceHistory: async () => set({ priceHistory: await priceHistoryService.getAll() }),

      loadSupplierPayments: async () => set({ supplierPayments: await paymentService.getAll() }),
      addSupplierPayment: async (data) => {
        const c = await paymentService.create(data)
        await get().loadSupplierPayments()
        await get().loadSuppliers()
        return c
      },
      updateSupplierPayment: async (id, data) => {
        const c = await paymentService.update(id, data)
        await get().loadSupplierPayments()
        await get().loadSuppliers()
        return c
      },
      markPaymentAsFullyPaid: async (id) => {
        const c = await paymentService.markAsFullyPaid(id)
        await get().loadSupplierPayments()
        await get().loadSuppliers()
        return c
      },
      deleteSupplierPayment: async (id) => {
        await paymentService.delete(id)
        await get().loadSupplierPayments()
        await get().loadSuppliers()
      },
      getPOBalance: (purchaseOrderId) => paymentService.getPOBalance(purchaseOrderId),

      loadSupplierAdjustments: async () => set({ supplierAdjustments: await adjustmentService.getAll() }),
      addSupplierAdjustment: async (data) => {
        const c = await adjustmentService.create(data)
        await get().loadSupplierAdjustments()
        await get().loadSuppliers()
        return c
      },
      updateSupplierAdjustment: async (id, data) => {
        const c = await adjustmentService.update(id, data)
        await get().loadSupplierAdjustments()
        await get().loadSuppliers()
        return c
      },
      deleteSupplierAdjustment: async (id) => {
        await adjustmentService.delete(id)
        await get().loadSupplierAdjustments()
        await get().loadSuppliers()
      },

      loadSupplierDocuments: async () => set({ supplierDocuments: await documentService.getAll() }),
      addSupplierDocument: async (data) => {
        const c = await documentService.create(data)
        await get().loadSupplierDocuments()
        return c
      },
      updateSupplierDocument: async (id, data) => {
        const c = await documentService.update(id, data)
        await get().loadSupplierDocuments()
        return c
      },
      deleteSupplierDocument: async (id) => {
        await documentService.delete(id)
        await get().loadSupplierDocuments()
      },

      loadSupplierCommunications: async () => set({ supplierCommunications: await communicationService.getAll() }),
      addSupplierCommunication: async (data) => {
        const c = await communicationService.create(data)
        await get().loadSupplierCommunications()
        return c
      },
      updateSupplierCommunication: async (id, data) => {
        const c = await communicationService.update(id, data)
        await get().loadSupplierCommunications()
        return c
      },
      deleteSupplierCommunication: async (id) => {
        await communicationService.delete(id)
        await get().loadSupplierCommunications()
      },

      loadSupplierTasks: async () => set({ supplierTasks: await taskService.getAll() }),
      addSupplierTask: async (data) => {
        const c = await taskService.create(data)
        await get().loadSupplierTasks()
        return c
      },
      updateSupplierTask: async (id, data) => {
        const c = await taskService.update(id, data)
        await get().loadSupplierTasks()
        return c
      },
      markTaskComplete: async (id) => {
        const c = await taskService.markComplete(id)
        await get().loadSupplierTasks()
        return c
      },
      deleteSupplierTask: async (id) => {
        await taskService.delete(id)
        await get().loadSupplierTasks()
      },

      loadSupplierRatings: async () => set({ supplierRatings: await ratingService.getAll() }),
      upsertSupplierRating: async (supplierId, data) => {
        const c = await ratingService.upsert(supplierId, data)
        await get().loadSupplierRatings()
        return c
      },
      getSupplierRating: (supplierId) => get().supplierRatings.find((r) => r.supplierId === supplierId),

      initializeData: async () => {
        const { language, theme } = get()
        document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr'
        document.documentElement.lang = language
        document.documentElement.classList.toggle('dark', theme === 'dark')
        set({ isDataLoading: true, dataError: null })
        try {
          const data = await fetchBootstrap()
          setCurrencyCache(data.currencies as Currency[])
          setConversionCache(data.conversionRecords as ConversionRecord[])
          setCalcCache(data.calculatorRecords as CalculatorRecord[])
          set({
            goods: data.goods as Goods[],
            agents: data.agents as Agent[],
            notifications: data.notifications as Notification[],
            templates: data.templates as DocumentTemplate[],
            supplierTemplates: data.supplierTemplates as SupplierDocumentTemplate[],
            suppliers: data.suppliers as Supplier[],
            supplierProducts: data.supplierProducts as SupplierProduct[],
            supplierCategories: data.supplierCategories as SupplierCategoryEntity[],
            purchaseOrders: data.purchaseOrders as PurchaseOrder[],
            purchaseOrderItems: data.purchaseOrderItems as PurchaseOrderItem[],
            priceHistory: data.priceHistory as PriceHistoryEntry[],
            supplierPayments: data.supplierPayments as SupplierPayment[],
            supplierAdjustments: data.supplierAdjustments as SupplierAdjustment[],
            supplierDocuments: data.supplierDocuments as SupplierDocument[],
            supplierCommunications: data.supplierCommunications as SupplierCommunication[],
            supplierTasks: data.supplierTasks as SupplierTask[],
            supplierRatings: data.supplierRatings as SupplierRating[],
            companyName: data.organization.name,
            companyNameFr: data.organization.nameFr,
            role: (data.user.profile.role as UserRole) || get().role,
            office: (data.user.profile.office as import('../types').UserOffice) || get().office,
            isDataLoading: false,
          })
        } catch (e) {
          set({
            isDataLoading: false,
            dataError: e instanceof Error ? e.message : 'Failed to load data',
          })
        }
      },

      resetData: async () => {
        await goodsService.reset()
        await get().initializeData()
      },
    }),
    {
      name: 'cargobridge_settings',
      partialize: (state) => ({
        language: state.language,
        theme: state.theme,
        companyName: state.companyName,
        companyNameFr: state.companyNameFr,
        sidebarCollapsed: state.sidebarCollapsed,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) state.t = createT(state.language)
      },
    },
  ),
)
