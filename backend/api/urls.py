from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    AgentViewSet,
    BootstrapView,
    CalculatorRecordViewSet,
    ConversionRecordViewSet,
    CurrencyViewSet,
    DocumentTemplateViewSet,
    GoodsTrackStatusView,
    GoodsTrackView,
    GoodsViewSet,
    HealthView,
    NotificationViewSet,
    PriceHistoryEntryViewSet,
    PurchaseOrderViewSet,
    ResetDataView,
    SupplierAdjustmentViewSet,
    SupplierCategoryEntityViewSet,
    SupplierCommunicationViewSet,
    SupplierDocumentTemplateViewSet,
    SupplierDocumentViewSet,
    SupplierPaymentViewSet,
    SupplierProductViewSet,
    SupplierRatingViewSet,
    SupplierTaskViewSet,
    SupplierViewSet,
)

router = DefaultRouter()
router.register('agents', AgentViewSet, basename='agent')
router.register('goods', GoodsViewSet, basename='goods')
router.register('notifications', NotificationViewSet, basename='notification')
router.register('templates', DocumentTemplateViewSet, basename='template')
router.register('supplier-templates', SupplierDocumentTemplateViewSet, basename='supplier-template')
router.register('suppliers', SupplierViewSet, basename='supplier')
router.register('supplier-products', SupplierProductViewSet, basename='supplier-product')
router.register('supplier-categories', SupplierCategoryEntityViewSet, basename='supplier-category')
router.register('purchase-orders', PurchaseOrderViewSet, basename='purchase-order')
router.register('price-history', PriceHistoryEntryViewSet, basename='price-history')
router.register('supplier-payments', SupplierPaymentViewSet, basename='supplier-payment')
router.register('supplier-adjustments', SupplierAdjustmentViewSet, basename='supplier-adjustment')
router.register('supplier-documents', SupplierDocumentViewSet, basename='supplier-document')
router.register('supplier-communications', SupplierCommunicationViewSet, basename='supplier-communication')
router.register('supplier-tasks', SupplierTaskViewSet, basename='supplier-task')
router.register('supplier-ratings', SupplierRatingViewSet, basename='supplier-rating')
router.register('currencies', CurrencyViewSet, basename='currency')
router.register('conversion-records', ConversionRecordViewSet, basename='conversion-record')
router.register('calculator-records', CalculatorRecordViewSet, basename='calculator-record')

urlpatterns = [
    path('health/', HealthView.as_view()),
    path('bootstrap/', BootstrapView.as_view()),
    path('reset/', ResetDataView.as_view()),
    path('track/<uuid:token>/', GoodsTrackView.as_view()),
    path('track/<uuid:token>/status/', GoodsTrackStatusView.as_view()),
    path('', include(router.urls)),
]
