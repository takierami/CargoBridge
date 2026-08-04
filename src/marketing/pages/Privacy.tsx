import { useLang } from '../context/LangContext'
import SectionReveal from '../components/SectionReveal'

export default function Privacy() {
  const { lang, isAr } = useLang()
  return (
    <div style={{ background: '#f9fafb', paddingTop: 'var(--nav-height)' }}>
      <div className="max-w-[760px] mx-auto px-6 py-20">
        <SectionReveal>
          <h1 className={`text-[40px] font-bold text-slate-900 mb-4 ${isAr ? 'font-arabic text-right' : ''}`}>
            {isAr ? 'سياسة الخصوصية' : 'Politique de confidentialité'}
          </h1>
          <p className="text-slate-500 text-sm mb-10">
            {isAr ? '[مسودة قانونية — للتأكيد من المستشار القانوني]' : '[BROUILLON JURIDIQUE — À confirmer par un conseiller juridique]'}
          </p>
          <div className={`prose prose-slate max-w-none text-slate-600 text-[15px] leading-relaxed space-y-6 ${isAr ? 'text-right font-arabic' : ''}`}>
            <p>
              {isAr
                ? 'CargoBridge تلتزم بحماية خصوصيتك وبيانات مؤسستك. يشرح هذا المستند كيفية جمع البيانات واستخدامها وحمايتها.'
                : "CargoBridge s'engage à protéger votre vie privée et les données de votre organisation. Ce document explique comment les données sont collectées, utilisées et protégées."}
            </p>
            <h2 className="text-slate-800 font-semibold text-[20px]">
              {isAr ? 'البيانات المجمّعة' : 'Données collectées'}
            </h2>
            <p>
              {isAr
                ? 'نجمع البيانات التشغيلية التي تدخلها في مساحة العمل (بضائع، موردون، مدفوعات) وبيانات الاستخدام لتحسين المنصة.'
                : "Nous collectons les données opérationnelles que vous saisissez dans le workspace (marchandises, fournisseurs, paiements) et des données d'utilisation pour améliorer la plateforme."}
            </p>
            <h2 className="text-slate-800 font-semibold text-[20px]">
              {isAr ? 'عزل البيانات' : 'Isolation des données'}
            </h2>
            <p>
              {isAr
                ? 'مساحة عمل كل مؤسسة معزولة. لا يمكن لعملاء CargoBridge الآخرين الوصول إلى بياناتك.'
                : "Le workspace de chaque organisation est isolé. Les autres clients CargoBridge ne peuvent pas accéder à vos données."}
            </p>
            <h2 className="text-slate-800 font-semibold text-[20px]">
              {isAr ? 'حقوقك' : 'Vos droits'}
            </h2>
            <p>
              {isAr
                ? 'يحق لك الوصول إلى بياناتك وتصحيحها وحذفها. تواصل معنا عبر صفحة الاتصال.'
                : "Vous avez le droit d'accéder, rectifier et supprimer vos données. Contactez-nous via la page Contact."}
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
