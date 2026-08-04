import { Outlet } from 'react-router'
import { Toaster } from 'sonner'
import { useAppStore } from '../../../store/appStore'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { BottomTabBar } from './BottomTabBar'

export function Root() {
  const { language, isDataLoading, dataError } = useAppStore()

  return (
    <div className="flex h-dvh min-h-dvh overflow-hidden bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto overscroll-contain pb-[calc(4.5rem+env(safe-area-inset-bottom))] lg:pb-[env(safe-area-inset-bottom)]">
          {isDataLoading ? (
            <div className="flex h-full items-center justify-center text-gray-500">
              {language === 'ar' ? 'جاري تحميل البيانات...' : 'Chargement des données...'}
            </div>
          ) : dataError ? (
            <div className="flex h-full items-center justify-center p-4 text-center text-red-500">
              {dataError}
            </div>
          ) : (
            <Outlet />
          )}
        </main>
        <BottomTabBar />
      </div>
      <Toaster
        position={language === 'ar' ? 'bottom-left' : 'bottom-right'}
        richColors
        dir={language === 'ar' ? 'rtl' : 'ltr'}
        offset="calc(4.75rem + env(safe-area-inset-bottom))"
        mobileOffset="calc(4.75rem + env(safe-area-inset-bottom))"
      />
    </div>
  )
}
