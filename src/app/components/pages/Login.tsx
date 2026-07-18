import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { Package, Loader2, Eye, EyeOff } from 'lucide-react'
import { toast } from 'sonner'
import { useAuthStore } from '../../../store/authStore'
import { useAppStore } from '../../../store/appStore'
import { sanitizeNextPath } from '../../../lib/authRedirect'
import { cn } from '../../utils/cn'

export function Login() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const nextPath = sanitizeNextPath(searchParams.get('next'))
  const { login, isLoading } = useAuthStore()
  const initializeData = useAppStore((s) => s.initializeData)
  const language = useAppStore((s) => s.language)
  const setLanguage = useAppStore((s) => s.setLanguage)
  const isRTL = language === 'ar'

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [formError, setFormError] = useState('')

  const copy = isRTL
    ? {
        tagline: 'إدارة الشحنات والموردين بين الصين والجزائر',
        title: 'تسجيل الدخول',
        username: 'اسم المستخدم',
        password: 'كلمة المرور',
        submit: 'دخول',
        success: 'تم تسجيل الدخول بنجاح',
        badCreds: 'اسم المستخدم أو كلمة المرور غير صحيحة',
        network: 'تعذّر الاتصال بالخادم. حاول مرة أخرى.',
        adminNote: 'الحساب يُنشأ بواسطة المسؤول — لا يوجد تسجيل ذاتي.',
        show: 'إظهار',
        hide: 'إخفاء',
      }
    : {
        tagline: 'Expéditions et fournisseurs Chine ↔ Algérie',
        title: 'Connexion',
        username: "Nom d'utilisateur",
        password: 'Mot de passe',
        submit: 'Se connecter',
        success: 'Connexion réussie',
        badCreds: "Nom d'utilisateur ou mot de passe incorrect",
        network: 'Impossible de joindre le serveur. Réessayez.',
        adminNote: "Compte créé par l'administrateur — pas d'inscription publique.",
        show: 'Afficher',
        hide: 'Masquer',
      }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isLoading) return
    setFormError('')
    try {
      await login(username.trim(), password)
      await initializeData()
      toast.success(copy.success)
      navigate(nextPath, { replace: true })
    } catch (err) {
      const raw = err instanceof Error ? err.message : ''
      const lower = raw.toLowerCase()
      const message =
        lower.includes('failed to fetch') || lower.includes('network')
          ? copy.network
          : lower.includes('no active account') ||
              lower.includes('credentials') ||
              lower.includes('unauthorized') ||
              lower.includes('detail')
            ? copy.badCreds
            : raw || copy.badCreds
      setFormError(message)
      toast.error(message)
    }
  }

  return (
    <div
      className="relative min-h-screen flex items-center justify-center overflow-hidden px-4 py-10"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 80% 60% at 20% 10%, rgba(14,165,233,0.22), transparent 55%),' +
            'radial-gradient(ellipse 70% 50% at 85% 80%, rgba(37,99,235,0.18), transparent 50%),' +
            'linear-gradient(160deg, #0b1220 0%, #0f172a 45%, #111827 100%)',
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px),' +
            'linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />

      <div className="relative z-10 w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-sky-500 shadow-lg shadow-sky-500/30">
            <Package className="h-8 w-8 text-white" strokeWidth={2.25} />
          </div>
          <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl">
            CargoBridge
          </h1>
          <p className="mt-3 text-sm text-slate-400 sm:text-base">{copy.tagline}</p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur-md sm:p-8">
          <div className="mb-6 flex items-center justify-between gap-3">
            <h2 className="text-lg font-medium text-white">{copy.title}</h2>
            <div className="flex rounded-lg border border-white/10 bg-black/20 p-0.5">
              {(['ar', 'fr'] as const).map((lang) => (
                <button
                  key={lang}
                  type="button"
                  onClick={() => setLanguage(lang)}
                  className={cn(
                    'rounded-md px-2.5 py-1 text-xs font-medium uppercase transition-colors',
                    language === lang
                      ? 'bg-sky-500 text-white'
                      : 'text-slate-400 hover:text-white',
                  )}
                >
                  {lang}
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-300">
                {copy.username}
              </label>
              <input
                required
                autoComplete="username"
                autoFocus
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-black/30 px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 outline-none ring-sky-500/40 transition focus:border-sky-500/50 focus:ring-2"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-300">
                {copy.password}
              </label>
              <div className="relative">
                <input
                  required
                  autoComplete="current-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-black/30 px-3.5 py-2.5 pe-11 text-sm text-white placeholder:text-slate-500 outline-none ring-sky-500/40 transition focus:border-sky-500/50 focus:ring-2"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute inset-y-0 end-0 flex items-center px-3 text-slate-400 hover:text-white"
                  aria-label={showPassword ? copy.hide : copy.show}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {formError && (
              <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
                {formError}
              </p>
            )}

            <button
              type="submit"
              disabled={isLoading || !username.trim() || !password}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-sky-500 py-3 text-sm font-semibold text-white shadow-lg shadow-sky-500/25 transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              {copy.submit}
            </button>
          </form>

          <p className="mt-6 text-center text-xs leading-relaxed text-slate-500">
            {copy.adminNote}
          </p>
        </div>
      </div>
    </div>
  )
}
