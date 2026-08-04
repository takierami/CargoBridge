import { Link } from 'react-router'
import { motion } from 'framer-motion'
import { useLang } from '../context/LangContext'
import SectionReveal, { StaggerReveal, StaggerItem } from '../components/SectionReveal'
import FAQAccordion from '../components/FAQAccordion'
import CTABand from '../components/CTABand'

const features = [
  { fr: 'Utilisateurs', ar: 'المستخدمون', starter: '5 utilisateurs', business: '10 utilisateurs', enterprise: { fr: 'Personnalisé', ar: 'مخصص' } },
  { fr: 'Marchandises & suivi', ar: 'البضائع والتتبع', starter: '✓', business: '✓', enterprise: '✓' },
  { fr: 'Fournisseurs & achats', ar: 'الموردون والشراء', starter: '✓', business: '✓', enterprise: '✓' },
  { fr: 'Opérations de paiement', ar: 'عمليات الدفع', starter: '✓', business: '✓', enterprise: '✓' },
  { fr: 'Agents', ar: 'الوكلاء', starter: '✓', business: '✓', enterprise: '✓' },
  { fr: 'QR / Scanner', ar: 'QR / مسح', starter: '✓', business: '✓', enterprise: '✓' },
  { fr: 'Calculateur métier', ar: 'حاسبة الأعمال', starter: '✓', business: '✓', enterprise: '✓' },
  { fr: 'Historique & audit', ar: 'السجل والتدقيق', starter: '✓', business: '✓', enterprise: '✓' },
  { fr: 'Modèles & documents', ar: 'النماذج والوثائق', starter: '✓', business: '✓', enterprise: '✓' },
  { fr: 'Support onboarding', ar: 'دعم التأهيل', starter: { fr: 'Standard', ar: 'قياسي' }, business: { fr: 'Prioritaire', ar: 'أولوية' }, enterprise: { fr: 'Dédié', ar: 'مخصص' } },
  { fr: 'Support prioritaire', ar: 'دعم أولوية', starter: '—', business: '✓', enterprise: '✓' },
]

const faqPricing = {
  fr: [
    { q: "Qui contacter pour la facturation ?", a: "Contactez-nous via /contact — nous vous guiderons sur le processus de facturation." },
    { q: "Qu'est-ce qu'une démo couvre ?", a: "Votre boucle import réelle : marchandises, fournisseurs, paiements, suivi — pas une visite générique des fonctionnalités." },
    { q: "Comment fonctionnent les sièges ?", a: "Starter : jusqu'à 5 utilisateurs. Business : jusqu'à 10 utilisateurs. Enterprise : personnalisé selon vos besoins." },
    { q: "Comment passer à Enterprise ?", a: "Contactez notre équipe commerciale — nous proposerons un plan adapté à votre volume et processus." },
  ],
  ar: [
    { q: "من أتصل للفوترة؟", a: "تواصل معنا عبر /contact — سنرشدك خلال عملية الفوترة." },
    { q: "ماذا تغطي الديمو؟", a: "حلقة استيرادك الفعلية: بضائع وموردون ومدفوعات وتتبع — وليس جولة ميزات عامة." },
    { q: "كيف تعمل المقاعد؟", a: "Starter: حتى 5 مستخدمين. Business: حتى 10 مستخدمين. Enterprise: مخصص حسب احتياجاتك." },
    { q: "كيف أنتقل إلى Enterprise؟", a: "تواصل مع فريق المبيعات — سنقترح خطة مناسبة لحجمك وعملياتك." },
  ],
}

export default function Pricing() {
  const { lang, isAr } = useLang()

  return (
    <div style={{ background: '#f9fafb' }}>
      {/* Hero */}
      <section
        className="relative section-pad text-center"
        style={{
          paddingTop: 'calc(var(--nav-height) + 80px)',
          background: 'linear-gradient(160deg, #0b1220 0%, #0d1729 60%, #0b1220 100%)',
        }}
      >
        <div className="absolute inset-0 pointer-events-none">
          <div style={{ position:'absolute', top:'20%', left:'50%', transform:'translateX(-50%)', width:600, height:400, background:'radial-gradient(ellipse, rgba(14,165,233,0.08) 0%, transparent 70%)', borderRadius:'50%'}}/>
        </div>
        <div className="relative max-w-[760px] mx-auto px-4 sm:px-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold text-sky-400 border border-sky-500/20 bg-sky-500/8 mb-6">
              {isAr ? 'أسعار واضحة' : 'Tarification claire'}
            </div>
            <h1 className={`text-[30px] sm:text-[40px] md:text-[52px] font-bold text-white mb-5 leading-tight ${isAr ? 'font-arabic' : ''}`}>
              {isAr
                ? 'خطط بسيطة. دينار جزائري. للمشغلين.'
                : 'Plans simples. Dinar algérien. Pour les opérateurs.'}
            </h1>
            <p className="text-slate-400 text-[15px] sm:text-[17px] mb-3">
              {isAr
                ? 'اختر حجم مساحة العمل المناسب لفريقك — ثم اكتشف CargoBridge بعرض توضيحي.'
                : "Choisissez la taille de workspace adaptée à votre équipe — puis découvrez CargoBridge avec une démo."}
            </p>
            <p className="text-sky-400/70 text-[13px]">
              {isAr
                ? 'أسعار بالدينار الجزائري للمشغلين الجزائريين — لا ألعاب تحويل USD خفية.'
                : "Prix en DZD pour les opérateurs algériens — pas de jeux de conversion USD cachés."}
            </p>
          </motion.div>
        </div>
      </section>

      {/* Pricing cards */}
      <section className="section-pad" style={{ background: 'linear-gradient(180deg, #0b1220 0%, #f9fafb 30%)' }}>
        <div className="max-w-[1100px] mx-auto px-4 sm:px-6">
          <StaggerReveal className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5 sm:gap-6">
            {[
              {
                plan: { fr: 'Starter', ar: 'المبتدئ' },
                price: '70,000',
                users: { fr: "Jusqu'à 5 utilisateurs", ar: 'حتى 5 مستخدمين' },
                ideal: { fr: 'Importateurs solo et petites équipes', ar: 'المستوردون المنفردون والفرق الصغيرة' },
                tagline: { fr: 'Arrêtez de gérer depuis un thread de chat.', ar: 'توقف عن إدارة الشركة من محادثة.' },
                cta: { fr: 'Demander une démo', ar: 'طلب عرض' },
                intent: 'demo',
                highlight: false,
                navy: false,
                feats: ['5 utilisateurs', '✓ Marchandises & suivi', '✓ Fournisseurs', '✓ Paiements', '✓ QR/Scanner', '✓ Calculateur'],
              },
              {
                plan: { fr: 'Business', ar: 'الأعمال' },
                price: '99,000',
                users: { fr: "Jusqu'à 10 utilisateurs", ar: 'حتى 10 مستخدمين' },
                ideal: { fr: 'Sociétés commerciales en croissance Chine + Algérie', ar: 'شركات تجارية نامية بالصين والجزائر' },
                tagline: { fr: "La Chine et l'Algérie partagent enfin un timeline.", ar: 'الصين والجزائر يشتركان أخيراً في مسار واحد.' },
                cta: { fr: 'Demander une démo', ar: 'طلب عرض' },
                intent: 'demo',
                highlight: true,
                navy: false,
                badge: { fr: 'Le plus choisi pour les équipes', ar: 'الأكثر اختياراً للفرق' },
                feats: ['10 utilisateurs', '✓ Tout Starter', '✓ Support prioritaire', '✓ Historique complet', '✓ Rapports & analytique'],
              },
              {
                plan: { fr: 'Enterprise', ar: 'المؤسسات' },
                price: null,
                users: { fr: 'Personnalisé', ar: 'مخصص' },
                ideal: { fr: 'Grandes entreprises, gouvernance, onboarding dédié', ar: 'مؤسسات كبيرة، حوكمة، تأهيل مخصص' },
                tagline: { fr: 'Vos règles opérationnelles, notre plateforme.', ar: 'قواعد عملك، منصتنا.' },
                cta: { fr: 'Contacter les ventes', ar: 'تواصل للمبيعات' },
                intent: 'sales',
                highlight: false,
                navy: true,
                feats: ['✓ Tout Business', '✓ Onboarding dédié', '✓ Support Enterprise', '✓ Processus sur mesure', '✓ Devis personnalisé'],
              },
            ].map((plan) => (
              <StaggerItem key={plan.plan.fr}>
                <motion.div
                  whileHover={{ y: -4 }}
                  transition={{ duration: 0.2 }}
                  className="relative rounded-2xl flex flex-col h-full"
                  style={{
                    background: plan.navy ? '#0f172a' : plan.highlight ? '#ffffff' : '#ffffff',
                    border: plan.highlight
                      ? '2px solid #0ea5e9'
                      : plan.navy
                      ? '1px solid rgba(148,163,184,0.12)'
                      : '1px solid rgba(148,163,184,0.15)',
                    boxShadow: plan.highlight
                      ? '0 8px 40px rgba(14,165,233,0.18), 0 2px 8px rgba(0,0,0,0.08)'
                      : plan.navy
                      ? '0 8px 32px rgba(0,0,0,0.3)'
                      : '0 4px 16px rgba(0,0,0,0.06)',
                  }}
                >
                  {plan.badge && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 text-[11px] font-bold text-white bg-sky-500 rounded-full whitespace-nowrap shadow-lg shadow-sky-500/30">
                      {plan.badge[lang]}
                    </div>
                  )}

                  <div className="p-7 flex-1">
                    <div className={`text-[12px] font-bold uppercase tracking-widest mb-4 ${plan.navy ? 'text-sky-400' : plan.highlight ? 'text-sky-600' : 'text-slate-500'}`}>
                      {plan.plan[lang]}
                    </div>

                    {plan.price ? (
                      <div className="mb-1">
                        <span className={`font-price text-[36px] font-bold ${plan.navy ? 'text-white' : 'text-slate-900'}`}>{plan.price}</span>
                        <span className={`text-[14px] ml-1.5 font-medium ${plan.navy ? 'text-slate-400' : 'text-slate-500'}`}>DZD</span>
                      </div>
                    ) : (
                      <div className={`text-[28px] font-bold mb-1 ${plan.navy ? 'text-white' : 'text-slate-900'}`}>
                        {isAr ? 'اتصل بنا' : 'Sur devis'}
                      </div>
                    )}

                    <div className={`text-[13px] mb-2 ${plan.navy ? 'text-slate-400' : 'text-slate-500'}`}>{plan.users[lang]}</div>
                    <div className={`text-[12px] mb-5 ${plan.navy ? 'text-slate-500' : 'text-slate-400'}`}>{plan.ideal[lang]}</div>

                    <p className={`text-[14px] leading-relaxed mb-6 font-medium ${plan.navy ? 'text-slate-300' : 'text-slate-600'} ${isAr ? 'font-arabic text-right' : ''}`}>
                      "{plan.tagline[lang]}"
                    </p>

                    <ul className="space-y-2.5">
                      {plan.feats.map((f, i) => {
                        const text = f.startsWith('fr:') ? f.slice(3) : f
                        return (
                          <li key={i} className={`flex items-center gap-2.5 text-[13px] ${plan.navy ? 'text-slate-300' : 'text-slate-600'} ${isAr ? 'flex-row-reverse' : ''}`}>
                            <span className="text-emerald-400 flex-shrink-0">✓</span>
                            <span>{text}</span>
                          </li>
                        )
                      })}
                    </ul>
                  </div>

                  <div className="p-7 pt-0">
                    <Link
                      to={`/contact?intent=${plan.intent}`}
                      className={`block text-center py-3 rounded-xl text-[14px] font-semibold transition-all ${
                        plan.highlight
                          ? 'bg-sky-500 hover:bg-sky-400 text-white shadow-lg shadow-sky-500/25'
                          : plan.navy
                          ? 'bg-sky-500/15 hover:bg-sky-500/25 text-sky-400 border border-sky-500/25'
                          : 'border border-slate-200 hover:border-sky-400 hover:text-sky-600 text-slate-700'
                      }`}
                    >
                      {plan.cta[lang]}
                    </Link>
                  </div>
                </motion.div>
              </StaggerItem>
            ))}
          </StaggerReveal>
        </div>
      </section>

      {/* Comparison table */}
      <section className="section-pad" style={{ background: '#ffffff' }}>
        <div className="max-w-[1100px] mx-auto px-4 sm:px-6">
          <SectionReveal className={`text-center mb-10 ${isAr ? 'font-arabic' : ''}`}>
            <h2 className="text-[22px] sm:text-[28px] md:text-[34px] font-bold text-slate-900 mb-3">
              {isAr ? 'مقارنة مفصلة' : 'Comparaison détaillée'}
            </h2>
          </SectionReveal>

          <SectionReveal>
            <div className="overflow-x-auto -mx-2 px-2 rounded-2xl">
            <div className="rounded-2xl overflow-hidden border border-slate-100 min-w-[560px]" style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}>
              <table className="w-full">
                <thead>
                  <tr style={{ background: '#0f172a' }}>
                    <th className={`px-4 sm:px-6 py-3 sm:py-4 text-left text-slate-400 text-[11px] sm:text-[12px] font-semibold uppercase tracking-wider ${isAr ? 'text-right' : ''}`}>
                      {isAr ? 'الميزة' : 'Fonctionnalité'}
                    </th>
                    {['Starter', 'Business', 'Enterprise'].map((p) => (
                      <th key={p} className="px-4 sm:px-6 py-3 sm:py-4 text-center text-white text-[12px] sm:text-[13px] font-bold">{p}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {features.map((row, i) => (
                    <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                      <td className={`px-4 sm:px-6 py-2.5 sm:py-3.5 text-slate-700 text-[12px] sm:text-[13px] font-medium ${isAr ? 'font-arabic text-right' : ''}`}>
                        {row[lang]}
                      </td>
                      {['starter', 'business', 'enterprise'].map((plan) => {
                        const val = row[plan as keyof typeof row]
                        const display = typeof val === 'object' ? (val as { fr: string; ar: string })[lang] : val
                        return (
                          <td key={plan} className="px-4 sm:px-6 py-2.5 sm:py-3.5 text-center">
                            {display === '✓' ? (
                              <span className="text-emerald-500 text-[16px]">✓</span>
                            ) : display === '—' ? (
                              <span className="text-slate-300">—</span>
                            ) : (
                              <span className="text-slate-600 text-[12px]">{display as string}</span>
                            )}
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            </div>
          </SectionReveal>
        </div>
      </section>

      {/* FAQ strip */}
      <section className="section-pad" style={{ background: '#f9fafb' }}>
        <div className="max-w-[760px] mx-auto px-4 sm:px-6">
          <SectionReveal className={`text-center mb-10 ${isAr ? 'font-arabic' : ''}`}>
            <h2 className="text-[22px] sm:text-[26px] font-bold text-slate-900 mb-2">
              {isAr ? 'أسئلة عن الأسعار' : 'Questions sur les tarifs'}
            </h2>
          </SectionReveal>
          <FAQAccordion items={faqPricing[lang]} isAr={isAr} />
        </div>
      </section>

      <CTABand
        headline={{ fr: "Voyez votre workflow dans CargoBridge en DZD.", ar: "شاهد سير عملك في CargoBridge بالدينار الجزائري." }}
        sub={{ fr: "Une démo ciblée — pas une visite générique.", ar: "عرض مستهدف — لا جولة عامة." }}
      />
    </div>
  )
}
