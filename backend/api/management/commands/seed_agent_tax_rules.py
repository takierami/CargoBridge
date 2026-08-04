from django.core.management.base import BaseCommand

from accounts.models import Organization
from api.agent_tax_rules import upsert_agent_tax_rules


class Command(BaseCommand):
    help = 'Upsert default agent tax rules (standard 0%, auto-entrepreneur 5%) for all orgs'

    def handle(self, *args, **options):
        for org in Organization.objects.all():
            n = upsert_agent_tax_rules(org)
            self.stdout.write(self.style.SUCCESS(f'{org.name}: touched={n}'))
