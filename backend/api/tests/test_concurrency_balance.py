"""
Prove supplier balances cannot become inconsistent under concurrent requests.

Under READ COMMITTED + select_for_update on Supplier, concurrent payment creates
each re-aggregate from DB. Final outstanding = purchased − (payA + payB), never a
lost-update where one payment overwrites the other on a cached field.
"""
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import date
from decimal import Decimal

from django.contrib.auth.models import User
from django.db import connection
from django.test import TransactionTestCase
from rest_framework.test import APIClient

from accounts.models import Organization, UserProfile
from api.models import Currency, PurchaseOrder, Supplier, SupplierPayment
from api import services


class ConcurrentBalanceProofTests(TransactionTestCase):
    def setUp(self):
        self.org = Organization.objects.create(name='Conc Org')
        self.algeria = User.objects.create_user(username='conc_alg', password='StrongPass1!')
        UserProfile.objects.create(user=self.algeria, organization=self.org, role='algeria_admin')
        Currency.objects.create(
            organization=self.org,
            code='USD',
            name='USD',
            name_fr='USD',
            symbol='$',
            rate_to_base=Decimal('1'),
            is_base=True,
            is_enabled=True,
        )
        self.supplier = Supplier.objects.create(
            organization=self.org,
            code='SUP-C',
            name='Supplier C',
            country='CN',
        )
        PurchaseOrder.objects.create(
            organization=self.org,
            supplier=self.supplier,
            po_number='PO-C-1',
            order_date=date(2026, 1, 1),
            currency='USD',
            status='confirmed',
            total_amount=Decimal('1000.00'),
            fx_rate_to_base=Decimal('1'),
        )
        services.update_supplier_balance(self.supplier)
        self.supplier.refresh_from_db()
        self.assertEqual(self.supplier.outstanding, Decimal('1000.00'))

    def _create_payment(self, amount: str):
        # Fresh connection per thread (required for Django + threads)
        connection.close()
        client = APIClient()
        client.force_authenticate(user=self.algeria)
        res = client.post(
            '/api/supplier-payments/',
            {
                'supplier': str(self.supplier.id),
                'amount': amount,
                'amount_paid': amount,
                'currency': 'USD',
                'payment_date': '2026-07-01',
                'payment_method': 'bank_transfer',
            },
            format='json',
        )
        return res.status_code, res.data if res.status_code < 500 else {}

    def test_concurrent_payments_both_count(self):
        """
        Prove: 1000 − 200 − 300 = 500 (both payments), not 800 or 700 from overwrite.
        """
        with ThreadPoolExecutor(max_workers=2) as pool:
            futures = [
                pool.submit(self._create_payment, '200.00'),
                pool.submit(self._create_payment, '300.00'),
            ]
            results = [f.result() for f in as_completed(futures)]

        self.assertTrue(all(code == 201 for code, _ in results), results)
        self.supplier.refresh_from_db()
        self.assertEqual(SupplierPayment.objects.filter(supplier=self.supplier, is_deleted=False).count(), 2)
        self.assertEqual(self.supplier.total_paid, Decimal('500.00'))
        self.assertEqual(self.supplier.outstanding, Decimal('500.00'))

    def test_concurrent_sequence_unique(self):
        connection.close()

        def alloc():
            connection.close()
            return services.next_sequence(self.org, 'payment', 'PAY')

        with ThreadPoolExecutor(max_workers=8) as pool:
            nums = list(pool.map(lambda _: alloc(), range(8)))
        self.assertEqual(len(nums), len(set(nums)))
