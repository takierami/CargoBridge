import { useState } from 'react'
import { useNavigate } from 'react-router'
import { Sun, Moon, Globe, User, Bell, Database, Building2, Check, AlertTriangle, FileText, ChevronRight } from 'lucide-react'
import { toast } from 'sonner'
import { useAppStore } from '../../../store/appStore'
import { useAuthStore } from '../../../store/authStore'
import { cn } from '../../utils/cn'
import type { Language, Theme } from '../../../types'

function SettingSection({ title, icon: Icon, children }: {
  title: string; icon: React.ElementType; children: React.ReactNode
}) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-750">
        <Icon className="w-4 h-4 text-blue-500" />
        <h3 className="font-semibold text-gray-900 dark:text-white text-sm">{title}</h3>
      </div>
      <div className="p-5">{children}</div>
    </div>
  )
}

function ToggleRow({ label, description, checked, onChange }: {
  label: string; description?: string; checked: boolean; onChange: (v: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between py-2.5">
      <div>
        <p className="text-sm font-medium text-gray-900 dark:text-white">{label}</p>
        {description && <p className="text-xs text-gray-500 mt-0.5">{description}</p>}
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={cn(
          'relative w-11 h-6 rounded-full transition-colors duration-200',
          checked ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-600'
        )}
      >
        <div className={cn(
          'absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all duration-200',
          checked ? 'start-5' : 'start-0.5'
        )} />
      </button>
    </div>
  )
}

export function Settings() {
  const {
    t, language, theme, role, companyName, companyNameFr, templates,
    setLanguage, setTheme, setRole, setCompanyName, setCompanyNameFr, resetData,
  } = useAppStore()
  const navigate = useNavigate()

  const [localCompanyName, setLocalCompanyName] = useState(companyName)
  const [localCompanyNameFr, setLocalCompanyNameFr] = useState(companyNameFr)
  const [notifGoods, setNotifGoods] = useState(true)
  const [notifChat, setNotifChat] = useState(true)
  const [notifEnabled, setNotifEnabled] = useState(true)
  const [showResetConfirm, setShowResetConfirm] = useState(false)

  const handleSaveCompany = async () => {
    try {
      await useAuthStore.getState().updateProfile({
        companyName: localCompanyName,
        companyNameFr: localCompanyNameFr,
      })
      setCompanyName(localCompanyName)
      setCompanyNameFr(localCompanyNameFr)
      toast.success(t('settings.saved'))
    } catch {
      toast.error(t('common.error'))
    }
  }

  const handleResetData = async () => {
    await resetData()
    setShowResetConfirm(false)
    toast.success(language === 'ar' ? 'تم إعادة تعيين البيانات' : 'Données réinitialisées')
  }

  const OptionCard = ({ value, current, label, icon: Icon, onClick, color, disabled = false }: {
    value: string; current: string; label: string; icon?: React.ElementType; onClick: () => void; color?: string; disabled?: boolean
  }) => (
    <button
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-start w-full',
        current === value
          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
          : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500',
        disabled && 'cursor-not-allowed opacity-75 hover:border-gray-200 dark:hover:border-gray-600'
      )}
    >
      {Icon && (
        <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0', color || 'bg-gray-100 dark:bg-gray-700')}>
          <Icon className="w-4 h-4" />
        </div>
      )}
      <span className="text-sm font-medium text-gray-900 dark:text-white">{label}</span>
      {current === value && <Check className="w-4 h-4 text-blue-500 ms-auto flex-shrink-0" />}
    </button>
  )

  return (
    <div className="p-4 lg:p-6 space-y-5 max-w-2xl mx-auto">
      <div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">{t('settings.title')}</h1>
      </div>

      {/* Company */}
      <SettingSection title={t('settings.company')} icon={Building2}>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t('settings.companyName')} (عربي)</label>
            <input
              value={localCompanyName}
              onChange={e => setLocalCompanyName(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t('settings.companyName')} (Français)</label>
            <input
              value={localCompanyNameFr}
              onChange={e => setLocalCompanyNameFr(e.target.value)}
              dir="ltr"
              placeholder="ex: CargoBridge"
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <button
              onClick={handleSaveCompany}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
            >
              {t('common.save')}
            </button>
          </div>
        </div>
      </SettingSection>

      {/* User Role */}
      <SettingSection title={t('settings.preferences')} icon={User}>
        <div>
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('settings.currentRole')}</p>
          <div className="grid grid-cols-2 gap-3">
            <OptionCard
              value="china_admin"
              current={role}
              label={t('settings.roles.china_admin')}
              onClick={() => undefined}
              color="bg-red-100 dark:bg-red-900/30 text-red-600"
              disabled
            />
            <OptionCard
              value="algeria_admin"
              current={role}
              label={t('settings.roles.algeria_admin')}
              onClick={() => undefined}
              color="bg-green-100 dark:bg-green-900/30 text-green-600"
              disabled
            />
          </div>
          <p className="text-xs text-amber-600 dark:text-amber-400 mt-2 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" />
            {language === 'ar' ? 'يتم تعيين الدور من طرف مسؤول النظام' : 'Le rôle est attribué par un administrateur système'}
          </p>
        </div>
      </SettingSection>

      {/* Language */}
      <SettingSection title={t('settings.languageSettings')} icon={Globe}>
        <div className="grid grid-cols-2 gap-3">
          <OptionCard
            value="ar"
            current={language}
            label={t('settings.arabic')}
            onClick={() => setLanguage('ar')}
            color="bg-amber-100 dark:bg-amber-900/30"
          />
          <OptionCard
            value="fr"
            current={language}
            label={t('settings.french')}
            onClick={() => setLanguage('fr')}
            color="bg-blue-100 dark:bg-blue-900/30"
          />
        </div>
      </SettingSection>

      {/* Theme */}
      <SettingSection title={t('settings.themeSettings')} icon={Sun}>
        <div className="grid grid-cols-2 gap-3">
          <OptionCard
            value="light"
            current={theme}
            label={t('settings.lightMode')}
            icon={Sun}
            onClick={() => setTheme('light')}
            color="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600"
          />
          <OptionCard
            value="dark"
            current={theme}
            label={t('settings.darkMode')}
            icon={Moon}
            onClick={() => setTheme('dark')}
            color="bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600"
          />
        </div>
      </SettingSection>

      {/* Notifications */}
      <SettingSection title={t('settings.notificationSettings')} icon={Bell}>
        <div className="divide-y divide-gray-100 dark:divide-gray-700">
          <ToggleRow
            label={t('settings.enableNotifications')}
            description={language === 'ar' ? 'تفعيل أو إيقاف جميع الإشعارات' : 'Activer ou désactiver toutes les notifications'}
            checked={notifEnabled}
            onChange={setNotifEnabled}
          />
          <ToggleRow
            label={t('settings.goodsNotifications')}
            description={language === 'ar' ? 'إشعارات حالة السلع والشحنات' : 'Notifications de statut des marchandises'}
            checked={notifGoods && notifEnabled}
            onChange={v => setNotifGoods(v)}
          />
          <ToggleRow
            label={t('settings.chatNotifications')}
            description={language === 'ar' ? 'إشعارات الرسائل الجديدة' : 'Notifications de nouveaux messages'}
            checked={notifChat && notifEnabled}
            onChange={v => setNotifChat(v)}
          />
        </div>
      </SettingSection>

      {/* Document Templates */}
      <SettingSection title={t('templates.title')} icon={FileText}>
        <div className="space-y-2">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {language === 'ar'
              ? `${templates.length} نموذج مسجّل — أنشئ وعدّل نماذج وثائق الاستلام والتسليم`
              : `${templates.length} modèle(s) enregistré(s) — Créez et modifiez les modèles de documents`}
          </p>
          <button
            onClick={() => navigate('/settings/templates')}
            className="flex items-center justify-between w-full px-4 py-3 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 rounded-xl text-sm font-medium transition-colors"
          >
            <span className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              {t('templates.title')}
            </span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </SettingSection>

      {/* Data Management */}
      <SettingSection title={t('settings.dataManagement')} icon={Database}>
        <div className="space-y-3">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {language === 'ar'
              ? 'البيانات مخزنة محلياً في متصفحك. يمكنك إعادة تعيين البيانات للرجوع إلى البيانات الافتراضية.'
              : 'Les données sont stockées localement dans votre navigateur. Vous pouvez réinitialiser pour revenir aux données par défaut.'}
          </p>

          <div className="flex gap-3">
            <button
              onClick={() => setShowResetConfirm(true)}
              className="px-4 py-2 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 rounded-lg text-sm font-medium transition-colors"
            >
              {t('settings.resetData')}
            </button>
          </div>

          {showResetConfirm && (
            <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
              <p className="text-sm text-red-700 dark:text-red-400 mb-3 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                {t('settings.confirmClearData')}
              </p>
              <div className="flex gap-2">
                <button onClick={handleResetData} className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-medium">
                  {t('common.confirm')}
                </button>
                <button onClick={() => setShowResetConfirm(false)} className="px-3 py-1.5 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 text-gray-700 dark:text-gray-300 rounded-lg text-xs font-medium">
                  {t('common.cancel')}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Version info */}
        <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between text-xs text-gray-400">
          <span>CargoBridge</span>
          <span>{t('settings.version')} 1.0.0 • Phase 1 (Local Storage)</span>
        </div>
      </SettingSection>
    </div>
  )
}
