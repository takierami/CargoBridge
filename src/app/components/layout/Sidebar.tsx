import { NavLink } from 'react-router'
import {
  LayoutDashboard, Package, Users, ScanLine, Calculator,
  Settings, X, ChevronLeft, ChevronRight, Truck,
} from 'lucide-react'
import { useAppStore } from '../../../store/appStore'
import { cn } from '../../utils/cn'

export function Sidebar() {
  const { t, language, sidebarOpen, setSidebarOpen, role, companyName } = useAppStore()
  const isRTL = language === 'ar'

  const navItems = [
    { to: '/', icon: LayoutDashboard, label: t('nav.dashboard'), end: true },
    { to: '/goods', icon: Package, label: t('nav.goods') },
    { to: '/suppliers', icon: Truck, label: t('nav.suppliers') },
    { to: '/agents', icon: Users, label: t('nav.agents') },
    { to: '/scanner', icon: ScanLine, label: t('nav.scanner') },
    { to: '/calculator', icon: Calculator, label: t('nav.calculator') },
    { to: '/settings', icon: Settings, label: t('nav.settings') },
  ]

  return (
    <>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed lg:static inset-y-0 z-30 lg:z-auto flex flex-col',
          'bg-gray-900 dark:bg-gray-950 text-white transition-all duration-300',
          sidebarOpen ? 'w-64' : 'w-16',
          isRTL ? 'right-0' : 'left-0',
          !sidebarOpen && 'lg:flex hidden'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700 dark:border-gray-800 min-h-[64px]">
          {sidebarOpen && (
            <div className="flex items-center gap-2 overflow-hidden">
              <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center flex-shrink-0">
                <Package className="w-4 h-4 text-white" />
              </div>
              <div className="overflow-hidden">
                <p className="text-sm font-semibold truncate leading-tight">{companyName}</p>
                <p className="text-xs text-gray-400">
                  {role === 'china_admin' ? t('settings.roles.china_admin') : t('settings.roles.algeria_admin')}
                </p>
              </div>
            </div>
          )}
          {!sidebarOpen && (
            <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center mx-auto">
              <Package className="w-4 h-4 text-white" />
            </div>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="hidden lg:flex p-1 rounded hover:bg-gray-700 text-gray-400 hover:text-white transition-colors flex-shrink-0"
          >
            {isRTL
              ? (sidebarOpen ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />)
              : (sidebarOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />)
            }
          </button>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1 rounded hover:bg-gray-700 text-gray-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 overflow-y-auto">
          <ul className="space-y-1 px-2">
            {navItems.map(({ to, icon: Icon, label, end }) => (
              <li key={to}>
                <NavLink
                  to={to}
                  end={end}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150 group relative',
                      isActive
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-400 hover:bg-gray-700 hover:text-white',
                      !sidebarOpen && 'justify-center'
                    )
                  }
                >
                  <div className="relative flex-shrink-0">
                    <Icon className="w-5 h-5" />
                  </div>
                  {sidebarOpen && (
                    <span className="text-sm font-medium truncate">{label}</span>
                  )}
                  {!sidebarOpen && (
                    <div className={cn(
                      'absolute hidden group-hover:flex items-center px-2 py-1 bg-gray-800 text-white text-xs rounded shadow-lg whitespace-nowrap z-50',
                      isRTL ? 'right-full me-2' : 'left-full ms-2'
                    )}>
                      {label}
                    </div>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        {/* Footer */}
        {sidebarOpen && (
          <div className="p-4 border-t border-gray-700 dark:border-gray-800">
            <p className="text-xs text-gray-500 text-center">CargoBridge v1.0</p>
          </div>
        )}
      </aside>
    </>
  )
}
