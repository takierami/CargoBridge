import { Link } from 'react-router'
import { motion } from 'framer-motion'
import { useLang } from '../context/LangContext'

export default function NotFound() {
  const { isAr } = useLang()

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 sm:px-6"
      style={{ background: 'linear-gradient(160deg, #0b1220 0%, #0d1729 100%)', paddingTop: 'var(--nav-height)' }}
    >
      <div className="text-center max-w-[600px]">
        {/* Missing container illustration */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="mb-8"
        >
          <svg viewBox="0 0 280 180" fill="none" className="w-full max-w-[288px] mx-auto">
            <defs>
              <linearGradient id="containerGrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.6"/>
                <stop offset="100%" stopColor="#1e293b" stopOpacity="0.8"/>
              </linearGradient>
            </defs>
            {/* Port dock */}
            <rect x="10" y="140" width="260" height="12" rx="2" fill="rgba(148,163,184,0.1)"/>
            {/* Crane */}
            <rect x="190" y="60" width="4" height="80" fill="rgba(148,163,184,0.2)"/>
            <rect x="170" y="58" width="44" height="4" rx="2" fill="rgba(148,163,184,0.2)"/>
            <rect x="210" y="62" width="2" height="40" stroke="rgba(148,163,184,0.15)" strokeWidth="1" strokeDasharray="4 3" fill="none"/>
            {/* Empty space where container should be */}
            <rect x="60" y="90" width="80" height="50" rx="4" fill="none" stroke="rgba(14,165,233,0.2)" strokeWidth="1.5" strokeDasharray="8 5"/>
            <text x="100" y="120" textAnchor="middle" fill="rgba(14,165,233,0.3)" fontSize="11" fontFamily="Plus Jakarta Sans, sans-serif">?</text>
            {/* Ship silhouette */}
            <path d="M20 148 C20 148 30 130 60 130 L220 130 C250 130 260 148 260 148" fill="rgba(15,23,42,0.6)" stroke="rgba(148,163,184,0.1)" strokeWidth="1"/>
            {/* 404 */}
            <text x="140" y="52" textAnchor="middle" fill="rgba(14,165,233,0.15)" fontSize="52" fontWeight="bold" fontFamily="JetBrains Mono, monospace">404</text>
          </svg>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold text-amber-400 border border-amber-500/20 bg-amber-500/8 mb-5">
            📦 {isAr ? 'حاوية مفقودة' : 'Conteneur introuvable'}
          </div>
          <h1 className={`text-[26px] sm:text-[36px] font-bold text-white mb-4 ${isAr ? 'font-arabic' : ''}`}>
            {isAr ? 'هذه الصفحة ضلّت الطريق' : "Cette page s'est perdue en route"}
          </h1>
          <p className={`text-slate-400 text-[16px] mb-8 leading-relaxed ${isAr ? 'font-arabic' : ''}`}>
            {isAr
              ? 'مثل حاوية ضائعة في المحيط — أحياناً تحدث أخطاء في التتبع. عد إلى الرئيسية.'
              : "Comme un conteneur perdu en mer — parfois le tracking se trompe. Retournez à l'accueil."}
          </p>
          <div className={`flex flex-col sm:flex-row gap-3 justify-center ${isAr ? 'sm:flex-row-reverse' : ''}`}>
            <Link
              to="/"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 text-[14px] font-semibold text-white bg-sky-500 hover:bg-sky-400 rounded-xl transition-colors"
            >
              {isAr ? '← الرئيسية' : "← Accueil"}
            </Link>
            <Link
              to="/contact"
              className="inline-flex items-center justify-center px-6 py-3 text-[14px] font-medium text-slate-300 border border-slate-700/50 hover:border-slate-500 rounded-xl transition-all"
            >
              {isAr ? 'تواصل معنا' : 'Nous contacter'}
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
