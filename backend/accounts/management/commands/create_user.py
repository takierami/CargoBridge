"""
Provision a CargoBridge user.

Examples:
  python manage.py create_user --username owner --email owner@example.com \\
    --password 'StrongPass1!' --role owner --office china --org-name "Acme Trading"

  python manage.py create_user --username emp --email emp@example.com \\
    --password 'StrongPass1!' --role employee --office algeria --org-id <uuid>

Legacy --role china_admin / algeria_admin still accepted (mapped to admin + office).
"""
from django.core.management.base import BaseCommand, CommandError

from accounts.models import Organization, UserProfile
from accounts.serializers import RegisterSerializer


class Command(BaseCommand):
    help = 'Create a user (and optionally a new organization) for CargoBridge.'

    def add_arguments(self, parser):
        parser.add_argument('--username', required=True)
        parser.add_argument('--email', required=True)
        parser.add_argument('--password', required=True)
        parser.add_argument(
            '--role',
            default=UserProfile.ROLE_ADMIN,
            help='owner|admin|manager|employee|readonly (or legacy china_admin|algeria_admin)',
        )
        parser.add_argument(
            '--office',
            choices=[c[0] for c in UserProfile.OFFICE_CHOICES],
            default=UserProfile.OFFICE_CHINA,
        )
        parser.add_argument('--org-name', dest='org_name', default='')
        parser.add_argument('--org-name-fr', dest='org_name_fr', default='')
        parser.add_argument('--org-id', dest='org_id', default='')
        parser.add_argument(
            '--demo',
            action='store_true',
            help='When creating a new org, also seed demo agents/goods.',
        )

    def handle(self, *args, **options):
        data = {
            'username': options['username'],
            'email': options['email'],
            'password': options['password'],
            'role': options['role'],
            'office': options['office'],
            'company_name': options['org_name'],
            'company_name_fr': options['org_name_fr'],
        }
        if options['org_id']:
            try:
                org = Organization.objects.get(pk=options['org_id'])
            except Organization.DoesNotExist as exc:
                raise CommandError(f'Organization not found: {options["org_id"]}') from exc
            data['organization'] = org.pk

        serializer = RegisterSerializer(data=data)
        if not serializer.is_valid():
            raise CommandError(str(serializer.errors))
        user = serializer.save()
        org = user.profile.organization
        if options['demo'] and options['org_name'] and not options['org_id']:
            from api.management.commands.seed_demo import seed_demo_data
            seed_demo_data(org)
        self.stdout.write(self.style.SUCCESS(
            f'Created user {user.username} ({user.profile.role}/{user.profile.office}) '
            f'in org {org.name} ({org.id})'
        ))
