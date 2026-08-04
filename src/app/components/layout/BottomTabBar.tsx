import { NavLink } from 'react-router'
import { Home, Package, ScanLine, Building2, MoreHorizontal } from 'lucide-react'
import { useAppStore } from '../../../store/appStore'
import { cn } from '../../utils/cn'

const TABS = [
  { to: '/dashboard', end: true, icon: Home, labelAr: 'الرئيسية', labelFr: 'Accueil' },
  { to: '/goods', end: false, icon: Package, labelAr: 'البضائع', labelFr: 'Marchandises' },
  { to: '/scanner', end: false, icon: ScanLine, labelAr: 'مسح', labelFr: 'Scanner' },
  { to: '/suppliers', end: false, icon: Building2, labelAr: 'الموردون', labelFr: 'Fournisseurs' },
] as const

/** Phone-only sticky tabs. "More" opens the existing sidebar drawer. */
export function BottomTabBar() {
  const { language, toggleMobileNav } = useAppStore()
  const isFr = language === 'fr'

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-30 border-t border-gray-200 bg-white/95 backdrop-blur dark:border-gray-700 dark:bg-gray-900/95 lg:hidden pb-[env(safe-area-inset-bottom)]"
      aria-label={isFr ? 'Navigation principale' : 'التنقل الرئيسي'}
    >
      <div className="flex h-14 items-stretch justify-around px-1">
        {TABS.map(({ to, end, icon: Icon, labelAr, labelFr }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              cn(
                'flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 px-1 text-[10px] font-medium transition-colors',
                isActive
                  ? 'text-blue-600 dark:text-blue-400'
                  : 'text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200',
              )
            }
          >
            <Icon className="h-5 w-5 shrink-0" aria-hidden />
            <span className="truncate max-w-full">{isFr ? labelFr : labelAr}</span>
          </NavLink>
        ))}
        <button
          type="button"
          onClick={toggleMobileNav}
          className="flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 px-1 text-[10px] font-medium text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
        >
          <MoreHorizontal className="h-5 w-5 shrink-0" aria-hidden />
          <span className="truncate max-w-full">{isFr ? 'Plus' : 'المزيد'}</span>
        </button>
      </div>
    </nav>
  )
}
