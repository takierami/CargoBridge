# Soft-delete actor fields consistency

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('api', '0013_business_activity_history'),
    ]

    operations = [
        migrations.AddField(
            model_name='supplierdocumenttemplate',
            name='deleted_at',
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='supplierdocumenttemplate',
            name='deleted_by',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='deleted_supplier_document_templates',
                to=settings.AUTH_USER_MODEL,
            ),
        ),
        migrations.AddField(
            model_name='suppliercommunication',
            name='deleted_at',
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='suppliercommunication',
            name='deleted_by',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='deleted_supplier_communications',
                to=settings.AUTH_USER_MODEL,
            ),
        ),
        migrations.AddField(
            model_name='suppliertask',
            name='deleted_at',
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='suppliertask',
            name='deleted_by',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='deleted_supplier_tasks',
                to=settings.AUTH_USER_MODEL,
            ),
        ),
    ]
