"""Org-scoped agent tax rules (auto-entrepreneur 5%, standard 0%)."""

from decimal import Decimal

from api.models import AgentTaxRule

DEFAULT_AGENT_TAX_RULES = [
    {
        'agent_type': 'standard',
        'tax_percent': Decimal('0.00'),
        'label_ar': 'وكيل عادي',
        'label_fr': 'Agent standard',
    },
    {
        'agent_type': 'auto_entrepreneur',
        'tax_percent': Decimal('5.00'),
        'label_ar': 'مقاول ذاتي (5%)',
        'label_fr': 'Auto-entrepreneur (5%)',
    },
]


def upsert_agent_tax_rules(org) -> int:
    """Ensure default tax rules exist for an organization. Returns rows touched."""
    touched = 0
    for row in DEFAULT_AGENT_TAX_RULES:
        _, created = AgentTaxRule.objects.update_or_create(
            organization=org,
            agent_type=row['agent_type'],
            defaults={
                'tax_percent': row['tax_percent'],
                'label_ar': row['label_ar'],
                'label_fr': row['label_fr'],
                'is_active': True,
            },
        )
        if created:
            touched += 1
    return touched
