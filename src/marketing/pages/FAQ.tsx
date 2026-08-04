import { Link } from 'react-router'
import { useLang } from '../context/LangContext'
import SectionReveal from '../components/SectionReveal'
import FAQAccordion from '../components/FAQAccordion'
import CTABand from '../components/CTABand'

const faqCategories = {
  fr: [
    {
      cat: 'Produit',
      items: [
        { q: "CargoBridge remplace-t-il WhatsApp entièrement ?", a: "Non — vous remplacez WhatsApp comme base de données opérationnelle. Gardez la conversation pour le quotidien. Perdez le chaos où les décisions critiques se noient dans le scrollback." },
        { q: "Quels modules sont inclus ?", a: "Dashboard, Marchandises, Fournisseurs, Agents, Achats (BdC), Paiements, Calculateur, QR/Scanner, Documents & Modèles, Historique d'audit, Rapports. Tout dans un seul workspace." },
        { q: "Le mobile est-il supporté ?", a: "Oui — les flux clés sont accessibles depuis le téléphone : scanner QR, vérifier statuts, suivre les paiements, mettre à jour les marchandises." },
        { q: "Y a-t-il une inscription publique ?", a: "Non. CargoBridge est sales-led — demandez une démo et nous guiderons l'onboarding et provisionnement du workspace." },
      ],
    },
    {
      cat: 'Tarification',
      items: [
        { q: "Les prix sont en quelle devise ?", a: "Dinar algérien (DZD) uniquement — Starter 70,000 DZD, Business 99,000 DZD. Aucun USD caché. Les opérateurs qui budgétisent en DZD méritent des prix en DZD." },
        { q: "Qu'est-ce qu'un « admin » vs un utilisateur ?", a: "Starter inclut jusqu'à 5 utilisateurs. Business monte à 10 utilisateurs. Enterprise : contact commercial pour un devis personnalisé selon votre volume et structure." },
        { q: "Que comprend le plan Enterprise ?", a: "Onboarding dédié, support prioritaire, processus personnalisés, et tarification selon volume et besoins de gouvernance. Contactez les ventes pour un devis." },
      ],
    },
    {
      cat: 'Sécurité & Workspace',
      items: [
        { q: "Mes données sont-elles séparées des autres entreprises ?", a: "Oui. Les workspaces sont scoped par organisation — vos données restent dans votre organisation, inaccessibles à d'autres clients CargoBridge." },
        { q: "Où sont hébergées les données ?", a: "CargoBridge utilise une infrastructure cloud sécurisée. Les détails d'hébergement et de conformité sont disponibles sur demande lors de la démo ou via Contact." },
        { q: "Comment les clients existants se connectent-ils ?", a: "Utilisez le lien Connexion dans la navigation — il vous mène directement à votre workspace. Pas besoin de remplir un formulaire de démo." },
      ],
    },
    {
      cat: 'Démo & Ventes',
      items: [
        { q: "Que couvre une démo ?", a: "Votre boucle import réelle : comment vos marchandises passent par CargoBridge, comment vos fournisseurs y vivent, comment les paiements bougent et l'historique se construit. Pas une visite de fonctionnalités générique." },
        { q: "Quel est le délai de réponse ?", a: "Nous répondons sous 1 jour ouvré — [À CONFIRMER selon SLA réel]. Si votre besoin est urgent, précisez-le dans le champ message." },
        { q: "Comment l'onboarding fonctionne-t-il ?", a: "Après la démo et engagement : nous provisionnons votre workspace et guidons la configuration selon votre flux réel (fournisseurs, marchandises, structure d'équipe)." },
      ],
    },
    {
      cat: 'Langue',
      items: [
        { q: "Quelles langues sont supportées ?", a: "Arabe (RTL natif) et Français (LTR natif) — les deux en première classe. Pas de traduction machine, pas d'interface pensée en anglais et traduite." },
        { q: "Puis-je changer de langue dans l'app ?", a: "Oui — le bascule de langue est disponible dans la navigation et le footer. Votre préférence est enregistrée par workspace." },
      ],
    },
  ],
  ar: [
    {
      cat: 'المنتج',
      items: [
        { q: "هل يستبدل CargoBridge واتساب بالكامل؟", a: "لا — أنت تستبدل واتساب كقاعدة بيانات تشغيلية. احتفظ بالمحادثة للتواصل اليومي. تخلص من الفوضى حيث تضيع القرارات الحرجة في سيل الرسائل." },
        { q: "ما الوحدات المضمنة؟", a: "لوحة التحكم، البضائع، الموردون، الوكلاء، الشراء، المدفوعات، الحاسبة، QR/المسح، الوثائق والنماذج، سجل التدقيق، التقارير. كل شيء في مساحة عمل واحدة." },
        { q: "هل يدعم الموبايل؟", a: "نعم — التدفقات الرئيسية متاحة من الهاتف: مسح QR، التحقق من الحالات، تتبع المدفوعات، تحديث البضائع." },
        { q: "هل يوجد تسجيل عام؟", a: "لا. CargoBridge يعمل بنموذج المبيعات — اطلب عرضاً ونحن سنرشدك خلال عملية الإعداد وتفعيل مساحة العمل." },
      ],
    },
    {
      cat: 'الأسعار',
      items: [
        { q: "ما العملة المستخدمة في الأسعار؟", a: "الدينار الجزائري (DZD) فقط — Starter بـ 70,000 دج، Business بـ 99,000 دج. لا دولار خفي. المشغلون الذين يضعون ميزانياتهم بالدينار يستحقون أسعاراً بالدينار." },
        { q: "ما الفرق بين 'مدير' و'مستخدم'؟", a: "Starter يشمل حتى 5 مستخدمين. Business يصل إلى 10 مستخدمين. Enterprise: تواصل مع المبيعات للحصول على عرض مخصص." },
        { q: "ماذا يشمل خطة Enterprise؟", a: "تأهيل مخصص، دعم أولوية، عمليات مخصصة، وتسعير حسب الحجم واحتياجات الحوكمة. تواصل مع المبيعات للحصول على عرض." },
      ],
    },
    {
      cat: 'الأمان ومساحة العمل',
      items: [
        { q: "هل بياناتي معزولة عن الشركات الأخرى؟", a: "نعم. مساحات العمل مخصصة لكل مؤسسة — بياناتك تبقى داخل مؤسستك، لا يمكن لعملاء CargoBridge الآخرين الوصول إليها." },
        { q: "أين يتم استضافة البيانات؟", a: "CargoBridge يستخدم بنية تحتية سحابية آمنة. تفاصيل الاستضافة والامتثال متاحة عند الطلب خلال العرض أو عبر التواصل." },
        { q: "كيف يسجل العملاء الحاليون الدخول؟", a: "استخدم رابط الدخول في التنقل — يأخذك مباشرة إلى مساحة عملك. لا حاجة لملء نموذج طلب عرض." },
      ],
    },
    {
      cat: 'العرض والمبيعات',
      items: [
        { q: "ماذا يغطي العرض التجريبي؟", a: "حلقة استيرادك الفعلية: كيف تمر بضائعك عبر CargoBridge، كيف يعيش موردوك فيه، كيف تتحرك المدفوعات ويُبنى السجل. ليس جولة ميزات عامة." },
        { q: "ما وقت الاستجابة؟", a: "نرد خلال يوم عمل واحد — [للتأكيد حسب SLA الفعلي]. إذا كان طلبك عاجلاً، وضح ذلك في حقل الرسالة." },
        { q: "كيف يعمل التأهيل؟", a: "بعد العرض والالتزام: نُفعّل مساحة عملك ونرشد الإعداد وفق سير عملك الفعلي (موردون، بضائع، هيكل الفريق)." },
      ],
    },
    {
      cat: 'اللغة',
      items: [
        { q: "ما اللغات المدعومة؟", a: "العربية (RTL أصيل) والفرنسية (LTR أصيل) — كلتاهما بالمستوى الأول. لا ترجمة آلية، لا واجهة مصممة بالإنجليزية ثم مترجمة." },
        { q: "هل يمكنني تغيير اللغة في التطبيق؟", a: "نعم — تبديل اللغة متاح في التنقل والتذييل. تفضيلك يُحفظ في مساحة العمل." },
      ],
    },
  ],
}

export default function FAQ() {
  const { lang, isAr } = useLang()
  const cats = faqCategories[lang]

  return (
    <div style={{ background: '#f9fafb' }}>
      <section
        className="section-pad text-center"
        style={{
          paddingTop: 'calc(var(--nav-height) + 80px)',
          background: 'linear-gradient(160deg, #0b1220 0%, #0d1729 100%)',
        }}
      >
        <div className="max-w-[760px] mx-auto px-4 sm:px-6">
          <SectionReveal>
            <h1 className={`text-[30px] sm:text-[40px] md:text-[52px] font-bold text-white mb-4 ${isAr ? 'font-arabic' : ''}`}>
              {isAr ? 'أسئلة شائعة' : 'Questions fréquentes'}
            </h1>
            <p className="text-slate-400 text-[15px] sm:text-[17px]">
              {isAr
                ? 'إجابات عن العروض والأسعار واللغة وكيف يناسب CargoBridge سير عملك.'
                : "Réponses sur les démos, tarifs, langue et comment CargoBridge s'adapte à votre workflow."}
            </p>
          </SectionReveal>
        </div>
      </section>

      <section className="section-pad">
        <div className="max-w-[760px] mx-auto px-4 sm:px-6 space-y-10 sm:space-y-12">
          {cats.map((cat) => (
            <SectionReveal key={cat.cat}>
              <div className={`text-sky-500 text-[11px] font-bold uppercase tracking-widest mb-4 ${isAr ? 'text-right' : ''}`}>
                {cat.cat}
              </div>
              <FAQAccordion items={cat.items} isAr={isAr} />
            </SectionReveal>
          ))}

          <SectionReveal>
            <div
              className="rounded-2xl p-6 text-center"
              style={{ background: 'linear-gradient(135deg, #0b1220, #0f172a)', border: '1px solid rgba(14,165,233,0.15)' }}
            >
              <p className={`text-slate-300 mb-4 ${isAr ? 'font-arabic' : ''}`}>
                {isAr ? 'لم تجد إجابة؟' : 'Pas trouvé votre réponse ?'}
              </p>
              <Link
                to="/contact"
                className="inline-flex items-center gap-2 px-6 py-2.5 text-[14px] font-semibold text-white bg-sky-500 hover:bg-sky-400 rounded-xl transition-colors"
              >
                {isAr ? 'تواصل معنا' : 'Nous contacter'}
              </Link>
            </div>
          </SectionReveal>
        </div>
      </section>

      <CTABand />
    </div>
  )
}
