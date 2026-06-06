import { useState } from 'react'
import { Bell, Menu, Sun, Moon, Globe, ChevronDown, Check } from 'lucide-react'
import { useAppStore } from '../../../store/appStore'
import { cn } from '../../utils/cn'
import { formatDistanceToNow } from '../../../utils/dateUtils'

export function Header() {
  const {
    t, language, theme, role, companyName,
    setLanguage, setTheme,
    notifications, markNotificationRead, markAllNotificationsRead,
    setSidebarOpen, sidebarOpen,
  } = useAppStore()

  const [showNotifications, setShowNotifications] = useState(false)
  const [showLangMenu, setShowLangMenu] = useState(false)

  const unread = notifications.filter((n) => !n.read).length
  const isRTL = language === 'ar'

  const notifTypeColors: Record<string, string> = {
    goods: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
    agent: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
    chat: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
    system: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
  }

  return (
    <header className="h-16 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-4 lg:px-6 gap-4 relative z-10">
      {/* Left/Start: Hamburger + Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-base font-semibold text-gray-900 dark:text-white leading-tight">
            {companyName}
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {role === 'china_admin' ? t('settings.roles.china_admin') : t('settings.roles.algeria_admin')}
          </p>
        </div>
      </div>

      {/* Right/End: Actions */}
      <div className="flex items-center gap-2">
        {/* Language Switcher */}
        <div className="relative">
          <button
            onClick={() => { setShowLangMenu(!showLangMenu); setShowNotifications(false) }}
            className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 text-sm"
          >
            <Globe className="w-4 h-4" />
            <span className="hidden sm:inline font-medium">{language === 'ar' ? 'ع' : 'Fr'}</span>
            <ChevronDown className="w-3 h-3" />
          </button>
          {showLangMenu && (
            <div className={cn(
              'absolute top-full mt-1 w-36 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50',
              isRTL ? 'left-0' : 'right-0'
            )}>
              {(['ar', 'fr'] as const).map((lang) => (
                <button
                  key={lang}
                  onClick={() => { setLanguage(lang); setShowLangMenu(false) }}
                  className="w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
                >
                  <span>{lang === 'ar' ? 'العربية' : 'Français'}</span>
                  {language === lang && <Check className="w-3.5 h-3.5 text-blue-500" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Theme toggle */}
        <button
          onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300"
        >
          {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
        </button>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => { setShowNotifications(!showNotifications); setShowLangMenu(false) }}
            className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300"
          >
            <Bell className="w-4 h-4" />
            {unread > 0 && (
              <span className="absolute top-1 end-1 w-4 h-4 bg-red-500 rounded-full text-[10px] flex items-center justify-center text-white font-bold">
                {unread}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className={cn(
              'absolute top-full mt-1 w-80 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 z-50 overflow-hidden',
              isRTL ? 'left-0' : 'right-0'
            )}>
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                <span className="font-semibold text-sm text-gray-900 dark:text-white">{t('notifications.title')}</span>
                {unread > 0 && (
                  <button
                    onClick={markAllNotificationsRead}
                    className="text-xs text-blue-500 hover:text-blue-600"
                  >
                    {t('notifications.markAllRead')}
                  </button>
                )}
              </div>
              <div className="max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                  <p className="text-center py-8 text-sm text-gray-500">{t('notifications.noNotifications')}</p>
                ) : (
                  notifications.slice(0, 8).map((n) => (
                    <div
                      key={n.id}
                      onClick={() => markNotificationRead(n.id)}
                      className={cn(
                        'px-4 py-3 border-b border-gray-100 dark:border-gray-700 last:border-0 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-750',
                        !n.read && 'bg-blue-50 dark:bg-blue-950/30'
                      )}
                    >
                      <div className="flex items-start gap-2">
                        <span className={cn('text-xs px-1.5 py-0.5 rounded-full font-medium flex-shrink-0 mt-0.5', notifTypeColors[n.type])}>
                          {t(`notifications.types.${n.type}`)}
                        </span>
                        {!n.read && (
                          <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0 mt-1 ms-auto" />
                        )}
                      </div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white mt-1">
                        {language === 'ar' ? n.titleAr : n.titleFr}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        {language === 'ar' ? n.messageAr : n.messageFr}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {formatDistanceToNow(n.timestamp, language)}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Avatar */}
        <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
          {role === 'china_admin' ? 'ص' : 'ج'}
        </div>
      </div>

      {/* Click outside overlay */}
      {(showNotifications || showLangMenu) && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => { setShowNotifications(false); setShowLangMenu(false) }}
        />
      )}
    </header>
  )
}
