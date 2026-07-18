from django.core.management.base import BaseCommand

from api.models import Supplier
from api.services import update_supplier_balance


class Command(BaseCommand):
    help = 'Recalculate total_purchased, total_paid, and outstanding for all suppliers.'

    def handle(self, *args, **options):
        qs = Supplier.objects.all()
        count = 0
        for supplier in qs.iterator():
            update_supplier_balance(supplier)
            supplier.refresh_from_db()
            count += 1
            self.stdout.write(
                f'{supplier.code}: purchased={supplier.total_purchased} '
                f'paid={supplier.total_paid} outstanding={supplier.outstanding}'
            )
        self.stdout.write(self.style.SUCCESS(f'Rebalanced {count} supplier(s).'))
