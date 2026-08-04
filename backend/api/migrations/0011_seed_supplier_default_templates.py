from django.db import migrations


def seed_defaults(apps, schema_editor):
    Organization = apps.get_model('accounts', 'Organization')
    SupplierDocumentTemplate = apps.get_model('api', 'SupplierDocumentTemplate')

    # Inline catalog keys only — bodies come from the live module so future
    # catalog changes are not baked into this historical migration wrongly.
    # For a one-time backfill we import the live catalog.
    from api.supplier_default_templates import SUPPLIER_DEFAULT_TEMPLATES

    for org in Organization.objects.all():
        for tpl in SUPPLIER_DEFAULT_TEMPLATES:
            SupplierDocumentTemplate.objects.get_or_create(
                organization=org,
                system_key=tpl['system_key'],
                defaults={
                    'template_name': tpl['template_name'],
                    'template_body': tpl['template_body'],
                    'kind': tpl['kind'],
                    'is_deleted': False,
                },
            )


def noop_reverse(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0010_supplier_default_templates'),
        ('accounts', '0001_initial'),
    ]

    operations = [
        migrations.RunPython(seed_defaults, noop_reverse),
    ]
