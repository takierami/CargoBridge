"""Backfill BusinessActivityEvent from MoneyAuditEvent and GoodsTrackingEvent."""

from django.core.management.base import BaseCommand

from accounts.models import Organization
from api.activity import record_activity
from api.models import BusinessActivityEvent, GoodsTrackingEvent, MoneyAuditEvent


class Command(BaseCommand):
    help = 'Backfill centralized activity history from domain audit tables.'

    def add_arguments(self, parser):
        parser.add_argument('--org', type=str, help='Organization UUID (default: all)')
        parser.add_argument('--limit', type=int, default=5000)

    def handle(self, *args, **options):
        orgs = Organization.objects.all()
        if options.get('org'):
            orgs = orgs.filter(pk=options['org'])
        limit = options['limit']
        for org in orgs:
            created = 0
            money = MoneyAuditEvent.objects.filter(organization=org).order_by('created_at')[:limit]
            for m in money:
                # Skip if already backfilled for this money audit
                if BusinessActivityEvent.objects.filter(
                    organization=org,
                    metadata__money_audit_id=str(m.id),
                ).exists():
                    continue
                module_map = {
                    'purchase_order': 'purchase_orders',
                    'payment': 'payments',
                    'adjustment': 'adjustments',
                    'supplier': 'suppliers',
                }
                record_activity(
                    organization=org,
                    module=module_map.get(m.entity_type, m.entity_type),
                    action=m.action if m.action in {
                        'create', 'soft_delete', 'mark_paid', 'amount_paid_update', 'status_change',
                    } else 'update',
                    user=m.user,
                    entity_type=m.entity_type,
                    entity_id=m.entity_id,
                    entity_label=str(m.entity_id),
                    summary=m.notes or f'Backfill {m.action} {m.entity_type}',
                    before=m.before or {},
                    after=m.after or {},
                    metadata={'money_audit_id': str(m.id), 'backfill': True},
                    source='backfill',
                    occurred_at=m.created_at,
                    use_on_commit=False,
                )
                created += 1

            tracks = GoodsTrackingEvent.objects.filter(organization=org).order_by('created_at')[:limit]
            for t in tracks:
                if BusinessActivityEvent.objects.filter(
                    organization=org,
                    metadata__tracking_event_id=str(t.id),
                ).exists():
                    continue
                record_activity(
                    organization=org,
                    module='goods',
                    action='status_change' if t.from_status else 'create',
                    user=t.user,
                    entity_type='goods',
                    entity_id=t.goods_id,
                    entity_label=getattr(t.goods, 'tracking_number', '') or str(t.goods_id),
                    summary=t.notes or f'{t.from_status} → {t.to_status}',
                    before={'status': t.from_status},
                    after={'status': t.to_status},
                    goods_id=t.goods_id,
                    status=t.to_status,
                    metadata={'tracking_event_id': str(t.id), 'backfill': True},
                    source='backfill',
                    occurred_at=t.created_at,
                    use_on_commit=False,
                    related_url=f'/goods/{t.goods_id}',
                )
                created += 1
            self.stdout.write(f'{org.name}: backfilled {created} events')
