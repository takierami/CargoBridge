from django.core.management.base import BaseCommand

from accounts.models import Organization
from api.receipt_templates import upsert_receipt_templates


class Command(BaseCommand):
    help = (
        'Upsert full Arabic/French reception and delivery receipt templates '
        'for all organizations (does not delete custom templates).'
    )

    def handle(self, *args, **options):
        count = 0
        for org in Organization.objects.all():
            upsert_receipt_templates(org)
            count += 1
            self.stdout.write(self.style.SUCCESS(f'Updated receipt templates for org {org.pk}'))
        self.stdout.write(self.style.SUCCESS(f'Done. {count} organization(s) processed.'))
