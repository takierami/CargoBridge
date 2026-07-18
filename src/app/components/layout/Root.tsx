import { Outlet } from 'react-router'
import { Toaster } from 'sonner'
import { useAppStore } from '../../../store/appStore'
import { Sidebar } from './Sidebar'
import { Header } from './Header'

export function Root() {
  const { language, theme, isDataLoading, dataError } = useAppStore()

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto">
          {isDataLoading ? (
            <div className="flex items-center justify-center h-full text-gray-500">
              {language === 'ar' ? 'جاري تحميل البيانات...' : 'Chargement des données...'}
            </div>
          ) : dataError ? (
            <div className="flex items-center justify-center h-full text-red-500 p-4 text-center">
              {dataError}
            </div>
          ) : (
            <Outlet />
          )}
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
