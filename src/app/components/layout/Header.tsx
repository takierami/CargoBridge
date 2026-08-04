import { useState } from 'react'
import { Bell, Menu, Sun, Moon, Globe, ChevronDown, Check, LogOut, ArrowLeft, ArrowRight } from 'lucide-react'
import { useNavigate } from 'react-router'
import { useAppStore } from '../../../store/appStore'
import { useAuthStore } from '../../../store/authStore'
import { cn } from '../../utils/cn'
import { formatDistanceToNow } from '../../../utils/dateUtils'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '../ui/alert-dialog'

export function Header() {
  const navigate = useNavigate()
  const logout = useAuthStore((s) => s.logout)
  const {
    t, language, theme, role, office, companyName,
    setLanguage, setTheme,
    notifications, markNotificationRead, markAllNotificationsRead,
    mobileNavOpen, toggleMobileNav,
  } = useAppStore()

  const roleLabel = t(`settings.roles.${role}`) || role
  const officeLabel = office === 'algeria' ? t('settings.offices.algeria') : t('settings.offices.china')

  const [showNotifications, setShowNotifications] = useState(false)
  const [showLangMenu, setShowLangMenu] = useState(false)

  const unread = notifications.filter((n) => !n.read).length
  const isRTL = language === 'ar'
  const BackIcon = isRTL ? ArrowRight : ArrowLeft

  const goBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      navigate(-1)
      return
    }
    navigate('/dashboard')
  }

  const handleLogoutConfirm = async () => {
    await logout()
    navigate('/login')
  }

  const notifTypeColors: Record<string, string> = {
    goods: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
    agent: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
    chat: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
    system: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
  }

  return (
    <header className="relative z-10 flex min-h-16 items-center justify-between gap-3 border-b border-gray-200 bg-white px-4 dark:border-gray-700 dark:bg-gray-900 lg:px-6 pt-[env(safe-area-inset-top)]">
      <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
        <button
          type="button"
          onClick={toggleMobileNav}
          className="min-h-11 min-w-11 rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 lg:hidden"
          aria-expanded={mobileNavOpen}
          aria-controls="app-sidebar"
          aria-label={language === 'ar' ? 'فتح القائمة' : 'Open menu'}
        >
          <Menu className="h-5 w-5" />
        </button>
        <button
          type="button"
          onClick={goBack}
          className="min-h-11 min-w-11 rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
          aria-label={t('common.back')}
          title={t('common.back')}
        >
          <BackIcon className="h-5 w-5" />
        </button>
        <div className="min-w-0">
          <h1 className="truncate text-base font-semibold leading-tight text-gray-900 dark:text-white sm:text-lg">
            {companyName}
          </h1>
          <p className="truncate text-xs text-gray-500 dark:text-gray-400">
            {roleLabel} · {officeLabel}
          </p>
        </div>
      </div>

      <div className="flex flex-shrink-0 items-center gap-1 sm:gap-2">
        <div className="relative">
          <button
            type="button"
            onClick={() => { setShowLangMenu(!showLangMenu); setShowNotifications(false) }}
            className="flex min-h-11 items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            <Globe className="h-4 w-4" />
            <span className="hidden font-medium sm:inline">{language === 'ar' ? 'ع' : 'Fr'}</span>
            <ChevronDown className="h-3 w-3" />
          </button>
          {showLangMenu && (
            <div className={cn(
              'absolute top-full z-50 mt-1 w-36 rounded-xl border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-700 dark:bg-gray-800',
              isRTL ? 'left-0' : 'right-0',
            )}>
              {(['ar', 'fr'] as const).map((lang) => (
                <button
                  key={lang}
                  type="button"
                  onClick={() => { setLanguage(lang); setShowLangMenu(false) }}
                  className="flex w-full items-center justify-between px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700"
                >
                  <span>{lang === 'ar' ? 'العربية' : 'Français'}</span>
                  {language === lang && <Check className="h-3.5 w-3.5 text-blue-500" />}
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
          className="min-h-11 min-w-11 rounded-lg p-2 text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
          aria-label={theme === 'light' ? 'Dark mode' : 'Light mode'}
        >
          {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
        </button>

        <div className="relative">
          <button
            type="button"
            onClick={() => { setShowNotifications(!showNotifications); setShowLangMenu(false) }}
            className="relative min-h-11 min-w-11 rounded-lg p-2 text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
            aria-label={t('notifications.title')}
          >
            <Bell className="h-4 w-4" />
            {unread > 0 && (
              <span className="absolute end-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                {unread}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className={cn(
              'absolute top-full z-50 mt-1 w-[min(20rem,calc(100vw-2rem))] overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl dark:border-gray-700 dark:bg-gray-800',
              isRTL ? 'left-0' : 'right-0',
            )}>
              <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3 dark:border-gray-700">
                <span className="text-sm font-semibold text-gray-900 dark:text-white">{t('notifications.title')}</span>
                {unread > 0 && (
                  <button
                    type="button"
                    onClick={markAllNotificationsRead}
                    className="text-xs text-blue-500 hover:text-blue-600"
                  >
                    {t('notifications.markAllRead')}
                  </button>
                )}
              </div>
              <div className="max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                  <p className="py-8 text-center text-sm text-gray-500">{t('notifications.noNotifications')}</p>
                ) : (
                  notifications.slice(0, 8).map((n) => (
                    <div
                      key={n.id}
                      onClick={() => markNotificationRead(n.id)}
                      className={cn(
                        'cursor-pointer border-b border-gray-100 px-4 py-3 last:border-0 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-750',
                        !n.read && 'bg-blue-50 dark:bg-blue-950/30',
                      )}
                    >
                      <div className="flex items-start gap-2">
                        <span className={cn('mt-0.5 flex-shrink-0 rounded-full px-1.5 py-0.5 text-xs font-medium', notifTypeColors[n.type])}>
                          {t(`notifications.types.${n.type}`)}
                        </span>
                        {!n.read && (
                          <div className="ms-auto mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-blue-500" />
                        )}
                      </div>
                      <p className="mt-1 text-sm font-medium text-gray-900 dark:text-white">
                        {language === 'ar' ? n.titleAr : n.titleFr}
                      </p>
                      <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                        {language === 'ar' ? n.messageAr : n.messageFr}
                      </p>
                      <p className="mt-1 text-xs text-gray-400">
                        {formatDistanceToNow(n.timestamp, language)}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <button
              type="button"
              className="min-h-11 min-w-11 rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
              title={language === 'ar' ? 'تسجيل الخروج' : 'Déconnexion'}
              aria-label={language === 'ar' ? 'تسجيل الخروج' : 'Déconnexion'}
            >
              <LogOut className="h-4 w-4" />
            </button>
          </AlertDialogTrigger>
          <AlertDialogContent dir={isRTL ? 'rtl' : 'ltr'}>
            <AlertDialogHeader>
              <AlertDialogTitle>{t('common.logoutConfirmTitle')}</AlertDialogTitle>
              <AlertDialogDescription>
                {t('common.logoutConfirmDescription')}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
              <AlertDialogAction onClick={handleLogoutConfirm}>
                {t('common.confirm')}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <div className="hidden h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white sm:flex">
          {office === 'algeria' ? 'ج' : 'ص'}
        </div>
      </div>

      {(showNotifications || showLangMenu) && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => { setShowNotifications(false); setShowLangMenu(false) }}
        />
      )}
    </header>
  )
}
