import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { Package, Loader2, Eye, EyeOff } from 'lucide-react'
import { toast } from 'sonner'
import { useAuthStore } from '../../../store/authStore'
import { useAppStore } from '../../../store/appStore'
import { cn } from '../../utils/cn'

export function Register() {
  const navigate = useNavigate()
  const { register, isLoading } = useAuthStore()
  const initializeData = useAppStore((s) => s.initializeData)
  const language = useAppStore((s) => s.language)
  const setLanguage = useAppStore((s) => s.setLanguage)
  const isRTL = language === 'ar'

  const [companyName, setCompanyName] = useState('')
  const [companyNameFr, setCompanyNameFr] = useState('')
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [acceptTerms, setAcceptTerms] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [formError, setFormError] = useState('')

  const copy = isRTL
    ? {
        tagline: 'أنشئ شركتك وابدأ بدون بيانات تجريبية',
        title: 'تسجيل شركة جديدة',
        company: 'اسم الشركة (عربي)',
        companyFr: 'اسم الشركة (فرنسي)',
        username: 'اسم المستخدم',
        email: 'البريد الإلكتروني',
        password: 'كلمة المرور',
        terms: 'أوافق على شروط الاستخدام وسياسة الخصوصية',
        submit: 'إنشاء الحساب',
        success: 'تم إنشاء الحساب بنجاح',
        haveAccount: 'لديك حساب؟ تسجيل الدخول',
        network: 'تعذّر الاتصال بالخادم. حاول مرة أخرى.',
      }
    : {
        tagline: 'Créez votre entreprise — sans données de démo',
        title: 'Inscription entreprise',
        company: "Nom de l'entreprise (AR)",
        companyFr: "Nom de l'entreprise (FR)",
        username: "Nom d'utilisateur",
        email: 'E-mail',
        password: 'Mot de passe',
        terms: "J'accepte les conditions d'utilisation et la politique de confidentialité",
        submit: 'Créer le compte',
        success: 'Compte créé avec succès',
        haveAccount: 'Déjà un compte ? Connexion',
        network: 'Impossible de joindre le serveur. Réessayez.',
      }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isLoading) return
    setFormError('')
    try {
      await register({
        username: username.trim(),
        email: email.trim(),
        password,
        companyName: companyName.trim(),
        companyNameFr: companyNameFr.trim(),
        acceptTerms,
      })
      await initializeData()
      toast.success(copy.success)
      navigate('/dashboard', { replace: true })
    } catch (err) {
      const raw = err instanceof Error ? err.message : ''
      const message =
        raw.toLowerCase().includes('failed to fetch') || raw.toLowerCase().includes('network')
          ? copy.network
          : raw || copy.network
      setFormError(message)
      toast.error(message)
    }
  }

  return (
    <div
      className="relative min-h-dvh flex items-center justify-center overflow-hidden px-4 py-10 pt-[max(2.5rem,env(safe-area-inset-top))] pb-[max(2.5rem,env(safe-area-inset-bottom))]"
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

      <div className="relative z-10 w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-sky-500 shadow-lg shadow-sky-500/30">
            <Package className="h-8 w-8 text-white" strokeWidth={2.25} />
          </div>
          <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl">CargoBridge</h1>
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
                    'min-h-11 min-w-11 rounded-md px-2.5 text-xs font-medium uppercase transition-colors',
                    language === lang ? 'bg-sky-500 text-white' : 'text-slate-400 hover:text-white',
                  )}
                >
                  {lang}
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3.5" noValidate>
            <input
              required
              placeholder={copy.company}
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-black/30 px-3.5 py-2.5 text-base text-white outline-none focus:ring-2 focus:ring-sky-500/40 sm:text-sm"
            />
            <input
              placeholder={copy.companyFr}
              value={companyNameFr}
              onChange={(e) => setCompanyNameFr(e.target.value)}
              dir="ltr"
              className="w-full rounded-xl border border-white/10 bg-black/30 px-3.5 py-2.5 text-base text-white outline-none focus:ring-2 focus:ring-sky-500/40 sm:text-sm"
            />
            <input
              required
              autoComplete="username"
              placeholder={copy.username}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-black/30 px-3.5 py-2.5 text-base text-white outline-none focus:ring-2 focus:ring-sky-500/40 sm:text-sm"
            />
            <input
              required
              type="email"
              autoComplete="email"
              placeholder={copy.email}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              dir="ltr"
              className="w-full rounded-xl border border-white/10 bg-black/30 px-3.5 py-2.5 text-base text-white outline-none focus:ring-2 focus:ring-sky-500/40 sm:text-sm"
            />
            <div className="relative">
              <input
                required
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder={copy.password}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-black/30 px-3.5 py-2.5 pe-12 text-base text-white outline-none focus:ring-2 focus:ring-sky-500/40 sm:text-sm"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute end-1 top-1/2 inline-flex min-h-11 min-w-11 -translate-y-1/2 items-center justify-center text-slate-400"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <label className="flex items-start gap-2 text-xs text-slate-300">
              <input
                type="checkbox"
                checked={acceptTerms}
                onChange={(e) => setAcceptTerms(e.target.checked)}
                className="mt-0.5"
              />
              <span>{copy.terms}</span>
            </label>
            {formError && (
              <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">{formError}</p>
            )}
            <button
              type="submit"
              disabled={isLoading || !acceptTerms || !companyName.trim() || !username.trim() || !email.trim() || !password}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-sky-500 py-3 text-sm font-semibold text-white disabled:opacity-50"
            >
              {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              {copy.submit}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-slate-400">
            <Link to="/login" className="text-sky-400 hover:underline">{copy.haveAccount}</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
