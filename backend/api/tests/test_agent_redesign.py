from decimal import Decimal

from django.contrib.auth import get_user_model

User = get_user_model()
from django.test import TestCase
from rest_framework.test import APIClient

from accounts.models import Organization, UserProfile
from api.agent_tax_rules import upsert_agent_tax_rules
from api.models import Agent, AgentTaxRule
from api.services import apply_agent_tax, effective_agent_tax_rate


class AgentTaxHelperTests(TestCase):
    def setUp(self):
        self.org = Organization.objects.create(name='Tax Org')
        upsert_agent_tax_rules(self.org)

    def test_seed_auto_entrepreneur_five_percent(self):
        rule = AgentTaxRule.objects.get(organization=self.org, agent_type='auto_entrepreneur')
        self.assertEqual(rule.tax_percent, Decimal('5.00'))
        std = AgentTaxRule.objects.get(organization=self.org, agent_type='standard')
        self.assertEqual(std.tax_percent, Decimal('0.00'))

    def test_effective_rate_from_rule(self):
        agent = Agent.objects.create(
            organization=self.org,
            name='AE',
            phone='+213-555-1001',
            passport='P-AE-1',
            country='DZ',
            agent_type='auto_entrepreneur',
            code='AGT-TEST-1',
        )
        self.assertEqual(effective_agent_tax_rate(agent), Decimal('5.00'))

    def test_override_beats_rule(self):
        agent = Agent.objects.create(
            organization=self.org,
            name='OV',
            phone='+213-555-1002',
            passport='P-OV-1',
            country='DZ',
            agent_type='auto_entrepreneur',
            tax_rate_override=Decimal('3.50'),
            code='AGT-TEST-2',
        )
        self.assertEqual(effective_agent_tax_rate(agent), Decimal('3.50'))

    def test_apply_agent_tax(self):
        result = apply_agent_tax(1000, 5)
        self.assertEqual(result['base'], Decimal('1000'))
        self.assertEqual(result['tax_amount'], Decimal('50.00'))
        self.assertEqual(result['total_payable'], Decimal('1050.00'))


class AgentApiRedesignTests(TestCase):
    def setUp(self):
        self.org = Organization.objects.create(name='Agent API Org')
        upsert_agent_tax_rules(self.org)
        self.user = User.objects.create_user(username='agent_api', password='StrongPass1!')
        UserProfile.objects.create(user=self.user, organization=self.org, role='admin', office='china')
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

    def _payload(self, **extra):
        data = {
            'name': 'وكيل تجريبي',
            'name_fr': 'Agent Test',
            'phone': '+213-555-2001',
            'passport': 'DZ-API-1',
            'country': 'الجزائر',
            'agent_type': 'auto_entrepreneur',
            'employment_status': 'active',
        }
        data.update(extra)
        return data

    def test_create_assigns_code_and_tax_rate(self):
        res = self.client.post('/api/agents/', self._payload(), format='json')
        self.assertEqual(res.status_code, 201, res.data)
        self.assertTrue(str(res.data.get('code', '')).startswith('AGT-'))
        self.assertEqual(float(res.data['effective_tax_rate']), 5.0)
        self.assertEqual(res.data['agent_type'], 'auto_entrepreneur')

    def test_soft_delete_hides_from_list(self):
        created = self.client.post('/api/agents/', self._payload(), format='json')
        self.assertEqual(created.status_code, 201, created.data)
        agent_id = created.data['id']

        deleted = self.client.delete(f'/api/agents/{agent_id}/')
        self.assertEqual(deleted.status_code, 204)

        listed = self.client.get('/api/agents/')
        rows = listed.data.get('results', listed.data)
        ids = [str(row['id']) for row in rows]
        self.assertNotIn(str(agent_id), ids)
        self.assertTrue(Agent.objects.get(pk=agent_id).is_deleted)

    def test_soft_deleted_phone_reusable(self):
        first = self.client.post('/api/agents/', self._payload(), format='json')
        self.assertEqual(first.status_code, 201, first.data)
        self.client.delete(f'/api/agents/{first.data["id"]}/')

        second = self.client.post(
            '/api/agents/',
            self._payload(passport='DZ-API-2'),
            format='json',
        )
        self.assertEqual(second.status_code, 201, second.data)
