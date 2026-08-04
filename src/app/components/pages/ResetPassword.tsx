import { useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { Package, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useAuthStore } from '../../../store/authStore'
import { useAppStore } from '../../../store/appStore'
import { cn } from '../../utils/cn'

export function ForgotPassword() {
  const { requestPasswordReset, isLoading } = useAuthStore()
  const language = useAppStore((s) => s.language)
  const setLanguage = useAppStore((s) => s.setLanguage)
  const isRTL = language === 'ar'
  const [email, setEmail] = useState('')
  const [done, setDone] = useState(false)

  const copy = isRTL
    ? {
        title: 'استعادة كلمة المرور',
        email: 'البريد الإلكتروني',
        submit: 'إرسال رابط الاستعادة',
        done: 'إن وُجد حساب بهذا البريد، أُرسل رابط الاستعادة.',
        back: 'العودة لتسجيل الدخول',
      }
    : {
        title: 'Mot de passe oublié',
        email: 'E-mail',
        submit: 'Envoyer le lien',
        done: 'Si un compte existe pour cet e-mail, un lien a été envoyé.',
        back: 'Retour à la connexion',
      }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await requestPasswordReset(email.trim())
      setDone(true)
      toast.success(copy.done)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error')
    }
  }

  return (
    <AuthShell isRTL={isRTL} language={language} setLanguage={setLanguage} title={copy.title}>
      {done ? (
        <p className="text-sm text-slate-300">{copy.done}</p>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={copy.email}
            dir="ltr"
            className="w-full rounded-xl border border-white/10 bg-black/30 px-3.5 py-2.5 text-white outline-none focus:ring-2 focus:ring-sky-500/40"
          />
          <button
            type="submit"
            disabled={isLoading || !email.trim()}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-sky-500 py-3 text-sm font-semibold text-white disabled:opacity-50"
          >
            {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
            {copy.submit}
          </button>
        </form>
      )}
      <p className="mt-6 text-center text-xs">
        <Link to="/login" className="text-sky-400 hover:underline">{copy.back}</Link>
      </p>
    </AuthShell>
  )
}

export function ResetPassword() {
  const [params] = useSearchParams()
  const uid = params.get('uid') || ''
  const token = params.get('token') || ''
  const { confirmPasswordReset, isLoading } = useAuthStore()
  const language = useAppStore((s) => s.language)
  const setLanguage = useAppStore((s) => s.setLanguage)
  const isRTL = language === 'ar'
  const [password, setPassword] = useState('')
  const [done, setDone] = useState(false)

  const copy = isRTL
    ? {
        title: 'تعيين كلمة مرور جديدة',
        password: 'كلمة المرور الجديدة',
        submit: 'حفظ',
        done: 'تم تحديث كلمة المرور. يمكنك تسجيل الدخول.',
        back: 'تسجيل الدخول',
        invalid: 'رابط الاستعادة غير صالح.',
      }
    : {
        title: 'Nouveau mot de passe',
        password: 'Nouveau mot de passe',
        submit: 'Enregistrer',
        done: 'Mot de passe mis à jour. Vous pouvez vous connecter.',
        back: 'Connexion',
        invalid: 'Lien de réinitialisation invalide.',
      }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!uid || !token) {
      toast.error(copy.invalid)
      return
    }
    try {
      await confirmPasswordReset(uid, token, password)
      setDone(true)
      toast.success(copy.done)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error')
    }
  }

  return (
    <AuthShell isRTL={isRTL} language={language} setLanguage={setLanguage} title={copy.title}>
      {done ? (
        <p className="text-sm text-slate-300">{copy.done}</p>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            required
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={copy.password}
            className="w-full rounded-xl border border-white/10 bg-black/30 px-3.5 py-2.5 text-white outline-none focus:ring-2 focus:ring-sky-500/40"
          />
          <button
            type="submit"
            disabled={isLoading || !password}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-sky-500 py-3 text-sm font-semibold text-white disabled:opacity-50"
          >
            {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
            {copy.submit}
          </button>
        </form>
      )}
      <p className="mt-6 text-center text-xs">
        <Link to="/login" className="text-sky-400 hover:underline">{copy.back}</Link>
      </p>
    </AuthShell>
  )
}

function AuthShell({
  children,
  isRTL,
  language,
  setLanguage,
  title,
}: {
  children: React.ReactNode
  isRTL: boolean
  language: string
  setLanguage: (l: 'ar' | 'fr') => void
  title: string
}) {
  return (
    <div
      className="relative min-h-dvh flex items-center justify-center overflow-hidden px-4 py-10"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 80% 60% at 20% 10%, rgba(14,165,233,0.22), transparent 55%), linear-gradient(160deg, #0b1220 0%, #0f172a 45%, #111827 100%)',
        }}
      />
      <div className="relative z-10 w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-sky-500">
            <Package className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-semibold text-white">CargoBridge</h1>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md sm:p-8">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-lg font-medium text-white">{title}</h2>
            <div className="flex rounded-lg border border-white/10 bg-black/20 p-0.5">
              {(['ar', 'fr'] as const).map((lang) => (
                <button
                  key={lang}
                  type="button"
                  onClick={() => setLanguage(lang)}
                  className={cn(
                    'min-h-11 min-w-11 rounded-md px-2.5 text-xs font-medium uppercase',
                    language === lang ? 'bg-sky-500 text-white' : 'text-slate-400',
                  )}
                >
                  {lang}
                </button>
              ))}
            </div>
          </div>
          {children}
        </div>
      </div>
    </div>
  )
}
