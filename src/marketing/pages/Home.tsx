import { Link } from 'react-router'
import { motion, useReducedMotion } from 'framer-motion'
import { useLang } from '../context/LangContext'
import SectionReveal, { StaggerReveal, StaggerItem } from '../components/SectionReveal'
import FAQAccordion from '../components/FAQAccordion'
import CTABand from '../components/CTABand'

/* ─── Trade Route SVG ────────────────────────────────────────── */
function RoutePath() {
  const reduced = useReducedMotion()
  return (
    <svg viewBox="0 0 900 320" fill="none" preserveAspectRatio="xMidYMid meet" className="w-full" style={{ maxWidth: 900 }}>
      <defs>
        <linearGradient id="routeGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.9"/>
          <stop offset="50%" stopColor="#38bdf8" stopOpacity="1"/>
          <stop offset="100%" stopColor="#2563eb" stopOpacity="0.8"/>
        </linearGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="3" result="blur"/>
          <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>

      {/* Grid lines */}
      {[60, 120, 180, 240, 300].map(y => (
        <line key={y} x1="0" y1={y} x2="900" y2={y} stroke="rgba(148,163,184,0.04)" strokeWidth="1"/>
      ))}
      {[100, 200, 300, 400, 500, 600, 700, 800].map(x => (
        <line key={x} x1={x} y1="0" x2={x} y2="320" stroke="rgba(148,163,184,0.04)" strokeWidth="1"/>
      ))}

      {/* Shadow route */}
      <path
        d="M80 160 C200 160 250 80 400 120 C480 140 520 200 640 180 C720 168 760 140 820 160"
        stroke="rgba(14,165,233,0.12)"
        strokeWidth="8"
        strokeLinecap="round"
        fill="none"
      />

      {/* Main route */}
      <motion.path
        d="M80 160 C200 160 250 80 400 120 C480 140 520 200 640 180 C720 168 760 140 820 160"
        stroke="url(#routeGrad)"
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
        filter="url(#glow)"
        initial={reduced ? { pathLength: 1, opacity: 1 } : { pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 1.4, delay: 0.3, ease: 'easeInOut' }}
        style={{ pathLength: undefined }}
      />

      {/* Dashed parallel */}
      <motion.path
        d="M80 170 C200 170 250 90 400 130 C480 150 520 210 640 190 C720 178 760 150 820 170"
        stroke="rgba(14,165,233,0.15)"
        strokeWidth="1"
        strokeDasharray="6 8"
        strokeLinecap="round"
        fill="none"
        initial={reduced ? { pathLength: 1 } : { pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.6, delay: 0.8, ease: 'easeInOut' }}
      />

      {/* China dot */}
      <motion.g
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2, duration: 0.5 }}
      >
        <circle cx="80" cy="160" r="8" fill="#0ea5e9" opacity="0.2"/>
        <circle cx="80" cy="160" r="4" fill="#0ea5e9"/>
        <circle cx="80" cy="160" r="2" fill="white"/>
        <text x="80" y="185" textAnchor="middle" fill="rgba(148,163,184,0.6)" fontSize="11" fontFamily="Plus Jakarta Sans, sans-serif">中国</text>
      </motion.g>

      {/* Algeria dot */}
      <motion.g
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 1.6, duration: 0.5 }}
      >
        <circle cx="820" cy="160" r="8" fill="#38bdf8" opacity="0.2"/>
        <circle cx="820" cy="160" r="4" fill="#38bdf8"/>
        <circle cx="820" cy="160" r="2" fill="white"/>
        <text x="820" y="185" textAnchor="middle" fill="rgba(148,163,184,0.6)" fontSize="11" fontFamily="Plus Jakarta Sans, sans-serif">الجزائر</text>
      </motion.g>

      {/* Moving cargo dot */}
      {!reduced && (
        <motion.circle
          r="5"
          fill="#38bdf8"
          filter="url(#glow)"
          initial={{ offsetDistance: '0%' }}
          animate={{ offsetDistance: '100%' }}
          transition={{ duration: 3, delay: 1.5, ease: 'easeInOut' }}
          style={{
            offsetPath: "path('M80 160 C200 160 250 80 400 120 C480 140 520 200 640 180 C720 168 760 140 820 160')",
          } as React.CSSProperties}
        />
      )}

      {/* Waypoint dots */}
      {[
        { cx: 280, cy: 112, label: 'Guangzhou' },
        { cx: 450, cy: 126, label: 'Mer Rouge' },
        { cx: 640, cy: 182, label: 'Méditerranée' },
      ].map(({ cx, cy, label }) => (
        <motion.g key={label}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 0.6 }}
        >
          <circle cx={cx} cy={cy} r="3" fill="rgba(56,189,248,0.5)"/>
          <text x={cx} y={cy - 10} textAnchor="middle" fill="rgba(148,163,184,0.4)" fontSize="9" fontFamily="Plus Jakarta Sans, sans-serif">{label}</text>
        </motion.g>
      ))}
    </svg>
  )
}

/* ─── Floating glass UI cards ────────────────────────────────── */
function GoodsStatusCard() {
  return (
    <div className="glass-card rounded-2xl p-4 w-64 shadow-2xl">
      <div className="flex items-center justify-between mb-3">
        <span className="text-slate-400 text-xs font-medium">Marchandises en transit</span>
        <span className="chip chip-transit">En transit</span>
      </div>
      <div className="space-y-2.5">
        {[
          { ref: 'CB-2024-0891', label: 'Électronique × 24', status: 'chip-transit', s: 'Transit' },
          { ref: 'CB-2024-0892', label: 'Textiles × 120', status: 'chip-arrived', s: 'Arrivé' },
          { ref: 'CB-2024-0887', label: 'Pièces détachées', status: 'chip-pending', s: 'Douane' },
        ].map((row) => (
          <div key={row.ref} className="flex items-center justify-between py-2 border-b border-slate-700/30">
            <div>
              <div className="text-white text-[12px] font-medium">{row.label}</div>
              <div className="text-slate-500 text-[10px] font-mono">{row.ref}</div>
            </div>
            <span className={`chip ${row.status} chip-pulse`}>{row.s}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function SupplierCard() {
  return (
    <div className="glass-card rounded-2xl p-4 w-56 shadow-2xl">
      <div className="text-slate-400 text-xs font-medium mb-3">Solde fournisseur</div>
      <div className="flex items-center gap-3 mb-3">
        <div className="w-8 h-8 rounded-full bg-sky-500/20 flex items-center justify-center text-sky-400 text-xs font-bold">SH</div>
        <div>
          <div className="text-white text-[13px] font-semibold">Shanghai Global</div>
          <div className="text-slate-500 text-[10px]">Fournisseur · Chine</div>
        </div>
      </div>
      <div className="bg-slate-800/60 rounded-xl p-3">
        <div className="text-slate-500 text-[10px] mb-1">Solde en attente</div>
        <div className="text-amber-400 font-price text-[15px] font-semibold">¥ 48,200</div>
        <div className="text-slate-500 text-[10px] mt-1">≈ 9,640,000 DZD</div>
      </div>
    </div>
  )
}

function QRCard() {
  return (
    <div className="glass-card rounded-2xl p-4 w-48 shadow-2xl">
      <div className="text-slate-400 text-xs font-medium mb-3">QR Tracking</div>
      <div className="bg-white rounded-xl p-2 mb-3 flex items-center justify-center">
        <svg viewBox="0 0 48 48" className="w-20 h-20">
          {/* QR code pattern */}
          {[0,1,2,3,4,5,6].map(r => [0,1,2,3,4,5,6].map(c => {
            const qr = [
              [1,1,1,1,1,1,1],[1,0,0,0,0,0,1],[1,0,1,1,1,0,1],[1,0,1,0,1,0,1],[1,0,1,1,1,0,1],[1,0,0,0,0,0,1],[1,1,1,1,1,1,1]
            ]
            return qr[r][c] ? <rect key={`${r}-${c}`} x={c*6+2} y={r*6+2} width="5" height="5" fill="#0f172a"/> : null
          }))}
          <rect x="32" y="2" width="5" height="5" fill="#0f172a"/>
          <rect x="32" y="9" width="5" height="5" fill="#0ea5e9"/>
          <rect x="38" y="2" width="5" height="5" fill="#0f172a"/>
          <rect x="2" y="32" width="5" height="5" fill="#0f172a"/>
          <rect x="9" y="32" width="5" height="5" fill="#0f172a"/>
          <rect x="2" y="38" width="5" height="5" fill="#0ea5e9"/>
        </svg>
      </div>
      <div className="text-center">
        <div className="text-white text-[11px] font-semibold">CB-2024-0891</div>
        <div className="chip chip-arrived mx-auto mt-1.5 text-[10px]">Livré</div>
      </div>
    </div>
  )
}

/* ─── Module strip ───────────────────────────────────────────── */
const modules = [
  { icon: '📦', fr: 'Marchandises', ar: 'البضائع', color: '#0ea5e9' },
  { icon: '🏭', fr: 'Fournisseurs', ar: 'الموردون', color: '#10b981' },
  { icon: '🤝', fr: 'Agents', ar: 'الوكلاء', color: '#38bdf8' },
  { icon: '📱', fr: 'Scanner QR', ar: 'مسح QR', color: '#a78bfa' },
  { icon: '🧮', fr: 'Calculateur', ar: 'الحاسبة', color: '#f59e0b' },
  { icon: '📜', fr: 'Historique', ar: 'السجل', color: '#34d399' },
  { icon: '🧾', fr: 'Documents', ar: 'الوثائق', color: '#fb7185' },
  { icon: '📊', fr: 'Rapports', ar: 'التقارير', color: '#818cf8' },
]

/* ─── FAQ data ───────────────────────────────────────────────── */
const faqData = {
  fr: [
    { q: "Y a-t-il une inscription publique ?", a: "Non — demandez une démo et nous guiderons l'onboarding." },
    { q: "Quelles langues sont supportées ?", a: "Arabe (RTL) et Français — les deux en première classe, pas en option." },
    { q: "Les prix sont en quelle devise ?", a: "Dinar algérien (DZD) uniquement. Pas de surprise en dollars." },
    { q: "Les clients existants peuvent-ils se connecter ?", a: "Oui — utilisez Connexion pour accéder directement à votre workspace." },
    { q: "Remplacez-vous WhatsApp ?", a: "Vous remplacez WhatsApp comme base de données opérationnelle. Gardez la conversation — éliminez le chaos." },
    { q: "Les données sont-elles isolées par société ?", a: "Les workspaces sont scoped par organisation — vos données restent dans votre organisation." },
  ],
  ar: [
    { q: "هل يوجد تسجيل عام؟", a: "لا — اطلب عرضاً تجريبياً وسنرشدك خلال عملية الإعداد." },
    { q: "ما اللغات المدعومة؟", a: "العربية (من اليمين إلى اليسار) والفرنسية — كلتاهما بالمستوى الأول." },
    { q: "ما العملة المستخدمة في الأسعار؟", a: "الدينار الجزائري (DZD) فقط. لا مفاجآت بالدولار." },
    { q: "هل يمكن للعملاء الحاليين تسجيل الدخول؟", a: "نعم — استخدم رابط الدخول للوصول مباشرة إلى مساحة عملك." },
    { q: "هل تستبدلون واتساب؟", a: "تستبدل واتساب كقاعدة بيانات تشغيلية. احتفظ بالمحادثة — تخلص من الفوضى." },
    { q: "هل البيانات معزولة لكل شركة؟", a: "مساحات العمل مخصصة لكل مؤسسة — بياناتك تبقى داخل مؤسستك." },
  ],
}

/* ─── Home ───────────────────────────────────────────────────── */
export default function Home() {
  const { lang, isAr } = useLang()
  const reduced = useReducedMotion()

  return (
    <div className={isAr ? 'font-arabic' : ''}>

      {/* ── H1 HERO ────────────────────────────────────────────── */}
      <section
        className="relative min-h-screen flex flex-col justify-center overflow-hidden"
        style={{
          background: 'linear-gradient(160deg, #0b1220 0%, #0d1729 40%, #071018 100%)',
          paddingTop: 'calc(var(--nav-height) + 40px)',
        }}
      >
        {/* Background */}
        <div className="absolute inset-0 pointer-events-none">
          <div style={{ position:'absolute', top:'15%', left:'8%', width:500, height:500, background:'radial-gradient(circle, rgba(14,165,233,0.09) 0%, transparent 70%)', borderRadius:'50%'}}/>
          <div style={{ position:'absolute', bottom:'20%', right:'5%', width:400, height:400, background:'radial-gradient(circle, rgba(37,99,235,0.07) 0%, transparent 70%)', borderRadius:'50%'}}/>
          <div style={{ position:'absolute', top:'50%', left:'45%', width:600, height:300, background:'radial-gradient(ellipse, rgba(14,165,233,0.04) 0%, transparent 70%)', borderRadius:'50%'}}/>
          {/* Grid */}
          <div style={{
            position:'absolute', inset:0,
            backgroundImage:'linear-gradient(rgba(148,163,184,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.025) 1px, transparent 1px)',
            backgroundSize:'80px 80px',
          }}/>
        </div>

        <div className="relative max-w-[1200px] mx-auto px-4 sm:px-6 w-full pb-16 sm:pb-24">
          <div className={`grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center ${isAr ? 'lg:grid-flow-col-dense' : ''}`}>

            {/* Copy */}
            <div className={isAr ? 'lg:order-2 text-right' : ''}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
              >
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold text-sky-400 border border-sky-500/20 bg-sky-500/8 mb-6">
                  <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse"/>
                  {isAr ? 'الصين ↔ الجزائر' : 'Chine ↔ Algérie'}
                </div>
              </motion.div>

              <motion.h1
                className={`text-[34px] sm:text-[46px] lg:text-[60px] font-bold leading-[1.1] text-white mb-6 ${isAr ? 'font-arabic' : ''}`}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
              >
                {isAr ? (
                  <>
                    <span className="gradient-text">نظام تشغيل</span>
                    <br/>الاستيراد من الصين<br/>إلى الجزائر
                  </>
                ) : (
                  <>
                    Le <span className="gradient-text">système d'exploitation</span>
                    <br/>de l'import Chine<br/>→ Algérie
                  </>
                )}
              </motion.h1>

              <motion.p
                className="text-slate-400 text-[15px] sm:text-[17px] md:text-[18px] leading-relaxed mb-8 max-w-[480px]"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
              >
                {isAr
                  ? 'استبدل Excel وواتساب والأدوات المتفرقة بمساحة عمل واحدة للبضائع والموردين والوكلاء والمدفوعات والتتبع.'
                  : "Remplacez Excel, WhatsApp et les outils éparpillés par un seul workspace pour les marchandises, fournisseurs, agents, paiements et le suivi."}
              </motion.p>

              <motion.div
                className={`flex flex-col sm:flex-row gap-3 ${isAr ? 'sm:flex-row-reverse sm:justify-end' : ''}`}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.55 }}
              >
                <motion.div whileTap={{ scale: 0.97 }}>
                  <Link
                    to="/contact?intent=demo"
                    className="inline-flex items-center justify-center gap-2 px-7 py-3.5 text-[15px] font-semibold text-white bg-sky-500 hover:bg-sky-400 rounded-xl transition-colors shadow-lg shadow-sky-500/25 w-full sm:w-auto"
                  >
                    {isAr ? 'طلب عرض تجريبي' : 'Demander une démo'}
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d={isAr ? 'M19 12H5m0 0l6 6m-6-6l6-6' : 'M5 12h14m0 0l-6-6m6 6l-6 6'}/>
                    </svg>
                  </Link>
                </motion.div>
                <Link to="/login"
                  className="inline-flex items-center justify-center px-7 py-3.5 text-[15px] font-medium text-slate-300 hover:text-white border border-slate-700/50 hover:border-slate-500 rounded-xl transition-all w-full sm:w-auto"
                >
                  {isAr ? 'الدخول للمنصة' : 'Connexion workspace'}
                </Link>
              </motion.div>

              {/* Trust signals */}
              <motion.div
                className={`mt-8 flex flex-wrap gap-x-6 gap-y-2 text-slate-500 text-[13px] ${isAr ? 'justify-end' : ''}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
              >
                {[
                  { fr: '✓ Prix en DZD', ar: '✓ أسعار بالدينار' },
                  { fr: '✓ Arabe + Français', ar: '✓ عربي + فرنسي' },
                  { fr: '✓ Cloud sécurisé', ar: '✓ سحابة آمنة' },
                ].map((t) => <span key={t.fr}>{t[lang]}</span>)}
              </motion.div>
            </div>

            {/* Visual: route + glass cards */}
            <div className={`relative min-h-[240px] md:min-h-[320px] ${isAr ? 'lg:order-1' : ''}`}>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.8 }}
                className="relative min-h-[240px] md:min-h-[320px]"
              >
                <div className="opacity-70">
                  <RoutePath />
                </div>

                {/* Floating cards — hidden on narrow phones to avoid overflow */}
                <div className="hidden md:block absolute inset-0 flex items-center justify-center pointer-events-none overflow-visible">
                  <motion.div
                    className="absolute animate-float"
                    style={{ top: '5%', right: '2%' }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.8, duration: 0.6 }}
                  >
                    <GoodsStatusCard />
                  </motion.div>
                  <motion.div
                    className="absolute animate-float-delay"
                    style={{ bottom: '8%', left: '2%' }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 2.1, duration: 0.6 }}
                  >
                    <SupplierCard />
                  </motion.div>
                  <motion.div
                    className="absolute animate-float-delay2"
                    style={{ top: '35%', left: '10%' }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 2.4, duration: 0.6 }}
                  >
                    <QRCard />
                  </motion.div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
          animate={reduced ? {} : { y: [0, 8, 0] }}
          transition={{ duration: 1.8, repeat: Infinity }}
        >
          <div className="w-5 h-8 rounded-full border border-slate-600/50 flex items-start justify-center pt-1.5">
            <div className="w-1 h-2 bg-sky-500/60 rounded-full"/>
          </div>
        </motion.div>
      </section>

      {/* ── H2 PAIN GRID ───────────────────────────────────────── */}
      <section className="section-pad" style={{ background: '#f9fafb' }}>
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
          <SectionReveal>
            <div className={`text-center mb-10 sm:mb-14 ${isAr ? 'font-arabic' : ''}`}>
              <h2 className="text-[26px] sm:text-[32px] md:text-[40px] font-bold text-slate-900 mb-4">
                {isAr ? 'عملياتك تعمل على الأمل' : "Votre opération tourne à l'espoir"}
              </h2>
              <p className="text-slate-500 text-[15px] sm:text-[17px] max-w-xl mx-auto">
                {isAr
                  ? 'الجداول الحسابية وخيوط الدردشة وملفات PDF ليست نظاماً لسلسلة التوريد.'
                  : "Les feuilles Excel, threads de chat et PDFs ne font pas un système de supply chain."}
              </p>
            </div>
          </SectionReveal>

          <StaggerReveal className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            {[
              {
                icon: '📦',
                color: '#0ea5e9',
                fr: { title: 'Perdu dans les expéditions', body: 'Le statut du conteneur vit dans trois chats et deux Excel. Personne ne sait « où en est la marchandise » sans appeler.' },
                ar: { title: 'ضياع في الشحنات', body: 'حالة الحاوية تعيش في ثلاث محادثات وجدولين. لا أحد يعرف "أين البضاعة" دون الاتصال.' },
                img: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=600&h=300&fit=crop&auto=format',
              },
              {
                icon: '🏭',
                color: '#10b981',
                fr: { title: 'Chaos fournisseurs', body: "Plusieurs feuilles, numéros contradictoires, pas de solde unique. Onboarder quelqu'un signifie lui enseigner votre Excel personnel." },
                ar: { title: 'فوضى الموردين', body: 'أوراق متعددة، أرقام متضاربة، لا رصيد موحد. تدريب شخص جديد يعني تعليمه جداولك الشخصية.' },
                img: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=600&h=300&fit=crop&auto=format',
              },
              {
                icon: '💱',
                color: '#f59e0b',
                fr: { title: 'Confusion devises & coûts', body: 'Calcul mental entre CNY, USD, EUR et DZD. Fret, assurance, droits, commission ajoutés dans des apps différentes.' },
                ar: { title: 'ارتباك العملات والتكاليف', body: 'حساب ذهني بين اليوان والدولار واليورو والدينار. شحن وتأمين ورسوم وعمولة في تطبيقات مختلفة.' },
                img: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=600&h=300&fit=crop&auto=format',
              },
              {
                icon: '📄',
                color: '#e11d48',
                fr: { title: 'Chasse aux documents', body: "PDFs dans les emails, galeries de téléphone, clés USB et « le dossier sur l'ordinateur de Karim ». Le jour de douane devient de l'archéologie." },
                ar: { title: 'صيد الوثائق', body: 'ملفات PDF في البريد الإلكتروني وألبومات الهاتف والمجلدات. يوم الجمارك يصبح تنقيباً أثرياً.' },
                img: 'https://images.unsplash.com/photo-1568667256549-094345857637?w=600&h=300&fit=crop&auto=format',
              },
            ].map((card) => (
              <StaggerItem key={card.fr.title}>
                <motion.div
                  className="group relative rounded-2xl overflow-hidden bg-white border border-slate-100 card-lift"
                  style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}
                >
                  <div className="relative h-44 overflow-hidden">
                    <img
                      src={card.img}
                      alt={card.fr.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      style={{ filter: 'saturate(0.4) brightness(0.7)' }}
                    />
                    <div className="absolute inset-0" style={{ background: `linear-gradient(to bottom, transparent 30%, rgba(15,23,42,0.7) 100%)` }}/>
                    <div
                      className="absolute top-3 left-3 w-10 h-10 rounded-xl flex items-center justify-center text-lg"
                      style={{ background: `${card.color}22`, border: `1px solid ${card.color}44` }}
                    >
                      {card.icon}
                    </div>
                  </div>
                  <div className="p-5">
                    <h3 className={`text-slate-900 font-semibold text-[16px] mb-2 ${isAr ? 'font-arabic text-right' : ''}`}>
                      {card[lang].title}
                    </h3>
                    <p className={`text-slate-500 text-[14px] leading-relaxed ${isAr ? 'font-arabic text-right' : ''}`}>
                      {card[lang].body}
                    </p>
                  </div>
                </motion.div>
              </StaggerItem>
            ))}
          </StaggerReveal>
        </div>
      </section>

      {/* ── H3 CONSEQUENCES BAND ───────────────────────────────── */}
      <section
        className="relative section-pad overflow-hidden"
        style={{ background: 'linear-gradient(160deg, #070e1a 0%, #0b1828 50%, #060f1c 100%)' }}
      >
        <div className="absolute inset-0 pointer-events-none">
          <img
            src="https://images.unsplash.com/photo-1578575437130-527eed3abbec?w=1600&h=800&fit=crop&auto=format"
            alt=""
            className="w-full h-full object-cover opacity-10"
            style={{ filter: 'saturate(0.3)' }}
          />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(7,14,26,0.8) 0%, rgba(7,14,26,0.6) 50%, rgba(7,14,26,0.9) 100%)' }}/>
        </div>

        <div className="relative max-w-[1200px] mx-auto px-4 sm:px-6 text-center">
          <SectionReveal>
            <h2 className={`text-[24px] sm:text-[32px] md:text-[42px] font-bold text-white mb-5 ${isAr ? 'font-arabic' : ''}`}>
              {isAr
                ? 'كل حالة فائتة = أموال عالقة في البحر المتوسط'
                : 'Chaque statut manqué = du cash bloqué en Méditerranée'}
            </h2>
            <p className="text-slate-400 text-[15px] sm:text-[17px] max-w-2xl mx-auto mb-10 sm:mb-14">
              {isAr
                ? 'التأخيرات تتراكم. النزاعات تتضاعف. آخر الشهر يتحول إلى تحقيق.'
                : "Les retards s'accumulent. Les litiges se multiplient. La fin de mois devient une enquête."}
            </p>
          </SectionReveal>

          <StaggerReveal className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 max-w-3xl mx-auto">
            {[
              { num: isAr ? 'مسار واحد' : 'Un seul timeline', label: isAr ? 'الصين والجزائر معاً' : 'Chine + Algérie ensemble' },
              { num: isAr ? 'رصيد واحد' : 'Un solde fournisseur', label: isAr ? 'موثوق دائماً' : 'Toujours fiable' },
              { num: isAr ? 'سجل واحد' : 'Un historique', label: isAr ? 'يحفظ الوقائع' : 'Qui garde les faits' },
            ].map((stat) => (
              <StaggerItem key={stat.num}>
                <div className="glass-light rounded-2xl p-6">
                  <div className="gradient-text text-[26px] font-bold font-price mb-2">{stat.num}</div>
                  <div className="text-slate-400 text-sm">{stat.label}</div>
                </div>
              </StaggerItem>
            ))}
          </StaggerReveal>
        </div>
      </section>

      {/* ── H4 INTRODUCE CARGOBRIDGE ───────────────────────────── */}
      <section className="section-pad" style={{ background: '#f9fafb' }}>
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
          <div className={`grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14 items-center ${isAr ? 'lg:grid-flow-col-dense' : ''}`}>
            <SectionReveal className={isAr ? 'lg:order-2 text-right' : ''}>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold text-emerald-600 border border-emerald-200 bg-emerald-50 mb-5">
                {isAr ? '✦ الحل' : '✦ La solution'}
              </div>
              <h2 className={`text-[26px] sm:text-[34px] md:text-[40px] font-bold text-slate-900 mb-5 leading-tight ${isAr ? 'font-arabic' : ''}`}>
                {isAr
                  ? 'مساحة عمل واحدة لحلقة الاستيراد كاملة'
                  : 'Un seul workspace pour toute la boucle import'}
              </h2>
              <p className="text-slate-500 text-[15px] sm:text-[17px] leading-relaxed mb-6">
                {isAr
                  ? 'بضائع، موردون، وكلاء، مشتريات، مدفوعات، حاسبة، تتبع QR، وسجل — مبني لفرق الصين والجزائر.'
                  : "Marchandises, fournisseurs, agents, achats, paiements, calculateur, QR tracking et historique — conçu pour les équipes Chine ↔ Algérie."}
              </p>
              <motion.div whileTap={{ scale: 0.97 }}>
                <Link
                  to="/features"
                  className="inline-flex items-center gap-2 px-6 py-3 text-[15px] font-semibold text-white bg-sky-500 hover:bg-sky-400 rounded-xl transition-colors"
                >
                  {isAr ? 'استعرض المميزات' : 'Explorer les fonctionnalités'}
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d={isAr ? 'M19 12H5' : 'M5 12h14m0 0l-6-6m6 6l-6 6'}/>
                  </svg>
                </Link>
              </motion.div>
            </SectionReveal>

            {/* Dashboard mock */}
            <SectionReveal delay={0.15} className={isAr ? 'lg:order-1' : ''}>
              <div className="rounded-2xl overflow-hidden shadow-2xl" style={{ background: '#0f172a', border: '1px solid rgba(148,163,184,0.1)' }}>
                {/* Header */}
                <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-700/50">
                  <div className="flex gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-rose-500/60"/><div className="w-2.5 h-2.5 rounded-full bg-amber-500/60"/><div className="w-2.5 h-2.5 rounded-full bg-emerald-500/60"/></div>
                  <div className="flex-1 mx-4 bg-slate-800/60 rounded-md h-5 flex items-center px-3">
                    <span className="text-slate-500 text-[10px]">cargobridge.app/goods</span>
                  </div>
                </div>
                {/* Sidebar + content */}
                <div className="flex min-h-[300px]">
                  <div className="w-12 bg-slate-900/60 border-r border-slate-700/30 flex flex-col items-center py-4 gap-4">
                    {['📦','🏭','🤝','💳','🧮'].map((icon, i) => (
                      <div key={i} className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm ${i === 0 ? 'bg-sky-500/20' : ''}`}>{icon}</div>
                    ))}
                  </div>
                  <div className="flex-1 p-4">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-white text-sm font-semibold">Marchandises</span>
                      <span className="chip chip-transit text-[10px]">3 en transit</span>
                    </div>
                    <div className="space-y-2">
                      {[
                        { ref: 'CB-0891', name: 'Électronique Samsung', status: 'chip-transit', s: 'Transit', weight: '240 kg', supplier: 'Shanghai Global' },
                        { ref: 'CB-0892', name: 'Textiles Shein × 120', status: 'chip-arrived', s: 'Arrivé', weight: '180 kg', supplier: 'Guangzhou Trade' },
                        { ref: 'CB-0887', name: 'Pièces Auto — Lot B', status: 'chip-pending', s: 'Douane', weight: '420 kg', supplier: 'Beijing Parts Co.' },
                        { ref: 'CB-0885', name: 'Accessoires Maison', status: 'chip-draft', s: 'Livré', weight: '95 kg', supplier: 'Yiwu Market' },
                      ].map((row) => (
                        <div key={row.ref} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-800/50 transition-colors cursor-default">
                          <div className="w-6 h-6 rounded-md bg-sky-500/10 flex items-center justify-center">
                            <svg viewBox="0 0 16 16" fill="none" className="w-3.5 h-3.5"><rect x="2" y="4" width="12" height="9" rx="1.5" fill="#0ea5e9" opacity="0.5"/><rect x="5" y="2" width="6" height="3" rx="1" fill="#0ea5e9"/></svg>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-white text-[12px] font-medium truncate">{row.name}</div>
                            <div className="text-slate-500 text-[10px] font-mono">{row.ref} · {row.supplier}</div>
                          </div>
                          <span className={`chip ${row.status} text-[9px]`}>{row.s}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </SectionReveal>
          </div>
        </div>
      </section>

      {/* ── H5 SOLUTION PILLARS ────────────────────────────────── */}
      <section className="section-pad" style={{ background: '#ffffff' }}>
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
          <SectionReveal className="text-center mb-10 sm:mb-14">
            <h2 className={`text-[24px] sm:text-[32px] md:text-[38px] font-bold text-slate-900 mb-3 ${isAr ? 'font-arabic' : ''}`}>
              {isAr ? 'ثلاثة مبادئ. وضوح كامل.' : 'Trois piliers. Clarté totale.'}
            </h2>
          </SectionReveal>

          <StaggerReveal className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
            {[
              {
                icon: '👁',
                color: '#0ea5e9',
                fr: { title: 'Tout voir', body: "Partagez la vérité sur les expéditions et partenaires. Quand Alger marque arrivé, la Chine peut le voir." },
                ar: { title: 'رؤية كاملة', body: 'شارك حقيقة الشحنات والشركاء. عندما تسجل الجزائر "وصل"، يراه الفريق في الصين.' },
              },
              {
                icon: '💰',
                color: '#10b981',
                fr: { title: "Contrôler l'argent", body: "Paiements, soldes et clarté des coûts. Faites les calculs avant que l'argent ne bouge." },
                ar: { title: 'السيطرة على المال', body: 'المدفوعات والأرصدة ووضوح التكاليف. افعل الحسابات قبل أن تتحرك الأموال.' },
              },
              {
                icon: '📜',
                color: '#a78bfa',
                fr: { title: "Prouver l'historique", body: "Journal d'audit des décisions et litiges. Quand quelque chose change, l'historique garde le reçu." },
                ar: { title: 'إثبات السجل', body: 'سجل تدقيق للقرارات والنزاعات. عندما يتغير شيء، السجل يحفظ الوصل.' },
              },
            ].map((p, i) => (
              <StaggerItem key={i}>
                <div
                  className="rounded-2xl p-7 border card-lift"
                  style={{ borderColor: 'rgba(148,163,184,0.12)', background: '#fafbfc' }}
                >
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl mb-5"
                    style={{ background: `${p.color}15`, border: `1px solid ${p.color}30` }}
                  >
                    {p.icon}
                  </div>
                  <div style={{ width: 40, height: 3, background: p.color, borderRadius: 2, marginBottom: 16 }}/>
                  <h3 className={`text-slate-900 text-[18px] font-bold mb-3 ${isAr ? 'font-arabic text-right' : ''}`}>{p[lang].title}</h3>
                  <p className={`text-slate-500 text-[14px] leading-relaxed ${isAr ? 'font-arabic text-right' : ''}`}>{p[lang].body}</p>
                </div>
              </StaggerItem>
            ))}
          </StaggerReveal>
        </div>
      </section>

      {/* ── H6 MODULE MARQUEE ──────────────────────────────────── */}
      <section className="py-16 overflow-hidden" style={{ background: '#f4f6f8', borderTop: '1px solid rgba(148,163,184,0.1)', borderBottom: '1px solid rgba(148,163,184,0.1)' }}>
        <SectionReveal>
          <div className={`text-center mb-10 px-6 ${isAr ? 'font-arabic' : ''}`}>
            <p className="text-slate-500 text-sm font-semibold uppercase tracking-widest">
              {isAr ? 'المنصة الكاملة' : 'La plateforme complète'}
            </p>
          </div>
        </SectionReveal>

        <div className="marquee-wrapper overflow-hidden">
          <div className="animate-marquee gap-3 sm:gap-4 flex">
            {[...modules, ...modules].map((m, i) => (
              <div
                key={i}
                className="flex-shrink-0 flex items-center gap-2 sm:gap-3 px-4 sm:px-5 py-3 sm:py-3.5 rounded-2xl border bg-white card-lift cursor-default"
                style={{ borderColor: 'rgba(148,163,184,0.12)', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
              >
                <span className="text-2xl">{m.icon}</span>
                <span className="text-slate-700 font-semibold text-[14px] whitespace-nowrap">{m[lang]}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── H7 BENEFITS ────────────────────────────────────────── */}
      <section className="section-pad" style={{ background: '#ffffff' }}>
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
          <div className={`grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14 items-center ${isAr ? 'lg:grid-flow-col-dense' : ''}`}>
            <SectionReveal className={isAr ? 'lg:order-2 text-right' : ''}>
              <h2 className={`text-[24px] sm:text-[32px] md:text-[38px] font-bold text-slate-900 mb-6 sm:mb-8 leading-tight ${isAr ? 'font-arabic' : ''}`}>
                {isAr
                  ? 'ما الذي يتغير عندما تجد الحقيقة مكاناً لها'
                  : 'Ce qui change quand la vérité a un foyer'}
              </h2>
              <div className="space-y-5">
                {[
                  { icon: '⚡', fr: 'Moins de litiges sur les statuts', ar: 'نزاعات أقل على الحالات' },
                  { icon: '💸', fr: 'Clarté des paiements plus rapide', ar: 'وضوح أسرع للمدفوعات' },
                  { icon: '🌐', fr: 'Équipes bilingues débloquées', ar: 'فرق ثنائية اللغة تعمل بسلاسة' },
                  { icon: '📱', fr: 'Opérations mobiles pour les équipes terrain', ar: 'عمليات موبايل للفرق الميدانية' },
                  { icon: '🧑‍💼', fr: "Onboarding qui n'est pas du folklore", ar: 'تأهيل موظفين بنظام لا بخرافات' },
                ].map((b) => (
                  <div key={b.fr} className={`flex items-start gap-4 ${isAr ? 'flex-row-reverse' : ''}`}>
                    <div className="w-10 h-10 flex-shrink-0 rounded-xl bg-sky-50 border border-sky-100 flex items-center justify-center text-lg">
                      {b.icon}
                    </div>
                    <p className="text-slate-700 text-[15px] pt-2 font-medium">{b[lang]}</p>
                  </div>
                ))}
              </div>
            </SectionReveal>

            {/* Phone mock */}
            <SectionReveal delay={0.1} className={isAr ? 'lg:order-1' : ''}>
              <div className="flex justify-center">
                <div
                  className="relative w-[min(260px,80vw)] rounded-[36px] overflow-hidden shadow-2xl"
                  style={{ background: '#0f172a', border: '8px solid #1e293b', boxShadow: '0 40px 80px rgba(0,0,0,0.4)' }}
                >
                  {/* Notch */}
                  <div className="h-7 bg-slate-900 flex items-center justify-center">
                    <div className="w-20 h-4 rounded-full bg-slate-800"/>
                  </div>
                  {/* Screen */}
                  <div className="p-4">
                    <div className="text-sky-400 text-xs font-semibold mb-3 text-center">{isAr ? 'CargoBridge موبايل' : 'CargoBridge Mobile'}</div>
                    <div className="grid grid-cols-3 gap-2 mb-4">
                      {[
                        { icon: '📦', fr: 'Goods', ar: 'بضائع', color: '#0ea5e9' },
                        { icon: '🏭', fr: 'Fourniss.', ar: 'موردون', color: '#10b981' },
                        { icon: '📱', fr: 'Scanner', ar: 'مسح', color: '#a78bfa' },
                        { icon: '💳', fr: 'Paiements', ar: 'دفعات', color: '#f59e0b' },
                        { icon: '🧮', fr: 'Calcul.', ar: 'حاسبة', color: '#38bdf8' },
                        { icon: '📜', fr: 'Historiq.', ar: 'سجل', color: '#34d399' },
                      ].map((app) => (
                        <div key={app.fr} className="flex flex-col items-center gap-1 p-2 rounded-xl" style={{ background: `${app.color}15` }}>
                          <span className="text-lg">{app.icon}</span>
                          <span className="text-[9px] text-slate-400 text-center">{app[lang]}</span>
                        </div>
                      ))}
                    </div>
                    {/* Status card */}
                    <div className="glass-card rounded-xl p-3">
                      <div className="text-slate-400 text-[10px] mb-2">{isAr ? 'آخر تحديث' : 'Dernière activité'}</div>
                      <div className="flex items-center gap-2">
                        <span className="chip chip-arrived text-[9px]">{isAr ? 'وصل' : 'Arrivé'}</span>
                        <span className="text-white text-[11px]">CB-0892 · Textiles</span>
                      </div>
                    </div>
                  </div>
                  {/* Bottom bar */}
                  <div className="h-8 bg-slate-900/50 flex items-center justify-center">
                    <div className="w-24 h-1 rounded-full bg-slate-600"/>
                  </div>
                </div>
              </div>
            </SectionReveal>
          </div>
        </div>
      </section>

      {/* ── H8 PRICING TEASER ──────────────────────────────────── */}
      <section className="section-pad" style={{ background: 'linear-gradient(180deg, #f9fafb 0%, #eef2f7 100%)' }}>
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
          <SectionReveal className={`text-center mb-8 sm:mb-12 ${isAr ? 'font-arabic' : ''}`}>
            <h2 className="text-[24px] sm:text-[32px] md:text-[38px] font-bold text-slate-900 mb-3">
              {isAr ? 'أسعار واضحة بالدينار الجزائري' : 'Tarifs clairs en Dinar algérien'}
            </h2>
            <p className="text-slate-500 text-[16px]">
              {isAr ? 'لا مفاجآت بالدولار لمشغلين يضعون ميزانياتهم بالدينار.' : "Pas de surprise en USD pour des opérateurs qui budgétisent en DZD."}
            </p>
          </SectionReveal>

          <StaggerReveal className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 max-w-3xl mx-auto">
            {[
              {
                plan: { fr: 'Starter', ar: 'المبتدئ' },
                price: '70,000',
                users: { fr: "Jusqu'à 5 utilisateurs", ar: 'حتى 5 مستخدمين' },
                msg: { fr: 'Arrêtez de gérer depuis un thread de chat.', ar: 'توقف عن إدارة الشركة من محادثة.' },
                highlight: false,
              },
              {
                plan: { fr: 'Business', ar: 'الأعمال' },
                price: '99,000',
                users: { fr: "Jusqu'à 10 utilisateurs", ar: 'حتى 10 مستخدمين' },
                msg: { fr: "La Chine et l'Algérie partagent enfin un timeline.", ar: 'الصين والجزائر يشتركان أخيراً في مسار واحد.' },
                highlight: true,
              },
              {
                plan: { fr: 'Enterprise', ar: 'المؤسسات' },
                price: null,
                users: { fr: 'Personnalisé', ar: 'مخصص' },
                msg: { fr: 'Vos règles opérationnelles, notre plateforme.', ar: 'قواعد عملك، منصتنا.' },
                highlight: false,
              },
            ].map((plan) => (
              <StaggerItem key={plan.plan.fr}>
                <div
                  className="relative rounded-2xl p-6 card-lift"
                  style={{
                    background: plan.highlight ? '#0f172a' : '#ffffff',
                    border: plan.highlight ? '1px solid rgba(14,165,233,0.3)' : '1px solid rgba(148,163,184,0.15)',
                    boxShadow: plan.highlight ? '0 8px 32px rgba(14,165,233,0.12)' : '0 4px 16px rgba(0,0,0,0.06)',
                  }}
                >
                  {plan.highlight && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 text-[11px] font-semibold text-sky-400 bg-navy-950 border border-sky-500/30 rounded-full whitespace-nowrap">
                      {isAr ? 'الأكثر اختياراً' : 'Le plus choisi'}
                    </div>
                  )}
                  <div className={`text-[13px] font-semibold mb-3 ${plan.highlight ? 'text-sky-400' : 'text-slate-500'}`}>{plan.plan[lang]}</div>
                  {plan.price ? (
                    <div className="mb-1">
                      <span className={`font-price text-[28px] font-bold ${plan.highlight ? 'text-white' : 'text-slate-900'}`}>{plan.price}</span>
                      <span className={`text-sm ml-1 ${plan.highlight ? 'text-slate-400' : 'text-slate-500'}`}>DZD</span>
                    </div>
                  ) : (
                    <div className={`font-semibold text-[18px] mb-1 ${plan.highlight ? 'text-white' : 'text-slate-900'}`}>
                      {isAr ? 'تواصل معنا' : 'Contactez-nous'}
                    </div>
                  )}
                  <div className={`text-[12px] mb-4 ${plan.highlight ? 'text-slate-400' : 'text-slate-500'}`}>{plan.users[lang]}</div>
                  <p className={`text-[13px] leading-relaxed mb-5 ${plan.highlight ? 'text-slate-300' : 'text-slate-600'}`}>{plan.msg[lang]}</p>
                  <Link
                    to={plan.price ? '/contact?intent=demo' : '/contact?intent=sales'}
                    className={`block text-center py-2.5 rounded-xl text-[13px] font-semibold transition-colors ${
                      plan.highlight
                        ? 'bg-sky-500 hover:bg-sky-400 text-white'
                        : 'border border-slate-200 hover:border-slate-400 text-slate-700 hover:text-slate-900'
                    }`}
                  >
                    {plan.price ? (isAr ? 'طلب عرض' : 'Demander une démo') : (isAr ? 'تواصل للمبيعات' : 'Contacter les ventes')}
                  </Link>
                </div>
              </StaggerItem>
            ))}
          </StaggerReveal>

          <SectionReveal className="text-center mt-8">
            <Link to="/pricing" className="text-sky-500 hover:text-sky-400 text-[14px] font-semibold transition-colors">
              {isAr ? 'عرض الأسعار الكاملة ←' : 'Voir les tarifs complets →'}
            </Link>
          </SectionReveal>
        </div>
      </section>

      {/* ── H9 FAQ ─────────────────────────────────────────────── */}
      <section className="section-pad" style={{ background: '#ffffff' }}>
        <div className="max-w-[760px] mx-auto px-4 sm:px-6">
          <SectionReveal className={`text-center mb-10 ${isAr ? 'font-arabic' : ''}`}>
            <h2 className="text-[22px] sm:text-[28px] md:text-[34px] font-bold text-slate-900 mb-3">
              {isAr ? 'أسئلة شائعة' : 'Questions fréquentes'}
            </h2>
          </SectionReveal>
          <FAQAccordion items={faqData[lang]} isAr={isAr} />
          <SectionReveal className="text-center mt-8">
            <Link to="/faq" className="text-sky-500 hover:text-sky-400 text-sm font-semibold">
              {isAr ? 'المزيد من الأسئلة ←' : 'Plus de questions →'}
            </Link>
          </SectionReveal>
        </div>
      </section>

      {/* ── H10 CLOSING CTA ────────────────────────────────────── */}
      <CTABand />

    </div>
  )
}
