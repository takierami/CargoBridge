"""Member soft-deactivation and organization suspension."""
from django.contrib.auth import get_user_model
from django.test import TestCase, override_settings
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken

from accounts.deactivation import reactivate_organization, suspend_organization
from accounts.models import Organization, UserProfile

User = get_user_model()


@override_settings(
    EMAIL_BACKEND='django.core.mail.backends.locmem.EmailBackend',
)
class MemberDeactivationTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.org = Organization.objects.create(name='Deact Co')
        self.owner = User.objects.create_user(
            username='deact_owner', email='owner@deact.test', password='StrongPass1!',
        )
        self.owner_profile = UserProfile.objects.create(
            user=self.owner, organization=self.org, role=UserProfile.ROLE_OWNER, office='china',
        )
        self.admin = User.objects.create_user(
            username='deact_admin', email='admin@deact.test', password='StrongPass1!',
        )
        self.admin_profile = UserProfile.objects.create(
            user=self.admin, organization=self.org, role=UserProfile.ROLE_ADMIN, office='china',
        )
        self.employee = User.objects.create_user(
            username='deact_emp', email='emp@deact.test', password='StrongPass1!',
        )
        self.employee_profile = UserProfile.objects.create(
            user=self.employee, organization=self.org, role=UserProfile.ROLE_EMPLOYEE, office='china',
        )

    def _tokens_for(self, user):
        refresh = RefreshToken.for_user(user)
        return str(refresh.access_token), str(refresh)

    def test_owner_deactivates_employee(self):
        self.client.force_authenticate(user=self.owner)
        res = self.client.delete(f'/api/auth/members/{self.employee_profile.id}/')
        self.assertEqual(res.status_code, 200, res.data)
        self.assertEqual(res.data['detail'], 'Member deactivated.')
        self.assertFalse(res.data['member']['is_active'])
        self.employee.refresh_from_db()
        self.assertFalse(self.employee.is_active)
        self.assertTrue(UserProfile.objects.filter(pk=self.employee_profile.pk).exists())

    def test_owner_cannot_deactivate_self(self):
        self.client.force_authenticate(user=self.owner)
        res = self.client.delete(f'/api/auth/members/{self.owner_profile.id}/')
        self.assertEqual(res.status_code, 400, res.data)
        self.owner.refresh_from_db()
        self.assertTrue(self.owner.is_active)

    def test_owner_cannot_deactivate_last_owner(self):
        self.client.force_authenticate(user=self.admin)
        res = self.client.delete(f'/api/auth/members/{self.owner_profile.id}/')
        self.assertEqual(res.status_code, 400, res.data)
        self.assertIn('last owner', res.data['detail'].lower())
        self.owner.refresh_from_db()
        self.assertTrue(self.owner.is_active)

    def test_admin_can_deactivate_employee(self):
        self.client.force_authenticate(user=self.admin)
        res = self.client.delete(f'/api/auth/members/{self.employee_profile.id}/')
        self.assertEqual(res.status_code, 200, res.data)
        self.employee.refresh_from_db()
        self.assertFalse(self.employee.is_active)

    def test_employee_cannot_deactivate(self):
        self.client.force_authenticate(user=self.employee)
        res = self.client.delete(f'/api/auth/members/{self.admin_profile.id}/')
        self.assertEqual(res.status_code, 403, res.data)
        self.admin.refresh_from_db()
        self.assertTrue(self.admin.is_active)

    def test_deactivated_access_token_fails(self):
        access, _refresh = self._tokens_for(self.employee)
        self.client.force_authenticate(user=self.owner)
        self.assertEqual(
            self.client.delete(f'/api/auth/members/{self.employee_profile.id}/').status_code,
            200,
        )
        self.client.force_authenticate(user=None)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {access}')
        res = self.client.get('/api/auth/me/')
        self.assertEqual(res.status_code, 401, res.data)

    def test_deactivated_refresh_token_fails(self):
        _access, refresh = self._tokens_for(self.employee)
        self.client.force_authenticate(user=self.owner)
        self.assertEqual(
            self.client.delete(f'/api/auth/members/{self.employee_profile.id}/').status_code,
            200,
        )
        self.client.force_authenticate(user=None)
        self.client.credentials()
        res = self.client.post('/api/auth/token/refresh/', {'refresh': refresh}, format='json')
        self.assertIn(res.status_code, (401, 400), res.data)

    def test_reactivation_via_patch_restores_login(self):
        self.client.force_authenticate(user=self.owner)
        self.assertEqual(
            self.client.delete(f'/api/auth/members/{self.employee_profile.id}/').status_code,
            200,
        )
        res = self.client.patch(
            f'/api/auth/members/{self.employee_profile.id}/',
            {'is_active': True},
            format='json',
        )
        self.assertEqual(res.status_code, 200, res.data)
        self.assertTrue(res.data['is_active'])
        self.employee.refresh_from_db()
        self.assertTrue(self.employee.is_active)

        self.client.force_authenticate(user=None)
        login = self.client.post(
            '/api/auth/token/',
            {'username': 'deact_emp', 'password': 'StrongPass1!'},
            format='json',
        )
        self.assertEqual(login.status_code, 200, login.data)
        self.assertIn('access', login.data)

    def test_list_includes_is_active(self):
        self.client.force_authenticate(user=self.owner)
        self.client.delete(f'/api/auth/members/{self.employee_profile.id}/')
        res = self.client.get('/api/auth/members/')
        self.assertEqual(res.status_code, 200)
        by_user = {m['username']: m for m in res.data}
        self.assertFalse(by_user['deact_emp']['is_active'])
        self.assertTrue(by_user['deact_owner']['is_active'])


@override_settings(
    EMAIL_BACKEND='django.core.mail.backends.locmem.EmailBackend',
)
class OrganizationSuspensionTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.org = Organization.objects.create(name='Suspend Co')
        self.owner = User.objects.create_user(
            username='sus_owner', email='owner@sus.test', password='StrongPass1!',
        )
        UserProfile.objects.create(
            user=self.owner, organization=self.org, role=UserProfile.ROLE_OWNER, office='china',
        )
        self.employee = User.objects.create_user(
            username='sus_emp', email='emp@sus.test', password='StrongPass1!',
        )
        UserProfile.objects.create(
            user=self.employee, organization=self.org, role=UserProfile.ROLE_EMPLOYEE, office='china',
        )

    def test_suspended_org_blocks_login_with_clear_message(self):
        suspend_organization(self.org)
        self.org.refresh_from_db()
        self.assertFalse(self.org.is_active)

        for username in ('sus_owner', 'sus_emp'):
            res = self.client.post(
                '/api/auth/token/',
                {'username': username, 'password': 'StrongPass1!'},
                format='json',
            )
            self.assertEqual(res.status_code, 401, res.data)
            detail = res.data.get('detail', '')
            self.assertIn('suspended', str(detail).lower(), res.data)

    def test_reactivated_org_restores_login(self):
        suspend_organization(self.org)
        reactivate_organization(self.org)
        self.org.refresh_from_db()
        self.assertTrue(self.org.is_active)

        for username in ('sus_owner', 'sus_emp'):
            res = self.client.post(
                '/api/auth/token/',
                {'username': username, 'password': 'StrongPass1!'},
                format='json',
            )
            self.assertEqual(res.status_code, 200, res.data)
            self.assertIn('access', res.data)
