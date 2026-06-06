import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Agent, Goods, Notification, DocumentTemplate, Language, Theme, UserRole, TemplateType } from '../types'
import { goodsService } from '../services/goodsService'
import { agentService } from '../services/agentService'
import { notificationService } from '../services/notificationService'
import { templateService } from '../services/templateService'
import { currencyService, conversionHistoryService, calcRecordService } from '../services/currencyService'
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

      initializeData: () => {
        const { language, theme, loadGoods, loadAgents, loadNotifications, loadTemplates } = get()
        document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr'
        document.documentElement.lang = language
        document.documentElement.classList.toggle('dark', theme === 'dark')
        loadGoods(); loadAgents(); loadNotifications(); loadTemplates()
      },

      resetData: () => {
        goodsService.reset(); agentService.reset()
        notificationService.reset(); templateService.reset()
        currencyService.reset(); conversionHistoryService.clear(); calcRecordService.reset()
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
