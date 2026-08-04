import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router'
import { motion, AnimatePresence } from 'framer-motion'
import { useLang } from '../context/LangContext'

const links = [
  { href: '/', label: { fr: 'Accueil', ar: 'الرئيسية' } },
  { href: '/features', label: { fr: 'Fonctionnalités', ar: 'المميزات' } },
  { href: '/pricing', label: { fr: 'Tarifs', ar: 'الأسعار' } },
  { href: '/about', label: { fr: 'À propos', ar: 'من نحن' } },
  { href: '/contact', label: { fr: 'Contact', ar: 'تواصل' } },
]

export default function Nav() {
  const { lang, setLang, isAr } = useLang()
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const location = useLocation()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    setMenuOpen(false)
  }, [location])

  return (
    <>
      <nav
        className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
        style={{
          height: 'var(--nav-height)',
          background: scrolled ? 'rgba(11,18,32,0.92)' : 'rgba(11,18,32,0.6)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderBottom: scrolled ? '1px solid rgba(148,163,184,0.08)' : '1px solid transparent',
        }}
      >
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 h-full flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="relative w-8 h-8">
              <svg viewBox="0 0 32 32" fill="none" className="w-8 h-8">
                <rect x="2" y="14" width="28" height="4" rx="2" fill="#0ea5e9" opacity="0.3"/>
                <path d="M4 16 Q10 8 16 16 Q22 24 28 16" stroke="#0ea5e9" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
                <circle cx="6" cy="16" r="3" fill="#0ea5e9"/>
                <circle cx="26" cy="16" r="3" fill="#38bdf8"/>
                <path d="M6 16 L26 16" stroke="rgba(14,165,233,0.25)" strokeWidth="1" strokeDasharray="3 3"/>
              </svg>
            </div>
            <span className="text-white font-bold text-[15px] sm:text-[17px] tracking-tight group-hover:text-sky-400 transition-colors">
              CargoBridge
            </span>
          </Link>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-1">
            {links.map((l) => {
              const active = location.pathname === l.href
              return (
                <Link
                  key={l.href}
                  to={l.href}
                  className={`px-3.5 py-2 rounded-lg text-[14px] font-medium transition-colors ${
                    active
                      ? 'text-sky-400 bg-sky-500/10'
                      : 'text-slate-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {l.label[lang]}
                </Link>
              )
            })}
          </div>

          {/* Right actions */}
          <div className="hidden md:flex items-center gap-3">
            {/* Lang toggle */}
            <button
              onClick={() => setLang(isAr ? 'fr' : 'ar')}
              className="flex items-center gap-1 px-3 py-2 rounded-md text-[13px] font-semibold text-slate-400 hover:text-sky-400 border border-slate-700/50 hover:border-sky-500/30 transition-all"
            >
              <span className={isAr ? 'text-sky-400' : ''}>AR</span>
              <span className="text-slate-600">|</span>
              <span className={!isAr ? 'text-sky-400' : ''}>FR</span>
            </button>
            {/* Login */}
            <Link
              to="/login"
              className="px-4 py-2 text-[14px] font-medium text-slate-300 hover:text-white border border-slate-700/50 hover:border-slate-500 rounded-lg transition-all"
            >
              {isAr ? 'الدخول' : 'Connexion'}
            </Link>
            {/* Request Demo */}
            <Link
              to="/contact?intent=demo"
              className="px-4 py-2 text-[14px] font-semibold text-white bg-sky-500 hover:bg-sky-400 rounded-lg transition-colors shadow-lg shadow-sky-500/20"
            >
              {isAr ? 'طلب عرض' : 'Demander une démo'}
            </Link>
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-2.5 text-slate-300 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Menu"
          >
            <div className="w-5 flex flex-col gap-1.5">
              <span className={`block h-0.5 bg-current transition-all origin-center ${menuOpen ? 'rotate-45 translate-y-2' : ''}`} />
              <span className={`block h-0.5 bg-current transition-all ${menuOpen ? 'opacity-0 scale-x-0' : ''}`} />
              <span className={`block h-0.5 bg-current transition-all origin-center ${menuOpen ? '-rotate-45 -translate-y-2' : ''}`} />
            </div>
          </button>
        </div>
      </nav>

      {/* Mobile sheet */}
      <AnimatePresence>
        {menuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-40 md:hidden"
              onClick={() => setMenuOpen(false)}
            />
            <motion.div
              initial={{ x: isAr ? '-100%' : '100%', opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: isAr ? '-100%' : '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 28, stiffness: 280 }}
              className={`fixed top-0 ${isAr ? 'left-0' : 'right-0'} bottom-0 z-50 w-[min(320px,85vw)] glass-card flex flex-col p-5 sm:p-6 md:hidden overflow-y-auto`}
            >
              <div className="flex items-center justify-between mb-8">
                <span className="text-white font-bold text-lg">CargoBridge</span>
                <button onClick={() => setMenuOpen(false)} className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-white/5 transition-colors">✕</button>
              </div>
              <div className="flex flex-col gap-1 flex-1">
                {links.map((l) => (
                  <Link
                    key={l.href}
                    to={l.href}
                    className={`px-4 py-3 rounded-lg text-[15px] font-medium transition-colors ${
                      location.pathname === l.href ? 'text-sky-400 bg-sky-500/10' : 'text-slate-200 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    {l.label[lang]}
                  </Link>
                ))}
              </div>
              <div className="flex flex-col gap-3 pt-6 border-t border-slate-700/50">
                <button
                  onClick={() => setLang(isAr ? 'fr' : 'ar')}
                  className="flex items-center justify-center gap-2 py-2.5 text-sm font-semibold border border-slate-600/50 rounded-lg text-slate-300 hover:text-sky-400"
                >
                  <span className={isAr ? 'text-sky-400' : ''}>العربية</span>
                  <span className="text-slate-600">·</span>
                  <span className={!isAr ? 'text-sky-400' : ''}>Français</span>
                </button>
                <Link to="/login" className="py-2.5 text-center text-sm font-medium text-slate-300 border border-slate-700/50 rounded-lg hover:border-slate-500 transition-all">
                  {isAr ? 'الدخول للمنصة' : 'Connexion workspace'}
                </Link>
                <Link
                  to="/contact?intent=demo"
                  className="py-3 text-center text-sm font-semibold text-white bg-sky-500 hover:bg-sky-400 rounded-lg transition-colors"
                >
                  {isAr ? 'طلب عرض تجريبي' : 'Demander une démo'}
                </Link>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
