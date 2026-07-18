"""
Provision a CargoBridge user (login-only product — no public register).

Examples:
  python manage.py create_user --username china --email china@example.com \\
    --password 'StrongPass1!' --role china_admin --org-name "CargoBridge"

  python manage.py create_user --username algeria --email algeria@example.com \\
    --password 'StrongPass1!' --role algeria_admin --org-id <uuid>
"""
from django.core.management.base import BaseCommand, CommandError

from accounts.models import Organization
from accounts.serializers import RegisterSerializer


class Command(BaseCommand):
    help = 'Create a user (and optionally a new organization) for CargoBridge login.'

    def add_arguments(self, parser):
        parser.add_argument('--username', required=True)
        parser.add_argument('--email', required=True)
        parser.add_argument('--password', required=True)
        parser.add_argument(
            '--role',
            choices=['china_admin', 'algeria_admin'],
            default='china_admin',
        )
        parser.add_argument('--org-name', dest='org_name', default='')
        parser.add_argument('--org-name-fr', dest='org_name_fr', default='')
        parser.add_argument('--org-id', dest='org_id', default='')

    def handle(self, *args, **options):
        data = {
            'username': options['username'],
            'email': options['email'],
            'password': options['password'],
            'role': options['role'],
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
        self.stdout.write(self.style.SUCCESS(
            f'Created user {user.username} ({user.profile.role}) in org {org.name} ({org.id})'
        ))
