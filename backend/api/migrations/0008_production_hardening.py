# Generated manually for production audit fixes

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


def clamp_overpaid_payments(apps, schema_editor):
    SupplierPayment = apps.get_model('api', 'SupplierPayment')
    for payment in SupplierPayment.objects.all().iterator():
        if payment.amount_paid is None:
            continue
        if payment.amount_paid < 0:
            payment.amount_paid = 0
            payment.save(update_fields=['amount_paid'])
        elif payment.amount is not None and payment.amount_paid > payment.amount:
            payment.amount_paid = payment.amount
            payment.save(update_fields=['amount_paid'])


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('api', '0007_warehouse_status'),
    ]

    operations = [
        migrations.AddField(
            model_name='supplier',
            name='deleted_at',
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='supplier',
            name='deleted_by',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='deleted_suppliers',
                to=settings.AUTH_USER_MODEL,
            ),
        ),
        migrations.AddField(
            model_name='supplier',
            name='is_deleted',
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name='supplierdocument',
            name='deleted_at',
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='supplierdocument',
            name='deleted_by',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='deleted_supplier_documents',
                to=settings.AUTH_USER_MODEL,
            ),
        ),
        migrations.AddField(
            model_name='supplierdocument',
            name='is_deleted',
            field=models.BooleanField(default=False),
        ),
        migrations.AlterField(
            model_name='moneyauditevent',
            name='entity_type',
            field=models.CharField(
                choices=[
                    ('purchase_order', 'Purchase Order'),
                    ('payment', 'Payment'),
                    ('adjustment', 'Adjustment'),
                    ('supplier', 'Supplier'),
                ],
                max_length=32,
            ),
        ),
        migrations.RunPython(clamp_overpaid_payments, migrations.RunPython.noop),
        migrations.AddConstraint(
            model_name='supplierpayment',
            constraint=models.CheckConstraint(
                check=models.Q(amount_paid__gte=0) & models.Q(amount_paid__lte=models.F('amount')),
                name='payment_amount_paid_within_amount',
            ),
        ),
    ]
