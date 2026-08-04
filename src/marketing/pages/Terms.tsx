import { useLang } from '../context/LangContext'
import SectionReveal from '../components/SectionReveal'

export default function Terms() {
  const { lang, isAr } = useLang()
  return (
    <div style={{ background: '#f9fafb', paddingTop: 'var(--nav-height)' }}>
      <div className="max-w-[760px] mx-auto px-6 py-20">
        <SectionReveal>
          <h1 className={`text-[40px] font-bold text-slate-900 mb-4 ${isAr ? 'font-arabic text-right' : ''}`}>
            {isAr ? 'شروط الخدمة' : "Conditions d'utilisation"}
          </h1>
          <p className="text-slate-500 text-sm mb-10">
            {isAr ? '[مسودة قانونية — للتأكيد من المستشار القانوني]' : '[BROUILLON JURIDIQUE — À confirmer par un conseiller juridique]'}
          </p>
          <div className={`prose prose-slate max-w-none text-slate-600 text-[15px] leading-relaxed space-y-6 ${isAr ? 'text-right font-arabic' : ''}`}>
            <p>
              {isAr
                ? 'باستخدام CargoBridge، توافق على الشروط التالية. يُرجى قراءتها بعناية.'
                : "En utilisant CargoBridge, vous acceptez les conditions suivantes. Veuillez les lire attentivement."}
            </p>
            <h2 className="text-slate-800 font-semibold text-[20px]">
              {isAr ? 'استخدام المنصة' : 'Utilisation de la plateforme'}
            </h2>
            <p>
              {isAr
                ? 'CargoBridge مخصص للاستخدام التجاري المشروع. لا يجوز استخدامه لأغراض غير قانونية.'
                : "CargoBridge est destiné à un usage commercial légitime. Il ne peut pas être utilisé à des fins illégales."}
            </p>
            <h2 className="text-slate-800 font-semibold text-[20px]">
              {isAr ? 'مسؤولية البيانات' : 'Responsabilité des données'}
            </h2>
            <p>
              {isAr
                ? 'أنت مسؤول عن دقة البيانات التي تدخلها في المنصة. CargoBridge يوفر الأدوات؛ القرارات التشغيلية تقع على عاتقك.'
                : "Vous êtes responsable de l'exactitude des données saisies. CargoBridge fournit les outils ; les décisions opérationnelles vous appartiennent."}
            </p>
            <h2 className="text-slate-800 font-semibold text-[20px]">
              {isAr ? 'اتفاقيات الخدمة' : 'Accords de service'}
            </h2>
            <p>
              {isAr
                ? 'الاشتراكات تُجدد سنوياً ما لم يُلغَ الاشتراك. التفاصيل الكاملة في اتفاقية الخدمة الموقعة عند التأهيل.'
                : "Les abonnements se renouvellent annuellement sauf résiliation. Les détails complets dans le contrat de service signé à l'onboarding."}
            </p>
            <p className="text-slate-400 text-[13px] italic">
              {isAr
                ? 'للأسئلة القانونية، تواصل مع [البريد الإلكتروني — للتأكيد]'
                : "Pour toute question juridique, contactez [email — À CONFIRMER]"}
            </p>
          </div>
        </SectionReveal>
      </div>
    </div>
  )
}
