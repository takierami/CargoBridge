import { Link } from 'react-router'
import { motion } from 'framer-motion'
import { useLang } from '../context/LangContext'

export default function ContactSuccess() {
  const { lang, isAr } = useLang()

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 sm:px-6"
      style={{ background: 'linear-gradient(160deg, #0b1220 0%, #0d1729 100%)', paddingTop: 'var(--nav-height)' }}
    >
      <div className="text-center max-w-[560px]">
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', damping: 18, stiffness: 200 }}
          className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mx-auto mb-8 text-3xl sm:text-4xl"
        >
          ✓
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
        >
          <h1 className={`text-[28px] sm:text-[40px] font-bold text-white mb-4 ${isAr ? 'font-arabic' : ''}`}>
            {isAr ? 'تم استلام طلبك' : 'Demande reçue'}
          </h1>
          <p className={`text-slate-400 text-[17px] leading-relaxed mb-8 ${isAr ? 'font-arabic' : ''}`}>
            {isAr
              ? 'سنراجع رسالتك ونتواصل معك لجدولة عرض مخصص لسير عملك الفعلي.'
              : "Nous allons examiner votre message et vous contacter pour planifier une démo ciblée sur votre workflow réel."}
          </p>

          <div className="glass-card rounded-2xl p-6 mb-8 text-left">
            <h3 className={`text-white font-semibold mb-4 ${isAr ? 'font-arabic text-right' : ''}`}>
              {isAr ? 'ما يحدث بعد ذلك:' : "Ce qui se passe ensuite :"}
            </h3>
            <ol className={`space-y-3 text-slate-400 text-[14px] ${isAr ? 'font-arabic text-right' : ''}`}>
              {[
                isAr ? 'نراجع طلبك (خلال يوم عمل واحد)' : 'Nous examinons votre demande (sous 1 jour ouvré)',
                isAr ? 'نتصل لنفهم سير عملك' : "Nous appelons pour comprendre votre workflow",
                isAr ? 'نجدول عرضاً مخصصاً لعملياتك' : "Nous planifions une démo ciblée sur vos opérations",
                isAr ? 'نُفعّل مساحة عملك' : "Nous provisionnons votre workspace",
              ].map((step, i) => (
                <li key={i} className={`flex items-start gap-3 ${isAr ? 'flex-row-reverse' : ''}`}>
                  <span className="w-5 h-5 rounded-full bg-sky-500/20 text-sky-400 text-[11px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </div>

          <div className={`flex flex-col sm:flex-row gap-3 justify-center ${isAr ? 'sm:flex-row-reverse' : ''}`}>
            <Link
              to="/"
              className="inline-flex items-center justify-center px-6 py-3 text-[14px] font-semibold text-white bg-sky-500 hover:bg-sky-400 rounded-xl transition-colors"
            >
              {isAr ? 'العودة للرئيسية' : "Retour à l'accueil"}
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center justify-center px-6 py-3 text-[14px] font-medium text-slate-300 border border-slate-700/50 hover:border-slate-500 rounded-xl transition-all"
            >
              {isAr ? 'الدخول للمنصة' : 'Connexion workspace'}
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
