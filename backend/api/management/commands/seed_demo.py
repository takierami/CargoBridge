from datetime import timedelta

from django.core.management.base import BaseCommand
from django.utils import timezone

from accounts.models import Organization
from api.agent_tax_rules import upsert_agent_tax_rules
from api.models import (
    Agent,
    Currency,
    Goods,
    Notification,
    SupplierCategoryEntity,
)
from api.receipt_templates import upsert_receipt_templates
from api.supplier_default_templates import upsert_supplier_default_templates


def seed_system_defaults(org):
    """Currencies, categories, templates, tax rules, welcome notice — no demo ops data."""
    upsert_agent_tax_rules(org)
    upsert_receipt_templates(org)
    upsert_supplier_default_templates(org)

    if not Currency.objects.filter(organization=org).exists():
        defaults = [
            ('DZD', 'دينار جزائري', 'Dinar algérien', 'دج', 1, True, True),
            ('EUR', 'يورو', 'Euro', '€', 260, False, False),
            ('CNY', 'يوان صيني', 'Yuan chinois', '¥', 21, False, False),
            ('USD', 'دولار أمريكي', 'Dollar américain', '$', 235, False, False),
        ]
        for code, name, name_fr, symbol, rate, is_base, is_default in defaults:
            Currency.objects.create(
                organization=org,
                code=code,
                name=name,
                name_fr=name_fr,
                symbol=symbol,
                rate_to_base=rate,
                is_base=is_base,
                is_default=is_default,
                is_enabled=True,
            )

    if not SupplierCategoryEntity.objects.filter(organization=org).exists():
        categories = [
            ('أحذية', 'Chaussures'),
            ('ملابس', 'Vêtements'),
            ('إلكترونيات', 'Électronique'),
            ('أثاث', 'Mobilier'),
        ]
        for name, name_fr in categories:
            SupplierCategoryEntity.objects.create(
                organization=org,
                name=name,
                name_fr=name_fr,
                is_editable=True,
            )

    if not Notification.objects.filter(organization=org, type='goods').exists():
        now = timezone.now()
        Notification.objects.create(
            organization=org,
            type='goods',
            title_ar='مرحباً بك في كارغو بريدج',
            title_fr='Bienvenue sur CargoBridge',
            message_ar='تم تهيئة حسابك بنجاح. ابدأ بإضافة مورد أو وكيل أو شحنة.',
            message_fr='Votre compte a été initialisé. Commencez par un fournisseur, un agent ou une expédition.',
            read=False,
            timestamp=now,
        )


def seed_demo_data(org):
    """Sample agents + goods for local demos only — never for real tenant signup."""
    seed_system_defaults(org)
    if Agent.objects.filter(organization=org).exists():
        return

    now = timezone.now()
    agents_data = [
        {'name': 'أحمد بن علي', 'name_fr': 'Ahmed Ben Ali', 'phone': '+86-138-0000-1234',
         'passport': 'DZ-1234567', 'country': 'الجزائر', 'status': 'traveling',
         'employment_status': 'active', 'agent_type': 'auto_entrepreneur',
         'reliability_score': 92, 'total_deliveries': 47, 'delayed_deliveries': 3},
        {'name': 'محمد الحسين', 'name_fr': 'Mohamed El Hossine', 'phone': '+86-139-0000-5678',
         'passport': 'DZ-2345678', 'country': 'الجزائر', 'status': 'active',
         'employment_status': 'active', 'agent_type': 'standard',
         'reliability_score': 87, 'total_deliveries': 32, 'delayed_deliveries': 4},
        {'name': 'يوسف بلقاسم', 'name_fr': 'Youcef Belgassem', 'phone': '+86-137-0000-9012',
         'passport': 'DZ-3456789', 'country': 'الجزائر', 'status': 'delayed',
         'employment_status': 'active', 'agent_type': 'standard',
         'reliability_score': 74, 'total_deliveries': 21, 'delayed_deliveries': 5},
        {'name': 'كريم بوعزيز', 'name_fr': 'Karim Bouaziz', 'phone': '+86-136-0000-3456',
         'passport': 'DZ-4567890', 'country': 'الجزائر', 'status': 'active',
         'employment_status': 'active', 'agent_type': 'auto_entrepreneur',
         'reliability_score': 96, 'total_deliveries': 68, 'delayed_deliveries': 2},
    ]
    agents = []
    from api import services
    for data in agents_data:
        agents.append(Agent.objects.create(
            organization=org,
            last_active=now,
            code=services.next_sequence(org, 'agent', 'AGT'),
            **data,
        ))

    goods_samples = [
        ('CB-2025-001', 'هواتف ذكية سامسونج', 'electronics', 50, 'in_transit', 'high', 'air', agents[0]),
        ('CB-2025-002', 'ملابس شتوية نسائية', 'clothing', 200, 'ready_for_departure', 'medium', 'land', agents[1]),
        ('CB-2025-003', 'مستحضرات تجميل فاخرة', 'cosmetics', 300, 'delayed', 'medium', 'air', agents[0]),
        ('CB-2025-004', 'أجهزة لوحية وملحقاتها', 'electronics', 30, 'delivered', 'high', '', agents[3]),
    ]
    for tn, desc, cat, qty, status, priority, transport, agent in goods_samples:
        Goods.objects.create(
            organization=org,
            tracking_number=tn,
            description=desc,
            category=cat,
            quantity=qty,
            status=status,
            priority=priority,
            transport_type=transport,
            agent=agent,
            departure_date=(now - timedelta(days=5)).date(),
            expected_arrival_date=(now + timedelta(days=7)).date(),
            value=5000,
        )


def seed_organization(org, *, demo=False):
    """Backward-compatible entry: defaults only unless demo=True."""
    if demo:
        seed_demo_data(org)
    else:
        seed_system_defaults(org)


class Command(BaseCommand):
    help = 'Seed system defaults (and optional demo agents/goods) for organizations'

    def add_arguments(self, parser):
        parser.add_argument(
            '--demo',
            action='store_true',
            help='Also create sample agents and goods (CLI demos only).',
        )
        parser.add_argument(
            '--org-id',
            dest='org_id',
            default='',
            help='Limit to one organization UUID (default: all).',
        )

    def handle(self, *args, **options):
        qs = Organization.objects.all()
        if options['org_id']:
            qs = qs.filter(pk=options['org_id'])
        for org in qs:
            seed_organization(org, demo=options['demo'])
            label = 'demo+defaults' if options['demo'] else 'defaults'
            self.stdout.write(self.style.SUCCESS(f'Seeded {org.name} ({label})'))
