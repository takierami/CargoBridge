import { Outlet, useLocation } from 'react-router'
import { AnimatePresence, motion } from 'framer-motion'
import type { ReactNode } from 'react'
import { LangProvider, useLang } from './context/LangContext'
import Nav from './components/Nav'
import Footer from './components/Footer'
import './index.css'

function PageTransition({ children }: { children: ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
    >
      {children}
    </motion.div>
  )
}

function MarketingShell() {
  const location = useLocation()
  const { isAr } = useLang()
  const hideFooterOn = ['/contact/success']
  const showFooter = !hideFooterOn.includes(location.pathname)

  return (
    <div className="marketing-root" dir={isAr ? 'rtl' : 'ltr'} lang={isAr ? 'ar' : 'fr'}>
      <Nav />
      <AnimatePresence mode="wait" initial={false}>
        <PageTransition key={location.pathname}>
          <Outlet />
        </PageTransition>
      </AnimatePresence>
      {showFooter && <Footer />}
    </div>
  )
}

export function MarketingLayout() {
  return (
    <LangProvider>
      <MarketingShell />
    </LangProvider>
  )
}
