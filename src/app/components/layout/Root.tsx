import { useEffect } from 'react'
import { Outlet } from 'react-router'
import { Toaster } from 'sonner'
import { useAppStore } from '../../../store/appStore'
import { Sidebar } from './Sidebar'
import { Header } from './Header'

export function Root() {
  const { language, theme, initializeData } = useAppStore()

  useEffect(() => {
    initializeData()
  }, [])

  useEffect(() => {
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr'
    document.documentElement.lang = language
  }, [language])

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [theme])

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
      <Toaster
        position={language === 'ar' ? 'bottom-left' : 'bottom-right'}
        richColors
        dir={language === 'ar' ? 'rtl' : 'ltr'}
      />
    </div>
  )
}
