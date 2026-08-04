"""Central immutable business activity / audit trail writer."""

from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from typing import Any
from uuid import UUID

from django.db import transaction
from django.utils import timezone

from .models import BusinessActivityEvent

# Request metadata set by middleware for the current request
_request_meta: dict[str, Any] = {}


def set_request_activity_meta(*, ip: str = '', user_agent: str = '', request_id: str = '') -> None:
    _request_meta.clear()
    _request_meta.update(ip=ip or '', user_agent=user_agent or '', request_id=request_id or '')


def clear_request_activity_meta() -> None:
    _request_meta.clear()


def get_request_activity_meta() -> dict[str, Any]:
    return dict(_request_meta)


def _json_safe(value: Any) -> Any:
    if value is None or isinstance(value, (bool, int, float, str)):
        return value
    if isinstance(value, Decimal):
        return str(value)
    if isinstance(value, UUID):
        return str(value)
    if isinstance(value, datetime):
        return value.isoformat()
    if isinstance(value, (list, tuple)):
        return [_json_safe(v) for v in value]
    if isinstance(value, dict):
        return {str(k): _json_safe(v) for k, v in value.items()}
    if hasattr(value, 'pk'):
        return str(value.pk)
    return str(value)


def snapshot_fields(instance, fields: list[str] | None = None) -> dict:
    """Whitelist snapshot of model fields for before/after diffs."""
    data: dict[str, Any] = {}
    if instance is None:
        return data
    field_names = fields or [
        f.name for f in instance._meta.fields
        if f.name not in ('id',) and not f.name.endswith('_ptr')
    ]
    skip = {'password', 'data_url', 'file_data', 'content_blob'}
    for name in field_names:
        if name in skip:
            continue
        try:
            val = getattr(instance, name)
        except Exception:
            continue
        if callable(val):
            continue
        data[name] = _json_safe(val)
    return data


def changed_field_names(before: dict, after: dict) -> list[str]:
    keys = set(before) | set(after)
    return sorted(k for k in keys if before.get(k) != after.get(k))


def actor_snapshots(user) -> tuple[Any, str, str]:
    if not user or not getattr(user, 'is_authenticated', False):
        return None, '', ''
    display = (user.get_full_name() or '').strip() or user.username
    return user, user.username or '', display


def entity_label_for(instance) -> str:
    if instance is None:
        return ''
    for attr in (
        'tracking_number', 'po_number', 'payment_number', 'code', 'name',
        'template_name', 'title', 'label', 'username',
    ):
        val = getattr(instance, attr, None)
        if val:
            return str(val)[:255]
    return str(getattr(instance, 'pk', ''))[:255]


def related_url_for(module: str, entity_type: str, entity_id) -> str:
    if not entity_id:
        return ''
    eid = str(entity_id)
    mapping = {
        ('goods', 'goods'): f'/goods/{eid}',
        ('suppliers', 'supplier'): f'/suppliers/{eid}',
        ('agents', 'agent'): f'/agents/{eid}',
        ('purchase_orders', 'purchase_order'): f'/suppliers/purchase-orders/{eid}',
        ('payments', 'payment'): f'/suppliers/payments/{eid}',
        ('documents', 'document'): '/suppliers',
        ('templates', 'template'): '/settings/templates',
        ('templates', 'supplier_template'): '/suppliers',
        ('tasks', 'task'): f'/suppliers/tasks/{eid}',
        ('calculator', 'conversion'): '/calculator',
        ('calculator', 'calculator_record'): '/calculator',
    }
    return mapping.get((module, entity_type), '')


def _default_summaries(module: str, action: str, label: str) -> tuple[str, str, str]:
    label = label or 'record'
    en = f'{action.replace("_", " ").title()} {module.replace("_", " ")}: {label}'
    ar = f'{action} — {module}: {label}'
    fr = f'{action.replace("_", " ")} — {module}: {label}'
    return en, ar, fr


MODULE_ENTITY_TYPE = {
    'goods': 'goods',
    'suppliers': 'supplier',
    'agents': 'agent',
    'purchase_orders': 'purchase_order',
    'payments': 'payment',
    'adjustments': 'adjustment',
    'templates': 'template',
    'documents': 'document',
    'tasks': 'task',
    'calculator': 'conversion',
    'notifications': 'notification',
    'settings': 'settings',
    'auth': 'user',
    'system': 'system',
}


def record_activity(
    *,
    organization,
    module: str,
    action: str,
    user=None,
    entity_type: str = '',
    entity_id=None,
    entity_label: str = '',
    summary: str = '',
    summary_ar: str = '',
    summary_fr: str = '',
    before: dict | None = None,
    after: dict | None = None,
    changed_fields: list | None = None,
    supplier_id=None,
    agent_id=None,
    goods_id=None,
    currency: str = '',
    country: str = '',
    status: str = '',
    tags: list | None = None,
    metadata: dict | None = None,
    related_url: str = '',
    source: str = 'api',
    occurred_at=None,
    use_on_commit: bool = True,
) -> None:
    """Append an immutable activity event. Prefer calling after successful domain writes."""
    actor, username, display = actor_snapshots(user)
    before_s = _json_safe(before or {})
    after_s = _json_safe(after or {})
    fields = changed_fields if changed_fields is not None else changed_field_names(before_s, after_s)
    if not summary:
        summary, summary_ar_d, summary_fr_d = _default_summaries(module, action, entity_label)
        summary_ar = summary_ar or summary_ar_d
        summary_fr = summary_fr or summary_fr_d
    else:
        summary_ar = summary_ar or summary
        summary_fr = summary_fr or summary

    meta = get_request_activity_meta()
    if metadata:
        meta = {**meta, **_json_safe(metadata)}

    if not related_url and entity_id:
        related_url = related_url_for(module, entity_type, entity_id)

    payload = dict(
        organization=organization,
        occurred_at=occurred_at or timezone.now(),
        actor=actor,
        actor_username=username,
        actor_display_name=display,
        module=module,
        action=action,
        entity_type=entity_type or '',
        entity_id=entity_id,
        entity_label=(entity_label or '')[:255],
        summary=summary,
        summary_ar=summary_ar,
        summary_fr=summary_fr,
        before=before_s,
        after=after_s,
        changed_fields=fields,
        supplier_id=supplier_id,
        agent_id=agent_id,
        goods_id=goods_id,
        currency=currency or '',
        country=country or '',
        status=status or '',
        tags=tags or [],
        metadata=meta,
        related_url=related_url or '',
        source=source,
    )

    def _create():
        BusinessActivityEvent.objects.create(**payload)

    if use_on_commit and transaction.get_connection().in_atomic_block:
        transaction.on_commit(_create)
    else:
        _create()


def record_model_activity(
    *,
    organization,
    module: str,
    action: str,
    instance,
    user=None,
    before: dict | None = None,
    after: dict | None = None,
    fields: list[str] | None = None,
    extra_metadata: dict | None = None,
    **kwargs,
) -> None:
    """Convenience wrapper around record_activity for ORM instances."""
    after_snap = after if after is not None else (snapshot_fields(instance, fields) if instance else {})
    label = kwargs.pop('entity_label', None) or entity_label_for(instance)
    entity_type = kwargs.pop('entity_type', None) or MODULE_ENTITY_TYPE.get(module, module)

    supplier_id = kwargs.pop('supplier_id', None)
    agent_id = kwargs.pop('agent_id', None)
    goods_id = kwargs.pop('goods_id', None)
    currency = kwargs.pop('currency', '')
    country = kwargs.pop('country', '')
    status = kwargs.pop('status', '')

    if instance is not None:
        supplier_id = supplier_id or getattr(instance, 'supplier_id', None)
        agent_id = agent_id or getattr(instance, 'agent_id', None)
        if module == 'goods':
            goods_id = goods_id or getattr(instance, 'id', None)
        currency = currency or getattr(instance, 'currency', '') or getattr(instance, 'value_currency', '') or ''
        country = country or getattr(instance, 'country', '') or ''
        status = status or getattr(instance, 'status', '') or ''

    record_activity(
        organization=organization,
        module=module,
        action=action,
        user=user,
        entity_type=entity_type,
        entity_id=getattr(instance, 'pk', None) if instance is not None else kwargs.pop('entity_id', None),
        entity_label=label,
        before=before,
        after=after_snap,
        supplier_id=supplier_id,
        agent_id=agent_id,
        goods_id=goods_id,
        currency=str(currency or ''),
        country=str(country or ''),
        status=str(status or ''),
        metadata=extra_metadata,
        **kwargs,
    )


def archive_activity_events(*, organization, older_than) -> int:
    """Mark events archived (allowed mutation). Returns count."""
    qs = BusinessActivityEvent.objects.filter(
        organization=organization,
        is_archived=False,
        occurred_at__lt=older_than,
    )
    count = 0
    for event in qs.iterator(chunk_size=500):
        event.is_archived = True
        event.save(update_fields=['is_archived'])
        count += 1
    return count


def purge_archived_activity_events(*, organization, older_than) -> int:
    """Hard-delete archived events past retention — staff/job only via queryset._raw_delete."""
    qs = BusinessActivityEvent.objects.filter(
        organization=organization,
        is_archived=True,
        occurred_at__lt=older_than,
    )
    deleted, _ = qs._raw_delete(qs.db)
    return deleted
