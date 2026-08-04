import { useState, useEffect } from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router'
import { motion } from 'framer-motion'
import { useLang } from '../context/LangContext'
import SectionReveal from '../components/SectionReveal'

const WEB3FORMS_KEY = '617a4c9a-ed14-4eb5-8d64-e0088dd10a3e'

type Intent = 'demo' | 'sales' | 'technical' | 'partnership' | 'general'

const intents: { id: Intent; fr: string; ar: string }[] = [
  { id: 'demo', fr: 'Demander une démo', ar: 'طلب عرض تجريبي' },
  { id: 'sales', fr: 'Contacter les ventes', ar: 'تواصل مع المبيعات' },
  { id: 'technical', fr: 'Questions techniques', ar: 'أسئلة تقنية' },
  { id: 'partnership', fr: 'Partenariat', ar: 'شراكة' },
  { id: 'general', fr: 'Renseignement général', ar: 'استفسار عام' },
]

export default function Contact() {
  const { lang, isAr } = useLang()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  const [intent, setIntent] = useState<Intent>('demo')
  const [form, setForm] = useState({
    name: '', company: '', email: '', phone: '',
    city: '', size: '', message: '', preferredLang: 'fr', consent: false,
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')

  useEffect(() => {
    const i = searchParams.get('intent') as Intent
    if (i && intents.find(x => x.id === i)) setIntent(i)
  }, [searchParams])

  const validate = () => {
    const e: Record<string, string> = {}
    if (!form.name.trim()) e.name = isAr ? 'الاسم مطلوب' : 'Nom requis'
    if (!form.company.trim()) e.company = isAr ? 'اسم الشركة مطلوب' : 'Société requise'
    if (!form.email.includes('@')) e.email = isAr ? 'بريد إلكتروني غير صحيح' : 'Email invalide'
    if (!form.message.trim()) e.message = isAr ? 'الرسالة مطلوبة' : 'Message requis'
    if (!form.consent) e.consent = isAr ? 'الموافقة مطلوبة' : 'Consentement requis'
    return e
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const v = validate()
    setErrors(v)
    if (Object.keys(v).length > 0) return

    setSubmitting(true)
    setSubmitError('')

    const intentLabel = intents.find(i => i.id === intent)?.[lang] ?? intent

    // Build a rich message body so the email is actionable
    const fullMessage = [
      `Objet / الموضوع: ${intentLabel}`,
      `Société / الشركة: ${form.company}`,
      form.phone ? `Téléphone / الهاتف: ${form.phone}` : null,
      form.city ? `Ville / المدينة: ${form.city}` : null,
      form.size ? `Taille / الحجم: ${form.size}` : null,
      `Langue préférée / اللغة: ${form.preferredLang === 'ar' ? 'العربية' : 'Français'}`,
      '',
      form.message,
    ].filter(l => l !== null).join('\n')

    try {
      const payload = new FormData()
      payload.append('access_key', WEB3FORMS_KEY)
      payload.append('subject', `[CargoBridge] ${intentLabel} — ${form.company}`)
      payload.append('from_name', 'CargoBridge Website')
      payload.append('name', form.name)
      payload.append('email', form.email)
      payload.append('message', fullMessage)

      const res = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        body: payload,
      })

      const data = await res.json()

      if (data.success) {
        navigate('/contact/success')
      } else {
        setSubmitError(
          isAr
            ? 'حدث خطأ أثناء الإرسال. يرجى المحاولة مجدداً أو الاتصال بنا مباشرة.'
            : "Une erreur est survenue. Veuillez réessayer ou nous contacter directement.",
        )
        setSubmitting(false)
      }
    } catch {
      setSubmitError(
        isAr
          ? 'تعذّر الاتصال بالخادم. يرجى التحقق من اتصالك وإعادة المحاولة.'
          : 'Impossible de joindre le serveur. Vérifiez votre connexion et réessayez.',
      )
      setSubmitting(false)
    }
  }

  const field = (id: string) => ({
    className: `w-full px-4 py-3 rounded-xl text-slate-900 text-[14px] outline-none transition-all ${
      errors[id]
        ? 'border-2 border-rose-400 bg-rose-50'
        : 'border border-slate-200 bg-white focus:border-sky-400 focus:ring-2 focus:ring-sky-400/20'
    } ${isAr ? 'text-right font-arabic' : ''}`,
  })

  return (
    <div style={{ background: '#f9fafb' }}>
      {/* Hero */}
      <section
        className="section-pad"
        style={{
          paddingTop: 'calc(var(--nav-height) + 60px)',
          paddingBottom: 48,
          background: 'linear-gradient(160deg, #0b1220 0%, #0d1729 100%)',
        }}
      >
        <div className="max-w-[760px] mx-auto px-4 sm:px-6 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <h1 className={`text-[30px] sm:text-[40px] md:text-[52px] font-bold text-white mb-4 ${isAr ? 'font-arabic' : ''}`}>
              {isAr ? 'تواصل معنا' : 'Parlons-nous'}
            </h1>
            <p className="text-slate-400 text-[17px]">
              {isAr
                ? 'نرد خلال يوم عمل واحد. لا عروض عامة — نريد رؤية سير عملك الفعلي.'
                : "Nous répondons sous 1 jour ouvré. Pas de démos génériques — nous voulons voir votre workflow réel."}
            </p>
          </motion.div>
        </div>
      </section>

      {/* Form + trust */}
      <section className="section-pad">
        <div className="max-w-[1100px] mx-auto px-4 sm:px-6">
          <div className={`grid grid-cols-1 lg:grid-cols-5 gap-10 ${isAr ? 'lg:grid-flow-col-dense' : ''}`}>

            {/* Form */}
            <div className={`lg:col-span-3 ${isAr ? 'lg:order-2' : ''}`}>
              <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100">
                <form onSubmit={handleSubmit} noValidate>
                  {/* Intent chips */}
                  <div className="mb-7">
                    <label className={`block text-slate-700 text-[13px] font-semibold mb-3 ${isAr ? 'text-right' : ''}`}>
                      {isAr ? 'موضوع تواصلك *' : 'Objet de votre demande *'}
                    </label>
                    <div className={`flex flex-wrap gap-2 ${isAr ? 'flex-row-reverse' : ''}`}>
                      {intents.map((i) => (
                        <button
                          key={i.id}
                          type="button"
                          onClick={() => setIntent(i.id)}
                          className={`px-4 py-2 rounded-xl text-[13px] font-medium transition-all ${
                            intent === i.id
                              ? 'bg-sky-500 text-white shadow-md shadow-sky-500/25'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          } py-2.5`}
                        >
                          {i[lang]}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className={`block text-slate-600 text-[12px] font-semibold mb-1.5 ${isAr ? 'text-right' : ''}`}>
                        {isAr ? 'الاسم الكامل *' : 'Nom complet *'}
                      </label>
                      <input
                        type="text"
                        placeholder={isAr ? 'محمد بن علي' : 'Mohamed Ben Ali'}
                        {...field('name')}
                        value={form.name}
                        onChange={e => setForm({ ...form, name: e.target.value })}
                      />
                      {errors.name && <p className="text-rose-500 text-[11px] mt-1">{errors.name}</p>}
                    </div>
                    <div>
                      <label className={`block text-slate-600 text-[12px] font-semibold mb-1.5 ${isAr ? 'text-right' : ''}`}>
                        {isAr ? 'اسم الشركة *' : 'Société *'}
                      </label>
                      <input
                        type="text"
                        placeholder={isAr ? 'شركة الاستيراد' : 'Import Sarl'}
                        {...field('company')}
                        value={form.company}
                        onChange={e => setForm({ ...form, company: e.target.value })}
                      />
                      {errors.company && <p className="text-rose-500 text-[11px] mt-1">{errors.company}</p>}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className={`block text-slate-600 text-[12px] font-semibold mb-1.5 ${isAr ? 'text-right' : ''}`}>
                        {isAr ? 'البريد الإلكتروني *' : 'Email professionnel *'}
                      </label>
                      <input
                        type="email"
                        placeholder="you@company.dz"
                        {...field('email')}
                        value={form.email}
                        onChange={e => setForm({ ...form, email: e.target.value })}
                      />
                      {errors.email && <p className="text-rose-500 text-[11px] mt-1">{errors.email}</p>}
                    </div>
                    <div>
                      <label className={`block text-slate-600 text-[12px] font-semibold mb-1.5 ${isAr ? 'text-right' : ''}`}>
                        {isAr ? 'الهاتف (موصى به)' : 'Téléphone (recommandé)'}
                      </label>
                      <input
                        type="tel"
                        placeholder="+213 ..."
                        {...field('phone')}
                        value={form.phone}
                        onChange={e => setForm({ ...form, phone: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className={`block text-slate-600 text-[12px] font-semibold mb-1.5 ${isAr ? 'text-right' : ''}`}>
                        {isAr ? 'المدينة / الدولة' : 'Ville / Pays'}
                      </label>
                      <input
                        type="text"
                        placeholder={isAr ? 'الجزائر' : 'Algérie'}
                        {...field('city')}
                        value={form.city}
                        onChange={e => setForm({ ...form, city: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className={`block text-slate-600 text-[12px] font-semibold mb-1.5 ${isAr ? 'text-right' : ''}`}>
                        {isAr ? 'حجم الشركة' : 'Taille de société'}
                      </label>
                      <select
                        className={`w-full px-4 py-3 rounded-xl text-slate-900 text-[14px] border border-slate-200 bg-white focus:border-sky-400 focus:ring-2 focus:ring-sky-400/20 outline-none transition-all ${isAr ? 'text-right font-arabic' : ''}`}
                        value={form.size}
                        onChange={e => setForm({ ...form, size: e.target.value })}
                      >
                        <option value="">{isAr ? 'اختر...' : 'Choisir...'}</option>
                        <option value="1-5">1–5</option>
                        <option value="6-25">6–25</option>
                        <option value="26-100">26–100</option>
                        <option value="100+">100+</option>
                      </select>
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className={`block text-slate-600 text-[12px] font-semibold mb-1.5 ${isAr ? 'text-right' : ''}`}>
                      {isAr ? 'رسالتك *' : 'Votre message *'}
                    </label>
                    <textarea
                      rows={4}
                      placeholder={isAr ? 'أخبرنا كيف تستورد اليوم...' : "Dites-nous comment vous importez aujourd'hui..."}
                      {...field('message')}
                      value={form.message}
                      onChange={e => setForm({ ...form, message: e.target.value })}
                      style={{ resize: 'vertical' }}
                    />
                    {errors.message && <p className="text-rose-500 text-[11px] mt-1">{errors.message}</p>}
                  </div>

                  {/* Preferred language */}
                  <div className="mb-5">
                    <label className={`block text-slate-600 text-[12px] font-semibold mb-2 ${isAr ? 'text-right' : ''}`}>
                      {isAr ? 'اللغة المفضلة *' : 'Langue préférée *'}
                    </label>
                    <div className={`flex gap-2 ${isAr ? 'flex-row-reverse' : ''}`}>
                      {[{ v: 'fr', label: 'Français' }, { v: 'ar', label: 'العربية' }].map(({ v, label }) => (
                        <button
                          key={v}
                          type="button"
                          onClick={() => setForm({ ...form, preferredLang: v })}
                          className={`px-5 py-2 rounded-xl text-[13px] font-medium transition-all ${
                            form.preferredLang === v
                              ? 'bg-sky-500 text-white'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          } py-2.5`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Consent */}
                  <label className={`flex items-start gap-3 mb-6 cursor-pointer ${isAr ? 'flex-row-reverse' : ''}`}>
                    <input
                      type="checkbox"
                      className="mt-0.5 w-4 h-4 rounded accent-sky-500 flex-shrink-0"
                      checked={form.consent}
                      onChange={e => setForm({ ...form, consent: e.target.checked })}
                    />
                    <span className={`text-slate-500 text-[13px] leading-relaxed ${isAr ? 'font-arabic text-right' : ''}`}>
                      {isAr
                        ? 'أوافق على تواصل CargoBridge معي بخصوص هذا الطلب.'
                        : "J'accepte que CargoBridge me contacte concernant cette demande."}
                    </span>
                  </label>
                  {errors.consent && <p className="text-rose-500 text-[11px] -mt-4 mb-4">{errors.consent}</p>}

                  <motion.button
                    type="submit"
                    disabled={submitting}
                    whileTap={{ scale: 0.98 }}
                    className="w-full py-4 text-[15px] font-semibold text-white bg-sky-500 hover:bg-sky-400 rounded-xl transition-colors shadow-lg shadow-sky-500/25 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {submitting ? (
                      <>
                        <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.3"/>
                          <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
                        </svg>
                        {isAr ? 'جاري الإرسال...' : 'Envoi en cours...'}
                      </>
                    ) : (
                      isAr ? 'إرسال الطلب' : 'Envoyer la demande'
                    )}
                  </motion.button>

                  {submitError && (
                    <p className={`text-rose-500 text-[13px] text-center mt-3 leading-relaxed ${isAr ? 'font-arabic' : ''}`}>
                      {submitError}
                    </p>
                  )}

                  <p className={`text-slate-400 text-[12px] text-center mt-3 ${isAr ? 'font-arabic' : ''}`}>
                    {isAr ? 'عميل حالي؟ ' : "Déjà client ? "}
                    <Link to="/login" className="text-sky-500 hover:text-sky-400 font-medium">
                      {isAr ? 'ادخل إلى مساحتك' : 'Connectez-vous à votre workspace'}
                    </Link>
                  </p>
                </form>
              </div>
            </div>

            {/* Trust panel */}
            <div className={`lg:col-span-2 ${isAr ? 'lg:order-1' : ''}`}>
              <SectionReveal>
                <div className="space-y-5">
                  <div className="glass-card rounded-2xl p-6">
                    <div className="w-9 h-9 rounded-xl bg-emerald-500/15 flex items-center justify-center text-emerald-400 text-lg mb-3">⚡</div>
                    <h3 className={`text-white font-semibold text-[15px] mb-2 ${isAr ? 'font-arabic text-right' : ''}`}>
                      {isAr ? 'رد سريع' : 'Réponse rapide'}
                    </h3>
                    <p className={`text-slate-400 text-[13px] leading-relaxed ${isAr ? 'font-arabic text-right' : ''}`}>
                      {isAr
                        ? 'نرد خلال يوم عمل واحد. إذا كان طلبك عاجلاً، يمكنك الاتصال بنا مباشرة.'
                        : "Nous répondons sous 1 jour ouvré. Pour un besoin urgent, contactez-nous directement par téléphone."}
                    </p>
                  </div>

                  <div className="glass-card rounded-2xl p-6">
                    <div className="w-9 h-9 rounded-xl bg-sky-500/15 flex items-center justify-center text-sky-400 text-lg mb-3">🎯</div>
                    <h3 className={`text-white font-semibold text-[15px] mb-2 ${isAr ? 'font-arabic text-right' : ''}`}>
                      {isAr ? 'ما تغطيه الديمو' : 'Ce que couvre une démo'}
                    </h3>
                    <p className={`text-slate-400 text-[13px] leading-relaxed ${isAr ? 'font-arabic text-right' : ''}`}>
                      {isAr
                        ? 'حلقة استيرادك الفعلية — البضائع والموردون والمدفوعات والتتبع — موضحة في CargoBridge. ليس جولة ميزات عامة.'
                        : "Votre boucle import réelle — marchandises, fournisseurs, paiements, suivi — montrée dans CargoBridge. Pas une visite générique."}
                    </p>
                  </div>

                  <div className="glass-card rounded-2xl p-6">
                    <div className="w-9 h-9 rounded-xl bg-purple-500/15 flex items-center justify-center text-purple-400 text-lg mb-3">🔒</div>
                    <h3 className={`text-white font-semibold text-[15px] mb-2 ${isAr ? 'font-arabic text-right' : ''}`}>
                      {isAr ? 'بياناتك معزولة' : 'Vos données isolées'}
                    </h3>
                    <p className={`text-slate-400 text-[13px] leading-relaxed ${isAr ? 'font-arabic text-right' : ''}`}>
                      {isAr
                        ? 'مساحات العمل مخصصة لكل مؤسسة — بيانات شركتك تبقى داخل شركتك.'
                        : "Workspaces scoped par organisation — les données de votre société restent dans votre société."}
                    </p>
                  </div>

                  <div className="glass-card rounded-2xl p-5 border border-sky-500/15">
                    <div className={`text-slate-400 text-[12px] mb-3 ${isAr ? 'font-arabic text-right' : ''}`}>
                      {isAr ? 'للمؤسسات والطلبات المخصصة' : 'Pour les entreprises & devis sur-mesure'}
                    </div>
                    <Link
                      to="/contact?intent=sales"
                      className={`flex items-center gap-2 text-sky-400 hover:text-sky-300 text-[13px] font-semibold transition-colors ${isAr ? 'flex-row-reverse' : ''}`}
                    >
                      {isAr ? 'تواصل مع مبيعات Enterprise ←' : 'Contacter les ventes Enterprise →'}
                    </Link>
                  </div>

                  <div className={`glass-card rounded-2xl p-5 space-y-3 ${isAr ? 'font-arabic text-right' : ''}`}>
                    <div className="text-slate-400 text-[11px] font-semibold uppercase tracking-wider">
                      {isAr ? 'تواصل مباشر' : 'Contact direct'}
                    </div>
                    <a
                      href="mailto:info@cargobridgedz.com"
                      className="flex items-center gap-2.5 text-sky-400 hover:text-sky-300 text-[13px] font-medium transition-colors group"
                    >
                      <span className="w-7 h-7 rounded-lg bg-sky-500/10 flex items-center justify-center text-sm flex-shrink-0">✉</span>
                      <span className="group-hover:underline">info@cargobridgedz.com</span>
                    </a>
                    {[
                      { num: '0560 20 70 00', href: 'tel:+213560207000' },
                      { num: '0663 10 41 86', href: 'tel:+213663104186' },
                      { num: '0770 41 40 17', href: 'tel:+213770414017' },
                    ].map(({ num, href }) => (
                      <a
                        key={num}
                        href={href}
                        className="flex items-center gap-2.5 text-slate-300 hover:text-white text-[13px] font-mono transition-colors group"
                      >
                        <span className="w-7 h-7 rounded-lg bg-slate-700/50 flex items-center justify-center text-sm flex-shrink-0">📞</span>
                        <span className="group-hover:underline">{num}</span>
                      </a>
                    ))}
                  </div>
                </div>
              </SectionReveal>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
