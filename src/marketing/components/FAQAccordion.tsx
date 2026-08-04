import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface FAQItem {
  q: string
  a: string
}

interface Props {
  items: FAQItem[]
  isAr?: boolean
}

function FAQRow({ item, isAr }: { item: FAQItem; isAr?: boolean }) {
  const [open, setOpen] = useState(false)

  return (
    <div
      className="border-b transition-colors"
      style={{ borderColor: open ? 'rgba(14,165,233,0.2)' : 'rgba(148,163,184,0.08)' }}
    >
      <button
        className={`w-full flex items-center justify-between gap-4 py-4 sm:py-5 text-left transition-colors ${open ? 'text-sky-400' : 'text-slate-200 hover:text-white'}`}
        onClick={() => setOpen(!open)}
      >
        <span className={`text-[14px] sm:text-[15px] font-medium leading-snug ${isAr ? 'font-arabic text-right' : ''}`}>
          {item.q}
        </span>
        <motion.div
          animate={{ rotate: open ? 45 : 0 }}
          transition={{ duration: 0.22 }}
          className="flex-shrink-0 w-5 h-5 text-current"
        >
          <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 4v12M4 10h12"/>
          </svg>
        </motion.div>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <p className={`pb-4 sm:pb-5 text-slate-400 text-[13px] sm:text-[14px] leading-relaxed ${isAr ? 'font-arabic text-right' : ''}`}>
              {item.a}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function FAQAccordion({ items, isAr }: Props) {
  return (
    <div className="divide-transparent">
      {items.map((item, i) => (
        <FAQRow key={i} item={item} isAr={isAr} />
      ))}
    </div>
  )
}
