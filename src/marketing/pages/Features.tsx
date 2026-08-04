import { useEffect, useRef } from 'react'
import { Link, useLocation } from 'react-router'
import { motion } from 'framer-motion'
import { useLang } from '../context/LangContext'
import SectionReveal, { StaggerReveal, StaggerItem } from '../components/SectionReveal'
import CTABand from '../components/CTABand'

const modules = [
  {
    id: 'dashboard',
    icon: '🎯',
    color: '#0ea5e9',
    img: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=700&h=420&fit=crop&auto=format',
    fr: {
      title: 'Dashboard',
      problem: "Les dirigeants n'apprennent les incidents que quand c'est trop tard.",
      solution: "Un pouls opérationnel sur les marchandises, partenaires et tâches à traiter.",
      value: "Commencez la journée depuis la réalité, pas depuis l'anxiété de la boîte mail.",
    },
    ar: {
      title: 'لوحة التحكم',
      problem: 'المسؤولون يعرفون بالمشاكل عندما يفوت الأوان.',
      solution: 'نبضة تشغيلية على البضائع والشركاء والمهام المعلقة.',
      value: 'ابدأ يومك من الواقع لا من قلق صندوق البريد.',
    },
  },
  {
    id: 'goods',
    icon: '📦',
    color: '#38bdf8',
    img: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=700&h=420&fit=crop&auto=format',
    fr: {
      title: 'Gestion des Marchandises',
      problem: "L'état des expéditions vit dans les chats.",
      solution: "Enregistrements de marchandises avec statuts de cycle de vie (brouillon → transit → livré), priorités, types de transport et affectations.",
      value: "Tout le monde nomme le même statut.",
    },
    ar: {
      title: 'إدارة البضائع',
      problem: 'حالة الشحنات تعيش في المحادثات.',
      solution: 'سجلات البضائع مع حالات دورة الحياة (مسودة → عبور → تسليم) والأولويات والمهام.',
      value: 'الجميع يسمي نفس الحالة.',
    },
  },
  {
    id: 'qr',
    icon: '📱',
    color: '#a78bfa',
    img: 'https://images.unsplash.com/photo-1586880244406-556ebe35f282?w=700&h=420&fit=crop&auto=format',
    fr: {
      title: 'Codes QR & Scanner',
      problem: "L'entrepôt et les partenaires manquent d'un point d'entrée de suivi propre.",
      solution: "Générez un QR pour les marchandises ; scannez sur le terrain ; suivi public pour la visibilité des statuts.",
      value: 'Transferts plus rapides ; moins de boucles "envoyez-moi la mise à jour".',
    },
    ar: {
      title: 'رموز QR والمسح',
      problem: 'المستودع والشركاء يفتقرون إلى نقطة دخول واضحة للتتبع.',
      solution: 'أنشئ رمز QR للبضائع؛ امسح في الميدان؛ تتبع عام لرؤية الحالات.',
      value: 'تسليمات أسرع؛ حلقات "أرسل لي التحديث" أقل.',
    },
  },
  {
    id: 'suppliers',
    icon: '🏭',
    color: '#10b981',
    img: 'https://images.unsplash.com/photo-1553877522-43269d4ea984?w=700&h=420&fit=crop&auto=format',
    fr: {
      title: 'Fournisseurs',
      problem: 'La vérité fournisseur est fragmentée.',
      solution: 'Profils fournisseurs avec contacts, catégories, documents, communications, tâches, notes et soldes en attente.',
      value: "Un seul endroit pour préparer une décision d'achat ou de paiement.",
    },
    ar: {
      title: 'الموردون',
      problem: 'حقيقة المورد مشتتة في أماكن متعددة.',
      solution: 'ملفات الموردين مع جهات الاتصال والفئات والوثائق والمراسلات والمهام والأرصدة المعلقة.',
      value: 'مكان واحد لإعداد قرار شراء أو دفع.',
    },
  },
  {
    id: 'buying',
    icon: '🛒',
    color: '#f59e0b',
    img: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=700&h=420&fit=crop&auto=format',
    fr: {
      title: "Opérations d'Achat (BdC)",
      problem: "L'état des bons de commande est flou ; les lignes vivent dans des brouillons d'emails.",
      solution: "Pipeline de bons de commande reliés aux fournisseurs et aux montants.",
      value: "L'achat devient un processus suivi, pas un thread.",
    },
    ar: {
      title: 'عمليات الشراء (طلبات الشراء)',
      problem: 'حالة طلبات الشراء غامضة؛ السطور تعيش في مسودات البريد الإلكتروني.',
      solution: 'خط أنابيب طلبات شراء مرتبط بالموردين والمبالغ.',
      value: 'الشراء يصبح عملية متتبعة لا خيطاً من الرسائل.',
    },
  },
  {
    id: 'payments',
    icon: '💳',
    color: '#34d399',
    img: 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=700&h=420&fit=crop&auto=format',
    fr: {
      title: 'Opérations de Paiement',
      problem: '"Avons-nous payé ?" est un débat.',
      solution: 'Enregistrements de paiements progressant contre la réalité fournisseur.',
      value: 'Les sorties de trésorerie deviennent auditables.',
    },
    ar: {
      title: 'عمليات الدفع',
      problem: '"هل دفعنا؟" يصبح نقاشاً.',
      solution: 'سجلات الدفع تتقدم مقابل واقع المورد.',
      value: 'تدفقات النقد تصبح قابلة للتدقيق.',
    },
  },
  {
    id: 'agents',
    icon: '🤝',
    color: '#818cf8',
    img: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=700&h=420&fit=crop&auto=format',
    fr: {
      title: 'Agents',
      problem: "Les agents sont des relations informelles jusqu'à ce que quelque chose tourne mal.",
      solution: "Enregistrements d'agents, affectation aux marchandises, contexte opérationnel.",
      value: 'La responsabilité voyage avec la personne qui déplace la cargaison.',
    },
    ar: {
      title: 'الوكلاء',
      problem: 'الوكلاء علاقات غير رسمية حتى يحدث خطأ.',
      solution: 'سجلات الوكلاء، تعيين للبضائع، السياق التشغيلي.',
      value: 'المساءلة تسافر مع الشخص الذي يحرك البضاعة.',
    },
  },
  {
    id: 'calculator',
    icon: '🧮',
    color: '#fb923c',
    img: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=700&h=420&fit=crop&auto=format',
    fr: {
      title: 'Calculateur Métier',
      problem: 'Le calcul des coûts est improvisé.',
      solution: 'Workflows de calculateur pour la clarté des taux de change et des coûts.',
      value: 'Engagez-vous avec les yeux ouverts.',
    },
    ar: {
      title: 'حاسبة الأعمال',
      problem: 'حسابات التكلفة مرتجلة.',
      solution: 'حساب أعمال لوضوح أسعار الصرف ومكونات التكلفة.',
      value: 'التزم بعينين مفتوحتين.',
    },
  },
  {
    id: 'documents',
    icon: '📄',
    color: '#f472b6',
    img: 'https://images.unsplash.com/photo-1568667256549-094345857637?w=700&h=420&fit=crop&auto=format',
    fr: {
      title: 'Documents & Modèles',
      problem: 'Chaque expédition réinvente la paperasse.',
      solution: 'Stockage de documents + modèles de réception/livraison/fournisseur réutilisables.',
      value: 'Cohérence sous pression.',
    },
    ar: {
      title: 'الوثائق والنماذج',
      problem: 'كل شحنة تعيد اختراع الأوراق.',
      solution: 'تخزين الوثائق + نماذج الاستلام والتسليم قابلة لإعادة الاستخدام.',
      value: 'الاتساق تحت الضغط.',
    },
  },
  {
    id: 'history',
    icon: '📜',
    color: '#22d3ee',
    img: 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=700&h=420&fit=crop&auto=format',
    fr: {
      title: 'Historique & Audit',
      problem: "Aucune trace d'évidence.",
      solution: "Timeline d'activité commerciale avec acteur, action et horodatage.",
      value: 'Les litiges obtiennent des faits ; la formation obtient des exemples.',
    },
    ar: {
      title: 'السجل والتدقيق',
      problem: 'لا أثر للأدلة.',
      solution: 'خط زمني لنشاط الأعمال مع المنفذ والإجراء والتاريخ.',
      value: 'النزاعات تحصل على وقائع؛ التدريب يحصل على أمثلة.',
    },
  },
  {
    id: 'reports',
    icon: '📊',
    color: '#a78bfa',
    img: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=700&h=420&fit=crop&auto=format',
    fr: {
      title: 'Rapports & Analytique',
      problem: 'Décisions basées sur des anecdotes.',
      solution: "Surfaces d'analytique alimentées par les données opérationnelles.",
      value: 'Management sans stalker WhatsApp.',
    },
    ar: {
      title: 'التقارير والتحليلات',
      problem: 'قرارات مبنية على حكايات.',
      solution: 'واجهات تحليلية مدعومة ببيانات التشغيل.',
      value: 'إدارة بدون مراقبة واتساب.',
    },
  },
  {
    id: 'mobile',
    icon: '🌐',
    color: '#4ade80',
    img: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=700&h=420&fit=crop&auto=format',
    fr: {
      title: 'Multi-langue & Mobile',
      problem: 'Outils en anglais uniquement ; habitudes uniquement sur desktop.',
      solution: 'Langue produit AR/FR ; opérations capables en mobile.',
      value: "Toute l'équipe incluse — même en entrepôt.",
    },
    ar: {
      title: 'متعدد اللغات والموبايل',
      problem: 'أدوات بالإنجليزية فقط؛ عادات على الحاسوب فقط.',
      solution: 'لغة المنتج عربية/فرنسية؛ عمليات على الموبايل.',
      value: 'الفريق كله مشمول — حتى في المستودع.',
    },
  },
]

function SubNav({ isAr, lang }: { isAr: boolean; lang: 'fr' | 'ar' }) {
  const location = useLocation()
  const scrollTo = (id: string) => {
    const el = document.getElementById(id)
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
  return (
    <div
      className="sticky z-30 overflow-x-auto scrollbar-hide"
      style={{ top: 'var(--nav-height)', background: 'rgba(15,23,42,0.95)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(148,163,184,0.08)' }}
    >
      <div className="flex items-center gap-1 px-4 sm:px-6 py-2 min-w-max max-w-[1200px] mx-auto">
        {modules.map((m) => (
          <button
            key={m.id}
            onClick={() => scrollTo(m.id)}
            className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-2 text-[11px] sm:text-[12px] font-medium text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors whitespace-nowrap"
          >
            <span>{m.icon}</span>
            <span className="hidden sm:inline">{m[lang].title}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

export default function Features() {
  const { lang, isAr } = useLang()

  return (
    <div style={{ background: '#0b1220' }}>
      {/* Hero */}
      <section
        className="relative section-pad"
        style={{
          paddingTop: 'calc(var(--nav-height) + 80px)',
          background: 'linear-gradient(160deg, #0b1220 0%, #0d1a2e 100%)',
        }}
      >
        <div className="absolute inset-0 pointer-events-none">
          <div style={{ position:'absolute', top:'20%', left:'10%', width:400, height:400, background:'radial-gradient(circle, rgba(14,165,233,0.08) 0%, transparent 70%)', borderRadius:'50%'}}/>
        </div>
        <div className="relative max-w-[760px] mx-auto px-4 sm:px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold text-sky-400 border border-sky-500/20 bg-sky-500/8 mb-6">
              {isAr ? '12 وحدة' : '12 modules'}
            </div>
            <h1 className={`text-[28px] sm:text-[38px] md:text-[52px] font-bold text-white mb-5 leading-tight ${isAr ? 'font-arabic' : ''}`}>
              {isAr
                ? 'كل وحدة موجودة لأن عمل الاستيراد ينكسر بطرق متوقعة'
                : "Chaque module existe parce que l'import se casse de façon prévisible"}
            </h1>
            <p className="text-slate-400 text-[15px] sm:text-[17px] leading-relaxed mb-8">
              {isAr
                ? 'لا توجد مميزات عشوائية. كل شيء يحل مشكلة عملية حقيقية في تجارة الصين-الجزائر.'
                : "Pas de fonctionnalités au hasard. Chaque module résout un problème opérationnel réel du commerce Chine-Algérie."}
            </p>
            <motion.div whileTap={{ scale: 0.97 }}>
              <Link
                to="/contact?intent=demo"
                className="inline-flex items-center gap-2 px-7 py-3.5 text-[15px] font-semibold text-white bg-sky-500 hover:bg-sky-400 rounded-xl transition-colors shadow-lg shadow-sky-500/25"
              >
                {isAr ? 'طلب عرض تجريبي' : 'Demander une démo'}
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      <SubNav isAr={isAr} lang={lang} />

      {/* Feature sections */}
      {modules.map((mod, i) => {
        const data = mod[lang]
        const isEven = i % 2 === 0
        return (
          <section
            key={mod.id}
            id={mod.id}
            className="section-pad"
            style={{
              background: i % 2 === 0 ? '#0b1220' : '#080f1e',
              borderTop: '1px solid rgba(148,163,184,0.06)',
              scrollMarginTop: 'calc(var(--nav-height) + 48px)',
            }}
          >
            <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
              <div className={`grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center ${isAr ? 'lg:grid-flow-col-dense' : (!isEven ? 'lg:grid-flow-col-dense' : '')}`}>

                {/* Copy */}
                <SectionReveal className={isAr ? 'text-right' : (isEven ? '' : 'lg:order-2')}>
                  <div
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold mb-5"
                    style={{ background: `${mod.color}15`, color: mod.color, border: `1px solid ${mod.color}25` }}
                  >
                    <span>{mod.icon}</span>
                    <span>{data.title}</span>
                  </div>

                  {/* Problem */}
                  <div className="mb-5 p-4 rounded-xl" style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.12)' }}>
                    <div className="text-rose-400 text-[11px] font-semibold uppercase tracking-wider mb-1.5">
                      {isAr ? 'المشكلة' : 'Le problème'}
                    </div>
                    <p className={`text-slate-300 text-[14px] leading-relaxed ${isAr ? 'font-arabic' : ''}`}>{data.problem}</p>
                  </div>

                  {/* Solution */}
                  <div className="mb-5">
                    <div className="text-sky-400 text-[11px] font-semibold uppercase tracking-wider mb-2">
                      {isAr ? 'الحل' : 'La solution'}
                    </div>
                    <p className={`text-slate-200 text-[15px] leading-relaxed ${isAr ? 'font-arabic' : ''}`}>{data.solution}</p>
                  </div>

                  {/* Value */}
                  <div
                    className="flex items-start gap-3 p-4 rounded-xl"
                    style={{ background: `${mod.color}08`, border: `1px solid ${mod.color}20` }}
                  >
                    <div className="w-1 h-full min-h-[32px] rounded-full flex-shrink-0" style={{ background: mod.color }}/>
                    <p className={`text-[14px] font-medium leading-relaxed ${isAr ? 'font-arabic text-slate-200' : 'text-slate-200'}`}>{data.value}</p>
                  </div>
                </SectionReveal>

                {/* Image */}
                <SectionReveal delay={0.15} className={isAr ? '' : (isEven ? '' : 'lg:order-1')}>
                  <div className="relative rounded-2xl overflow-hidden" style={{ aspectRatio: '16/10' }}>
                    <img
                      src={mod.img}
                      alt={data.title}
                      className="w-full h-full object-cover"
                      style={{ filter: 'saturate(0.7) brightness(0.65)' }}
                    />
                    <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${mod.color}18 0%, transparent 60%)` }}/>
                    {/* Overlay badge */}
                    <div className="absolute bottom-2 sm:bottom-4 left-2 sm:left-4 right-2 sm:right-4">
                      <div
                        className="glass-card rounded-xl p-3 flex items-center gap-3"
                      >
                        <div
                          className="w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                          style={{ background: `${mod.color}20` }}
                        >
                          {mod.icon}
                        </div>
                        <div>
                          <div className="text-white text-[13px] font-semibold">{data.title}</div>
                          <div className="text-slate-400 text-[11px]">{isAr ? 'CargoBridge' : 'CargoBridge'}</div>
                        </div>
                        <div className="ml-auto">
                          <span className="chip chip-arrived text-[10px]">{isAr ? 'مباشر' : 'Live'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </SectionReveal>

              </div>
            </div>
          </section>
        )
      })}

      <CTABand />
    </div>
  )
}
