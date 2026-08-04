from django.contrib.auth import get_user_model

User = get_user_model()
from django.test import TestCase
from rest_framework.test import APIClient

from accounts.models import Organization, UserProfile
from api.models import Agent


class AgentCreateUniquenessTests(TestCase):
    def setUp(self):
        self.org = Organization.objects.create(name='Agent Org')
        self.other_org = Organization.objects.create(name='Other Org')
        self.user = User.objects.create_user(username='agent_admin', password='StrongPass1!')
        UserProfile.objects.create(user=self.user, organization=self.org, role='admin', office='china')
        self.other_user = User.objects.create_user(username='other_admin', password='StrongPass1!')
        UserProfile.objects.create(
            user=self.other_user, organization=self.other_org, role='admin', office='china',
        )
        self.client = APIClient()

    def _payload(self, **extra):
        data = {
            'name': 'وكيل تجريبي',
            'name_fr': 'Agent Test',
            'phone': '+213-555-0001',
            'passport': 'DZ-UNIQUE-1',
            'country': 'الجزائر',
            'status': 'active',
        }
        data.update(extra)
        return data

    def test_create_appears_in_list(self):
        self.client.force_authenticate(user=self.user)
        res = self.client.post('/api/agents/', self._payload(), format='json')
        self.assertEqual(res.status_code, 201, res.data)
        agent_id = str(res.data['id'])

        listed = self.client.get('/api/agents/')
        self.assertEqual(listed.status_code, 200)
        rows = listed.data.get('results', listed.data)
        ids = [str(row['id']) for row in rows]
        self.assertIn(agent_id, ids)

    def test_empty_phone_or_passport_rejected(self):
        self.client.force_authenticate(user=self.user)
        res = self.client.post('/api/agents/', self._payload(phone=''), format='json')
        self.assertEqual(res.status_code, 400)
        res = self.client.post('/api/agents/', self._payload(passport='  '), format='json')
        self.assertEqual(res.status_code, 400)

    def test_duplicate_passport_same_org_rejected(self):
        self.client.force_authenticate(user=self.user)
        first = self.client.post('/api/agents/', self._payload(), format='json')
        self.assertEqual(first.status_code, 201, first.data)

        dup = self.client.post(
            '/api/agents/',
            self._payload(name='Other', phone='+213-555-0002', passport='DZ-UNIQUE-1'),
            format='json',
        )
        self.assertEqual(dup.status_code, 400)
        self.assertIn('passport', dup.data)

    def test_duplicate_phone_same_org_rejected(self):
        self.client.force_authenticate(user=self.user)
        first = self.client.post('/api/agents/', self._payload(), format='json')
        self.assertEqual(first.status_code, 201, first.data)

        dup = self.client.post(
            '/api/agents/',
            self._payload(name='Other', phone='+213-555-0001', passport='DZ-UNIQUE-2'),
            format='json',
        )
        self.assertEqual(dup.status_code, 400)
        self.assertIn('phone', dup.data)

    def test_same_passport_other_org_allowed(self):
        self.client.force_authenticate(user=self.user)
        first = self.client.post('/api/agents/', self._payload(), format='json')
        self.assertEqual(first.status_code, 201, first.data)

        self.client.force_authenticate(user=self.other_user)
        second = self.client.post('/api/agents/', self._payload(), format='json')
        self.assertEqual(second.status_code, 201, second.data)
        self.assertNotEqual(str(first.data['id']), str(second.data['id']))
        self.assertEqual(
            Agent.objects.filter(passport='DZ-UNIQUE-1').count(),
            2,
        )
