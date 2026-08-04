from django.core.management.base import BaseCommand

from accounts.models import Organization
from api.supplier_default_templates import upsert_supplier_default_templates


class Command(BaseCommand):
    help = (
        'Upsert built-in supplier buying/payment receipt templates for all organizations '
        '(does not overwrite existing bodies or undelete soft-deleted system templates).'
    )

    def handle(self, *args, **options):
        count = 0
        for org in Organization.objects.all():
            upsert_supplier_default_templates(org)
            count += 1
            self.stdout.write(self.style.SUCCESS(f'Seeded supplier templates for org {org.pk}'))
        self.stdout.write(self.style.SUCCESS(f'Done. {count} organization(s) processed.'))
