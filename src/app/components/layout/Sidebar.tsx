import { useEffect, useRef } from 'react'
import { NavLink } from 'react-router'
import {
  LayoutDashboard, Package, Users, ScanLine, Calculator,
  Settings, X, ChevronLeft, ChevronRight, Truck, History,
} from 'lucide-react'
import { useAppStore } from '../../../store/appStore'
import { cn } from '../../utils/cn'
import { TOUCH_ICON_BTN } from '../ui/responsive'

export function Sidebar() {
  const {
    t,
    language,
    sidebarCollapsed,
    mobileNavOpen,
    setSidebarCollapsed,
    setMobileNavOpen,
    role,
    office,
    companyName,
  } = useAppStore()
  const isRTL = language === 'ar'
  const desktopExpanded = !sidebarCollapsed

  const navItems = [
    { to: '/dashboard', icon: LayoutDashboard, label: t('nav.dashboard'), end: true },
    { to: '/goods', icon: Package, label: t('nav.goods') },
    { to: '/suppliers', icon: Truck, label: t('nav.suppliers') },
    { to: '/agents', icon: Users, label: t('nav.agents') },
    { to: '/scanner', icon: ScanLine, label: t('nav.scanner') },
    { to: '/calculator', icon: Calculator, label: t('nav.calculator') },
    { to: '/history', icon: History, label: t('nav.history') },
    { to: '/settings', icon: Settings, label: t('nav.settings') },
  ]

  const closeBtnRef = useRef<HTMLButtonElement>(null)
  const asideRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)')
    const onChange = () => {
      if (mq.matches) setMobileNavOpen(false)
    }
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [setMobileNavOpen])

  useEffect(() => {
    if (!mobileNavOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileNavOpen(false)
      if (e.key === 'Tab' && asideRef.current) {
        const focusable = asideRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
        )
        if (!focusable.length) return
        const first = focusable[0]
        const last = focusable[focusable.length - 1]
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault()
          last.focus()
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeBtnRef.current?.focus()
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [mobileNavOpen, setMobileNavOpen])

  const closeMobile = () => setMobileNavOpen(false)

  return (
    <>
      {mobileNavOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/50 lg:hidden"
          onClick={closeMobile}
          aria-hidden
        />
      )}

      <aside
        ref={asideRef}
        id="app-sidebar"
        role={mobileNavOpen ? 'dialog' : undefined}
        aria-modal={mobileNavOpen ? true : undefined}
        aria-label={language === 'ar' ? 'القائمة' : 'Navigation'}
        className={cn(
          'fixed inset-y-0 z-30 flex flex-col bg-gray-900 text-white transition-transform duration-300 ease-out dark:bg-gray-950',
          'lg:static lg:z-auto lg:translate-x-0 lg:transition-[width] lg:duration-300',
          desktopExpanded ? 'lg:w-64' : 'lg:w-16',
          'w-64',
          isRTL ? 'right-0' : 'left-0',
          isRTL
            ? mobileNavOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'
            : mobileNavOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
        )}
      >
        <div className="flex min-h-16 items-center justify-between border-b border-gray-700 p-4 dark:border-gray-800 pt-[max(1rem,env(safe-area-inset-top))]">
          <div className={cn('flex min-w-0 items-center gap-2 overflow-hidden', !desktopExpanded && 'lg:hidden')}>
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-blue-500">
              <Package className="h-4 w-4 text-white" />
            </div>
            <div className="min-w-0 overflow-hidden">
              <p className="truncate text-sm font-semibold leading-tight">{companyName}</p>
              <p className="text-xs text-gray-400">
                {t(`settings.roles.${role}`)} · {office === 'algeria' ? t('settings.offices.algeria') : t('settings.offices.china')}
              </p>
            </div>
          </div>
          {!desktopExpanded && (
            <div className="mx-auto hidden h-8 w-8 items-center justify-center rounded-lg bg-blue-500 lg:flex">
              <Package className="h-4 w-4 text-white" />
            </div>
          )}
          <button
            type="button"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className={cn(TOUCH_ICON_BTN, 'hidden flex-shrink-0 text-gray-400 hover:bg-gray-700 hover:text-white lg:flex')}
            aria-label={desktopExpanded ? 'Collapse sidebar' : 'Expand sidebar'}
          >
            {isRTL
              ? (desktopExpanded ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />)
              : (desktopExpanded ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />)}
          </button>
          <button
            ref={closeBtnRef}
            type="button"
            onClick={closeMobile}
            className={cn(TOUCH_ICON_BTN, 'text-gray-400 hover:bg-gray-700 hover:text-white lg:hidden')}
            aria-label={language === 'ar' ? 'إغلاق القائمة' : 'Close menu'}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-4">
          <ul className="space-y-1 px-2">
            {navItems.map(({ to, icon: Icon, label, end }) => (
              <li key={to}>
                <NavLink
                  to={to}
                  end={end}
                  onClick={closeMobile}
                  className={({ isActive }) =>
                    cn(
                      'group relative flex min-h-11 items-center gap-3 rounded-lg px-3 py-2.5 transition-all duration-150',
                      isActive
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-400 hover:bg-gray-700 hover:text-white',
                      !desktopExpanded && 'lg:justify-center',
                    )
                  }
                >
                  <Icon className="h-5 w-5 flex-shrink-0" />
                  <span className={cn('truncate text-sm font-medium', !desktopExpanded && 'lg:hidden')}>
                    {label}
                  </span>
                  {!desktopExpanded && (
                    <div
                      className={cn(
                        'absolute z-50 hidden items-center whitespace-nowrap rounded bg-gray-800 px-2 py-1 text-xs text-white shadow-lg group-hover:lg:flex',
                        isRTL ? 'right-full me-2' : 'left-full ms-2',
                      )}
                    >
                      {label}
                    </div>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className={cn('border-t border-gray-700 p-4 dark:border-gray-800', !desktopExpanded && 'lg:hidden')}>
          <p className="text-center text-xs text-gray-500">CargoBridge v1.0</p>
        </div>
      </aside>
    </>
  )
}
