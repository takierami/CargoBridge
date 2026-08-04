"""Archive (and optionally purge) old business activity events per retention policy."""

from datetime import timedelta

from django.core.management.base import BaseCommand
from django.utils import timezone

from accounts.models import Organization
from api.activity import archive_activity_events, purge_archived_activity_events
from api.models import ActivityRetentionPolicy


class Command(BaseCommand):
    help = 'Apply activity retention: archive old events; optionally purge archived.'

    def add_arguments(self, parser):
        parser.add_argument('--purge', action='store_true', help='Also purge archived past retain_days')
        parser.add_argument('--org', type=str, help='Organization UUID (default: all)')

    def handle(self, *args, **options):
        orgs = Organization.objects.all()
        if options.get('org'):
            orgs = orgs.filter(pk=options['org'])
        now = timezone.now()
        for org in orgs:
            policy, _ = ActivityRetentionPolicy.objects.get_or_create(organization=org)
            archive_before = now - timedelta(days=policy.archive_after_days)
            archived = archive_activity_events(organization=org, older_than=archive_before)
            purged = 0
            if options['purge'] or policy.purge_archived:
                retain_before = now - timedelta(days=policy.retain_days)
                purged = purge_archived_activity_events(organization=org, older_than=retain_before)
            self.stdout.write(f'{org.name}: archived={archived} purged={purged}')
