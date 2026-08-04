import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'

type Lang = 'fr' | 'ar'

interface LangContextValue {
  lang: Lang
  setLang: (l: Lang) => void
  isAr: boolean
}

const LangContext = createContext<LangContextValue>({
  lang: 'fr',
  setLang: () => {},
  isAr: false,
})

function restoreAppDocumentChrome() {
  try {
    const raw = localStorage.getItem('cargobridge_settings')
    if (raw) {
      const parsed = JSON.parse(raw) as { state?: { language?: string; theme?: string } }
      const language = parsed.state?.language
      const theme = parsed.state?.theme
      if (language === 'ar' || language === 'fr') {
        document.documentElement.lang = language
        document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr'
      } else {
        document.documentElement.lang = 'fr'
        document.documentElement.dir = 'ltr'
      }
      document.documentElement.classList.toggle('dark', theme === 'dark')
      return
    }
  } catch {
    /* ignore */
  }
  document.documentElement.lang = 'fr'
  document.documentElement.dir = 'ltr'
}

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>('fr')

  const setLang = (l: Lang) => {
    setLangState(l)
    document.documentElement.lang = l
    document.documentElement.dir = l === 'ar' ? 'rtl' : 'ltr'
  }

  useEffect(() => {
    document.documentElement.lang = lang
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr'
  }, [lang])

  useEffect(() => {
    document.documentElement.classList.remove('dark')
    return () => restoreAppDocumentChrome()
  }, [])

  return (
    <LangContext.Provider value={{ lang, setLang, isAr: lang === 'ar' }}>
      {children}
    </LangContext.Provider>
  )
}

export const useLang = () => useContext(LangContext)
