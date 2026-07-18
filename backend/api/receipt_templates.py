"""Default shipment receipt templates (Arabic + French, reception + delivery)."""

RECEIPT_TEMPLATES = [
    {
        'name': 'وصل استلام بضاعة (عربي)',
        'type': 'reception',
        'is_default': True,
        'content': '''بسم الله الرحمن الرحيم

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

الإمضاء: ________________________''',
    },
    {
        'name': 'وصل تسليم بضاعة (عربي)',
        'type': 'delivery',
        'is_default': True,
        'content': '''بسم الله الرحمن الرحيم

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
التاريخ: ________________________''',
    },
    {
        'name': 'Reçu de réception (Français)',
        'type': 'reception',
        'is_default': False,
        'content': '''REÇU DE RÉCEPTION DE MARCHANDISE
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

Signature: ________________________''',
    },
    {
        'name': 'Reçu de livraison (Français)',
        'type': 'delivery',
        'is_default': False,
        'content': '''REÇU DE LIVRAISON
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
Date: ________________________''',
    },
]


def upsert_receipt_templates(org):
    """Create or update the 4 default receipt templates for an organization."""
    from api.models import DocumentTemplate

    for tpl in RECEIPT_TEMPLATES:
        obj, created = DocumentTemplate.objects.update_or_create(
            organization=org,
            name=tpl['name'],
            type=tpl['type'],
            defaults={
                'content': tpl['content'],
                'is_default': tpl['is_default'],
            },
        )
        # Ensure only one default per type when marking default
        if tpl['is_default']:
            DocumentTemplate.objects.filter(
                organization=org,
                type=tpl['type'],
                is_default=True,
            ).exclude(pk=obj.pk).update(is_default=False)
            if not obj.is_default:
                obj.is_default = True
                obj.save(update_fields=['is_default', 'updated_at'])
