import { Link } from 'react-router'
import { motion } from 'framer-motion'
import { useLang } from '../context/LangContext'
import SectionReveal from './SectionReveal'

interface Props {
  headline?: { fr: string; ar: string }
  sub?: { fr: string; ar: string }
}

export default function CTABand({ headline, sub }: Props) {
  const { lang, isAr } = useLang()

  const h = headline ?? {
    fr: "Découvrez votre workflow dans CargoBridge — pas une démo générique.",
    ar: "شاهد سير عملك في CargoBridge — وليس عرضاً تقديمياً عاماً.",
  }
  const s = sub ?? {
    fr: "Une démo ciblée sur vos marchandises, vos fournisseurs et vos paiements.",
    ar: "عرض مخصص لبضائعك وموردينك ومدفوعاتك.",
  }

  return (
    <section
      className="relative overflow-hidden section-pad"
      style={{
        background: 'linear-gradient(135deg, #0b1220 0%, #0f172a 50%, #071320 100%)',
      }}
    >
      {/* Sky radials */}
      <div className="absolute inset-0 pointer-events-none">
        <div style={{ position:'absolute', top:'30%', left:'10%', width:'clamp(200px,40vw,400px)', height:'clamp(200px,40vw,400px)', background:'radial-gradient(circle, rgba(14,165,233,0.12) 0%, transparent 70%)', borderRadius:'50%' }}/>
        <div style={{ position:'absolute', top:'10%', right:'5%', width:'clamp(150px,30vw,300px)', height:'clamp(150px,30vw,300px)', background:'radial-gradient(circle, rgba(56,189,248,0.08) 0%, transparent 70%)', borderRadius:'50%' }}/>
      </div>

      <div className="relative max-w-[760px] mx-auto px-4 sm:px-6 text-center">
        <SectionReveal>
          <h2 className={`text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-4 leading-tight ${isAr ? 'font-arabic' : ''}`}>
            {h[lang]}
          </h2>
          <p className="text-slate-400 text-base sm:text-lg mb-8">
            {s[lang]}
          </p>
          <div className={`flex flex-col sm:flex-row items-center justify-center gap-4 ${isAr ? 'sm:flex-row-reverse' : ''}`}>
            <motion.div whileTap={{ scale: 0.97 }}>
              <Link
                to="/contact?intent=demo"
                className="inline-flex items-center gap-2 px-6 sm:px-7 py-3.5 text-[14px] sm:text-[15px] font-semibold text-white bg-sky-500 hover:bg-sky-400 rounded-xl transition-colors shadow-lg shadow-sky-500/25 w-full sm:w-auto justify-center"
              >
                {isAr ? 'طلب عرض تجريبي' : 'Demander une démo'}
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d={isAr ? 'M19 12H5m0 0l6 6m-6-6l6-6' : 'M5 12h14m0 0l-6-6m6 6l-6 6'}/>
                </svg>
              </Link>
            </motion.div>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 px-6 sm:px-7 py-3.5 text-[14px] sm:text-[15px] font-medium text-slate-300 hover:text-white border border-slate-700/50 hover:border-slate-500 rounded-xl transition-all w-full sm:w-auto justify-center"
            >
              {isAr ? 'دخول المنصة' : 'Connexion workspace'}
            </Link>
          </div>
        </SectionReveal>
      </div>
    </section>
  )
}
