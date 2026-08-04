"""Read-only Business Activity History API."""

from __future__ import annotations

import csv
import io
from datetime import datetime, timedelta
from decimal import Decimal

from django.db.models import Count, Q
from django.http import HttpResponse, StreamingHttpResponse
from django.utils import timezone
from django.utils.dateparse import parse_date, parse_datetime
from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.pagination import CursorPagination
from rest_framework.response import Response
from rest_framework.views import APIView

from .activity import record_activity
from .models import ActivityRetentionPolicy, BusinessActivityEvent
from .permissions import RoleWritePermission
from .serializers_activity import BusinessActivityEventSerializer


EXPORT_ROW_CAP = 10_000


class ActivityCursorPagination(CursorPagination):
    page_size = 50
    page_size_query_param = 'page_size'
    max_page_size = 200
    ordering = ('-occurred_at', '-id')


def _parse_dt(value: str | None, *, end: bool = False):
    if not value:
        return None
    dt = parse_datetime(value)
    if dt is None:
        d = parse_date(value)
        if d is None:
            return None
        dt = datetime(d.year, d.month, d.day, 23, 59, 59) if end else datetime(d.year, d.month, d.day)
        dt = timezone.make_aware(dt, timezone.get_current_timezone()) if timezone.is_naive(dt) else dt
        return dt
    if timezone.is_naive(dt):
        dt = timezone.make_aware(dt, timezone.get_current_timezone())
    return dt


def resolve_date_range(params) -> tuple:
    now = timezone.now()
    today = now.date()
    preset = (params.get('preset') or '').strip()

    if preset == 'today':
        start = timezone.make_aware(datetime.combine(today, datetime.min.time()))
        return start, now
    if preset == 'yesterday':
        y = today - timedelta(days=1)
        start = timezone.make_aware(datetime.combine(y, datetime.min.time()))
        end = timezone.make_aware(datetime.combine(y, datetime.max.time()))
        return start, end
    if preset == 'last_7_days':
        return now - timedelta(days=7), now
    if preset == 'last_30_days':
        return now - timedelta(days=30), now
    if preset == 'this_month':
        start = timezone.make_aware(datetime(today.year, today.month, 1))
        return start, now
    if preset == 'last_month':
        first_this = datetime(today.year, today.month, 1)
        last_month_end = first_this - timedelta(days=1)
        start = timezone.make_aware(datetime(last_month_end.year, last_month_end.month, 1))
        end = timezone.make_aware(datetime.combine(last_month_end.date(), datetime.max.time()))
        return start, end
    if preset == 'this_year':
        start = timezone.make_aware(datetime(today.year, 1, 1))
        return start, now

    return _parse_dt(params.get('date_from')), _parse_dt(params.get('date_to'), end=True)


def filter_activity_queryset(qs, request):
    params = request.query_params
    date_from, date_to = resolve_date_range(params)
    if date_from:
        qs = qs.filter(occurred_at__gte=date_from)
    if date_to:
        qs = qs.filter(occurred_at__lte=date_to)

    for key, field in (
        ('module', 'module'),
        ('action', 'action'),
        ('actor', 'actor_id'),
        ('supplier_id', 'supplier_id'),
        ('agent_id', 'agent_id'),
        ('goods_id', 'goods_id'),
        ('currency', 'currency'),
        ('country', 'country'),
        ('status', 'status'),
        ('entity_type', 'entity_type'),
        ('entity_id', 'entity_id'),
    ):
        val = params.get(key)
        if val:
            qs = qs.filter(**{field: val})

    if params.get('include_archived') != '1':
        qs = qs.filter(is_archived=False)

    tag = params.get('tag')
    if tag:
        qs = qs.filter(tags__contains=[tag])

    q = (params.get('q') or '').strip()
    if q:
        qs = qs.filter(
            Q(entity_label__icontains=q)
            | Q(summary__icontains=q)
            | Q(summary_ar__icontains=q)
            | Q(summary_fr__icontains=q)
            | Q(actor_username__icontains=q)
            | Q(actor_display_name__icontains=q)
        )
    return qs


class BusinessActivityEventViewSet(viewsets.ReadOnlyModelViewSet):
    """Immutable audit trail — list / retrieve / summary / export only."""

    permission_classes = [RoleWritePermission]
    serializer_class = BusinessActivityEventSerializer
    pagination_class = ActivityCursorPagination
    http_method_names = ['get', 'head', 'options']

    def get_organization(self):
        return self.request.user.profile.organization

    def get_queryset(self):
        qs = BusinessActivityEvent.objects.filter(organization=self.get_organization())
        return filter_activity_queryset(qs, self.request)

    @action(detail=False, methods=['get'], url_path='summary')
    def summary(self, request):
        qs = self.filter_queryset(self.get_queryset())
        total = qs.count()
        by_module = list(qs.values('module').annotate(count=Count('id')).order_by('-count')[:12])
        by_action = list(qs.values('action').annotate(count=Count('id')).order_by('-count')[:12])
        by_user = list(
            qs.exclude(actor_username='')
            .values('actor_username', 'actor_display_name')
            .annotate(count=Count('id'))
            .order_by('-count')[:12]
        )
        goods_created = qs.filter(module='goods', action='create').count()
        pos = qs.filter(module='purchase_orders', action='create').count()
        payments = qs.filter(module='payments', action__in=['create', 'mark_paid']).count()
        documents = qs.filter(module='documents', action='create').count()

        date_from, date_to = resolve_date_range(request.query_params)
        days = 1
        if date_from and date_to:
            days = max(1, (date_to.date() - date_from.date()).days + 1)

        # Sum amounts from metadata when present
        spend = Decimal('0')
        for row in qs.filter(module='payments').values_list('metadata', 'after')[:5000]:
            meta, after = row
            meta = meta or {}
            after = after or {}
            raw = meta.get('amount') or after.get('amount') or after.get('total_amount')
            try:
                if raw is not None:
                    spend += Decimal(str(raw))
            except Exception:
                pass

        return Response({
            'total_events': total,
            'average_daily_activity': round(total / days, 2),
            'goods_created': goods_created,
            'purchase_orders': pos,
            'payments': payments,
            'documents': documents,
            'total_spending': str(spend),
            'most_active_modules': by_module,
            'most_active_actions': by_action,
            'most_active_users': by_user,
            'date_from': date_from.isoformat() if date_from else None,
            'date_to': date_to.isoformat() if date_to else None,
        })

    @action(detail=False, methods=['get'], url_path='export')
    def export(self, request):
        """Download filtered history — bypass cursor pagination entirely."""
        # Do NOT use query key "format" — DRF reserves it for content negotiation (404).
        fmt = (
            request.query_params.get('export_format')
            or request.query_params.get('file_format')
            or 'csv'
        ).lower()
        # Build from model manager + filters; do not use paginated list queryset
        base = BusinessActivityEvent.objects.filter(organization=self.get_organization())
        qs = filter_activity_queryset(base, request).order_by('-occurred_at', '-id')[:EXPORT_ROW_CAP]
        rows = list(qs)

        record_activity(
            organization=self.get_organization(),
            module='system',
            action='export',
            user=request.user,
            entity_label=f'activity-{fmt}',
            summary=f'Exported activity history ({fmt}, {len(rows)} rows)',
            metadata={'format': fmt, 'row_count': len(rows)},
            use_on_commit=False,
        )

        if fmt == 'xlsx':
            return self._export_xlsx(rows, request)
        if fmt == 'pdf':
            return self._export_pdf(rows, request)
        return self._export_csv(rows)

    def _export_csv(self, rows):
        def generate():
            buffer = io.StringIO()
            writer = csv.writer(buffer)
            writer.writerow([
                'occurred_at', 'actor', 'module', 'action', 'entity_type', 'entity_label',
                'summary', 'currency', 'status', 'before', 'after',
            ])
            yield '\ufeff' + buffer.getvalue()
            buffer.seek(0)
            buffer.truncate(0)
            for e in rows:
                writer.writerow([
                    e.occurred_at.isoformat(),
                    e.actor_display_name or e.actor_username,
                    e.module,
                    e.action,
                    e.entity_type,
                    e.entity_label,
                    e.summary,
                    e.currency,
                    e.status,
                    str(e.before),
                    str(e.after),
                ])
                yield buffer.getvalue()
                buffer.seek(0)
                buffer.truncate(0)

        resp = StreamingHttpResponse(generate(), content_type='text/csv; charset=utf-8')
        resp['Content-Disposition'] = 'attachment; filename="activity-history.csv"'
        return resp

    def _export_xlsx(self, rows, request):
        try:
            from openpyxl import Workbook
        except ImportError:
            return Response({'error': 'openpyxl not installed'}, status=500)

        wb = Workbook()
        meta = wb.active
        meta.title = 'Summary'
        org = self.get_organization()
        meta.append(['Company', org.name])
        meta.append(['Exported at', timezone.now().isoformat()])
        meta.append(['Rows', len(rows)])
        meta.append(['Filters', str(dict(request.query_params))])

        sheet = wb.create_sheet('Activity')
        sheet.append([
            'occurred_at', 'actor', 'module', 'action', 'entity_type', 'entity_label',
            'summary', 'currency', 'status',
        ])
        for e in rows:
            sheet.append([
                e.occurred_at.isoformat(),
                e.actor_display_name or e.actor_username,
                e.module,
                e.action,
                e.entity_type,
                e.entity_label,
                e.summary,
                e.currency,
                e.status,
            ])

        buf = io.BytesIO()
        wb.save(buf)
        buf.seek(0)
        resp = HttpResponse(
            buf.getvalue(),
            content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        )
        resp['Content-Disposition'] = 'attachment; filename="activity-history.xlsx"'
        return resp

    def _export_pdf(self, rows, request):
        # Lightweight PDF without WeasyPrint system deps: report via plain text PDF-ish HTML fallback
        # Prefer reportlab if available; else return a simple HTML print document.
        try:
            from reportlab.lib.pagesizes import A4
            from reportlab.pdfgen import canvas
        except ImportError:
            html = [
                '<html><head><meta charset="utf-8"><title>Activity History</title>',
                '<style>body{font-family:sans-serif;font-size:12px} table{width:100%;border-collapse:collapse}',
                'td,th{border:1px solid #ccc;padding:4px;text-align:start}</style></head><body>',
                f'<h1>Activity History — {self.get_organization().name}</h1>',
                f'<p>Rows: {len(rows)} (capped at {EXPORT_ROW_CAP})</p><table>',
                '<tr><th>When</th><th>User</th><th>Module</th><th>Action</th><th>Label</th><th>Summary</th></tr>',
            ]
            for e in rows[:500]:
                html.append(
                    f'<tr><td>{e.occurred_at.isoformat()}</td>'
                    f'<td>{e.actor_display_name or e.actor_username}</td>'
                    f'<td>{e.module}</td><td>{e.action}</td>'
                    f'<td>{e.entity_label}</td><td>{e.summary}</td></tr>'
                )
            html.append('</table></body></html>')
            resp = HttpResponse(''.join(html), content_type='text/html; charset=utf-8')
            resp['Content-Disposition'] = 'inline; filename="activity-history.html"'
            return resp

        buf = io.BytesIO()
        c = canvas.Canvas(buf, pagesize=A4)
        width, height = A4
        y = height - 40
        c.setFont('Helvetica-Bold', 14)
        c.drawString(40, y, f'Activity History — {self.get_organization().name}')
        y -= 24
        c.setFont('Helvetica', 9)
        for e in rows[:80]:
            if y < 40:
                c.showPage()
                y = height - 40
                c.setFont('Helvetica', 9)
            line = f'{e.occurred_at.strftime("%Y-%m-%d %H:%M")} | {e.actor_display_name or e.actor_username} | {e.module}/{e.action} | {e.entity_label}'
            c.drawString(40, y, line[:110])
            y -= 12
        c.save()
        buf.seek(0)
        resp = HttpResponse(buf.getvalue(), content_type='application/pdf')
        resp['Content-Disposition'] = 'attachment; filename="activity-history.pdf"'
        return resp


class ActivityRetentionPolicyView(APIView):
    """Staff-facing retention settings (read for org admins; write staff-only in Phase 3)."""

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        org = request.user.profile.organization
        policy, _ = ActivityRetentionPolicy.objects.get_or_create(organization=org)
        return Response({
            'retain_days': policy.retain_days,
            'archive_after_days': policy.archive_after_days,
            'purge_archived': policy.purge_archived,
        })
