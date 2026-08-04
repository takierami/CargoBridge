from datetime import timedelta

from django.contrib.auth import get_user_model

User = get_user_model()
from django.test import TestCase
from django.urls import reverse
from django.utils import timezone
from rest_framework.test import APIClient

from accounts.models import Organization, UserProfile
from api.activity import archive_activity_events, record_activity
from api.models import BusinessActivityEvent


class BusinessActivityTests(TestCase):
    def setUp(self):
        self.org = Organization.objects.create(name='Test Org', name_fr='Test Org')
        self.user = User.objects.create_user(username='auditor', password='pass')
        UserProfile.objects.create(user=self.user, organization=self.org, role='admin', office='china')

    def test_record_and_immutable(self):
        record_activity(
            organization=self.org,
            module='goods',
            action='create',
            user=self.user,
            entity_type='goods',
            entity_label='TRK-1',
            summary='Created',
            use_on_commit=False,
        )
        ev = BusinessActivityEvent.objects.get()
        with self.assertRaises(ValueError):
            ev.summary = 'hacked'
            ev.save()
        with self.assertRaises(ValueError):
            ev.delete()

    def test_archive_allowed(self):
        record_activity(
            organization=self.org,
            module='auth',
            action='login',
            user=self.user,
            entity_label='auditor',
            occurred_at=timezone.now() - timedelta(days=1000),
            use_on_commit=False,
        )
        n = archive_activity_events(
            organization=self.org,
            older_than=timezone.now() - timedelta(days=30),
        )
        self.assertEqual(n, 1)
        self.assertTrue(BusinessActivityEvent.objects.get().is_archived)

    def test_org_isolation(self):
        other = Organization.objects.create(name='Other', name_fr='Other')
        record_activity(
            organization=self.org, module='system', action='export',
            entity_label='a', use_on_commit=False,
        )
        record_activity(
            organization=other, module='system', action='export',
            entity_label='b', use_on_commit=False,
        )
        self.assertEqual(
            BusinessActivityEvent.objects.filter(organization=self.org).count(), 1
        )

    def test_export_route_resolves_and_returns_csv(self):
        url = reverse('activity-event-export')
        self.assertIn('/export/', url)
        record_activity(
            organization=self.org,
            module='goods',
            action='create',
            user=self.user,
            entity_label='TRK-EXPORT',
            summary='For export',
            use_on_commit=False,
        )
        client = APIClient()
        client.force_authenticate(user=self.user)
        res = client.get(url, {'export_format': 'csv', 'preset': 'last_30_days'})
        self.assertEqual(res.status_code, 200)
        self.assertIn('text/csv', res['Content-Type'])
        # DRF ?format= must not be used — would 404 via content negotiation
        res_bad = client.get(url, {'format': 'csv'})
        self.assertEqual(res_bad.status_code, 404)
