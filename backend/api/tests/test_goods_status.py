from django.contrib.auth import get_user_model

User = get_user_model()
from django.test import TestCase
from rest_framework.test import APIClient

from accounts.models import Organization, UserProfile
from api.models import Agent, Goods
from api import services


class GoodsStatusIntegrityTests(TestCase):
    def setUp(self):
        self.org = Organization.objects.create(name='Test Org')
        self.china = User.objects.create_user(username='china_u', password='StrongPass1!')
        UserProfile.objects.create(user=self.china, organization=self.org, role='admin', office='china')
        self.algeria = User.objects.create_user(username='algeria_u', password='StrongPass1!')
        UserProfile.objects.create(user=self.algeria, organization=self.org, role='admin', office='algeria')
        self.agent = Agent.objects.create(
            organization=self.org,
            name='Agent',
            phone='1',
            passport='P1',
            country='DZ',
        )
        self.client = APIClient()

    def _auth(self, user):
        self.client.force_authenticate(user=user)

    def _create_goods(self, **extra):
        self._auth(self.china)
        payload = {
            'description': 'Test shipment',
            'category': 'electronics',
            'quantity': 1,
            'priority': 'medium',
            **extra,
        }
        res = self.client.post('/api/goods/', payload, format='json')
        self.assertEqual(res.status_code, 201, res.data)
        return res.data

    def test_create_forces_draft_and_records_event(self):
        data = self._create_goods(status='delivered')
        self.assertEqual(data['status'], 'draft')
        goods = Goods.objects.get(pk=data['id'])
        self.assertEqual(goods.status, 'draft')
        events = list(goods.tracking_events.order_by('created_at'))
        self.assertEqual(len(events), 1)
        self.assertEqual(events[0].to_status, 'draft')

    def test_cannot_skip_to_delivered_from_draft(self):
        data = self._create_goods()
        self._auth(self.algeria)
        res = self.client.post(
            f"/api/goods/{data['id']}/update_status/",
            {'status': 'delivered'},
            format='json',
        )
        self.assertEqual(res.status_code, 400)
        self.assertFalse(res.data.get('success', True))

    def test_cannot_in_transit_to_delivered(self):
        goods = Goods.objects.create(
            organization=self.org,
            tracking_number='CB-T-1',
            description='x',
            category='electronics',
            status='in_transit',
            agent=self.agent,
        )
        services.record_tracking_event(goods, from_status='', to_status='in_transit')
        self._auth(self.algeria)
        res = self.client.post(
            f'/api/goods/{goods.id}/update_status/',
            {'status': 'delivered'},
            format='json',
        )
        self.assertEqual(res.status_code, 400)

    def test_arrived_to_delivered_both_admins_ok(self):
        for user, tracking in ((self.china, 'CB-T-2a'), (self.algeria, 'CB-T-2b')):
            goods = Goods.objects.create(
                organization=self.org,
                tracking_number=tracking,
                description='x',
                category='electronics',
                status='warehouse',
                agent=self.agent,
            )
            services.record_tracking_event(goods, from_status='', to_status='warehouse')
            self._auth(user)
            res = self.client.post(
                f'/api/goods/{goods.id}/update_status/',
                {'status': 'delivered'},
                format='json',
            )
            self.assertEqual(res.status_code, 200, res.data)
            goods.refresh_from_db()
            self.assertEqual(goods.status, 'delivered')
            self.assertTrue(goods.tracking_events.filter(to_status='delivered').exists())

    def test_assigned_requires_agent(self):
        data = self._create_goods()
        res = self.client.post(
            f"/api/goods/{data['id']}/update_status/",
            {'status': 'assigned'},
            format='json',
        )
        self.assertEqual(res.status_code, 400)
        self.assertIn('agent', (res.data.get('error') or '').lower())

        self.client.patch(
            f"/api/goods/{data['id']}/",
            {'agent': str(self.agent.id)},
            format='json',
        )
        res = self.client.post(
            f"/api/goods/{data['id']}/update_status/",
            {'status': 'assigned'},
            format='json',
        )
        self.assertEqual(res.status_code, 200, res.data)

    def test_inconsistent_history_blocks_update(self):
        goods = Goods.objects.create(
            organization=self.org,
            tracking_number='CB-T-3',
            description='x',
            category='electronics',
            status='in_transit',
            agent=self.agent,
        )
        services.record_tracking_event(goods, from_status='', to_status='draft')
        self.assertFalse(services.goods_status_consistency(goods)[0])

        self._auth(self.china)
        res = self.client.post(
            f'/api/goods/{goods.id}/update_status/',
            {'status': 'arrived'},
            format='json',
        )
        self.assertEqual(res.status_code, 400)
        self.assertIn('inconsistent', (res.data.get('error') or '').lower())

    def test_delivered_can_reopen_to_warehouse(self):
        for user, tracking in ((self.china, 'CB-T-4a'), (self.algeria, 'CB-T-4b')):
            goods = Goods.objects.create(
                organization=self.org,
                tracking_number=tracking,
                description='x',
                category='electronics',
                status='delivered',
                agent=self.agent,
            )
            services.record_tracking_event(goods, from_status='', to_status='delivered')
            self._auth(user)
            res = self.client.post(
                f'/api/goods/{goods.id}/update_status/',
                {'status': 'warehouse'},
                format='json',
            )
            self.assertEqual(res.status_code, 200, res.data)
            goods.refresh_from_db()
            self.assertEqual(goods.status, 'warehouse')

    def test_cancelled_can_reopen_to_draft(self):
        goods = Goods.objects.create(
            organization=self.org,
            tracking_number='CB-T-5',
            description='x',
            category='electronics',
            status='cancelled',
        )
        services.record_tracking_event(goods, from_status='', to_status='cancelled')
        self._auth(self.china)
        res = self.client.post(
            f'/api/goods/{goods.id}/update_status/',
            {'status': 'draft'},
            format='json',
        )
        self.assertEqual(res.status_code, 200, res.data)
        goods.refresh_from_db()
        self.assertEqual(goods.status, 'draft')

    def test_cannot_clear_agent_midflight(self):
        goods = Goods.objects.create(
            organization=self.org,
            tracking_number='CB-T-6',
            description='x',
            category='electronics',
            status='in_transit',
            agent=self.agent,
        )
        self._auth(self.china)
        res = self.client.patch(
            f'/api/goods/{goods.id}/',
            {'agent': None},
            format='json',
        )
        self.assertEqual(res.status_code, 400)

    def test_no_tracking_event_api(self):
        self._auth(self.china)
        res = self.client.get('/api/goods-tracking-events/')
        self.assertEqual(res.status_code, 404)

    def test_allowed_statuses_endpoint(self):
        data = self._create_goods()
        goods_id = data['id']
        self.client.patch(f'/api/goods/{goods_id}/', {'agent': str(self.agent.id)}, format='json')
        res = self.client.get(f'/api/goods/{goods_id}/allowed_statuses/')
        self.assertEqual(res.status_code, 200)
        self.assertTrue(res.data['status_consistent'])
        statuses = {a['status'] for a in res.data['allowed_actions']}
        self.assertIn('assigned', statuses)
        self.assertNotIn('delivered', statuses)

    def test_customs_status_both_admins_ok(self):
        goods = Goods.objects.create(
            organization=self.org,
            tracking_number='CB-T-7',
            description='x',
            category='electronics',
            status='draft',
            agent=self.agent,
            customs_status='not_started',
        )
        self._auth(self.algeria)
        res = self.client.post(
            f'/api/goods/{goods.id}/update_customs_status/',
            {'customs_status': 'pending'},
            format='json',
        )
        self.assertEqual(res.status_code, 400)
        self.assertIn('arrived', (res.data.get('error') or '').lower())

        for user, tracking in ((self.china, 'CB-T-7a'), (self.algeria, 'CB-T-7b')):
            item = Goods.objects.create(
                organization=self.org,
                tracking_number=tracking,
                description='x',
                category='electronics',
                status='arrived',
                agent=self.agent,
                customs_status='not_started',
            )
            services.record_tracking_event(item, from_status='', to_status='arrived')
            self._auth(user)
            res = self.client.post(
                f'/api/goods/{item.id}/update_customs_status/',
                {'customs_status': 'pending'},
                format='json',
            )
            self.assertEqual(res.status_code, 200, res.data)
            item.refresh_from_db()
            self.assertEqual(item.customs_status, 'pending')
            self.assertTrue(item.customs_events.filter(to_status='pending').exists())

    def test_goods_soft_delete(self):
        data = self._create_goods()
        gid = data['id']
        res = self.client.delete(f'/api/goods/{gid}/')
        self.assertEqual(res.status_code, 204)
        goods = Goods.objects.get(pk=gid)
        self.assertTrue(goods.is_deleted)
        self.assertEqual(goods.deleted_by_id, self.china.id)
        res = self.client.get(f'/api/goods/{gid}/')
        self.assertEqual(res.status_code, 404)
