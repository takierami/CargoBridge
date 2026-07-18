"""
Round-trip every writable entity through serializers/services and assert DB values.
Usage:
  python manage.py scan_persistence
  python manage.py scan_persistence --keep
"""
from __future__ import annotations

import base64
import uuid
from datetime import date
from decimal import Decimal

from django.contrib.auth.models import User
from django.core.management.base import BaseCommand
from django.utils import timezone

from accounts.models import UserProfile
from accounts.serializers import RegisterSerializer
from api import services
from api.models import (
    Agent,
    Goods,
    GoodsScanLog,
    GoodsTrackingEvent,
    PurchaseOrder,
    PurchaseOrderItem,
    Supplier,
    SupplierRating,
)
from api.serializers import (
    AgentSerializer,
    CalculatorRecordSerializer,
    ConversionRecordSerializer,
    CurrencySerializer,
    DocumentTemplateSerializer,
    GoodsSerializer,
    NotificationSerializer,
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

# 1x1 transparent PNG
_PNG_BYTES = base64.b64decode(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='
)
_PNG_DATA_URL = (
    'data:image/png;base64,'
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='
)


class Command(BaseCommand):
    help = 'Deep-scan persistence: create each entity via serializers/services and assert DB fields.'

    def add_arguments(self, parser):
        parser.add_argument(
            '--keep',
            action='store_true',
            help='Keep the temporary organization and scan data after the run.',
        )

    def handle(self, *args, **options):
        self.failures: list[str] = []
        self.passes = 0
        keep = options['keep']
        suffix = uuid.uuid4().hex[:8]
        username = f'scan_{suffix}'

        self.stdout.write(self.style.NOTICE(f'Starting persistence scan ({suffix})…'))

        reg = RegisterSerializer(data={
            'username': username,
            'email': f'{username}@scan.test',
            'password': 'ScanTest123!',
            'company_name': f'Scan Org {suffix}',
            'company_name_fr': f'Scan Org FR {suffix}',
            'role': 'china_admin',
        })
        if not reg.is_valid():
            raise SystemExit(f'RegisterSerializer failed: {reg.errors}')
        user = reg.save()
        org = user.profile.organization
        self._check('Organization.name', org.name, f'Scan Org {suffix}')
        self._check('UserProfile.role', user.profile.role, 'china_admin')

        algeria = User.objects.create_user(
            username=f'{username}_dz',
            email=f'{username}_dz@scan.test',
            password='ScanTest123!',
        )
        UserProfile.objects.create(user=algeria, organization=org, role='algeria_admin')

        try:
            agent = self._scan_agent(org)
            goods = self._scan_goods(org, agent, user, algeria)
            supplier = self._scan_supplier(org)
            self._scan_supplier_product(org, supplier)
            self._scan_category(org)
            po = self._scan_purchase_order(org, supplier)
            self._scan_payment(org, supplier, po)
            self._scan_adjustment(org, supplier)
            self._scan_document(org, supplier)
            self._scan_communication(org, supplier)
            self._scan_task(org, supplier, po)
            self._scan_rating(org, supplier)
            self._scan_currency(org)
            self._scan_conversion(org)
            self._scan_calculator(org)
            self._scan_templates(org)
            self._scan_notification(org)
        finally:
            if not keep:
                org.delete()
                self.stdout.write('Cleaned up temporary organization.')
            else:
                self.stdout.write(self.style.WARNING(f'Kept org {org.id} / user {username}'))

        self.stdout.write('')
        if self.failures:
            self.stdout.write(self.style.ERROR(f'FAILED: {len(self.failures)} mismatch(es), {self.passes} ok'))
            for line in self.failures:
                self.stdout.write(self.style.ERROR(f'  - {line}'))
            raise SystemExit(1)

        self.stdout.write(self.style.SUCCESS(f'PASSED: all {self.passes} field assertions ok'))

    def _check(self, label: str, actual, expected):
        if isinstance(expected, Decimal) and actual is not None:
            actual = Decimal(str(actual))
            expected = Decimal(str(expected))
        if isinstance(expected, date) and hasattr(actual, 'isoformat') and not isinstance(actual, date):
            # unlikely
            pass
        if actual != expected:
            self.failures.append(f'{label}: expected={expected!r} actual={actual!r}')
            self.stdout.write(self.style.ERROR(f'  FAIL {label}'))
        else:
            self.passes += 1
            self.stdout.write(self.style.SUCCESS(f'  OK   {label}'))

    def _check_truthy(self, label: str, value):
        if not value:
            self.failures.append(f'{label}: expected truthy, got {value!r}')
            self.stdout.write(self.style.ERROR(f'  FAIL {label}'))
        else:
            self.passes += 1
            self.stdout.write(self.style.SUCCESS(f'  OK   {label}'))

    def _create(self, serializer_cls, data, organization, **extra):
        ser = serializer_cls(data=data)
        if not ser.is_valid():
            raise AssertionError(f'{serializer_cls.__name__} invalid: {ser.errors}')
        return ser.save(organization=organization, **extra)

    def _scan_agent(self, org) -> Agent:
        self.stdout.write('\n[Agent]')
        agent = self._create(AgentSerializer, {
            'name': 'Scan Agent',
            'name_fr': 'Scan Agent FR',
            'phone': '+86-100',
            'passport': 'SCAN-1',
            'country': 'China',
            'status': 'active',
            'notes': 'scan notes',
        }, org)
        agent.refresh_from_db()
        self._check('Agent.name', agent.name, 'Scan Agent')
        self._check('Agent.phone', agent.phone, '+86-100')
        self._check('Agent.passport', agent.passport, 'SCAN-1')
        self._check('Agent.reliability_score', agent.reliability_score, 0)
        self._check('Agent.organization_id', agent.organization_id, org.id)
        return agent

    def _scan_goods(self, org, agent: Agent, china_user, algeria_user) -> Goods:
        self.stdout.write('\n[Goods]')
        iso_dep = '2026-07-01T12:00:00.000Z'
        iso_exp = '2026-07-15T00:00:00.000Z'
        tracking = services.next_tracking_number(org)
        goods = self._create(GoodsSerializer, {
            'description': 'Scan shipment',
            'description_fr': 'Envoi scan',
            'category': 'electronics',
            'quantity': 5,
            'weight': '12.50',
            'value': '1000.00',
            'agent': str(agent.id),
            'status': 'draft',
            'priority': 'high',
            'departure_date': iso_dep,
            'expected_arrival_date': iso_exp,
            'transport_type': 'air',
            'notes': 'goods notes',
            'notes_fr': 'notes fr',
        }, org, tracking_number=tracking)
        goods.refresh_from_db()
        self._check('Goods.tracking_number', goods.tracking_number, tracking)
        self._check('Goods.description', goods.description, 'Scan shipment')
        self._check('Goods.quantity', goods.quantity, 5)
        self._check('Goods.priority', goods.priority, 'high')
        self._check('Goods.departure_date', goods.departure_date, date(2026, 7, 1))
        self._check('Goods.expected_arrival_date', goods.expected_arrival_date, date(2026, 7, 15))
        self._check('Goods.agent_id', goods.agent_id, agent.id)
        self._check('Goods.weight', Decimal(goods.weight), Decimal('12.50'))

        qr = services.get_or_create_goods_qr(goods, user=china_user)
        qr.refresh_from_db()
        self._check('GoodsQrCode.goods_id', qr.goods_id, goods.id)
        self._check_truthy('GoodsQrCode.token', qr.token)
        self._check('GoodsQrCode.is_active', qr.is_active, True)

        ok, err, updated = services.apply_goods_status_update(
            goods,
            new_status='assigned',
            user=china_user,
            role='china_admin',
            notes='assigned in scan',
            record_scan=True,
            qr=qr,
            device='scan-cmd',
        )
        self._check('Goods.status_update.ok', ok, True)
        if not ok:
            self.failures.append(f'Goods status update error: {err}')
            return goods
        updated.refresh_from_db()
        self._check('Goods.status', updated.status, 'assigned')
        event = GoodsTrackingEvent.objects.filter(goods=updated, to_status='assigned').first()
        self._check_truthy('GoodsTrackingEvent.exists', event)
        if event:
            self._check('GoodsTrackingEvent.from_status', event.from_status, 'draft')
            self._check('GoodsTrackingEvent.notes', event.notes, 'assigned in scan')
        scan = GoodsScanLog.objects.filter(goods=updated, action='status_update').first()
        self._check_truthy('GoodsScanLog.exists', scan)
        if scan:
            self._check('GoodsScanLog.device', scan.device, 'scan-cmd')
            self._check('GoodsScanLog.to_status', scan.to_status, 'assigned')
        return updated

    def _scan_supplier(self, org) -> Supplier:
        self.stdout.write('\n[Supplier]')
        code = services.next_sequence(org, 'supplier', 'SUP')
        supplier = self._create(SupplierSerializer, {
            'name': 'Scan Supplier',
            'name_fr': 'Fournisseur',
            'country': 'China',
            'city': '',
            'address': 'Guangzhou',
            'phones': [{'label': 'main', 'number': '123'}],
            'email': 'scan@supplier.test',
            'whatsapp': '',
            'wechat': 'wx-scan',
            'website': 'example.com',
            'primary_contact': '',
            'secondary_contact': 'Bob',
            'categories': ['electronics'],
            'payment_preferences': 'TT',
            'preferred_currency': 'USD',
            'lead_time_days': 14,
            'minimum_order_qty': 10,
            'business_notes': 'note',
            'status': 'active',
        }, org, code=code)
        supplier.refresh_from_db()
        self._check('Supplier.code', supplier.code, code)
        self._check('Supplier.name', supplier.name, 'Scan Supplier')
        self._check('Supplier.website', supplier.website, 'https://example.com')
        self._check('Supplier.city', supplier.city, '')
        self._check('Supplier.primary_contact', supplier.primary_contact, '')
        self._check('Supplier.phones', supplier.phones, [{'label': 'main', 'number': '123'}])
        self._check('Supplier.preferred_currency', supplier.preferred_currency, 'USD')
        return supplier

    def _scan_supplier_product(self, org, supplier: Supplier):
        self.stdout.write('\n[SupplierProduct]')
        product = self._create(SupplierProductSerializer, {
            'supplier': str(supplier.id),
            'name': 'Widget',
            'category': 'electronics',
            'sku': 'W-1',
            'unit_cost': '9.99',
            'currency': 'USD',
            'notes': 'prod',
        }, org)
        product.refresh_from_db()
        self._check('SupplierProduct.name', product.name, 'Widget')
        self._check('SupplierProduct.supplier_id', product.supplier_id, supplier.id)
        self._check('SupplierProduct.unit_cost', Decimal(product.unit_cost), Decimal('9.99'))
        self._check('SupplierProduct.sku', product.sku, 'W-1')

    def _scan_category(self, org):
        self.stdout.write('\n[SupplierCategory]')
        cat = self._create(SupplierCategoryEntitySerializer, {
            'name': 'إلكترونيات',
            'name_fr': 'Électronique',
            'is_editable': True,
        }, org)
        cat.refresh_from_db()
        self._check('SupplierCategoryEntity.name', cat.name, 'إلكترونيات')
        self._check('SupplierCategoryEntity.name_fr', cat.name_fr, 'Électronique')

    def _scan_purchase_order(self, org, supplier: Supplier) -> PurchaseOrder:
        self.stdout.write('\n[PurchaseOrder]')
        ser = PurchaseOrderSerializer(data={
            'supplier': str(supplier.id),
            'order_date': '2026-07-10',
            'expected_completion_date': '2026-08-01',
            'currency': 'USD',
            'status': 'confirmed',
            'notes': 'po notes',
            'items': [
                {'product_name': 'Widget', 'quantity': 2, 'unit_cost': '10.00'},
                {'product_name': 'Gadget', 'quantity': 3, 'unit_cost': '5.00'},
            ],
        })
        if not ser.is_valid():
            raise AssertionError(f'PurchaseOrderSerializer invalid: {ser.errors}')
        po = ser.save(organization=org)
        po.refresh_from_db()
        self._check_truthy('PurchaseOrder.po_number', po.po_number)
        self._check('PurchaseOrder.supplier_id', po.supplier_id, supplier.id)
        self._check('PurchaseOrder.status', po.status, 'draft')
        # Advance draft → sent → confirmed so balance counts the PO
        from api import services as api_services
        for st in ('sent', 'confirmed'):
            ok, err, po = api_services.apply_po_status_update(po, new_status=st)
            if not ok:
                raise AssertionError(f'PO transition to {st} failed: {err}')
        po.refresh_from_db()
        self._check('PurchaseOrder.status', po.status, 'confirmed')
        self._check('PurchaseOrder.order_date', po.order_date, date(2026, 7, 10))
        # 2*10 + 3*5 = 35
        self._check('PurchaseOrder.total_amount', Decimal(po.total_amount), Decimal('35.00'))
        items = list(PurchaseOrderItem.objects.filter(purchase_order=po).order_by('product_name'))
        self._check('PurchaseOrderItem.count', len(items), 2)
        if len(items) == 2:
            by_name = {i.product_name: i for i in items}
            self._check('PurchaseOrderItem.Widget.total_cost', Decimal(by_name['Widget'].total_cost), Decimal('20.00'))
            self._check('PurchaseOrderItem.Gadget.quantity', by_name['Gadget'].quantity, 3)
            self._check('PurchaseOrderItem.organization', by_name['Widget'].organization_id, org.id)

        supplier.refresh_from_db()
        self._check('Supplier.total_purchased_after_po', Decimal(supplier.total_purchased), Decimal('35.00'))
        return po

    def _scan_payment(self, org, supplier: Supplier, po: PurchaseOrder):
        self.stdout.write('\n[SupplierPayment]')
        payment = self._create(SupplierPaymentSerializer, {
            'supplier': str(supplier.id),
            'purchase_order': str(po.id),
            'amount': '20.00',
            'amount_paid': '20.00',
            'currency': 'USD',
            'payment_method': 'bank_transfer',
            'payment_date': '2026-07-12',
            'status': 'fully_paid',
            'notes': 'pay note',
        }, org)
        payment.refresh_from_db()
        self._check_truthy('SupplierPayment.payment_number', payment.payment_number)
        self._check('SupplierPayment.amount', Decimal(payment.amount), Decimal('20.00'))
        self._check('SupplierPayment.purchase_order_id', payment.purchase_order_id, po.id)
        self._check('SupplierPayment.payment_date', payment.payment_date, date(2026, 7, 12))
        supplier.refresh_from_db()
        self._check('Supplier.total_paid_after_payment', Decimal(supplier.total_paid), Decimal('20.00'))

    def _scan_adjustment(self, org, supplier: Supplier):
        self.stdout.write('\n[SupplierAdjustment]')
        adj = self._create(SupplierAdjustmentSerializer, {
            'supplier': str(supplier.id),
            'date': '2026-07-13',
            'type': 'credit',
            'amount': '5.00',
            'currency': 'USD',
            'reason': 'scan credit',
        }, org)
        adj.refresh_from_db()
        self._check('SupplierAdjustment.type', adj.type, 'credit')
        self._check('SupplierAdjustment.amount', Decimal(adj.amount), Decimal('5.00'))
        self._check('SupplierAdjustment.reason', adj.reason, 'scan credit')

    def _scan_document(self, org, supplier: Supplier):
        self.stdout.write('\n[SupplierDocument]')
        doc = self._create(SupplierDocumentSerializer, {
            'supplier': str(supplier.id),
            'document_type': 'invoice',
            'document_number': 'INV-SCAN-1',
            'document_date': '2026-07-10',
            'file_name': 'scan.png',
            'file_type': 'image/png',
            'file_size': len(_PNG_BYTES),
            'file_data_url': _PNG_DATA_URL,
            'notes': 'doc note',
        }, org)
        doc.refresh_from_db()
        self._check('SupplierDocument.document_number', doc.document_number, 'INV-SCAN-1')
        self._check('SupplierDocument.file_type', doc.file_type, 'image/png')
        self._check('SupplierDocument.file_size', doc.file_size, len(_PNG_BYTES))
        self._check_truthy('SupplierDocument.file_data_url', doc.file_data_url)

    def _scan_communication(self, org, supplier: Supplier):
        self.stdout.write('\n[SupplierCommunication]')
        comm = self._create(SupplierCommunicationSerializer, {
            'supplier': str(supplier.id),
            'date': '2026-07-11',
            'type': 'phone_call',
            'summary': 'Called about PO',
            'follow_up_required': False,
        }, org)
        comm.refresh_from_db()
        self._check('SupplierCommunication.summary', comm.summary, 'Called about PO')
        self._check('SupplierCommunication.type', comm.type, 'phone_call')
        self._check('SupplierCommunication.date', comm.date, date(2026, 7, 11))

    def _scan_task(self, org, supplier: Supplier, po: PurchaseOrder):
        self.stdout.write('\n[SupplierTask]')
        task = self._create(SupplierTaskSerializer, {
            'supplier': str(supplier.id),
            'purchase_order': str(po.id),
            'title': 'Follow up',
            'description': 'Call supplier',
            'due_date': '2026-07-20',
            'priority': 'high',
            'status': 'pending',
        }, org)
        task.refresh_from_db()
        self._check('SupplierTask.title', task.title, 'Follow up')
        self._check('SupplierTask.priority', task.priority, 'high')
        self._check('SupplierTask.due_date', task.due_date, date(2026, 7, 20))
        self._check('SupplierTask.supplier_id', task.supplier_id, supplier.id)

    def _scan_rating(self, org, supplier: Supplier):
        self.stdout.write('\n[SupplierRating upsert]')
        # Mimic view: accept `supplier` key (as mapToApi sends)
        request_data = {
            'supplier': str(supplier.id),
            'quality': 8,
            'communication': 7,
            'delivery_speed': 9,
            'reliability': 8,
            'pricing': 6,
            'flexibility': 7,
            'note': 'scan rating',
        }
        supplier_id = request_data.get('supplier') or request_data.get('supplier_id')
        self._check_truthy('Rating.upsert.supplier_key', supplier_id)
        rating, _ = SupplierRating.objects.get_or_create(
            supplier=supplier,
            organization=org,
            defaults={
                'quality': 0, 'communication': 0, 'delivery_speed': 0,
                'reliability': 0, 'pricing': 0, 'flexibility': 0, 'overall': 0,
            },
        )
        ser = SupplierRatingSerializer(rating, data=request_data, partial=True)
        if not ser.is_valid():
            raise AssertionError(f'SupplierRatingSerializer invalid: {ser.errors}')
        ser.save()
        rating.refresh_from_db()
        self._check('SupplierRating.quality', rating.quality, 8)
        self._check('SupplierRating.note', rating.note, 'scan rating')
        expected_overall = Decimal(str(sum([8, 7, 9, 8, 6, 7]) / 6))
        self._check('SupplierRating.overall', Decimal(rating.overall), expected_overall)

    def _scan_currency(self, org):
        self.stdout.write('\n[Currency]')
        # seed may already create DZD; create a scan-specific code
        cur = self._create(CurrencySerializer, {
            'code': 'TST',
            'name': 'Test Coin',
            'name_fr': 'Pièce test',
            'symbol': 'T',
            'rate_to_base': '2.500000',
            'is_base': False,
            'is_enabled': True,
            'is_default': False,
        }, org)
        cur.refresh_from_db()
        self._check('Currency.code', cur.code, 'TST')
        self._check('Currency.rate_to_base', Decimal(cur.rate_to_base), Decimal('2.500000'))

    def _scan_conversion(self, org):
        self.stdout.write('\n[ConversionRecord]')
        rec = self._create(ConversionRecordSerializer, {
            'from_code': 'USD',
            'to_code': 'DZD',
            'from_amount': '10.00',
            'to_amount': '2350.00',
            'rate': '235.000000',
        }, org)
        rec.refresh_from_db()
        self._check('ConversionRecord.from_code', rec.from_code, 'USD')
        self._check('ConversionRecord.to_amount', Decimal(rec.to_amount), Decimal('2350.00'))

    def _scan_calculator(self, org):
        self.stdout.write('\n[CalculatorRecord]')
        rec = self._create(CalculatorRecordSerializer, {
            'type': 'basic',
            'label': 'Scan calc',
            'inputs': {'a': 1, 'b': 2},
            'result': '3.00',
            'currency': 'DZD',
        }, org)
        rec.refresh_from_db()
        self._check('CalculatorRecord.label', rec.label, 'Scan calc')
        self._check('CalculatorRecord.result', Decimal(rec.result), Decimal('3.00'))
        self._check('CalculatorRecord.inputs', rec.inputs, {'a': 1, 'b': 2})

    def _scan_templates(self, org):
        self.stdout.write('\n[Templates]')
        tmpl = self._create(DocumentTemplateSerializer, {
            'name': 'Scan Template',
            'type': 'general',
            'content': 'Hello {{name}}',
            'is_default': False,
        }, org)
        tmpl.refresh_from_db()
        self._check('DocumentTemplate.name', tmpl.name, 'Scan Template')
        self._check('DocumentTemplate.content', tmpl.content, 'Hello {{name}}')

        st = self._create(SupplierDocumentTemplateSerializer, {
            'template_name': 'PO letter',
            'template_body': 'Dear supplier',
        }, org)
        st.refresh_from_db()
        self._check('SupplierDocumentTemplate.template_name', st.template_name, 'PO letter')

    def _scan_notification(self, org):
        self.stdout.write('\n[Notification]')
        now = timezone.now()
        notif = self._create(NotificationSerializer, {
            'type': 'system',
            'title_ar': 'مسح',
            'title_fr': 'Scan',
            'message_ar': 'رسالة',
            'message_fr': 'Message',
            'read': False,
            'timestamp': now.isoformat(),
            'related_id': '',
        }, org)
        notif.refresh_from_db()
        self._check('Notification.read', notif.read, False)
        self._check('Notification.title_ar', notif.title_ar, 'مسح')
        notif.read = True
        notif.save(update_fields=['read', 'updated_at'])
        notif.refresh_from_db()
        self._check('Notification.mark_read', notif.read, True)
