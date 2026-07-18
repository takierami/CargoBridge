"""Cross-role write parity: china_admin and algeria_admin share the same privileges."""
from datetime import date
from decimal import Decimal

from django.contrib.auth.models import User
from django.test import TestCase, override_settings
from rest_framework.test import APIClient

from accounts.models import Organization, UserProfile
from api.models import Agent, Currency, Goods, Supplier


class AdminRoleParityTests(TestCase):
    def setUp(self):
        self.org = Organization.objects.create(name='Parity Org')
        self.china = User.objects.create_user(username='parity_china', password='StrongPass1!')
        UserProfile.objects.create(user=self.china, organization=self.org, role='china_admin')
        self.algeria = User.objects.create_user(username='parity_algeria', password='StrongPass1!')
        UserProfile.objects.create(user=self.algeria, organization=self.org, role='algeria_admin')
        Currency.objects.create(
            organization=self.org,
            code='USD',
            name='US Dollar',
            name_fr='Dollar',
            symbol='$',
            rate_to_base=Decimal('1'),
            is_base=True,
            is_enabled=True,
        )
        self.supplier = Supplier.objects.create(
            organization=self.org,
            code='SUP-PAR',
            name='Parity Supplier',
            country='CN',
        )
        self.agent = Agent.objects.create(
            organization=self.org,
            name='Agent',
            phone='1',
            passport='P-PAR',
            country='DZ',
        )
        self.client = APIClient()

    def test_algeria_can_create_goods(self):
        self.client.force_authenticate(user=self.algeria)
        res = self.client.post(
            '/api/goods/',
            {
                'description': 'Algeria-created shipment',
                'category': 'electronics',
                'quantity': 1,
                'priority': 'medium',
            },
            format='json',
        )
        self.assertEqual(res.status_code, 201, res.data)
        self.assertEqual(res.data['status'], 'draft')

    def test_algeria_can_create_supplier(self):
        self.client.force_authenticate(user=self.algeria)
        res = self.client.post(
            '/api/suppliers/',
            {
                'code': 'SUP-DZ',
                'name': 'DZ Supplier',
                'country': 'CN',
            },
            format='json',
        )
        self.assertEqual(res.status_code, 201, res.data)

    def test_algeria_can_create_purchase_order(self):
        self.client.force_authenticate(user=self.algeria)
        res = self.client.post(
            '/api/purchase-orders/',
            {
                'supplier': str(self.supplier.id),
                'order_date': '2026-07-01',
                'currency': 'USD',
                'status': 'draft',
                'items': [{'product_name': 'Widget', 'quantity': 1, 'unit_cost': '10.00'}],
            },
            format='json',
        )
        self.assertEqual(res.status_code, 201, res.data)

    def test_china_can_create_supplier_adjustment(self):
        self.client.force_authenticate(user=self.china)
        res = self.client.post(
            '/api/supplier-adjustments/',
            {
                'supplier': str(self.supplier.id),
                'date': str(date(2026, 7, 1)),
                'type': 'credit',
                'amount': '25.00',
                'currency': 'USD',
                'reason': 'Parity credit',
            },
            format='json',
        )
        self.assertEqual(res.status_code, 201, res.data)

    def test_china_can_update_customs_status(self):
        goods = Goods.objects.create(
            organization=self.org,
            tracking_number='CB-PAR-1',
            description='x',
            category='electronics',
            status='arrived',
            agent=self.agent,
            customs_status='not_started',
        )
        self.client.force_authenticate(user=self.china)
        res = self.client.post(
            f'/api/goods/{goods.id}/update_customs_status/',
            {'customs_status': 'pending'},
            format='json',
        )
        self.assertEqual(res.status_code, 200, res.data)
        goods.refresh_from_db()
        self.assertEqual(goods.customs_status, 'pending')

    @override_settings(ALLOW_DATA_RESET=True)
    def test_algeria_can_call_reset(self):
        self.client.force_authenticate(user=self.algeria)
        res = self.client.post('/api/reset/', {}, format='json')
        self.assertEqual(res.status_code, 200, getattr(res, 'data', res.content))
