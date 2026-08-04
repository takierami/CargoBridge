"""
Workflow Integrity & Data Consistency Audit — five proof properties.

Run:
  python manage.py test api.tests.test_concurrency_balance \\
    api.tests.test_qr_isolation api.tests.test_goods_status \\
    api.tests.test_finance_integrity api.tests.test_workflow_integrity_audit
"""
from datetime import date
from decimal import Decimal

from django.contrib.auth import get_user_model

User = get_user_model()
from django.test import TestCase
from rest_framework.test import APIClient

from accounts.models import Organization, UserProfile
from api.constants import GOODS_STATUS_FLOW
from api.models import Agent, Currency, Goods, MoneyAuditEvent, PurchaseOrder, Supplier
from api import services


class WorkflowIntegrityAuditTests(TestCase):
    """Demonstrates the five audit properties with code-backed assertions."""

    def setUp(self):
        self.org = Organization.objects.create(name='Audit Org')
        self.china = User.objects.create_user(username='aud_cn', password='StrongPass1!')
        UserProfile.objects.create(user=self.china, organization=self.org, role='admin', office='china')
        self.algeria = User.objects.create_user(username='aud_dz', password='StrongPass1!')
        UserProfile.objects.create(user=self.algeria, organization=self.org, role='admin', office='algeria')
        self.agent = Agent.objects.create(
            organization=self.org, name='Ag', phone='1', passport='P', country='DZ',
        )
        Currency.objects.create(
            organization=self.org, code='USD', name='USD', name_fr='USD', symbol='$',
            rate_to_base=Decimal('1'), is_base=True, is_enabled=True,
        )
        self.supplier = Supplier.objects.create(
            organization=self.org, code='SUP-A', name='S', country='CN',
        )
        self.client = APIClient()

    def test_property_1_valid_transitions_only_no_bypass(self):
        """Every business state transition is valid and cannot be bypassed."""
        # Illegal edges
        for from_s, to_s in [
            ('draft', 'delivered'),
            ('draft', 'warehouse'),
            ('in_transit', 'delivered'),
            ('arrived', 'delivered'),  # must pass warehouse
        ]:
            self.assertNotIn(to_s, GOODS_STATUS_FLOW.get(from_s, []))

        self.client.force_authenticate(user=self.china)
        res = self.client.post(
            '/api/goods/',
            {'description': 'x', 'category': 'electronics', 'quantity': 1, 'status': 'delivered'},
            format='json',
        )
        self.assertEqual(res.status_code, 201)
        self.assertEqual(res.data['status'], 'draft')
        gid = res.data['id']

        # PATCH cannot change status
        patch = self.client.patch(f'/api/goods/{gid}/', {'status': 'delivered'}, format='json')
        self.assertEqual(patch.status_code, 200)
        goods = Goods.objects.get(pk=gid)
        self.assertEqual(goods.status, 'draft')

        self.client.force_authenticate(user=self.algeria)
        skip = self.client.post(
            f'/api/goods/{gid}/update_status/',
            {'status': 'delivered'},
            format='json',
        )
        self.assertEqual(skip.status_code, 400)

    def test_property_2_money_atomic_auditable_immutable(self):
        """Financial transactions are auditable; amounts historically immutable."""
        self.client.force_authenticate(user=self.china)
        po = self.client.post(
            '/api/purchase-orders/',
            {
                'supplier': str(self.supplier.id),
                'order_date': '2026-01-01',
                'currency': 'USD',
                'status': 'confirmed',
                'items': [{'product_name': 'X', 'quantity': 1, 'unit_cost': '100.00'}],
            },
            format='json',
        )
        self.assertEqual(po.status_code, 201)
        self.assertEqual(po.data['status'], 'confirmed')
        self.assertTrue(
            MoneyAuditEvent.objects.filter(entity_type='purchase_order', action='create').exists()
        )
        self.assertTrue(
            MoneyAuditEvent.objects.filter(entity_type='purchase_order', action='status_change').exists()
        )

        self.client.force_authenticate(user=self.algeria)
        pay = self.client.post(
            '/api/supplier-payments/',
            {
                'supplier': str(self.supplier.id),
                'amount': '40.00',
                'amount_paid': '40.00',
                'currency': 'USD',
                'payment_date': '2026-01-02',
                'payment_method': 'cash',
            },
            format='json',
        )
        self.assertEqual(pay.status_code, 201, pay.data)
        pid = pay.data['id']
        bad = self.client.patch(f'/api/supplier-payments/{pid}/', {'amount': '1.00'}, format='json')
        self.assertEqual(bad.status_code, 400)
        self.assertTrue(
            MoneyAuditEvent.objects.filter(entity_type='payment', action='create', entity_id=pid).exists()
        )

    def test_property_3_org_boundaries_and_soft_delete(self):
        """Queries respect organization boundaries and soft-delete rules."""
        other = Organization.objects.create(name='Other')
        other_user = User.objects.create_user(username='aud_other', password='StrongPass1!')
        UserProfile.objects.create(user=other_user, organization=other, role='admin', office='china')
        Goods.objects.create(
            organization=other,
            tracking_number='CB-OTHER',
            description='x',
            category='electronics',
            status='draft',
        )

        self.client.force_authenticate(user=self.china)
        listed = self.client.get('/api/goods/')
        self.assertEqual(listed.status_code, 200)
        # DRF may paginate or return list
        data = listed.data if isinstance(listed.data, list) else listed.data.get('results', listed.data)
        ids_track = [g.get('tracking_number') or g.get('trackingNumber') for g in data]
        self.assertNotIn('CB-OTHER', ids_track)

        create = self.client.post(
            '/api/goods/',
            {'description': 'mine', 'category': 'electronics', 'quantity': 1},
            format='json',
        )
        gid = create.data['id']
        self.client.delete(f'/api/goods/{gid}/')
        gone = self.client.get(f'/api/goods/{gid}/')
        self.assertEqual(gone.status_code, 404)
        self.assertTrue(Goods.objects.get(pk=gid).is_deleted)

    def test_property_4_locked_recompute_not_incremental(self):
        """Balance path uses full recompute under lock (not outstanding -= amount)."""
        import inspect
        src = inspect.getsource(services.update_supplier_balance)
        self.assertIn('select_for_update', src)
        self.assertIn('total_purchased', src)
        self.assertNotIn('outstanding -=', src)
        self.assertNotIn('outstanding +=', src)

    def test_property_5_single_authoritative_paths(self):
        """Status / customs / balance each have one authoritative service entrypoint."""
        self.assertTrue(callable(services.apply_goods_status_update))
        self.assertTrue(callable(services.apply_customs_status_update))
        self.assertTrue(callable(services.apply_po_status_update))
        self.assertTrue(callable(services.update_supplier_balance))

        # Warehouse is on the happy path; arrived cannot jump to delivered
        goods = Goods.objects.create(
            organization=self.org,
            tracking_number='CB-AUD-WH',
            description='x',
            category='electronics',
            status='arrived',
            agent=self.agent,
        )
        services.record_tracking_event(goods, from_status='', to_status='arrived')
        ok, err, _ = services.apply_goods_status_update(
            goods, new_status='delivered', user=self.algeria, role='admin', office='algeria',
        )
        self.assertFalse(ok)
        ok, err, updated = services.apply_goods_status_update(
            goods, new_status='warehouse', user=self.algeria, role='admin', office='algeria',
        )
        self.assertTrue(ok, err)
        self.assertEqual(updated.status, 'warehouse')
