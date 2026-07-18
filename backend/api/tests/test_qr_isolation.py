"""
QR / track isolation proofs: random token, cross-org write, soft-delete.
Public GET is a capability URL (token possession); writes require org match.
"""
import uuid

from django.contrib.auth.models import User
from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIClient

from accounts.models import Organization, UserProfile
from api.models import Agent, Goods, GoodsQrCode
from api import services


class QrIsolationProofTests(TestCase):
    def setUp(self):
        self.org_a = Organization.objects.create(name='Org A')
        self.org_b = Organization.objects.create(name='Org B')
        self.user_a = User.objects.create_user(username='qr_a', password='StrongPass1!')
        UserProfile.objects.create(user=self.user_a, organization=self.org_a, role='algeria_admin')
        self.user_b = User.objects.create_user(username='qr_b', password='StrongPass1!')
        UserProfile.objects.create(user=self.user_b, organization=self.org_b, role='algeria_admin')
        self.agent = Agent.objects.create(
            organization=self.org_a, name='A', phone='1', passport='P', country='DZ',
        )
        self.goods = Goods.objects.create(
            organization=self.org_a,
            tracking_number='CB-QR-1',
            description='secret shipment',
            category='electronics',
            status='arrived',
            agent=self.agent,
        )
        services.record_tracking_event(self.goods, from_status='', to_status='arrived')
        self.qr = services.get_or_create_goods_qr(self.goods, user=self.user_a)
        self.client = APIClient()

    def test_random_token_returns_404(self):
        res = self.client.get(f'/api/track/{uuid.uuid4()}/')
        self.assertEqual(res.status_code, 404)

    def test_token_holder_can_read_anonymously(self):
        res = self.client.get(f'/api/track/{self.qr.token}/')
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data['tracking_number'], 'CB-QR-1')

    def test_cross_org_status_update_404(self):
        self.client.force_authenticate(user=self.user_b)
        res = self.client.post(
            f'/api/track/{self.qr.token}/status/',
            {'status': 'warehouse'},
            format='json',
        )
        self.assertEqual(res.status_code, 404)

    def test_same_org_status_update_ok(self):
        self.client.force_authenticate(user=self.user_a)
        res = self.client.post(
            f'/api/track/{self.qr.token}/status/',
            {'status': 'warehouse'},
            format='json',
        )
        self.assertEqual(res.status_code, 200, res.data)
        self.goods.refresh_from_db()
        self.assertEqual(self.goods.status, 'warehouse')

    def test_soft_deleted_goods_track_404(self):
        self.goods.is_deleted = True
        self.goods.deleted_at = timezone.now()
        self.goods.save(update_fields=['is_deleted', 'deleted_at', 'updated_at'])
        res = self.client.get(f'/api/track/{self.qr.token}/')
        self.assertEqual(res.status_code, 404)

        self.client.force_authenticate(user=self.user_a)
        res = self.client.post(
            f'/api/track/{self.qr.token}/status/',
            {'status': 'delivered'},
            format='json',
        )
        self.assertEqual(res.status_code, 404)

    def test_generate_qr_org_scoped(self):
        china_a = User.objects.create_user(username='qr_china_a', password='StrongPass1!')
        UserProfile.objects.create(user=china_a, organization=self.org_a, role='china_admin')
        other_goods = Goods.objects.create(
            organization=self.org_b,
            tracking_number='CB-QR-B',
            description='b',
            category='electronics',
            status='draft',
        )
        self.client.force_authenticate(user=china_a)
        res = self.client.post(f'/api/goods/{other_goods.id}/generate_qr/')
        self.assertEqual(res.status_code, 404)
