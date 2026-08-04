import { Link } from 'react-router'
import { useLang } from '../context/LangContext'

export default function Footer() {
  const { lang, setLang, isAr } = useLang()

  return (
    <footer style={{ background: '#07101e', borderTop: '1px solid rgba(148,163,184,0.08)' }} className="overflow-x-hidden">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 lg:gap-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-3 lg:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <svg viewBox="0 0 32 32" fill="none" className="w-7 h-7">
                <path d="M4 16 Q10 8 16 16 Q22 24 28 16" stroke="#0ea5e9" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
                <circle cx="6" cy="16" r="2.5" fill="#0ea5e9"/>
                <circle cx="26" cy="16" r="2.5" fill="#38bdf8"/>
              </svg>
              <span className="text-white font-bold text-[16px]">CargoBridge</span>
            </div>
            <p className="text-slate-400 text-sm leading-relaxed max-w-xs">
              {isAr
                ? 'نظام التشغيل لأعمال الاستيراد من الصين إلى الجزائر.'
                : "Le système d'exploitation pour les entreprises d'import Chine → Algérie."}
            </p>
            <div className="mt-5 flex items-center gap-1">
              <button
                onClick={() => setLang('ar')}
                className={`px-3 py-2 text-xs font-semibold rounded-l-md border transition-all ${isAr ? 'bg-sky-500/15 text-sky-400 border-sky-500/30' : 'text-slate-500 border-slate-700/50 hover:text-slate-300'}`}
              >
                العربية
              </button>
              <button
                onClick={() => setLang('fr')}
                className={`px-3 py-2 text-xs font-semibold rounded-r-md border-t border-b border-r transition-all ${!isAr ? 'bg-sky-500/15 text-sky-400 border-sky-500/30' : 'text-slate-500 border-slate-700/50 hover:text-slate-300'}`}
              >
                Français
              </button>
            </div>
          </div>

          {/* Product */}
          <div>
            <h4 className="text-white text-xs font-semibold uppercase tracking-widest mb-4 opacity-50">
              {isAr ? 'المنتج' : 'Produit'}
            </h4>
            <ul className="space-y-3">
              {[
                { href: '/features', fr: 'Fonctionnalités', ar: 'المميزات' },
                { href: '/pricing', fr: 'Tarifs', ar: 'الأسعار' },
              ].map((l) => (
                <li key={l.href}>
                  <Link to={l.href} className="block py-1 text-slate-400 hover:text-sky-400 text-sm transition-colors">
                    {l[lang]}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-white text-xs font-semibold uppercase tracking-widest mb-4 opacity-50">
              {isAr ? 'الشركة' : 'Société'}
            </h4>
            <ul className="space-y-3">
              {[
                { href: '/about', fr: 'À propos', ar: 'من نحن' },
                { href: '/contact', fr: 'Contact', ar: 'تواصل' },
                { href: '/faq', fr: 'FAQ', ar: 'أسئلة شائعة' },
              ].map((l) => (
                <li key={l.href}>
                  <Link to={l.href} className="block py-1 text-slate-400 hover:text-sky-400 text-sm transition-colors">
                    {l[lang]}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact info */}
          <div>
            <h4 className="text-white text-xs font-semibold uppercase tracking-widest mb-4 opacity-50">
              {isAr ? 'اتصل بنا' : 'Nous contacter'}
            </h4>
            <ul className="space-y-3">
              <li>
                <a
                  href="mailto:info@cargobridgedz.com"
                  className="text-sky-400 hover:text-sky-300 text-sm transition-colors break-all"
                >
                  info@cargobridgedz.com
                </a>
              </li>
              {['0560 20 70 00', '0663 10 41 86', '0770 41 40 17'].map((n) => (
                <li key={n}>
                  <a
                    href={`tel:+213${n.replace(/\s/g, '').slice(1)}`}
                    className="text-slate-400 hover:text-white text-sm font-mono transition-colors"
                  >
                    {n}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal + Workspace */}
          <div>
            <h4 className="text-white text-xs font-semibold uppercase tracking-widest mb-4 opacity-50">
              {isAr ? 'قانوني' : 'Légal'}
            </h4>
            <ul className="space-y-3">
              {[
                { href: '/privacy', fr: 'Confidentialité', ar: 'الخصوصية' },
                { href: '/terms', fr: 'Conditions', ar: 'الشروط' },
              ].map((l) => (
                <li key={l.href}>
                  <Link to={l.href} className="block py-1 text-slate-400 hover:text-sky-400 text-sm transition-colors">
                    {l[lang]}
                  </Link>
                </li>
              ))}
              <li>
                <Link to="/login" className="text-sky-500 hover:text-sky-400 text-sm transition-colors font-medium">
                  {isAr ? 'الدخول للمنصة ↗' : 'Connexion workspace ↗'}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-slate-800/60 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-slate-600 text-xs">
            © {new Date().getFullYear()} CargoBridge. {isAr ? 'جميع الحقوق محفوظة.' : 'Tous droits réservés.'}
          </p>
          <p className="text-slate-700 text-xs">
            {isAr ? 'الصين ↔ الجزائر' : 'Chine ↔ Algérie'}
          </p>
        </div>
      </div>
    </footer>
  )
}
