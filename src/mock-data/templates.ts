import type { DocumentTemplate } from '../types'

export const mockTemplates: DocumentTemplate[] = [
  {
    id: 'tpl-reception-ar',
    name: 'وصل استلام بضاعة (عربي)',
    type: 'reception',
    isDefault: true,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
    content: `بسم الله الرحمن الرحيم

وصل استلام بضاعة
شركة: {{companyName}}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

أنا الموقع أدناه {{agentName}}، حامل جواز السفر رقم {{passportNumber}}، أُقر باستلام البضاعة التالية وتحمّل المسؤولية الكاملة عن نقلها:

الوصف: {{goodsDescription}}
الفئة: {{category}}
الكمية: {{quantity}}
الوزن: {{weight}}
القيمة: {{value}}
رقم التتبع: {{trackingNumber}}

تاريخ الاستلام: {{departureDate}}
تاريخ الوصول المتوقع: {{expectedArrivalDate}}

ملاحظات: {{notes}}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
أتعهد بتسليم هذه البضاعة في الوقت المحدد وبالحالة التي استلمتها عليها.

تاريخ ووقت إنشاء الوثيقة: {{currentDateTime}}

اسم الوكيل: {{agentName}}
رقم الهاتف: {{agentPhone}}

الإمضاء: ________________________`,
  },
  {
    id: 'tpl-delivery-ar',
    name: 'وصل تسليم بضاعة (عربي)',
    type: 'delivery',
    isDefault: true,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
    content: `بسم الله الرحمن الرحيم

وصل تسليم بضاعة
شركة: {{companyName}}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

يُشهد بموجب هذه الوثيقة أن البضاعة التالية قد تم استلامها بشكل كامل وسليم:

رقم التتبع: {{trackingNumber}}
الوصف: {{goodsDescription}}
الكمية: {{quantity}}

اسم الوكيل الناقل: {{agentName}}
رقم الجواز: {{passportNumber}}

تاريخ الوصول: {{arrivalDate}}
تاريخ ووقت إنشاء الوثيقة: {{currentDateTime}}

ملاحظات: {{notes}}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

توقيع المستلم: ________________________
الاسم: ________________________
التاريخ: ________________________`,
  },
  {
    id: 'tpl-reception-fr',
    name: 'Reçu de réception (Français)',
    type: 'reception',
    isDefault: false,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
    content: `REÇU DE RÉCEPTION DE MARCHANDISE
Société: {{companyName}}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Je soussigné(e) {{agentName}}, titulaire du passeport n° {{passportNumber}}, certifie avoir pris en charge la marchandise suivante pour transport:

Description: {{goodsDescription}}
Catégorie: {{category}}
Quantité: {{quantity}}
Poids: {{weight}}
Valeur: {{value}}
Numéro de suivi: {{trackingNumber}}

Date de prise en charge: {{departureDate}}
Date d'arrivée prévue: {{expectedArrivalDate}}

Notes: {{notes}}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Je m'engage à livrer cette marchandise dans les délais et en bon état.

Date et heure du document: {{currentDateTime}}

Nom de l'agent: {{agentName}}
Téléphone: {{agentPhone}}

Signature: ________________________`,
  },
  {
    id: 'tpl-delivery-fr',
    name: 'Reçu de livraison (Français)',
    type: 'delivery',
    isDefault: false,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
    content: `REÇU DE LIVRAISON
Société: {{companyName}}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Le présent document atteste que la marchandise ci-dessous a été réceptionnée en bon état:

Numéro de suivi: {{trackingNumber}}
Description: {{goodsDescription}}
Quantité: {{quantity}}
Agent transporteur: {{agentName}}
Passeport: {{passportNumber}}

Date d'arrivée: {{arrivalDate}}
Date et heure du document: {{currentDateTime}}

Notes: {{notes}}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Signature du réceptionnaire: ________________________
Nom: ________________________
Date: ________________________`,
  },
]
