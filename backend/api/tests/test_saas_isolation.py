"""SaaS isolation: register clean tenant, cross-org 404, readonly, track redaction."""
from django.contrib.auth import get_user_model

User = get_user_model()
from django.test import TestCase, override_settings
from rest_framework.test import APIClient

from accounts.models import Organization, UserProfile
from api.models import Currency, Goods, GoodsQrCode


@override_settings(
    EMAIL_BACKEND='django.core.mail.backends.locmem.EmailBackend',
    FRONTEND_URL='http://testserver',
)
class SaasIsolationTests(TestCase):
    def setUp(self):
        self.client = APIClient()

    def test_register_creates_owner_and_empty_goods(self):
        res = self.client.post(
            '/api/auth/register/',
            {
                'username': 'owner1',
                'email': 'owner1@example.com',
                'password': 'StrongPass1!',
                'company_name': 'Clean Co',
                'company_name_fr': 'Clean Co FR',
                'accept_terms': True,
            },
            format='json',
        )
        self.assertEqual(res.status_code, 201, res.data)
        self.assertEqual(res.data['user']['profile']['role'], 'owner')
        self.assertIn('access', res.data)
        org_id = res.data['user']['organization']['id']
        self.assertEqual(Goods.objects.filter(organization_id=org_id).count(), 0)
        self.assertTrue(Currency.objects.filter(organization_id=org_id).exists())

    def test_register_rejects_organization_uuid_join(self):
        other = Organization.objects.create(name='Other')
        res = self.client.post(
            '/api/auth/register/',
            {
                'username': 'hacker',
                'email': 'hacker@example.com',
                'password': 'StrongPass1!',
                'company_name': 'Evil',
                'accept_terms': True,
                'organization': str(other.id),
            },
            format='json',
        )
        self.assertEqual(res.status_code, 201, res.data)
        # Organization UUID must be ignored — new org created
        self.assertNotEqual(str(res.data['user']['organization']['id']), str(other.id))

    def test_cross_org_goods_404(self):
        org_a = Organization.objects.create(name='A')
        org_b = Organization.objects.create(name='B')
        user_a = User.objects.create_user(username='a', password='StrongPass1!')
        UserProfile.objects.create(user=user_a, organization=org_a, role='admin', office='china')
        goods_b = Goods.objects.create(
            organization=org_b,
            tracking_number='CB-X-1',
            description='secret',
            category='electronics',
            quantity=1,
            status='draft',
            priority='medium',
        )
        self.client.force_authenticate(user=user_a)
        res = self.client.get(f'/api/goods/{goods_b.id}/')
        self.assertEqual(res.status_code, 404)

    def test_readonly_cannot_post_goods(self):
        org = Organization.objects.create(name='RO Org')
        user = User.objects.create_user(username='ro', password='StrongPass1!')
        UserProfile.objects.create(user=user, organization=org, role='readonly', office='china')
        self.client.force_authenticate(user=user)
        res = self.client.post(
            '/api/goods/',
            {'description': 'x', 'category': 'electronics', 'quantity': 1, 'priority': 'medium'},
            format='json',
        )
        self.assertEqual(res.status_code, 403)

    def test_public_track_redacts_value(self):
        org = Organization.objects.create(name='Track Org')
        goods = Goods.objects.create(
            organization=org,
            tracking_number='CB-T-1',
            description='phones',
            category='electronics',
            quantity=10,
            status='in_transit',
            priority='high',
            value=99999,
            notes='internal note',
            photos=['data:image/png;base64,xxx'],
        )
        qr = GoodsQrCode.objects.create(organization=org, goods=goods, is_active=True)
        res = self.client.get(f'/api/track/{qr.token}/')
        self.assertEqual(res.status_code, 200)
        self.assertIsNone(res.data.get('value'))
        self.assertIsNone(res.data.get('landed_cost'))
        self.assertEqual(res.data.get('photos'), [])
        self.assertEqual(res.data.get('notes'), '')
        self.assertFalse(res.data.get('authenticated'))

    def test_password_reset_flow(self):
        from django.core import mail

        org = Organization.objects.create(name='Reset Org')
        user = User.objects.create_user(
            username='resetme', email='reset@example.com', password='OldPass1!',
        )
        UserProfile.objects.create(user=user, organization=org, role='owner', office='china')
        res = self.client.post('/api/auth/password-reset/', {'email': 'reset@example.com'}, format='json')
        self.assertEqual(res.status_code, 200)
        self.assertEqual(len(mail.outbox), 1)
        body = mail.outbox[0].body
        # Extract uid & token from URL query
        import re
        m = re.search(r'uid=([^&\s]+)&token=([^\s]+)', body)
        self.assertIsNotNone(m)
        uid, token = m.group(1), m.group(2)
        conf = self.client.post(
            '/api/auth/password-reset/confirm/',
            {'uid': uid, 'token': token, 'new_password': 'NewPass1!'},
            format='json',
        )
        self.assertEqual(conf.status_code, 200, conf.data)
        user.refresh_from_db()
        self.assertTrue(user.check_password('NewPass1!'))
