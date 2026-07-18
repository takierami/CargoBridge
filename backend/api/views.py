from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.authentication import JWTAuthentication

from accounts.serializers import OrganizationSerializer, UserSerializer

from . import services
from .permissions import ROLE_ALGERIA_ADMIN, ROLE_CHINA_ADMIN, RoleWritePermission, user_role

# Equal write privileges for both office admins
BOTH_ADMINS = (ROLE_CHINA_ADMIN, ROLE_ALGERIA_ADMIN)
from .models import (
    Agent,
    CalculatorRecord,
    ConversionRecord,
    Currency,
    DocumentTemplate,
    Goods,
    GoodsQrCode,
    Notification,
    PriceHistoryEntry,
    PurchaseOrder,
    PurchaseOrderItem,
    Supplier,
    SupplierAdjustment,
    SupplierCategoryEntity,
    SupplierCommunication,
    SupplierDocument,
    SupplierDocumentTemplate,
    SupplierPayment,
    SupplierProduct,
    SupplierRating,
    SupplierTask,
)
from .serializers import (
    AgentSerializer,
    CalculatorRecordSerializer,
    ConversionRecordSerializer,
    CurrencySerializer,
    DocumentTemplateSerializer,
    GoodsSerializer,
    NotificationSerializer,
    PriceHistoryEntrySerializer,
    PurchaseOrderSerializer,
    SupplierAdjustmentSerializer,
    SupplierCategoryEntitySerializer,
    SupplierCommunicationSerializer,
    SupplierDocumentSerializer,
    SupplierDocumentTemplateSerializer,
    SupplierPaymentSerializer,
    SupplierProductSerializer,
    SupplierRatingSerializer,
    SupplierSerializer,
    SupplierTaskSerializer,
)


class OrgViewSet(viewsets.ModelViewSet):
    permission_classes = [RoleWritePermission]
    allowed_write_roles = BOTH_ADMINS

    def get_organization(self):
        return self.request.user.profile.organization

    def get_queryset(self):
        return self.queryset.filter(organization=self.get_organization())

    def perform_create(self, serializer):
        serializer.save(organization=self.get_organization())


class AgentViewSet(OrgViewSet):
    queryset = Agent.objects.all()
    serializer_class = AgentSerializer
    allowed_write_roles = BOTH_ADMINS


class GoodsViewSet(OrgViewSet):
    queryset = Goods.objects.select_related('agent').all()
    serializer_class = GoodsSerializer
    allowed_write_roles = BOTH_ADMINS
    action_write_roles = {
        'update_status': BOTH_ADMINS,
        'allowed_statuses': BOTH_ADMINS,
        'update_customs_status': BOTH_ADMINS,
        'generate_qr': BOTH_ADMINS,
        'qr': BOTH_ADMINS,
    }

    def get_queryset(self):
        return super().get_queryset().filter(is_deleted=False)

    def perform_destroy(self, instance):
        from django.utils import timezone
        # Soft-delete preserves tracking history (prefer cancel for business exit)
        instance.is_deleted = True
        instance.deleted_by = self.request.user
        instance.deleted_at = timezone.now()
        instance.save(update_fields=['is_deleted', 'deleted_by', 'deleted_at', 'updated_at'])
        if instance.agent_id:
            services.sync_agent_stats(instance.agent)

    def perform_create(self, serializer):
        org = self.get_organization()
        goods = serializer.save(
            organization=org,
            tracking_number=services.next_tracking_number(org),
            status='draft',
        )
        services.record_tracking_event(
            goods,
            from_status='',
            to_status='draft',
            user=self.request.user,
            office=services.office_for_role(user_role(self.request.user)),
            notes='Shipment created',
        )

    @action(detail=True, methods=['get'])
    def allowed_statuses(self, request, pk=None):
        goods = self.get_object()
        role = user_role(request.user)
        consistent, last = services.goods_status_consistency(goods)
        return Response({
            'status': goods.status,
            'status_consistent': consistent,
            'last_event_status': last,
            'allowed_actions': (
                services.allowed_next_statuses(goods.status, role) if consistent else []
            ),
        })

    @action(detail=True, methods=['post'])
    def update_status(self, request, pk=None):
        goods = self.get_object()
        new_status = request.data.get('status')
        if not new_status:
            return Response({'error': 'status required'}, status=status.HTTP_400_BAD_REQUEST)
        old_status = goods.status
        ok, err, updated = services.apply_goods_status_update(
            goods,
            new_status=new_status,
            user=request.user,
            role=user_role(request.user),
            notes=request.data.get('notes') or '',
            photos=request.data.get('photos') or [],
            latitude=request.data.get('latitude'),
            longitude=request.data.get('longitude'),
            device=request.data.get('device') or '',
            record_scan=False,
        )
        if not ok:
            code = status.HTTP_403_FORBIDDEN if err and 'role' in err.lower() else status.HTTP_400_BAD_REQUEST
            return Response({'success': False, 'error': err}, status=code)
        return Response({
            'success': True,
            'goods': GoodsSerializer(updated).data,
            'old_status': old_status,
        })

    @action(detail=True, methods=['post'])
    def generate_qr(self, request, pk=None):
        goods = self.get_object()
        qr = services.get_or_create_goods_qr(goods, user=request.user)
        return Response({
            'token': str(qr.token),
            'url': f'/t/{qr.token}',
            'created_at': qr.created_at.isoformat(),
            'is_active': qr.is_active,
        })

    @action(detail=True, methods=['get'])
    def qr(self, request, pk=None):
        goods = self.get_object()
        try:
            qr = goods.qr_code
        except GoodsQrCode.DoesNotExist:
            return Response({'error': 'QR not generated'}, status=status.HTTP_404_NOT_FOUND)
        if not qr.is_active:
            return Response({'error': 'QR inactive'}, status=status.HTTP_404_NOT_FOUND)
        return Response({
            'token': str(qr.token),
            'url': f'/t/{qr.token}',
            'created_at': qr.created_at.isoformat(),
            'is_active': qr.is_active,
        })

    @action(detail=True, methods=['post'])
    def update_customs_status(self, request, pk=None):
        goods = self.get_object()
        new_status = request.data.get('customs_status') or request.data.get('status')
        if not new_status:
            return Response({'error': 'customs_status required'}, status=status.HTTP_400_BAD_REQUEST)
        ok, err, updated = services.apply_customs_status_update(
            goods,
            new_status=new_status,
            role=user_role(request.user),
            user=request.user,
            notes=request.data.get('notes') or '',
        )
        if not ok:
            code = status.HTTP_403_FORBIDDEN if err and 'role' in err.lower() else status.HTTP_400_BAD_REQUEST
            return Response({'success': False, 'error': err}, status=code)
        return Response({
            'success': True,
            'goods': GoodsSerializer(updated).data,
            'landed_cost': float(services.compute_landed_cost(updated)),
        })


class GoodsTrackView(APIView):
    """
    Public track-by-token (capability URL).

    Security model: possession of an active UUID4 QR token grants read access to that
    shipment only. Tokens are unguessable; soft-deleted goods are excluded. Cross-org
    status writes require JWT + matching organization (see GoodsTrackStatusView).
    """

    authentication_classes = [JWTAuthentication]
    permission_classes = [permissions.AllowAny]

    def get_qr(self, token):
        try:
            return GoodsQrCode.objects.select_related(
                'goods', 'goods__agent',
            ).prefetch_related('goods__tracking_events__user').get(
                token=token,
                is_active=True,
                goods__is_deleted=False,
            )
        except (GoodsQrCode.DoesNotExist, ValueError, TypeError):
            return None

    def get(self, request, token):
        qr = self.get_qr(token)
        if not qr:
            return Response({'error': 'Not found'}, status=status.HTTP_404_NOT_FOUND)
        goods = qr.goods
        role = user_role(request.user) if request.user and request.user.is_authenticated else None
        services.record_scan_log(
            goods,
            action='view',
            qr=qr,
            user=request.user if request.user.is_authenticated else None,
            device=(request.META.get('HTTP_USER_AGENT') or '')[:255],
            from_status=goods.status,
            to_status=goods.status,
        )
        payload = services.public_track_payload(goods, role=role)
        payload['token'] = str(qr.token)
        return Response(payload)


class GoodsTrackStatusView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, token):
        try:
            qr = GoodsQrCode.objects.select_related('goods', 'goods__agent').get(
                token=token,
                is_active=True,
                goods__is_deleted=False,
            )
        except (GoodsQrCode.DoesNotExist, ValueError, TypeError):
            return Response({'error': 'Not found'}, status=status.HTTP_404_NOT_FOUND)

        user_org_id = getattr(getattr(request.user, 'profile', None), 'organization_id', None)
        if not user_org_id or qr.organization_id != user_org_id:
            return Response({'error': 'Not found'}, status=status.HTTP_404_NOT_FOUND)

        new_status = request.data.get('status')
        if not new_status:
            return Response({'error': 'status required'}, status=status.HTTP_400_BAD_REQUEST)

        role = user_role(request.user)
        ok, err, updated = services.apply_goods_status_update(
            qr.goods,
            new_status=new_status,
            user=request.user,
            role=role,
            notes=request.data.get('notes') or '',
            photos=request.data.get('photos') or [],
            latitude=request.data.get('latitude'),
            longitude=request.data.get('longitude'),
            device=request.data.get('device') or (request.META.get('HTTP_USER_AGENT') or '')[:255],
            qr=qr,
            record_scan=True,
        )
        if not ok:
            code = status.HTTP_403_FORBIDDEN if err and 'role' in err.lower() else status.HTTP_400_BAD_REQUEST
            return Response({'success': False, 'error': err}, status=code)

        payload = services.public_track_payload(updated, role=role)
        payload['token'] = str(qr.token)
        payload['success'] = True
        return Response(payload)


class NotificationViewSet(OrgViewSet):
    queryset = Notification.objects.all()
    serializer_class = NotificationSerializer

    @action(detail=False, methods=['post'])
    def mark_all_read(self, request):
        self.get_queryset().update(read=True)
        return Response({'ok': True})


class DocumentTemplateViewSet(OrgViewSet):
    queryset = DocumentTemplate.objects.all()
    serializer_class = DocumentTemplateSerializer
    allowed_write_roles = BOTH_ADMINS

    @action(detail=True, methods=['post'])
    def set_default(self, request, pk=None):
        template = self.get_object()
        DocumentTemplate.objects.filter(
            organization=template.organization,
            type=template.type,
        ).update(is_default=False)
        template.is_default = True
        template.save(update_fields=['is_default', 'updated_at'])
        return Response(DocumentTemplateSerializer(template).data)

    @action(detail=True, methods=['post'])
    def duplicate(self, request, pk=None):
        template = self.get_object()
        copy = DocumentTemplate.objects.create(
            organization=template.organization,
            name=f'{template.name} (copy)',
            type=template.type,
            content=template.content,
            is_default=False,
        )
        return Response(DocumentTemplateSerializer(copy).data)


class SupplierDocumentTemplateViewSet(OrgViewSet):
    queryset = SupplierDocumentTemplate.objects.all()
    serializer_class = SupplierDocumentTemplateSerializer
    allowed_write_roles = BOTH_ADMINS


class SupplierViewSet(OrgViewSet):
    queryset = Supplier.objects.all().order_by('-updated_at')
    serializer_class = SupplierSerializer
    allowed_write_roles = BOTH_ADMINS

    def get_queryset(self):
        return super().get_queryset().filter(is_deleted=False)

    def perform_create(self, serializer):
        org = self.get_organization()
        serializer.save(
            organization=org,
            code=services.next_sequence(org, 'supplier', 'SUP'),
        )

    def perform_destroy(self, instance):
        from django.db import transaction
        from django.utils import timezone

        with transaction.atomic():
            instance.is_deleted = True
            instance.deleted_by = self.request.user
            instance.deleted_at = timezone.now()
            instance.save(update_fields=['is_deleted', 'deleted_by', 'deleted_at', 'updated_at'])
            services.record_money_audit(
                organization=instance.organization,
                entity_type='supplier',
                entity_id=instance.id,
                action='soft_delete',
                user=self.request.user,
                before={'code': instance.code, 'name': instance.name, 'status': instance.status},
            )

    @action(detail=True, methods=['get'])
    def ledger(self, request, pk=None):
        supplier = self.get_object()
        return Response(services.build_supplier_ledger(supplier))


class SupplierProductViewSet(OrgViewSet):
    queryset = SupplierProduct.objects.all()
    serializer_class = SupplierProductSerializer
    allowed_write_roles = BOTH_ADMINS


class SupplierCategoryEntityViewSet(OrgViewSet):
    queryset = SupplierCategoryEntity.objects.all()
    serializer_class = SupplierCategoryEntitySerializer
    allowed_write_roles = BOTH_ADMINS


class PurchaseOrderViewSet(OrgViewSet):
    queryset = PurchaseOrder.objects.prefetch_related('items').all()
    serializer_class = PurchaseOrderSerializer
    allowed_write_roles = BOTH_ADMINS

    def get_queryset(self):
        return super().get_queryset().filter(is_deleted=False)

    def perform_destroy(self, instance):
        from django.db import transaction
        from django.utils import timezone

        with transaction.atomic():
            instance.is_deleted = True
            instance.deleted_by = self.request.user
            instance.deleted_at = timezone.now()
            instance.save(update_fields=['is_deleted', 'deleted_by', 'deleted_at', 'updated_at'])
            services.record_money_audit(
                organization=instance.organization,
                entity_type='purchase_order',
                entity_id=instance.id,
                action='soft_delete',
                user=self.request.user,
                before={'po_number': instance.po_number, 'status': instance.status},
            )

    @action(detail=True, methods=['post'])
    def update_status(self, request, pk=None):
        po = self.get_object()
        new_status = request.data.get('status')
        if not new_status:
            return Response({'error': 'status required'}, status=status.HTTP_400_BAD_REQUEST)
        ok, err, updated = services.apply_po_status_update(
            po, new_status=new_status, user=request.user,
        )
        if not ok:
            return Response({'success': False, 'error': err}, status=status.HTTP_400_BAD_REQUEST)
        return Response({'success': True, 'po': PurchaseOrderSerializer(updated).data})


class PriceHistoryEntryViewSet(OrgViewSet):
    queryset = PriceHistoryEntry.objects.all()
    serializer_class = PriceHistoryEntrySerializer
    allowed_write_roles = BOTH_ADMINS


class SupplierPaymentViewSet(OrgViewSet):
    queryset = SupplierPayment.objects.all()
    serializer_class = SupplierPaymentSerializer
    # Both offices may record payments against supplier balances / كشف حساب
    allowed_write_roles = BOTH_ADMINS

    def get_queryset(self):
        return super().get_queryset().filter(is_deleted=False)

    def perform_destroy(self, instance):
        from django.db import transaction
        from django.utils import timezone

        with transaction.atomic():
            instance.is_deleted = True
            instance.deleted_by = self.request.user
            instance.deleted_at = timezone.now()
            instance.save(update_fields=['is_deleted', 'deleted_by', 'deleted_at', 'updated_at'])
            services.record_money_audit(
                organization=instance.organization,
                entity_type='payment',
                entity_id=instance.id,
                action='soft_delete',
                user=self.request.user,
                before={'payment_number': instance.payment_number, 'amount': str(instance.amount)},
            )

    @action(detail=True, methods=['post'])
    def mark_fully_paid(self, request, pk=None):
        from django.db import transaction

        payment = self.get_object()
        before = {'amount_paid': str(payment.amount_paid), 'status': payment.status}
        with transaction.atomic():
            payment.status = 'fully_paid'
            payment.amount_paid = payment.amount
            payment.save()
            services.record_money_audit(
                organization=payment.organization,
                entity_type='payment',
                entity_id=payment.id,
                action='mark_paid',
                user=request.user,
                before=before,
                after={'amount_paid': str(payment.amount_paid), 'status': payment.status},
            )
        return Response(SupplierPaymentSerializer(payment).data)

    @action(detail=False, methods=['get'])
    def po_balance(self, request):
        po_id = request.query_params.get('purchase_order_id')
        if not po_id:
            return Response({'error': 'purchase_order_id required'}, status=400)
        try:
            po = PurchaseOrder.objects.get(pk=po_id, organization=self.get_organization())
        except PurchaseOrder.DoesNotExist:
            return Response({'total': 0, 'paid': 0, 'remaining': 0})
        payments = SupplierPayment.objects.filter(
            purchase_order=po, is_deleted=False, organization=self.get_organization(),
        )
        paid = sum((services.payment_credited_amount(p) for p in payments), 0)
        return Response({
            'total': float(po.total_amount),
            'paid': float(paid),
            'remaining': float(po.total_amount - paid),
        })


class SupplierAdjustmentViewSet(OrgViewSet):
    queryset = SupplierAdjustment.objects.all()
    serializer_class = SupplierAdjustmentSerializer
    allowed_write_roles = BOTH_ADMINS

    def get_queryset(self):
        return super().get_queryset().filter(is_deleted=False)

    def perform_create(self, serializer):
        serializer.save(organization=self.get_organization())

    def perform_update(self, serializer):
        serializer.save()

    def perform_destroy(self, instance):
        from django.db import transaction
        from django.utils import timezone

        with transaction.atomic():
            instance.is_deleted = True
            instance.deleted_by = self.request.user
            instance.deleted_at = timezone.now()
            instance.save(update_fields=['is_deleted', 'deleted_by', 'deleted_at', 'updated_at'])
            services.record_money_audit(
                organization=instance.organization,
                entity_type='adjustment',
                entity_id=instance.id,
                action='soft_delete',
                user=self.request.user,
                before={'amount': str(instance.amount), 'type': instance.type},
            )


class SupplierDocumentViewSet(OrgViewSet):
    queryset = SupplierDocument.objects.all()
    serializer_class = SupplierDocumentSerializer
    allowed_write_roles = BOTH_ADMINS

    def get_queryset(self):
        return super().get_queryset().filter(is_deleted=False)

    def perform_destroy(self, instance):
        from django.utils import timezone

        instance.is_deleted = True
        instance.deleted_by = self.request.user
        instance.deleted_at = timezone.now()
        instance.save(update_fields=['is_deleted', 'deleted_by', 'deleted_at', 'updated_at'])


class SupplierCommunicationViewSet(OrgViewSet):
    queryset = SupplierCommunication.objects.all()
    serializer_class = SupplierCommunicationSerializer

    def get_queryset(self):
        return super().get_queryset().filter(is_deleted=False)

    def perform_destroy(self, instance):
        instance.is_deleted = True
        instance.save(update_fields=['is_deleted', 'updated_at'])


class SupplierTaskViewSet(OrgViewSet):
    queryset = SupplierTask.objects.all()
    serializer_class = SupplierTaskSerializer

    def get_queryset(self):
        return super().get_queryset().filter(is_deleted=False)

    def perform_destroy(self, instance):
        instance.is_deleted = True
        instance.save(update_fields=['is_deleted', 'updated_at'])

    @action(detail=True, methods=['post'])
    def complete(self, request, pk=None):
        from django.utils import timezone
        task = self.get_object()
        task.status = 'completed'
        task.completed_at = timezone.now()
        task.save()
        return Response(SupplierTaskSerializer(task).data)


class SupplierRatingViewSet(OrgViewSet):
    queryset = SupplierRating.objects.all()
    serializer_class = SupplierRatingSerializer

    @action(detail=False, methods=['post'])
    def upsert(self, request):
        supplier_id = request.data.get('supplier') or request.data.get('supplier_id')
        if not supplier_id:
            return Response({'error': 'supplier_id required'}, status=400)
        org = self.get_organization()
        try:
            supplier = Supplier.objects.get(pk=supplier_id, organization=org)
        except Supplier.DoesNotExist:
            return Response({'error': 'Supplier not found'}, status=404)
        rating, _ = SupplierRating.objects.get_or_create(
            supplier=supplier,
            organization=org,
            defaults={'quality': 0, 'communication': 0, 'delivery_speed': 0,
                      'reliability': 0, 'pricing': 0, 'flexibility': 0, 'overall': 0},
        )
        serializer = SupplierRatingSerializer(rating, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


class CurrencyViewSet(OrgViewSet):
    queryset = Currency.objects.all()
    serializer_class = CurrencySerializer
    allowed_write_roles = BOTH_ADMINS

    @action(detail=True, methods=['post'])
    def set_default(self, request, pk=None):
        currency = self.get_object()
        Currency.objects.filter(organization=currency.organization).update(is_default=False)
        currency.is_default = True
        currency.save(update_fields=['is_default', 'updated_at'])
        return Response(CurrencySerializer(currency).data)


class ConversionRecordViewSet(OrgViewSet):
    queryset = ConversionRecord.objects.all()
    serializer_class = ConversionRecordSerializer

    def get_queryset(self):
        return super().get_queryset().order_by('-timestamp')[:200]

    @action(detail=False, methods=['post'])
    def clear(self, request):
        org = self.get_organization()
        ConversionRecord.objects.filter(organization=org).delete()
        return Response({'ok': True})


class CalculatorRecordViewSet(OrgViewSet):
    queryset = CalculatorRecord.objects.all()
    serializer_class = CalculatorRecordSerializer

    def get_queryset(self):
        return super().get_queryset().order_by('-timestamp')[:100]

    @action(detail=False, methods=['post'])
    def clear(self, request):
        org = self.get_organization()
        CalculatorRecord.objects.filter(organization=org).delete()
        return Response({'ok': True})


class HealthView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        from django.db import connection
        try:
            connection.ensure_connection()
            db_ok = True
        except Exception:
            db_ok = False
        return Response({'status': 'ok' if db_ok else 'degraded', 'database': db_ok})


class BootstrapView(APIView):
    def get(self, request):
        from django.conf import settings as dj_settings

        org = request.user.profile.organization
        limit = int(getattr(dj_settings, 'BOOTSTRAP_MAX_PER_COLLECTION', 2000))
        truncated = {}

        def capped(qs, key):
            total = qs.count()
            if total > limit:
                truncated[key] = {'total': total, 'returned': limit}
            return qs[:limit]

        goods_qs = capped(
            Goods.objects.filter(organization=org, is_deleted=False).order_by('-updated_at'),
            'goods',
        )
        po_qs = list(
            capped(
                PurchaseOrder.objects.filter(organization=org, is_deleted=False)
                .prefetch_related('items')
                .order_by('-updated_at'),
                'purchase_orders',
            )
        )
        suppliers_qs = capped(
            Supplier.objects.filter(organization=org, is_deleted=False).order_by('-updated_at'),
            'suppliers',
        )
        payments_qs = capped(
            SupplierPayment.objects.filter(organization=org, is_deleted=False).order_by('-updated_at'),
            'supplier_payments',
        )
        adjustments_qs = capped(
            SupplierAdjustment.objects.filter(organization=org, is_deleted=False).order_by('-updated_at'),
            'supplier_adjustments',
        )
        documents_qs = capped(
            SupplierDocument.objects.filter(organization=org, is_deleted=False).order_by('-updated_at'),
            'supplier_documents',
        )
        products_qs = capped(
            SupplierProduct.objects.filter(organization=org).order_by('-updated_at'),
            'supplier_products',
        )
        notifications_qs = capped(
            Notification.objects.filter(organization=org).order_by('-timestamp'),
            'notifications',
        )
        price_history_qs = capped(
            PriceHistoryEntry.objects.filter(organization=org).order_by('-recorded_at'),
            'price_history',
        )
        communications_qs = capped(
            SupplierCommunication.objects.filter(organization=org, is_deleted=False).order_by('-updated_at'),
            'supplier_communications',
        )
        tasks_qs = capped(
            SupplierTask.objects.filter(organization=org, is_deleted=False).order_by('-updated_at'),
            'supplier_tasks',
        )

        return Response({
            'user': UserSerializer(request.user).data,
            'organization': OrganizationSerializer(org).data,
            'goods': GoodsSerializer(goods_qs, many=True).data,
            'agents': AgentSerializer(Agent.objects.filter(organization=org), many=True).data,
            'notifications': NotificationSerializer(notifications_qs, many=True).data,
            'templates': DocumentTemplateSerializer(
                DocumentTemplate.objects.filter(organization=org), many=True
            ).data,
            'supplier_templates': SupplierDocumentTemplateSerializer(
                SupplierDocumentTemplate.objects.filter(organization=org), many=True
            ).data,
            'suppliers': SupplierSerializer(suppliers_qs, many=True).data,
            'supplier_products': SupplierProductSerializer(products_qs, many=True).data,
            'supplier_categories': SupplierCategoryEntitySerializer(
                SupplierCategoryEntity.objects.filter(organization=org), many=True
            ).data,
            'purchase_orders': PurchaseOrderSerializer(po_qs, many=True).data,
            'purchase_order_items': [
                {
                    'id': str(item.id),
                    'purchase_order_id': str(item.purchase_order_id),
                    'product_name': item.product_name,
                    'quantity': item.quantity,
                    'unit_cost': float(item.unit_cost),
                    'total_cost': float(item.total_cost),
                    'created_at': item.created_at.isoformat(),
                    'updated_at': item.updated_at.isoformat(),
                }
                for po in po_qs
                for item in po.items.all()
            ],
            'price_history': PriceHistoryEntrySerializer(price_history_qs, many=True).data,
            'supplier_payments': SupplierPaymentSerializer(payments_qs, many=True).data,
            'supplier_adjustments': SupplierAdjustmentSerializer(adjustments_qs, many=True).data,
            'supplier_documents': SupplierDocumentSerializer(documents_qs, many=True).data,
            'supplier_communications': SupplierCommunicationSerializer(
                communications_qs, many=True
            ).data,
            'supplier_tasks': SupplierTaskSerializer(tasks_qs, many=True).data,
            'supplier_ratings': SupplierRatingSerializer(
                SupplierRating.objects.filter(organization=org), many=True
            ).data,
            'currencies': CurrencySerializer(Currency.objects.filter(organization=org), many=True).data,
            'conversion_records': ConversionRecordSerializer(
                ConversionRecord.objects.filter(organization=org).order_by('-timestamp')[:200], many=True
            ).data,
            'calculator_records': CalculatorRecordSerializer(
                CalculatorRecord.objects.filter(organization=org).order_by('-timestamp')[:100], many=True
            ).data,
            'meta': {
                'bootstrap_max_per_collection': limit,
                'truncated': truncated,
            },
        })


class ResetDataView(APIView):
    def post(self, request):
        from django.conf import settings as dj_settings

        if not getattr(dj_settings, 'ALLOW_DATA_RESET', False):
            return Response(
                {'error': 'Data reset is disabled. Set ALLOW_DATA_RESET=True to enable.'},
                status=status.HTTP_403_FORBIDDEN,
            )
        if user_role(request.user) not in BOTH_ADMINS:
            return Response(
                {'error': 'Only an organization admin can reset organization data.'},
                status=status.HTTP_403_FORBIDDEN,
            )
        org = request.user.profile.organization
        models_to_clear = [
            Goods, Agent, Notification, DocumentTemplate, SupplierDocumentTemplate,
            SupplierProduct, PurchaseOrderItem, PurchaseOrder, PriceHistoryEntry,
            SupplierPayment, SupplierAdjustment, SupplierDocument, SupplierCommunication,
            SupplierTask, SupplierRating, Supplier, SupplierCategoryEntity,
            Currency, ConversionRecord, CalculatorRecord,
        ]
        for model in models_to_clear:
            model.objects.filter(organization=org).delete()
        from api.management.commands.seed_demo import seed_organization
        seed_organization(org)
        bootstrap = BootstrapView()
        bootstrap.request = request
        return bootstrap.get(request)
