from datetime import date
from decimal import Decimal, ROUND_HALF_UP
import re

from django.db import transaction
from django.utils import timezone

from .constants import (
    BALANCE_PO_STATUSES,
    CUSTOMS_ALLOWED_GOODS_STATUSES,
    CUSTOMS_ROLE_ALLOWED_STATUSES,
    CUSTOMS_STATUS_FLOW,
    GOODS_AGENT_REQUIRED_STATUSES,
    GOODS_DELAYED_STATUSES,
    GOODS_DELIVERED_STATUSES,
    GOODS_ROLE_ALLOWED_STATUSES,
    GOODS_STATUS_ACTION_KEYS,
    GOODS_STATUS_FLOW,
    HS_CODE_PATTERN,
    PO_STATUS_FLOW,
)
from .models import (
    Agent,
    AgentTaxRule,
    Currency,
    Goods,
    GoodsCustomsEvent,
    GoodsQrCode,
    GoodsScanLog,
    GoodsTrackingEvent,
    MoneyAuditEvent,
    PriceHistoryEntry,
    PurchaseOrder,
    PurchaseOrderItem,
    SequenceCounter,
    Supplier,
    SupplierAdjustment,
    SupplierPayment,
)


class MissingFxRateError(Exception):
    """Raised when a used currency has no FX rate and no snapshot."""


def can_transition_po(from_status: str, to_status: str) -> bool:
    return to_status in PO_STATUS_FLOW.get(from_status, [])


def can_transition_goods(from_status: str, to_status: str) -> bool:
    return to_status in GOODS_STATUS_FLOW.get(from_status, [])


def can_transition_customs(from_status: str, to_status: str) -> bool:
    return to_status in CUSTOMS_STATUS_FLOW.get(from_status, [])


def validate_hs_code(hs_code: str) -> bool:
    if not hs_code:
        return True
    return bool(re.match(HS_CODE_PATTERN, hs_code.strip()))


def suggest_duty_amount(goods: Goods) -> Decimal | None:
    if goods.value is None or goods.duty_rate is None:
        return None
    return (Decimal(goods.value) * Decimal(goods.duty_rate) / Decimal('100')).quantize(
        Decimal('0.01'), rounding=ROUND_HALF_UP
    )


def sync_linked_shipment_costs(po: PurchaseOrder) -> None:
    """When PO links a shipment, fill empty goods.value from PO total (same currency)."""
    if not po.linked_shipment_id:
        return
    goods = po.linked_shipment
    updates = []
    if goods.value is None and po.total_amount:
        goods.value = po.total_amount
        updates.append('value')
    if (not goods.value_currency or goods.value_currency == 'USD') and po.currency:
        goods.value_currency = po.currency
        updates.append('value_currency')
    if updates:
        updates.append('updated_at')
        goods.save(update_fields=updates)


def next_sequence(organization, key: str, prefix: str) -> str:
    """Allocate the next org-scoped sequence under row lock (retry on first-create race)."""
    year = timezone.now().year
    from django.db import IntegrityError

    for _ in range(5):
        try:
            with transaction.atomic():
                try:
                    counter = SequenceCounter.objects.select_for_update().get(
                        organization=organization, key=key, year=year,
                    )
                except SequenceCounter.DoesNotExist:
                    SequenceCounter.objects.create(
                        organization=organization, key=key, year=year, count=0,
                    )
                    counter = SequenceCounter.objects.select_for_update().get(
                        organization=organization, key=key, year=year,
                    )
                counter.count += 1
                counter.save(update_fields=['count'])
                return f'{prefix}-{year}-{counter.count:04d}'
        except IntegrityError:
            continue
    raise RuntimeError(f'Could not allocate sequence {key} for organization {organization.pk}')


def next_tracking_number(organization) -> str:
    year = timezone.now().year
    from django.db import IntegrityError

    for _ in range(5):
        try:
            with transaction.atomic():
                try:
                    counter = SequenceCounter.objects.select_for_update().get(
                        organization=organization, key='tracking', year=year,
                    )
                except SequenceCounter.DoesNotExist:
                    SequenceCounter.objects.create(
                        organization=organization, key='tracking', year=year, count=100,
                    )
                    counter = SequenceCounter.objects.select_for_update().get(
                        organization=organization, key='tracking', year=year,
                    )
                counter.count += 1
                counter.save(update_fields=['count'])
                return f'CB-{year}-{counter.count}'
        except IntegrityError:
            continue
    raise RuntimeError(f'Could not allocate tracking number for organization {organization.pk}')


def compute_po_total(items) -> Decimal:
    return sum((item.total_cost for item in items), Decimal('0'))


def recalculate_po_total(po: PurchaseOrder) -> None:
    total = compute_po_total(po.items.all())
    po.total_amount = total
    po.save(update_fields=['total_amount', 'updated_at'])


def create_price_history_from_po(po: PurchaseOrder) -> None:
    for item in po.items.all():
        PriceHistoryEntry.objects.create(
            organization=po.organization,
            supplier=po.supplier,
            product_name=item.product_name,
            unit_cost=item.unit_cost,
            currency=po.currency,
            source_po=po,
            recorded_at=timezone.now(),
        )


def derive_payment_status(payment: SupplierPayment) -> str:
    """Derive status from amounts only (ignores stale fully_paid flag)."""
    today = date.today()
    if payment.amount_paid >= payment.amount and payment.amount_paid > 0:
        return 'fully_paid'
    if payment.amount_paid > 0 and payment.amount_paid < payment.amount:
        return 'partially_paid'
    if payment.payment_date < today:
        return 'overdue'
    return 'pending'


def payment_credited_amount(payment: SupplierPayment) -> Decimal:
    status = derive_payment_status(payment)
    if status == 'fully_paid':
        return payment.amount_paid if payment.amount_paid > 0 else payment.amount
    if status == 'partially_paid':
        return payment.amount_paid
    return Decimal('0')


def get_org_fx_rates(organization) -> tuple[dict[str, Decimal], str]:
    """Return (code -> rate_to_base, base_code). Does not invent missing rates."""
    rates: dict[str, Decimal] = {}
    base_code = 'USD'
    for row in Currency.objects.filter(organization=organization, is_enabled=True):
        code = (row.code or '').upper()
        rates[code] = row.rate_to_base
        if row.is_base:
            base_code = code
    if base_code not in rates:
        rates[base_code] = Decimal('1')
    return rates, base_code


def snapshot_fx_rate(organization, currency_code: str | None) -> Decimal:
    rates, base_code = get_org_fx_rates(organization)
    code = (currency_code or base_code or 'USD').upper()
    if code == base_code:
        return Decimal('1')
    if code not in rates:
        raise MissingFxRateError(
            f'No FX rate configured for {code}. Add it under currencies before posting money.'
        )
    return rates[code]


def to_base_amount(
    amount: Decimal,
    currency_code: str | None,
    rates: dict[str, Decimal],
    base_code: str,
    *,
    snapshot: Decimal | None = None,
) -> Decimal:
    code = (currency_code or base_code or 'USD').upper()
    if code == base_code:
        return Decimal(amount).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
    if snapshot is not None:
        rate = snapshot
    elif code in rates:
        rate = rates[code]
    else:
        raise MissingFxRateError(
            f'No FX rate for {code}; cannot convert to {base_code}.'
        )
    return (Decimal(amount) * rate).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)


def record_money_audit(
    *,
    organization,
    entity_type: str,
    entity_id,
    action: str,
    user=None,
    before: dict | None = None,
    after: dict | None = None,
    notes: str = '',
) -> MoneyAuditEvent:
    event = MoneyAuditEvent.objects.create(
        organization=organization,
        entity_type=entity_type,
        entity_id=entity_id,
        action=action,
        user=user if getattr(user, 'is_authenticated', False) else None,
        before=before or {},
        after=after or {},
        notes=notes or '',
    )
    # Dual-write into centralized business activity history
    from api import activity as activity_mod
    module_map = {
        'purchase_order': 'purchase_orders',
        'payment': 'payments',
        'adjustment': 'adjustments',
        'supplier': 'suppliers',
    }
    action_map = {
        'create': 'create',
        'soft_delete': 'soft_delete',
        'mark_paid': 'mark_paid',
        'amount_paid_update': 'amount_paid_update',
        'status_change': 'status_change',
    }
    label = ''
    if after:
        label = str(after.get('po_number') or after.get('payment_number') or after.get('code') or entity_id)
    elif before:
        label = str(before.get('po_number') or before.get('payment_number') or before.get('code') or entity_id)
    else:
        label = str(entity_id)
    supplier_id = None
    if after:
        supplier_id = after.get('supplier_id') or after.get('supplier')
    if not supplier_id and before:
        supplier_id = before.get('supplier_id') or before.get('supplier')
    currency = ''
    if after:
        currency = str(after.get('currency') or '')
    elif before:
        currency = str(before.get('currency') or '')
    activity_mod.record_activity(
        organization=organization,
        module=module_map.get(entity_type, entity_type),
        action=action_map.get(action, action),
        user=user,
        entity_type=entity_type,
        entity_id=entity_id,
        entity_label=label[:255],
        summary=notes or f'{action} {entity_type} {label}',
        before=before or {},
        after=after or {},
        supplier_id=supplier_id,
        currency=currency,
        metadata={'money_audit_id': str(event.id), 'notes': notes},
        use_on_commit=False,
    )
    return event


def _adjustment_net_base(supplier: Supplier, rates: dict[str, Decimal], base_code: str) -> Decimal:
    adjustments = SupplierAdjustment.objects.filter(
        supplier=supplier,
        organization=supplier.organization,
        is_deleted=False,
    )
    net = Decimal('0')
    for adj in adjustments:
        amount_base = to_base_amount(
            adj.amount, adj.currency, rates, base_code, snapshot=adj.fx_rate_to_base
        )
        if adj.type == 'credit':
            net -= amount_base
        else:
            net += amount_base
    return net


def update_supplier_balance(supplier: Supplier) -> None:
    with transaction.atomic():
        locked = Supplier.objects.select_for_update().get(pk=supplier.pk)
        rates, base_code = get_org_fx_rates(locked.organization)

        pos = PurchaseOrder.objects.filter(
            supplier=locked,
            organization=locked.organization,
            is_deleted=False,
            status__in=BALANCE_PO_STATUSES,
        )
        total_purchased = sum(
            (
                to_base_amount(
                    po.total_amount, po.currency, rates, base_code, snapshot=po.fx_rate_to_base
                )
                for po in pos
            ),
            Decimal('0'),
        )

        payments = SupplierPayment.objects.filter(
            supplier=locked,
            organization=locked.organization,
            is_deleted=False,
        )
        total_paid = Decimal('0')
        for p in payments:
            credited = payment_credited_amount(p)
            if credited:
                total_paid += to_base_amount(
                    credited, p.currency, rates, base_code, snapshot=p.fx_rate_to_base
                )

        adjustment_net = _adjustment_net_base(locked, rates, base_code)
        outstanding = total_purchased - total_paid + adjustment_net

        locked.total_purchased = total_purchased
        locked.total_paid = total_paid
        locked.outstanding = outstanding
        locked.balance_currency = base_code
        locked.save(
            update_fields=['total_purchased', 'total_paid', 'outstanding', 'balance_currency', 'updated_at']
        )


def sync_agent_stats(agent: Agent) -> None:
    goods = Goods.objects.filter(agent=agent, organization=agent.organization, is_deleted=False)
    total = goods.exclude(status='cancelled').count()
    delivered = goods.filter(status__in=GOODS_DELIVERED_STATUSES).count()
    delayed = goods.filter(status__in=GOODS_DELAYED_STATUSES).count()
    agent.total_deliveries = total
    agent.delayed_deliveries = delayed
    if total > 0:
        agent.reliability_score = max(0, min(100, int(((total - delayed) / total) * 100)))
    agent.save(update_fields=['total_deliveries', 'delayed_deliveries', 'reliability_score', 'updated_at'])


def effective_agent_tax_rate(agent: Agent) -> Decimal:
    """Return override rate if set, else org tax rule for agent_type, else 0."""
    if agent.tax_rate_override is not None:
        return Decimal(agent.tax_rate_override)
    rule = (
        AgentTaxRule.objects.filter(
            organization=agent.organization,
            agent_type=agent.agent_type,
            is_active=True,
        )
        .only('tax_percent')
        .first()
    )
    if rule is None:
        return Decimal('0')
    return Decimal(rule.tax_percent)


def apply_agent_tax(commission, rate) -> dict:
    """Pure breakdown: base, tax_percent, tax_amount, total_payable."""
    base = Decimal(str(commission or 0))
    pct = Decimal(str(rate or 0))
    tax_amount = (base * pct / Decimal('100')).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
    total = (base + tax_amount).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
    return {
        'base': base,
        'tax_percent': pct,
        'tax_amount': tax_amount,
        'total_payable': total,
    }


def build_supplier_ledger(supplier: Supplier) -> list[dict]:
    rates, base_code = get_org_fx_rates(supplier.organization)

    pos = PurchaseOrder.objects.filter(
        supplier=supplier,
        organization=supplier.organization,
        is_deleted=False,
        status__in=BALANCE_PO_STATUSES,
    )

    payments = SupplierPayment.objects.filter(
        supplier=supplier,
        organization=supplier.organization,
        is_deleted=False,
    )
    adjustments = SupplierAdjustment.objects.filter(
        supplier=supplier,
        organization=supplier.organization,
        is_deleted=False,
    )

    entries: list[dict] = []

    for po in pos:
        debit = float(
            to_base_amount(
                po.total_amount, po.currency, rates, base_code, snapshot=po.fx_rate_to_base
            )
        )
        entries.append({
            'date': po.order_date.isoformat(),
            'type': 'order',
            'reference': po.po_number,
            'debit': debit,
            'credit': 0.0,
            'original_amount': float(po.total_amount),
            'original_currency': po.currency,
        })

    for p in payments:
        credited = payment_credited_amount(p)
        if not credited:
            continue
        credit = float(
            to_base_amount(
                credited, p.currency, rates, base_code, snapshot=p.fx_rate_to_base
            )
        )
        entries.append({
            'date': p.payment_date.isoformat(),
            'type': 'payment',
            'reference': p.payment_number,
            'debit': 0.0,
            'credit': credit,
            'original_amount': float(credited),
            'original_currency': p.currency,
        })

    for adj in adjustments:
        amount_base = float(
            to_base_amount(
                adj.amount, adj.currency, rates, base_code, snapshot=adj.fx_rate_to_base
            )
        )
        entries.append({
            'date': adj.date.isoformat(),
            'type': 'credit_adjustment' if adj.type == 'credit' else 'debit_adjustment',
            'reference': str(adj.id),
            'debit': amount_base if adj.type == 'debit' else 0.0,
            'credit': amount_base if adj.type == 'credit' else 0.0,
            'original_amount': float(adj.amount),
            'original_currency': adj.currency,
        })

    entries.sort(key=lambda e: e['date'])

    ledger = []
    running = Decimal('0')
    for e in entries:
        running += Decimal(str(e['debit'])) - Decimal(str(e['credit']))
        ledger.append({**e, 'running_balance': float(running), 'currency': base_code})
    return ledger


# Backward-compatible aliases
can_transition = can_transition_po


def apply_po_status_update(
    po: PurchaseOrder,
    *,
    new_status: str,
    user=None,
) -> tuple[bool, str | None, PurchaseOrder | None]:
    if not can_transition_po(po.status, new_status):
        return False, f'Cannot transition from {po.status} to {new_status}', None
    with transaction.atomic():
        locked = PurchaseOrder.objects.select_for_update().get(pk=po.pk)
        if locked.is_deleted:
            return False, 'Purchase order is deleted.', None
        if not can_transition_po(locked.status, new_status):
            return False, f'Cannot transition from {locked.status} to {new_status}', None
        old = locked.status
        locked.status = new_status
        if new_status == 'received' and not locked.received_date:
            locked.received_date = timezone.now().date()
        locked.save()
        if new_status == 'received':
            create_price_history_from_po(locked)
        record_money_audit(
            organization=locked.organization,
            entity_type='purchase_order',
            entity_id=locked.id,
            action='status_change',
            user=user,
            before={'status': old},
            after={'status': new_status},
        )
        # Balance refresh via purchase_order_saved signal on locked.save()
        sync_linked_shipment_costs(locked)
        return True, None, locked


# Create may only auto-advance along this prefix of the happy path (not past confirmed).
_PO_CREATE_ADVANCE_PATH = ('draft', 'sent', 'confirmed')


def advance_po_along_path(
    po: PurchaseOrder,
    target: str | None,
    *,
    user=None,
) -> PurchaseOrder:
    """Walk draft→sent→confirmed toward target after create. Ignores invalid/cancelled targets."""
    if not target or target == po.status:
        return po
    if target not in _PO_CREATE_ADVANCE_PATH:
        # Cap create-time advance at confirmed for later statuses; ignore cancelled/etc.
        if target in (
            'in_production', 'ready', 'shipped', 'received',
        ):
            target = 'confirmed'
        else:
            return po
    try:
        start_idx = _PO_CREATE_ADVANCE_PATH.index(po.status)
        target_idx = _PO_CREATE_ADVANCE_PATH.index(target)
    except ValueError:
        return po
    if target_idx <= start_idx:
        return po
    current = po
    for next_status in _PO_CREATE_ADVANCE_PATH[start_idx + 1 : target_idx + 1]:
        ok, err, updated = apply_po_status_update(current, new_status=next_status, user=user)
        if not ok or updated is None:
            break
        current = updated
    return current


def office_for_role(role: str | None, office: str | None = None) -> str:
    if office == 'china' or role == 'china_admin':
        return 'China Office'
    if office == 'algeria' or role == 'algeria_admin':
        return 'Algeria Office'
    if office:
        return f'{office.title()} Office'
    return ''


def _status_cap_set(*, office: str | None = None, role: str | None = None) -> set:
    from .constants import GOODS_OFFICE_ALLOWED_STATUSES
    if office and office in GOODS_OFFICE_ALLOWED_STATUSES:
        return GOODS_OFFICE_ALLOWED_STATUSES[office]
    return GOODS_ROLE_ALLOWED_STATUSES.get(role or '', set())


def allowed_next_statuses(
    current_status: str,
    role: str | None = None,
    office: str | None = None,
) -> list[dict]:
    candidates = GOODS_STATUS_FLOW.get(current_status, [])
    cap = _status_cap_set(office=office, role=role)
    result = []
    for status_code in candidates:
        if (role or office) and status_code not in cap:
            continue
        action_key = GOODS_STATUS_ACTION_KEYS.get(status_code, status_code)
        if current_status == 'delivered' and status_code == 'warehouse':
            action_key = 'reopenWarehouse'
        elif current_status == 'cancelled' and status_code == 'draft':
            action_key = 'reopenDraft'
        result.append({
            'status': status_code,
            'action_key': action_key,
        })
    return result


def compute_landed_cost(goods: Goods) -> Decimal:
    """Goods value + freight + insurance + duty (same currency assumption)."""
    parts = [
        goods.value or Decimal('0'),
        goods.freight_cost or Decimal('0'),
        goods.insurance_cost or Decimal('0'),
        goods.duty_amount or Decimal('0'),
    ]
    return sum(parts, Decimal('0'))


def apply_customs_status_update(
    goods: Goods,
    *,
    new_status: str,
    role: str | None,
    office: str | None = None,
    user=None,
    notes: str = '',
) -> tuple[bool, str | None, Goods | None]:
    from .constants import CUSTOMS_OFFICE_ALLOWED_STATUSES

    if goods.status not in CUSTOMS_ALLOWED_GOODS_STATUSES:
        return (
            False,
            f'Customs updates require shipment status in {sorted(CUSTOMS_ALLOWED_GOODS_STATUSES)} '
            f'(current={goods.status}).',
            None,
        )
    if office and office in CUSTOMS_OFFICE_ALLOWED_STATUSES:
        role_set = CUSTOMS_OFFICE_ALLOWED_STATUSES[office]
    else:
        role_set = CUSTOMS_ROLE_ALLOWED_STATUSES.get(role or '', set())
    if new_status not in role_set:
        return False, 'Your role cannot set this customs status.', None
    if not can_transition_customs(goods.customs_status, new_status):
        return (
            False,
            f'Cannot transition customs from {goods.customs_status} to {new_status}',
            None,
        )
    with transaction.atomic():
        locked = Goods.objects.select_for_update().get(pk=goods.pk)
        if locked.is_deleted:
            return False, 'Shipment is deleted.', None
        if locked.status not in CUSTOMS_ALLOWED_GOODS_STATUSES:
            return (
                False,
                f'Customs updates require shipment status in {sorted(CUSTOMS_ALLOWED_GOODS_STATUSES)} '
                f'(current={locked.status}).',
                None,
            )
        if not can_transition_customs(locked.customs_status, new_status):
            return (
                False,
                f'Cannot transition customs from {locked.customs_status} to {new_status}',
                None,
            )
        old = locked.customs_status
        locked.customs_status = new_status
        locked.save(update_fields=['customs_status', 'updated_at'])
        GoodsCustomsEvent.objects.create(
            organization=locked.organization,
            goods=locked,
            from_status=old,
            to_status=new_status,
            user=user if getattr(user, 'is_authenticated', False) else None,
            notes=notes or '',
        )
        from api import activity as activity_mod
        activity_mod.record_activity(
            organization=locked.organization,
            module='goods',
            action='customs_change',
            user=user,
            entity_type='goods',
            entity_id=locked.id,
            entity_label=locked.tracking_number or str(locked.id),
            summary=notes or f'Customs {old} → {new_status}',
            before={'customs_status': old},
            after={'customs_status': new_status},
            changed_fields=['customs_status'],
            agent_id=locked.agent_id,
            goods_id=locked.id,
            status=locked.status,
            related_url=f'/goods/{locked.id}',
            use_on_commit=False,
        )
        return True, None, locked


def latest_tracking_to_status(goods: Goods) -> str | None:
    last = goods.tracking_events.order_by('-created_at').first()
    return last.to_status if last else None


def goods_status_consistency(goods: Goods) -> tuple[bool, str | None]:
    """
    True when there is no history yet, or the latest event matches goods.status.
    Legacy rows with empty history are treated as consistent until first write.
    """
    last = latest_tracking_to_status(goods)
    if last is None:
        return True, None
    return last == goods.status, last


def get_or_create_goods_qr(goods: Goods, user=None) -> GoodsQrCode:
    existing = GoodsQrCode.objects.filter(goods=goods, is_active=True).first()
    if existing:
        return existing
    return GoodsQrCode.objects.create(
        organization=goods.organization,
        goods=goods,
        created_by=user if getattr(user, 'is_authenticated', False) else None,
    )


def record_tracking_event(
    goods: Goods,
    *,
    from_status: str,
    to_status: str,
    user=None,
    office: str = '',
    notes: str = '',
    photos: list | None = None,
    latitude=None,
    longitude=None,
) -> GoodsTrackingEvent:
    event = GoodsTrackingEvent.objects.create(
        organization=goods.organization,
        goods=goods,
        from_status=from_status or '',
        to_status=to_status,
        user=user if getattr(user, 'is_authenticated', False) else None,
        office=office or '',
        notes=notes or '',
        photos=photos or [],
        latitude=latitude,
        longitude=longitude,
    )
    from api import activity as activity_mod
    activity_mod.record_activity(
        organization=goods.organization,
        module='goods',
        action='status_change' if from_status else 'create',
        user=user,
        entity_type='goods',
        entity_id=goods.id,
        entity_label=goods.tracking_number or str(goods.id),
        summary=notes or f'Status {from_status or "—"} → {to_status}',
        before={'status': from_status or ''},
        after={'status': to_status, 'office': office or ''},
        changed_fields=['status'],
        agent_id=goods.agent_id,
        goods_id=goods.id,
        status=to_status,
        metadata={
            'tracking_event_id': str(event.id),
            'office': office or '',
            'photos_count': len(photos or []),
        },
        related_url=f'/goods/{goods.id}',
        use_on_commit=False,
    )
    return event


def record_scan_log(
    goods: Goods,
    *,
    action: str,
    qr: GoodsQrCode | None = None,
    user=None,
    device: str = '',
    from_status: str = '',
    to_status: str = '',
    notes: str = '',
) -> GoodsScanLog:
    log = GoodsScanLog.objects.create(
        organization=goods.organization,
        goods=goods,
        qr=qr,
        user=user if getattr(user, 'is_authenticated', False) else None,
        action=action,
        device=device or '',
        from_status=from_status or '',
        to_status=to_status or '',
        notes=notes or '',
    )
    from api import activity as activity_mod
    activity_mod.record_activity(
        organization=goods.organization,
        module='goods',
        action='scan',
        user=user,
        entity_type='goods',
        entity_id=goods.id,
        entity_label=goods.tracking_number or str(goods.id),
        summary=notes or f'Scan: {action}',
        before={'status': from_status},
        after={'status': to_status or goods.status, 'scan_action': action},
        goods_id=goods.id,
        agent_id=goods.agent_id,
        status=to_status or goods.status,
        metadata={'scan_log_id': str(log.id), 'device': device or ''},
        related_url=f'/goods/{goods.id}',
        use_on_commit=False,
    )
    return log


def serialize_tracking_event(event: GoodsTrackingEvent) -> dict:
    username = ''
    if event.user_id:
        username = event.user.get_full_name() or event.user.username
    return {
        'id': str(event.id),
        'from_status': event.from_status,
        'to_status': event.to_status,
        'user': username,
        'office': event.office,
        'notes': event.notes,
        'photos': event.photos or [],
        'latitude': float(event.latitude) if event.latitude is not None else None,
        'longitude': float(event.longitude) if event.longitude is not None else None,
        'created_at': event.created_at.isoformat(),
    }


def public_track_payload(
    goods: Goods,
    role: str | None = None,
    office: str | None = None,
    *,
    authenticated: bool | None = None,
) -> dict:
    """Public QR payload. Monetary / media fields only for authenticated org users."""
    is_auth = bool(authenticated) if authenticated is not None else bool(role or office)
    agent_name = ''
    if goods.agent_id:
        agent_name = goods.agent.name
    events = [
        serialize_tracking_event(e)
        for e in goods.tracking_events.select_related('user').order_by('created_at')
    ]
    qr = getattr(goods, 'qr_code', None)
    token = str(qr.token) if qr and qr.is_active else None
    consistent, last_event_status = goods_status_consistency(goods)
    allowed = []
    if is_auth and consistent:
        allowed = allowed_next_statuses(goods.status, role=role, office=office)
    payload = {
        'token': token,
        'tracking_number': goods.tracking_number,
        'description': goods.description,
        'description_fr': goods.description_fr,
        'category': goods.category,
        'quantity': goods.quantity,
        'weight': float(goods.weight) if goods.weight is not None else None,
        'status': goods.status,
        'priority': goods.priority,
        'transport_type': goods.transport_type,
        'agent_name': agent_name if is_auth else '',
        'hs_code': goods.hs_code if is_auth else '',
        'incoterm': goods.incoterm if is_auth else '',
        'customs_status': goods.customs_status,
        'departure_date': goods.departure_date.isoformat() if goods.departure_date else None,
        'expected_arrival_date': goods.expected_arrival_date.isoformat() if goods.expected_arrival_date else None,
        'arrival_date': goods.arrival_date.isoformat() if goods.arrival_date else None,
        'created_at': goods.created_at.isoformat(),
        'timeline': events,
        'allowed_actions': allowed,
        'authenticated': is_auth,
        'status_consistent': consistent,
        'last_event_status': last_event_status,
    }
    if is_auth:
        payload.update({
            'value': float(goods.value) if goods.value is not None else None,
            'landed_cost': float(compute_landed_cost(goods)),
            'value_currency': goods.value_currency,
            'notes': goods.notes,
            'photos': goods.photos or [],
        })
    else:
        payload.update({
            'value': None,
            'landed_cost': None,
            'value_currency': None,
            'notes': '',
            'photos': [],
        })
    return payload


def apply_goods_status_update(
    goods: Goods,
    *,
    new_status: str,
    user,
    role: str | None,
    office: str | None = None,
    notes: str = '',
    photos: list | None = None,
    latitude=None,
    longitude=None,
    device: str = '',
    qr: GoodsQrCode | None = None,
    record_scan: bool = False,
) -> tuple[bool, str | None, Goods | None]:
    from django.db import transaction

    consistent, last = goods_status_consistency(goods)
    if not consistent:
        return (
            False,
            f'Status history is inconsistent (current={goods.status}, last_event={last}). '
            'Run repair_goods_status_history before updating.',
            None,
        )
    if getattr(goods, 'is_deleted', False):
        return False, 'Shipment is deleted.', None

    role_set = _status_cap_set(office=office, role=role)
    if new_status not in role_set:
        return False, 'Your role cannot set this shipment status.', None
    if not can_transition_goods(goods.status, new_status):
        return False, f'Cannot transition from {goods.status} to {new_status}', None
    if new_status in GOODS_AGENT_REQUIRED_STATUSES and not goods.agent_id:
        return False, 'Assign an agent before this status transition.', None

    lat = None
    lng = None
    try:
        if latitude is not None and latitude != '':
            lat = Decimal(str(latitude))
        if longitude is not None and longitude != '':
            lng = Decimal(str(longitude))
    except Exception:
        lat = None
        lng = None

    with transaction.atomic():
        # Do not select_related nullable FKs: Postgres rejects FOR UPDATE on outer joins.
        locked = Goods.objects.select_for_update().get(pk=goods.pk)
        if new_status in GOODS_AGENT_REQUIRED_STATUSES and not locked.agent_id:
            return False, 'Assign an agent before this status transition.', None
        consistent_locked, last_locked = goods_status_consistency(locked)
        if not consistent_locked:
            return (
                False,
                f'Status history is inconsistent (current={locked.status}, last_event={last_locked}). '
                'Run repair_goods_status_history before updating.',
                None,
            )
        if not can_transition_goods(locked.status, new_status):
            return False, f'Cannot transition from {locked.status} to {new_status}', None
        old_status = locked.status
        locked.status = new_status
        if new_status == 'delivered' and not locked.arrival_date:
            locked.arrival_date = timezone.now().date()
        event_notes = notes
        if old_status == 'delivered' and new_status == 'warehouse':
            event_notes = notes or 'reopen: mistaken delivery reversed to warehouse'
        elif old_status == 'cancelled' and new_status == 'draft':
            event_notes = notes or 'reopen: cancelled shipment restored to draft'
        locked.save()
        record_tracking_event(
            locked,
            from_status=old_status,
            to_status=new_status,
            user=user,
            office=office_for_role(role, office),
            notes=event_notes,
            photos=photos,
            latitude=lat,
            longitude=lng,
        )
        if record_scan:
            record_scan_log(
                locked,
                action='status_update',
                qr=qr,
                user=user,
                device=device,
                from_status=old_status,
                to_status=new_status,
                notes=notes,
            )
        if locked.agent_id:
            sync_agent_stats(Agent.objects.get(pk=locked.agent_id))
        return True, None, locked
