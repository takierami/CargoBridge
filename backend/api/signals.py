import logging

from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver

from .models import PurchaseOrder, Supplier, SupplierAdjustment, SupplierPayment
from .services import MissingFxRateError, derive_payment_status, update_supplier_balance

logger = logging.getLogger(__name__)


def _safe_rebalance(supplier):
    """Single authoritative balance path for money model saves (create/update/soft-delete)."""
    if supplier is None:
        return
    try:
        update_supplier_balance(supplier)
    except MissingFxRateError as exc:
        # Leave cached balances unchanged until FX is configured
        logger.error(
            'Supplier balance recompute skipped for supplier=%s: %s',
            getattr(supplier, 'pk', None),
            exc,
        )


def _remember_old_supplier(instance):
    if not instance.pk:
        instance._old_supplier_id = None
        return
    try:
        old = type(instance).objects.only('supplier_id').get(pk=instance.pk)
        instance._old_supplier_id = old.supplier_id
    except type(instance).DoesNotExist:
        instance._old_supplier_id = None


def _rebalance_supplier_change(instance):
    _safe_rebalance(instance.supplier)
    old_id = getattr(instance, '_old_supplier_id', None)
    if old_id and old_id != instance.supplier_id:
        try:
            old_supplier = Supplier.objects.get(pk=old_id)
        except Supplier.DoesNotExist:
            return
        _safe_rebalance(old_supplier)


@receiver(pre_save, sender=PurchaseOrder)
def purchase_order_pre_save(sender, instance, **kwargs):
    _remember_old_supplier(instance)


@receiver(pre_save, sender=SupplierPayment)
def payment_pre_save(sender, instance, **kwargs):
    _remember_old_supplier(instance)


@receiver(post_save, sender=SupplierPayment)
def payment_saved(sender, instance, **kwargs):
    derived = derive_payment_status(instance)
    if instance.status != derived:
        SupplierPayment.objects.filter(pk=instance.pk).update(status=derived)
    _rebalance_supplier_change(instance)


@receiver(post_save, sender=SupplierAdjustment)
def adjustment_saved(sender, instance, **kwargs):
    # Always rebalance (including soft-delete) so views need not call update_supplier_balance
    _safe_rebalance(instance.supplier)


@receiver(post_save, sender=PurchaseOrder)
def purchase_order_saved(sender, instance, **kwargs):
    _rebalance_supplier_change(instance)
