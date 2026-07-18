from django.contrib import admin

from .models import (
    Agent,
    CalculatorRecord,
    ConversionRecord,
    Currency,
    DocumentTemplate,
    Goods,
    GoodsCustomsEvent,
    GoodsQrCode,
    GoodsScanLog,
    GoodsTrackingEvent,
    MoneyAuditEvent,
    Notification,
    PurchaseOrder,
    Supplier,
    SupplierPayment,
)


class ReadOnlyAuditAdmin(admin.ModelAdmin):
    """Append-only audit rows — no create/change/delete in Django admin."""

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False


class NoHardDeleteAdmin(admin.ModelAdmin):
    """Block Django admin hard-delete (CASCADE data loss)."""

    def has_delete_permission(self, request, obj=None):
        return False


@admin.register(Goods)
class GoodsAdmin(NoHardDeleteAdmin):
    list_display = ('tracking_number', 'status', 'priority', 'organization', 'is_deleted', 'created_at')
    list_filter = ('status', 'priority', 'is_deleted')
    search_fields = ('tracking_number', 'description')
    readonly_fields = (
        'status', 'tracking_number', 'customs_status',
        'is_deleted', 'deleted_by', 'deleted_at',
        'created_at', 'updated_at',
    )


@admin.register(PurchaseOrder)
class PurchaseOrderAdmin(NoHardDeleteAdmin):
    list_display = ('po_number', 'status', 'supplier', 'total_amount', 'currency', 'is_deleted')
    list_filter = ('status', 'is_deleted')
    search_fields = ('po_number',)
    readonly_fields = (
        'status', 'po_number', 'total_amount', 'fx_rate_to_base',
        'created_by', 'deleted_by', 'deleted_at',
        'created_at', 'updated_at',
    )


@admin.register(Supplier)
class SupplierAdmin(NoHardDeleteAdmin):
    list_display = ('code', 'name', 'status', 'organization', 'is_deleted', 'outstanding')
    list_filter = ('status', 'is_deleted')
    search_fields = ('code', 'name')
    readonly_fields = (
        'code', 'total_purchased', 'total_paid', 'outstanding', 'balance_currency',
        'is_deleted', 'deleted_by', 'deleted_at',
        'created_at', 'updated_at',
    )


@admin.register(SupplierPayment)
class SupplierPaymentAdmin(NoHardDeleteAdmin):
    list_display = (
        'payment_number', 'supplier', 'amount', 'amount_paid', 'currency',
        'status', 'is_deleted',
    )
    list_filter = ('status', 'is_deleted')
    search_fields = ('payment_number',)
    readonly_fields = (
        'payment_number', 'amount', 'currency', 'fx_rate_to_base',
        'created_by', 'deleted_by', 'deleted_at', 'is_deleted',
        'created_at', 'updated_at',
    )


@admin.register(GoodsTrackingEvent)
class GoodsTrackingEventAdmin(ReadOnlyAuditAdmin):
    list_display = ('goods', 'from_status', 'to_status', 'user', 'created_at')
    list_filter = ('to_status',)


@admin.register(GoodsScanLog)
class GoodsScanLogAdmin(ReadOnlyAuditAdmin):
    list_display = ('goods', 'action', 'from_status', 'to_status', 'user', 'created_at')
    list_filter = ('action',)


@admin.register(GoodsCustomsEvent)
class GoodsCustomsEventAdmin(ReadOnlyAuditAdmin):
    list_display = ('goods', 'from_status', 'to_status', 'user', 'created_at')


@admin.register(MoneyAuditEvent)
class MoneyAuditEventAdmin(ReadOnlyAuditAdmin):
    list_display = ('entity_type', 'action', 'entity_id', 'user', 'created_at')
    list_filter = ('entity_type', 'action')


admin.site.register(Agent)
admin.site.register(GoodsQrCode)
admin.site.register(Notification)
admin.site.register(DocumentTemplate)
admin.site.register(Currency)
admin.site.register(ConversionRecord)
admin.site.register(CalculatorRecord)
