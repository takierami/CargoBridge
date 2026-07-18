"""
Find goods where the latest tracking event does not match goods.status.

Usage:
  python manage.py repair_goods_status_history
  python manage.py repair_goods_status_history --fix
"""
from django.core.management.base import BaseCommand

from api.models import Goods
from api import services


class Command(BaseCommand):
    help = 'Report (and optionally repair) goods status vs tracking-event mismatches.'

    def add_arguments(self, parser):
        parser.add_argument(
            '--fix',
            action='store_true',
            help='Insert a corrective tracking event aligning history to current status.',
        )

    def handle(self, *args, **options):
        fix = options['fix']
        mismatches = 0
        fixed = 0
        for goods in Goods.objects.all().iterator():
            consistent, last = services.goods_status_consistency(goods)
            if consistent:
                continue
            mismatches += 1
            self.stdout.write(
                f'MISMATCH {goods.tracking_number} id={goods.id} '
                f'status={goods.status} last_event={last}'
            )
            if fix:
                services.record_tracking_event(
                    goods,
                    from_status=last or '',
                    to_status=goods.status,
                    user=None,
                    office='',
                    notes='system_repair: aligned audit trail to current status',
                )
                fixed += 1
                self.stdout.write(self.style.SUCCESS(f'  repaired {goods.tracking_number}'))

        if mismatches == 0:
            self.stdout.write(self.style.SUCCESS('No inconsistencies found.'))
        else:
            msg = f'Found {mismatches} inconsistent shipment(s)'
            if fix:
                msg += f'; repaired {fixed}'
            else:
                msg += ' (re-run with --fix to align events)'
            self.stdout.write(self.style.WARNING(msg))
