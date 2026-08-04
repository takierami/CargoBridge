from datetime import date
from decimal import Decimal

from django.contrib.auth import get_user_model

User = get_user_model()
from django.test import TestCase
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
from api import services


class FinanceIntegrityTests(TestCase):
    def setUp(self):
        self.org = Organization.objects.create(name='Finance Org')
        self.china = User.objects.create_user(username='fin_china', password='StrongPass1!')
        UserProfile.objects.create(user=self.china, organization=self.org, role='admin', office='china')
        self.algeria = User.objects.create_user(username='fin_algeria', password='StrongPass1!')
        UserProfile.objects.create(user=self.algeria, organization=self.org, role='admin', office='algeria')
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
        Currency.objects.create(
            organization=self.org,
            code='CNY',
            name='Yuan',
            name_fr='Yuan',
            symbol='¥',
            rate_to_base=Decimal('0.14'),
            is_base=False,
            is_enabled=True,
        )
        self.supplier = Supplier.objects.create(
            organization=self.org,
            code='SUP-1',
            name='Supplier',
            country='CN',
            preferred_currency='CNY',
        )
        self.client = APIClient()

    def test_fx_normalize_balance_and_ledger_align(self):
        po = PurchaseOrder.objects.create(
            organization=self.org,
            supplier=self.supplier,
            po_number='PO-1',
            order_date=date(2026, 1, 1),
            currency='CNY',
            status='confirmed',
            total_amount=Decimal('100.00'),
            fx_rate_to_base=Decimal('0.14'),
            created_by=self.china,
        )
        PurchaseOrderItem.objects.create(
            organization=self.org,
            purchase_order=po,
            product_name='Widget',
            quantity=1,
            unit_cost=Decimal('100.00'),
            total_cost=Decimal('100.00'),
        )
        PurchaseOrder.objects.create(
            organization=self.org,
            supplier=self.supplier,
            po_number='PO-DRAFT',
            order_date=date(2026, 1, 2),
            currency='CNY',
            status='draft',
            total_amount=Decimal('999.00'),
            fx_rate_to_base=Decimal('0.14'),
        )
        SupplierPayment.objects.create(
            organization=self.org,
            supplier=self.supplier,
            payment_number='PAY-1',
            amount=Decimal('50.00'),
            amount_paid=Decimal('50.00'),
            currency='USD',
            fx_rate_to_base=Decimal('1'),
            payment_date=date(2026, 1, 3),
            status='pending',
            created_by=self.algeria,
        )

        services.update_supplier_balance(self.supplier)
        self.supplier.refresh_from_db()
        self.assertEqual(self.supplier.balance_currency, 'USD')
        self.assertEqual(self.supplier.total_purchased, Decimal('14.00'))
        self.assertEqual(self.supplier.total_paid, Decimal('50.00'))
        self.assertEqual(self.supplier.outstanding, Decimal('-36.00'))

        ledger = services.build_supplier_ledger(self.supplier)
        refs = {e['reference'] for e in ledger}
        self.assertIn('PO-1', refs)
        self.assertNotIn('PO-DRAFT', refs)
        self.assertEqual(ledger[-1]['running_balance'], -36.0)
        self.assertEqual(ledger[-1]['currency'], 'USD')

    def test_payment_created_by_and_soft_delete_actor(self):
        self.client.force_authenticate(user=self.algeria)
        res = self.client.post(
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
        self.assertEqual(res.status_code, 201, res.data)
        payment_id = res.data['id']
        self.assertEqual(str(res.data.get('created_by')), str(self.algeria.id))
        self.assertTrue(
            MoneyAuditEvent.objects.filter(entity_type='payment', action='create', entity_id=payment_id).exists()
        )

        del_res = self.client.delete(f'/api/supplier-payments/{payment_id}/')
        self.assertEqual(del_res.status_code, 204)
        payment = SupplierPayment.objects.get(pk=payment_id)
        self.assertTrue(payment.is_deleted)
        self.assertEqual(payment.deleted_by_id, self.algeria.id)
        self.assertIsNotNone(payment.deleted_at)
        self.assertTrue(
            MoneyAuditEvent.objects.filter(entity_type='payment', action='soft_delete', entity_id=payment_id).exists()
        )

    def test_derive_ignores_stale_fully_paid_flag(self):
        payment = SupplierPayment(
            amount=Decimal('100'),
            amount_paid=Decimal('0'),
            payment_date=date(2099, 1, 1),
            status='fully_paid',
        )
        self.assertEqual(services.derive_payment_status(payment), 'pending')
        self.assertEqual(services.payment_credited_amount(payment), Decimal('0'))

    def test_po_create_defaults_draft_without_status_and_snapshots_fx(self):
        self.client.force_authenticate(user=self.china)
        res = self.client.post(
            '/api/purchase-orders/',
            {
                'supplier': str(self.supplier.id),
                'order_date': '2026-07-01',
                'currency': 'CNY',
                'items': [{'product_name': 'A', 'quantity': 1, 'unit_cost': '10.00'}],
            },
            format='json',
        )
        self.assertEqual(res.status_code, 201, res.data)
        self.assertEqual(res.data['status'], 'draft')
        self.assertEqual(Decimal(res.data['fx_rate_to_base']), Decimal('0.14'))

    def test_po_create_advances_to_requested_confirmed(self):
        self.client.force_authenticate(user=self.china)
        res = self.client.post(
            '/api/purchase-orders/',
            {
                'supplier': str(self.supplier.id),
                'order_date': '2026-07-01',
                'currency': 'CNY',
                'status': 'confirmed',
                'items': [{'product_name': 'A', 'quantity': 1, 'unit_cost': '10.00'}],
            },
            format='json',
        )
        self.assertEqual(res.status_code, 201, res.data)
        self.assertEqual(res.data['status'], 'confirmed')
        self.assertEqual(Decimal(res.data['fx_rate_to_base']), Decimal('0.14'))
        self.supplier.refresh_from_db()
        # 10 CNY * 0.14 = 1.40 USD base
        self.assertEqual(self.supplier.total_purchased, Decimal('1.40'))
        self.assertEqual(self.supplier.outstanding, Decimal('1.40'))

    def test_payment_amount_immutable(self):
        self.client.force_authenticate(user=self.algeria)
        create = self.client.post(
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
        self.assertEqual(create.status_code, 201, create.data)
        pid = create.data['id']
        patch = self.client.patch(
            f'/api/supplier-payments/{pid}/',
            {'amount': '99.00'},
            format='json',
        )
        self.assertEqual(patch.status_code, 400)

    def test_missing_fx_rate_rejected_on_create(self):
        self.client.force_authenticate(user=self.algeria)
        res = self.client.post(
            '/api/supplier-payments/',
            {
                'supplier': str(self.supplier.id),
                'amount': '10.00',
                'currency': 'EUR',
                'payment_date': '2026-07-01',
                'payment_method': 'bank_transfer',
            },
            format='json',
        )
        self.assertEqual(res.status_code, 400)

    def test_po_link_fills_goods_value(self):
        goods = Goods.objects.create(
            organization=self.org,
            tracking_number='CB-LINK',
            description='linked',
            category='electronics',
            status='draft',
        )
        po = PurchaseOrder.objects.create(
            organization=self.org,
            supplier=self.supplier,
            po_number='PO-LINK',
            order_date=date(2026, 1, 1),
            currency='USD',
            status='confirmed',
            total_amount=Decimal('42.00'),
            fx_rate_to_base=Decimal('1'),
            linked_shipment=goods,
        )
        services.sync_linked_shipment_costs(po)
        goods.refresh_from_db()
        self.assertEqual(goods.value, Decimal('42.00'))
        self.assertEqual(goods.value_currency, 'USD')

    def test_hs_and_duty_suggestion(self):
        self.assertTrue(services.validate_hs_code('8471.30'))
        self.assertFalse(services.validate_hs_code('ABC'))
        goods = Goods(
            value=Decimal('100'),
            duty_rate=Decimal('10'),
        )
        self.assertEqual(services.suggest_duty_amount(goods), Decimal('10.00'))
