from datetime import date
from decimal import Decimal

from django.contrib.auth.models import User
from django.test import TestCase
from rest_framework.test import APIClient

from accounts.models import Organization, UserProfile
from api.models import Currency, PurchaseOrder, Supplier, SupplierPayment
from api import services


class SupplierStatementTests(TestCase):
    def setUp(self):
        self.org = Organization.objects.create(name='Statement Org')
        self.china = User.objects.create_user(username='stmt_china', password='StrongPass1!')
        UserProfile.objects.create(user=self.china, organization=self.org, role='china_admin')
        self.algeria = User.objects.create_user(username='stmt_algeria', password='StrongPass1!')
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
            code='SUP-S1',
            name='Supplier A',
            country='CN',
        )
        self.supplier_b = Supplier.objects.create(
            organization=self.org,
            code='SUP-S2',
            name='Supplier B',
            country='CN',
        )
        self.client = APIClient()

    def test_po_create_confirmed_updates_balance_and_ledger(self):
        self.client.force_authenticate(user=self.china)
        res = self.client.post(
            '/api/purchase-orders/',
            {
                'supplier': str(self.supplier.id),
                'order_date': '2026-07-01',
                'currency': 'USD',
                'status': 'confirmed',
                'items': [{'product_name': 'Widget', 'quantity': 2, 'unit_cost': '50.00'}],
            },
            format='json',
        )
        self.assertEqual(res.status_code, 201, res.data)
        self.assertEqual(res.data['status'], 'confirmed')
        self.assertEqual(Decimal(res.data['total_amount']), Decimal('100.00'))

        self.supplier.refresh_from_db()
        self.assertEqual(self.supplier.total_purchased, Decimal('100.00'))
        self.assertEqual(self.supplier.total_paid, Decimal('0'))
        self.assertEqual(self.supplier.outstanding, Decimal('100.00'))

        ledger = services.build_supplier_ledger(self.supplier)
        self.assertEqual(len(ledger), 1)
        self.assertEqual(ledger[0]['type'], 'order')
        self.assertEqual(ledger[0]['debit'], 100.0)
        self.assertEqual(ledger[0]['running_balance'], 100.0)

    def test_payment_create_zero_amount_paid_defaults_to_full_credit(self):
        PurchaseOrder.objects.create(
            organization=self.org,
            supplier=self.supplier,
            po_number='PO-STMT-1',
            order_date=date(2026, 7, 1),
            currency='USD',
            status='confirmed',
            total_amount=Decimal('100.00'),
            fx_rate_to_base=Decimal('1'),
        )
        services.update_supplier_balance(self.supplier)

        self.client.force_authenticate(user=self.algeria)
        res = self.client.post(
            '/api/supplier-payments/',
            {
                'supplier': str(self.supplier.id),
                'amount': '40.00',
                'amount_paid': '0',
                'currency': 'USD',
                'payment_date': '2026-07-02',
                'payment_method': 'bank_transfer',
            },
            format='json',
        )
        self.assertEqual(res.status_code, 201, res.data)
        self.assertEqual(Decimal(res.data['amount_paid']), Decimal('40.00'))

        self.supplier.refresh_from_db()
        self.assertEqual(self.supplier.total_paid, Decimal('40.00'))
        self.assertEqual(self.supplier.outstanding, Decimal('60.00'))

        ledger = services.build_supplier_ledger(self.supplier)
        types = [e['type'] for e in ledger]
        self.assertIn('payment', types)
        payment_row = next(e for e in ledger if e['type'] == 'payment')
        self.assertEqual(payment_row['credit'], 40.0)

    def test_payment_supplier_fk_change_rebalances_both(self):
        for supplier, total in ((self.supplier, '100.00'), (self.supplier_b, '200.00')):
            PurchaseOrder.objects.create(
                organization=self.org,
                supplier=supplier,
                po_number=f'PO-{supplier.code}',
                order_date=date(2026, 7, 1),
                currency='USD',
                status='confirmed',
                total_amount=Decimal(total),
                fx_rate_to_base=Decimal('1'),
            )
            services.update_supplier_balance(supplier)

        payment = SupplierPayment.objects.create(
            organization=self.org,
            supplier=self.supplier,
            payment_number='PAY-MOVE',
            amount=Decimal('30.00'),
            amount_paid=Decimal('30.00'),
            currency='USD',
            fx_rate_to_base=Decimal('1'),
            payment_date=date(2026, 7, 3),
            status='fully_paid',
        )
        services.update_supplier_balance(self.supplier)

        self.client.force_authenticate(user=self.algeria)
        res = self.client.patch(
            f'/api/supplier-payments/{payment.id}/',
            {'supplier': str(self.supplier_b.id)},
            format='json',
        )
        self.assertEqual(res.status_code, 200, res.data)

        self.supplier.refresh_from_db()
        self.supplier_b.refresh_from_db()
        self.assertEqual(self.supplier.total_paid, Decimal('0'))
        self.assertEqual(self.supplier.outstanding, Decimal('100.00'))
        self.assertEqual(self.supplier_b.total_paid, Decimal('30.00'))
        self.assertEqual(self.supplier_b.outstanding, Decimal('170.00'))
