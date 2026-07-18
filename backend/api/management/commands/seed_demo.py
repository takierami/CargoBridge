from datetime import timedelta

from django.core.management.base import BaseCommand
from django.utils import timezone

from accounts.models import Organization
from api.models import (
    Agent,
    Currency,
    Goods,
    Notification,
    SupplierCategoryEntity,
    SupplierDocumentTemplate,
)
from api.receipt_templates import upsert_receipt_templates


def seed_organization(org):
    if Agent.objects.filter(organization=org).exists():
        return

    now = timezone.now()
    agents_data = [
        {'name': 'أحمد بن علي', 'name_fr': 'Ahmed Ben Ali', 'phone': '+86-138-0000-1234',
         'passport': 'DZ-1234567', 'country': 'الجزائر', 'status': 'traveling',
         'reliability_score': 92, 'total_deliveries': 47, 'delayed_deliveries': 3},
        {'name': 'محمد الحسين', 'name_fr': 'Mohamed El Hossine', 'phone': '+86-139-0000-5678',
         'passport': 'DZ-2345678', 'country': 'الجزائر', 'status': 'active',
         'reliability_score': 87, 'total_deliveries': 32, 'delayed_deliveries': 4},
        {'name': 'يوسف بلقاسم', 'name_fr': 'Youcef Belgassem', 'phone': '+86-137-0000-9012',
         'passport': 'DZ-3456789', 'country': 'الجزائر', 'status': 'delayed',
         'reliability_score': 74, 'total_deliveries': 21, 'delayed_deliveries': 5},
        {'name': 'كريم بوعزيز', 'name_fr': 'Karim Bouaziz', 'phone': '+86-136-0000-3456',
         'passport': 'DZ-4567890', 'country': 'الجزائر', 'status': 'active',
         'reliability_score': 96, 'total_deliveries': 68, 'delayed_deliveries': 2},
    ]
    agents = []
    for data in agents_data:
        agents.append(Agent.objects.create(organization=org, last_active=now, **data))

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

    Notification.objects.create(
        organization=org,
        type='goods',
        title_ar='مرحباً بك في كارغو بريدج',
        title_fr='Bienvenue sur CargoBridge',
        message_ar='تم تهيئة حسابك بنجاح.',
        message_fr='Votre compte a été initialisé avec succès.',
        read=False,
        timestamp=now,
    )

    upsert_receipt_templates(org)

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

    SupplierDocumentTemplate.objects.create(
        organization=org,
        template_name='قالب افتراضي',
        template_body='{{supplierName}}',
    )


class Command(BaseCommand):
    help = 'Seed demo data for all organizations'

    def handle(self, *args, **options):
        for org in Organization.objects.all():
            seed_organization(org)
            self.stdout.write(self.style.SUCCESS(f'Seeded {org.name}'))
