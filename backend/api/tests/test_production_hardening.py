from datetime import date
from decimal import Decimal
from unittest.mock import patch

from django.contrib.auth.models import User
from django.test import TestCase, override_settings
from rest_framework.test import APIClient

from accounts.models import Organization, UserProfile
from api.models import (
    Currency,
    Goods,
    MoneyAuditEvent,
    PurchaseOrder,
    PurchaseOrderItem,
    Supplier,
    SupplierPayment,
)


class ProductionHardeningTests(TestCase):
    def setUp(self):
        self.org = Organization.objects.create(name='Prod Org')
        self.china = User.objects.create_user(username='prod_china', password='StrongPass1!')
        UserProfile.objects.create(user=self.china, organization=self.org, role='china_admin')
        self.algeria = User.objects.create_user(username='prod_algeria', password='StrongPass1!')
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
            code='SUP-P1',
            name='Supplier',
            country='CN',
        )
        self.client = APIClient()

    def test_supplier_soft_delete_preserves_row(self):
        self.client.force_authenticate(user=self.china)
        sid = str(self.supplier.id)
        res = self.client.delete(f'/api/suppliers/{sid}/')
        self.assertEqual(res.status_code, 204)
        supplier = Supplier.objects.get(pk=sid)
        self.assertTrue(supplier.is_deleted)
        self.assertEqual(supplier.deleted_by_id, self.china.id)
        self.assertIsNotNone(supplier.deleted_at)
        self.assertTrue(
            MoneyAuditEvent.objects.filter(
                entity_type='supplier', action='soft_delete', entity_id=supplier.id
            ).exists()
        )
        listed = self.client.get('/api/suppliers/')
        self.assertEqual(listed.status_code, 200)
        ids = [row['id'] for row in listed.data.get('results', listed.data)]
        self.assertNotIn(sid, ids)

    def test_po_items_frozen_after_confirmed(self):
        self.client.force_authenticate(user=self.china)
        po = PurchaseOrder.objects.create(
            organization=self.org,
            supplier=self.supplier,
            po_number='PO-FROZEN',
            order_date=date(2026, 1, 1),
            currency='USD',
            status='confirmed',
            total_amount=Decimal('100.00'),
            fx_rate_to_base=Decimal('1'),
        )
        PurchaseOrderItem.objects.create(
            organization=self.org,
            purchase_order=po,
            product_name='Widget',
            quantity=1,
            unit_cost=Decimal('100.00'),
            total_cost=Decimal('100.00'),
        )
        res = self.client.patch(
            f'/api/purchase-orders/{po.id}/',
            {'items': [{'product_name': 'Hacked', 'quantity': 1, 'unit_cost': '1.00'}]},
            format='json',
        )
        self.assertEqual(res.status_code, 400)
        self.assertIn('items', res.data)
        po.refresh_from_db()
        self.assertEqual(po.total_amount, Decimal('100.00'))
        self.assertEqual(po.items.count(), 1)
        self.assertEqual(po.items.first().product_name, 'Widget')

    def test_amount_paid_capped_at_amount(self):
        self.client.force_authenticate(user=self.algeria)
        res = self.client.post(
            '/api/supplier-payments/',
            {
                'supplier': str(self.supplier.id),
                'amount': '10.00',
                'amount_paid': '50.00',
                'currency': 'USD',
                'payment_date': '2026-07-01',
                'payment_method': 'bank_transfer',
            },
            format='json',
        )
        self.assertEqual(res.status_code, 400)
        self.assertIn('amount_paid', res.data)

    def test_payment_create_audit_atomic_on_audit_failure(self):
        self.client.force_authenticate(user=self.algeria)
        with patch('api.services.record_money_audit', side_effect=RuntimeError('audit boom')):
            with self.assertRaises(RuntimeError):
                self.client.post(
                    '/api/supplier-payments/',
                    {
                        'supplier': str(self.supplier.id),
                        'amount': '10.00',
                        'amount_paid': '0',
                        'currency': 'USD',
                        'payment_date': '2026-07-01',
                        'payment_method': 'bank_transfer',
                    },
                    format='json',
                )
        self.assertEqual(SupplierPayment.objects.filter(supplier=self.supplier).count(), 0)

    @override_settings(BOOTSTRAP_MAX_PER_COLLECTION=2)
    def test_bootstrap_caps_collections(self):
        for i in range(3):
            Goods.objects.create(
                organization=self.org,
                tracking_number=f'TRK-{i}',
                description='x',
                category='general',
                status='draft',
            )
        self.client.force_authenticate(user=self.china)
        res = self.client.get('/api/bootstrap/')
        self.assertEqual(res.status_code, 200)
        self.assertEqual(len(res.data['goods']), 2)
        self.assertIn('goods', res.data['meta']['truncated'])
        self.assertEqual(res.data['meta']['truncated']['goods']['total'], 3)
