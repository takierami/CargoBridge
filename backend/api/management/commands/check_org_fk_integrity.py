"""Report cross-organization FK anomalies (app-layer integrity, not DB CHECKs)."""

from django.core.management.base import BaseCommand

from api.models import (
    Goods,
    PriceHistoryEntry,
    PurchaseOrder,
    PurchaseOrderItem,
    SupplierAdjustment,
    SupplierCommunication,
    SupplierDocument,
    SupplierPayment,
    SupplierProduct,
    SupplierRating,
    SupplierTask,
)


# (label, model, fk_attr)
CHECKS = [
    ('Goods.agent', Goods, 'agent'),
    ('PurchaseOrder.supplier', PurchaseOrder, 'supplier'),
    ('PurchaseOrderItem.purchase_order', PurchaseOrderItem, 'purchase_order'),
    ('PurchaseOrderItem.product', PurchaseOrderItem, 'product'),
    ('SupplierPayment.supplier', SupplierPayment, 'supplier'),
    ('SupplierPayment.purchase_order', SupplierPayment, 'purchase_order'),
    ('SupplierAdjustment.supplier', SupplierAdjustment, 'supplier'),
    ('SupplierDocument.supplier', SupplierDocument, 'supplier'),
    ('SupplierCommunication.supplier', SupplierCommunication, 'supplier'),
    ('SupplierTask.supplier', SupplierTask, 'supplier'),
    ('SupplierTask.purchase_order', SupplierTask, 'purchase_order'),
    ('SupplierTask.payment', SupplierTask, 'payment'),
    ('SupplierProduct.supplier', SupplierProduct, 'supplier'),
    ('SupplierRating.supplier', SupplierRating, 'supplier'),
    ('PriceHistoryEntry.supplier', PriceHistoryEntry, 'supplier'),
]


class Command(BaseCommand):
    help = 'Scan for related objects whose organization_id differs from the parent row.'

    def handle(self, *args, **options):
        total = 0
        for label, model, fk_name in CHECKS:
            try:
                model._meta.get_field(fk_name)
            except Exception:
                self.stdout.write(self.style.WARNING(f'{label}: skipped (field missing)'))
                continue
            bad_ids = []
            for row in model.objects.iterator():
                related = getattr(row, fk_name, None)
                if related is None:
                    continue
                related_org = getattr(related, 'organization_id', None)
                if related_org is not None and related_org != row.organization_id:
                    bad_ids.append(str(row.pk))
            if bad_ids:
                total += len(bad_ids)
                preview = ', '.join(bad_ids[:20])
                suffix = '…' if len(bad_ids) > 20 else ''
                self.stdout.write(self.style.ERROR(
                    f'{label}: {len(bad_ids)} anomalies — ids: {preview}{suffix}'
                ))
            else:
                self.stdout.write(self.style.SUCCESS(f'{label}: OK'))
        if total:
            self.stdout.write(self.style.ERROR(f'Total anomalies: {total}'))
            raise SystemExit(1)
        self.stdout.write(self.style.SUCCESS('No cross-org FK anomalies found.'))
