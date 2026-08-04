import { Link } from 'react-router'
import { motion } from 'framer-motion'
import { useLang } from '../context/LangContext'
import SectionReveal, { StaggerReveal, StaggerItem } from '../components/SectionReveal'
import CTABand from '../components/CTABand'

export default function About() {
  const { lang, isAr } = useLang()

  return (
    <div>
      {/* Hero */}
      <section
        className="relative section-pad"
        style={{
          paddingTop: 'calc(var(--nav-height) + 80px)',
          background: 'linear-gradient(160deg, #0b1220 0%, #0d1a2e 100%)',
        }}
      >
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <img
            src="https://images.unsplash.com/photo-1578575437130-527eed3abbec?w=1600&h=800&fit=crop&auto=format"
            alt=""
            className="w-full h-full object-cover opacity-15"
            style={{ filter: 'saturate(0.3)' }}
          />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(11,18,32,0.7) 0%, rgba(11,18,32,0.95) 100%)' }}/>
        </div>
        <div className="relative max-w-[900px] mx-auto px-4 sm:px-6 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold text-sky-400 border border-sky-500/20 bg-sky-500/8 mb-6">
              {isAr ? 'قصتنا' : 'Notre histoire'}
            </div>
            <h1 className={`text-[28px] sm:text-[40px] md:text-[56px] font-bold text-white mb-6 leading-tight ${isAr ? 'font-arabic' : ''}`}>
              {isAr
                ? 'CargoBridge موجود لأن تجارة الصين-الجزائر واقع تشغيلي محدد'
                : "CargoBridge existe parce que le commerce Chine-Algérie est une réalité opérationnelle spécifique"}
            </h1>
            <p className="text-slate-400 text-[15px] sm:text-[18px] leading-relaxed max-w-2xl mx-auto">
              {isAr
                ? 'جغرافيتان، لغتان، دورة نقدية واحدة. برامج اللوجستيات العالمية العامة تتجاهل ذلك. نحن لا نتجاهله.'
                : "Deux géographies, deux langues, un cycle de trésorerie. Les SaaS logistiques globaux génériques ignorent ça. Pas nous."}
            </p>
          </motion.div>
        </div>
      </section>

      {/* Origin story */}
      <section className="section-pad" style={{ background: '#f9fafb' }}>
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
          <div className={`grid grid-cols-1 lg:grid-cols-2 gap-14 items-center ${isAr ? 'lg:grid-flow-col-dense' : ''}`}>
            <SectionReveal className={isAr ? 'lg:order-2 text-right' : ''}>
              <h2 className={`text-[32px] font-bold text-slate-900 mb-6 leading-tight ${isAr ? 'font-arabic' : ''}`}>
                {isAr
                  ? 'لماذا هذا الممر تحديداً'
                  : 'Pourquoi ce corridor spécifiquement'}
              </h2>
              <div className="space-y-5 text-slate-600 text-[15px] leading-relaxed">
                <p>
                  {isAr
                    ? 'المستوردون الجزائريون من الصين يديرون عملياتهم عبر Excel وواتساب والذاكرة. الشركة الصينية لها مسارها الخاص. الشركة الجزائرية لها مسارها الآخر. والعميل يشعر بالفجوة كصمت.'
                    : "Les importateurs algériens depuis la Chine gèrent leurs opérations via Excel, WhatsApp, et la mémoire. Le bureau chinois a sa réalité. Le bureau algérien a la sienne. Le client ressent l'écart comme un silence."}
                </p>
                <p>
                  {isAr
                    ? 'لا يوجد أداة واحدة تفهم الدينار الجزائري والعربية RTL والعلاقة بين التاجر والوكيل والجمارك في آن واحد.'
                    : "Aucun outil ne comprend à la fois le Dinar algérien, l'arabe RTL, et la relation entre le commerçant, l'agent, et les douanes."}
                </p>
                <p>
                  {isAr
                    ? 'CargoBridge هو الجواب. ليس نظام CRM مع أيقونة سفينة مُضافة. بل نظام تشغيل حقيقي لهذا الممر بالذات.'
                    : "CargoBridge est la réponse. Pas un CRM générique avec une icône de bateau collée dessus. Un système d'exploitation réel pour ce corridor précis."}
                </p>
              </div>
            </SectionReveal>
            <SectionReveal delay={0.15} className={isAr ? 'lg:order-1' : ''}>
              <div className="relative rounded-2xl overflow-hidden" style={{ aspectRatio: '4/3' }}>
                <img
                  src="https://images.unsplash.com/photo-1516937941344-00b4e0337589?w=700&h=520&fit=crop&auto=format"
                  alt={isAr ? 'ميناء الشحن' : 'Port de fret'}
                  className="w-full h-full object-cover"
                  style={{ filter: 'saturate(0.7) brightness(0.8)' }}
                />
                <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, rgba(14,165,233,0.08) 0%, transparent 60%)' }}/>
              </div>
            </SectionReveal>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="section-pad" style={{ background: '#ffffff' }}>
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
          <SectionReveal className={`text-center mb-12 ${isAr ? 'font-arabic' : ''}`}>
            <h2 className="text-[32px] sm:text-[38px] font-bold text-slate-900 mb-3">
              {isAr ? 'قيمنا الأساسية' : 'Nos valeurs fondamentales'}
            </h2>
          </SectionReveal>
          <StaggerReveal className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: '👁',
                color: '#0ea5e9',
                fr: { title: 'Visibilité', body: 'Tous ceux qui ont besoin de la vérité voient le même statut.' },
                ar: { title: 'الرؤية', body: 'كل من يحتاج إلى الحقيقة يرى نفس الحالة.' },
              },
              {
                icon: '📋',
                color: '#10b981',
                fr: { title: 'Responsabilité', body: "L'historique garde le reçu pour chaque décision." },
                ar: { title: 'المساءلة', body: 'السجل يحفظ الوصل لكل قرار.' },
              },
              {
                icon: '💰',
                color: '#f59e0b',
                fr: { title: 'Précision financière', body: 'Taux, paiements et marges ne sont pas laissés au hasard.' },
                ar: { title: 'دقة مالية', body: 'الأسعار والمدفوعات والهوامش ليست للمصادفة.' },
              },
              {
                icon: '🌐',
                color: '#a78bfa',
                fr: { title: 'Unité opérationnelle', body: 'Le bureau Chine et le bureau Algérie partagent un seul timeline.' },
                ar: { title: 'الوحدة التشغيلية', body: 'مكتب الصين ومكتب الجزائر يشتركان في مسار زمني واحد.' },
              },
            ].map((v) => (
              <StaggerItem key={v.fr.title}>
                <div
                  className="rounded-2xl p-6 border card-lift"
                  style={{ borderColor: 'rgba(148,163,184,0.12)', background: '#fafbfc' }}
                >
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center text-xl mb-4"
                    style={{ background: `${v.color}15`, border: `1px solid ${v.color}25` }}
                  >
                    {v.icon}
                  </div>
                  <div style={{ width: 32, height: 2, background: v.color, borderRadius: 1, marginBottom: 12 }}/>
                  <h3 className={`text-slate-900 font-bold text-[16px] mb-2 ${isAr ? 'font-arabic text-right' : ''}`}>{v[lang].title}</h3>
                  <p className={`text-slate-500 text-[13px] leading-relaxed ${isAr ? 'font-arabic text-right' : ''}`}>{v[lang].body}</p>
                </div>
              </StaggerItem>
            ))}
          </StaggerReveal>
        </div>
      </section>

      {/* Bilingual commitment */}
      <section className="section-pad" style={{ background: 'linear-gradient(160deg, #0b1220 0%, #0f172a 100%)' }}>
        <div className="max-w-[900px] mx-auto px-6 text-center">
          <SectionReveal>
            <h2 className="text-[32px] sm:text-[38px] font-bold text-white mb-5">
              {isAr ? 'العربية والفرنسية — متساويتان، لا ترجمة' : 'Arabe et Français — à égalité, pas en traduction'}
            </h2>
            <p className="text-slate-400 text-[16px] leading-relaxed max-w-xl mx-auto mb-8">
              {isAr
                ? 'الفرق الجزائرية تعمل بالعربية. الوثائق التجارية تأتي بالفرنسية. المنصة تدعم كليهما بشكل أصيل.'
                : "Les équipes algériennes travaillent en arabe. Les documents commerciaux arrivent en français. La plateforme supporte les deux nativement."}
            </p>
            <div className="inline-flex items-center gap-6 glass-light rounded-2xl px-8 py-5">
              <div className="text-right">
                <div className="font-arabic text-white text-[20px] font-bold">مرحباً بك في CargoBridge</div>
                <div className="text-slate-400 text-[12px] mt-1">العربية · RTL</div>
              </div>
              <div className="w-px h-10 bg-slate-600"/>
              <div className="text-left">
                <div className="text-white text-[20px] font-bold">Bienvenue sur CargoBridge</div>
                <div className="text-slate-400 text-[12px] mt-1">Français · LTR</div>
              </div>
            </div>
          </SectionReveal>
        </div>
      </section>

      <CTABand
        headline={{ fr: "Prêt à voir votre corridor géré avec précision ?", ar: "مستعد لرؤية ممرك يُدار بدقة؟" }}
        sub={{ fr: "Demandez une démo — pas une présentation générique.", ar: "اطلب عرضاً — لا عرضاً تقديمياً عاماً." }}
      />
    </div>
  )
}
