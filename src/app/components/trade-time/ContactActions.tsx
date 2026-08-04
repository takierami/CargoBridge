import { Mail, MessageCircle, Phone } from 'lucide-react'
import { useAppStore } from '../../../store/appStore'
import { ContactTimeBadge } from './ContactTimeBadge'

interface ContactActionsProps {
  country?: string
  city?: string
  phone?: string
  whatsapp?: string
  email?: string
}

export function ContactActions({ country, city, phone, whatsapp, email }: ContactActionsProps) {
  const language = useAppStore((state) => state.language)
  const whatsappDigits = whatsapp?.replace(/\D/g, '')
  const actions = [
    phone && {
      href: `tel:${phone}`,
      icon: Phone,
      label: language === 'ar' ? 'اتصال' : 'Appeler',
    },
    whatsappDigits && {
      href: `https://wa.me/${whatsappDigits}`,
      icon: MessageCircle,
      label: 'WhatsApp',
      external: true,
    },
    email && {
      href: `mailto:${email}`,
      icon: Mail,
      label: language === 'ar' ? 'بريد إلكتروني' : 'E-mail',
    },
  ].filter(Boolean) as Array<{ href: string; icon: typeof Phone; label: string; external?: boolean }>

  if (!actions.length) return null

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {actions.map(({ href, icon: Icon, label, external }) => (
          <a
            key={href}
            href={href}
            target={external ? '_blank' : undefined}
            rel={external ? 'noopener noreferrer' : undefined}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-700 transition hover:border-blue-300 hover:text-blue-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
          </a>
        ))}
      </div>
      <ContactTimeBadge country={country} city={city} />
    </div>
  )
}
