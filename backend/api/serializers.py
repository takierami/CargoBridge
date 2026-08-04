import base64
import binascii
from datetime import date, datetime
from decimal import Decimal

from django.utils.dateparse import parse_date, parse_datetime
from rest_framework import serializers

from .mixins import OrgScopedSerializerMixin
from .models import (
    Agent,
    AgentTaxRule,
    CalculatorRecord,
    ConversionRecord,
    Currency,
    DocumentTemplate,
    Goods,
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


def _normalize_date_value(value):
    """Accept date, datetime, or ISO strings; return a date or None."""
    if value is None or value == '':
        return None
    if isinstance(value, datetime):
        return value.date()
    if isinstance(value, date):
        return value
    if isinstance(value, str):
        parsed_dt = parse_datetime(value)
        if parsed_dt is not None:
            return parsed_dt.date()
        parsed = parse_date(value[:10] if len(value) >= 10 else value)
        if parsed is not None:
            return parsed
        raise serializers.ValidationError('Invalid date format.')
    raise serializers.ValidationError('Invalid date value.')


class AgentSerializer(serializers.ModelSerializer):
    effective_tax_rate = serializers.SerializerMethodField()

    class Meta:
        model = Agent
        fields = '__all__'
        read_only_fields = [
            'id', 'organization', 'code', 'reliability_score', 'total_deliveries',
            'delayed_deliveries', 'is_deleted', 'deleted_by', 'deleted_at',
            'created_at', 'updated_at', 'effective_tax_rate',
        ]

    def get_effective_tax_rate(self, obj):
        from . import services
        return float(services.effective_agent_tax_rate(obj))

    def validate_phone(self, value):
        phone = (value or '').strip()
        if not phone:
            raise serializers.ValidationError('Phone is required.')
        if len(phone) < 6:
            raise serializers.ValidationError('Phone is too short.')
        return phone

    def validate_passport(self, value):
        passport = (value or '').strip()
        if not passport:
            raise serializers.ValidationError('Passport is required.')
        return passport

    def validate_passport_expiry(self, value):
        return _normalize_date_value(value)

    def validate_email(self, value):
        return (value or '').strip()

    def validate_website(self, value):
        return (value or '').strip()

    def validate(self, attrs):
        attrs = super().validate(attrs)
        request = self.context.get('request')
        org = None
        if self.instance is not None:
            org = self.instance.organization
        elif request is not None and getattr(request.user, 'is_authenticated', False):
            profile = getattr(request.user, 'profile', None)
            org = getattr(profile, 'organization', None)

        for key in (
            'name', 'name_fr', 'name_en', 'company_name', 'phone', 'phone_alt',
            'whatsapp', 'email', 'website', 'passport', 'national_id',
            'business_registration_number', 'tax_id', 'country', 'state_province',
            'city', 'postal_code', 'bank_name', 'bank_account', 'iban', 'swift',
        ):
            if key in attrs and isinstance(attrs[key], str):
                attrs[key] = attrs[key].strip()

        phone = attrs.get('phone', getattr(self.instance, 'phone', None))
        passport = attrs.get('passport', getattr(self.instance, 'passport', None))
        qs = Agent.objects.filter(is_deleted=False)
        if org is not None:
            qs = qs.filter(organization=org)
        if self.instance is not None:
            qs = qs.exclude(pk=self.instance.pk)

        errors = {}
        if phone and qs.filter(phone=phone).exists():
            errors['phone'] = 'An agent with this phone already exists.'
        if passport and qs.filter(passport=passport).exists():
            errors['passport'] = 'An agent with this passport already exists.'
        if errors:
            raise serializers.ValidationError(errors)
        return attrs


class AgentTaxRuleSerializer(serializers.ModelSerializer):
    class Meta:
        model = AgentTaxRule
        fields = '__all__'
        read_only_fields = ['id', 'organization', 'created_at', 'updated_at']


class GoodsSerializer(OrgScopedSerializerMixin, serializers.ModelSerializer):
    ORG_FK_FIELDS = {'agent': Agent}
    DATE_FIELDS = ('departure_date', 'expected_arrival_date', 'arrival_date')
    landed_cost = serializers.SerializerMethodField()

    class Meta:
        model = Goods
        fields = '__all__'
        read_only_fields = [
            'id', 'organization', 'tracking_number', 'status', 'customs_status',
            'is_deleted', 'deleted_by', 'deleted_at',
            'created_at', 'updated_at', 'landed_cost',
        ]

    def get_landed_cost(self, obj):
        from . import services
        return float(services.compute_landed_cost(obj))

    def to_internal_value(self, data):
        # Normalize ISO datetimes before DateField validation rejects them.
        mutable = data.copy() if hasattr(data, 'copy') else dict(data)
        for field in self.DATE_FIELDS:
            if field not in mutable or mutable[field] in (None, ''):
                continue
            try:
                normalized = _normalize_date_value(mutable[field])
            except serializers.ValidationError:
                continue
            mutable[field] = normalized.isoformat() if normalized else None
        return super().to_internal_value(mutable)

    def validate(self, attrs):
        attrs = super().validate(attrs)
        from .constants import GOODS_AGENT_REQUIRED_STATUSES, INCOTERM_CHOICES
        from . import services
        instance = self.instance
        if instance and instance.status in GOODS_AGENT_REQUIRED_STATUSES:
            if 'agent' in attrs and attrs['agent'] is None:
                raise serializers.ValidationError(
                    {'agent': 'Cannot clear agent while shipment is mid-flight.'}
                )
        incoterm = attrs.get('incoterm', getattr(instance, 'incoterm', '') if instance else '')
        if incoterm and incoterm not in INCOTERM_CHOICES:
            raise serializers.ValidationError({'incoterm': f'Must be one of: {", ".join(INCOTERM_CHOICES)}'})
        hs = attrs.get('hs_code', getattr(instance, 'hs_code', '') if instance else '')
        if hs and not services.validate_hs_code(hs):
            raise serializers.ValidationError(
                {'hs_code': 'Invalid HS code (use 6–10 digits or dotted form e.g. 8471.30).'}
            )
        # Auto-suggest duty when rate+value present and duty not explicitly set
        duty_rate = attrs.get('duty_rate', getattr(instance, 'duty_rate', None) if instance else None)
        value = attrs.get('value', getattr(instance, 'value', None) if instance else None)
        if duty_rate is not None and value is not None and 'duty_amount' not in attrs:
            suggested = (Decimal(value) * Decimal(duty_rate) / Decimal('100')).quantize(Decimal('0.01'))
            attrs['duty_amount'] = suggested
        return attrs

    def create(self, validated_data):
        validated_data['status'] = 'draft'
        return super().create(validated_data)


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = '__all__'
        read_only_fields = ['id', 'organization', 'created_at', 'updated_at']


class DocumentTemplateSerializer(serializers.ModelSerializer):
    class Meta:
        model = DocumentTemplate
        fields = '__all__'
        read_only_fields = ['id', 'organization', 'created_at', 'updated_at']


class SupplierDocumentTemplateSerializer(serializers.ModelSerializer):
    class Meta:
        model = SupplierDocumentTemplate
        fields = '__all__'
        read_only_fields = ['id', 'organization', 'system_key', 'created_at', 'updated_at']


class SupplierSerializer(serializers.ModelSerializer):
    class Meta:
        model = Supplier
        fields = '__all__'
        read_only_fields = [
            'id', 'organization', 'code', 'total_purchased', 'total_paid',
            'outstanding', 'balance_currency',
            'is_deleted', 'deleted_by', 'deleted_at',
            'created_at', 'updated_at',
        ]
        extra_kwargs = {
            'city': {'allow_blank': True, 'required': False},
            'primary_contact': {'allow_blank': True, 'required': False},
            'country': {'allow_blank': True, 'required': False},
            'website': {'allow_blank': True, 'required': False},
            'email': {'allow_blank': True, 'required': False},
        }

    def to_internal_value(self, data):
        mutable = data.copy() if hasattr(data, 'copy') else dict(data)
        if 'website' in mutable:
            mutable['website'] = self._normalize_website(mutable.get('website'))
        return super().to_internal_value(mutable)

    @staticmethod
    def _normalize_website(value):
        if value is None:
            return ''
        value = str(value).strip()
        if not value:
            return ''
        if '://' not in value:
            value = f'https://{value}'
        return value

    def validate_website(self, value):
        return self._normalize_website(value)


class SupplierProductSerializer(OrgScopedSerializerMixin, serializers.ModelSerializer):
    ORG_FK_FIELDS = {'supplier': Supplier}

    class Meta:
        model = SupplierProduct
        fields = '__all__'
        read_only_fields = ['id', 'organization', 'created_at', 'updated_at']


class SupplierCategoryEntitySerializer(serializers.ModelSerializer):
    class Meta:
        model = SupplierCategoryEntity
        fields = '__all__'
        read_only_fields = ['id', 'organization', 'created_at', 'updated_at']


class PurchaseOrderItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = PurchaseOrderItem
        fields = '__all__'
        read_only_fields = [
            'id', 'organization', 'purchase_order', 'total_cost',
            'created_at', 'updated_at',
        ]


class PurchaseOrderSerializer(OrgScopedSerializerMixin, serializers.ModelSerializer):
    items = PurchaseOrderItemSerializer(many=True, required=False)
    ORG_FK_FIELDS = {'supplier': Supplier, 'linked_shipment': Goods}

    class Meta:
        model = PurchaseOrder
        fields = '__all__'
        read_only_fields = [
            'id', 'organization', 'po_number', 'total_amount', 'status',
            'fx_rate_to_base', 'created_by', 'deleted_by', 'deleted_at',
            'created_at', 'updated_at',
        ]

    PO_ITEM_EDITABLE_STATUSES = frozenset({'draft', 'sent'})

    def create(self, validated_data):
        from django.db import transaction

        items_data = validated_data.pop('items', [])
        org = validated_data['organization']
        from . import services

        request = self.context.get('request')
        user = None
        if request and getattr(request.user, 'is_authenticated', False):
            user = request.user
            validated_data.setdefault('created_by', user)

        # status is read-only on the field; requested target comes from raw input
        requested_status = None
        if hasattr(self, 'initial_data'):
            requested_status = self.initial_data.get('status')

        validated_data['status'] = 'draft'
        validated_data['po_number'] = services.next_sequence(org, 'po', 'PO')
        currency = validated_data.get('currency', 'USD')
        try:
            validated_data['fx_rate_to_base'] = services.snapshot_fx_rate(org, currency)
        except services.MissingFxRateError as exc:
            raise serializers.ValidationError({'currency': str(exc)})

        with transaction.atomic():
            po = PurchaseOrder.objects.create(**validated_data)
            for item in items_data:
                qty = item.get('quantity', 1)
                unit = item.get('unit_cost', 0)
                PurchaseOrderItem.objects.create(
                    organization=org,
                    purchase_order=po,
                    product_name=item['product_name'],
                    quantity=qty,
                    unit_cost=unit,
                    total_cost=qty * unit,
                )
            services.recalculate_po_total(po)
            services.record_money_audit(
                organization=org,
                entity_type='purchase_order',
                entity_id=po.id,
                action='create',
                user=validated_data.get('created_by'),
                after={
                    'po_number': po.po_number,
                    'total_amount': str(po.total_amount),
                    'currency': po.currency,
                },
            )
            services.sync_linked_shipment_costs(po)
            po = services.advance_po_along_path(po, requested_status, user=user)
        return po

    def update(self, instance, validated_data):
        from django.db import transaction

        items_data = validated_data.pop('items', None)
        validated_data.pop('status', None)
        validated_data.pop('fx_rate_to_base', None)
        if 'currency' in validated_data and validated_data['currency'] != instance.currency:
            raise serializers.ValidationError(
                {'currency': 'Currency is immutable after create. Soft-delete and recreate the PO.'}
            )
        if items_data is not None and instance.status not in self.PO_ITEM_EDITABLE_STATUSES:
            raise serializers.ValidationError(
                {
                    'items': (
                        f'PO items are frozen after status leaves draft/sent '
                        f'(current: {instance.status}).'
                    )
                }
            )

        with transaction.atomic():
            for attr, value in validated_data.items():
                setattr(instance, attr, value)
            instance.save()
            if items_data is not None:
                instance.items.all().delete()
                for item in items_data:
                    qty = item.get('quantity', 1)
                    unit = item.get('unit_cost', 0)
                    PurchaseOrderItem.objects.create(
                        organization=instance.organization,
                        purchase_order=instance,
                        product_name=item['product_name'],
                        quantity=qty,
                        unit_cost=unit,
                        total_cost=qty * unit,
                    )
                from . import services
                services.recalculate_po_total(instance)
                services.sync_linked_shipment_costs(instance)
        return instance


class PriceHistoryEntrySerializer(OrgScopedSerializerMixin, serializers.ModelSerializer):
    ORG_FK_FIELDS = {'supplier': Supplier, 'source_po': PurchaseOrder}

    class Meta:
        model = PriceHistoryEntry
        fields = '__all__'
        read_only_fields = ['id', 'organization', 'created_at', 'updated_at']


class SupplierPaymentSerializer(OrgScopedSerializerMixin, serializers.ModelSerializer):
    ORG_FK_FIELDS = {'supplier': Supplier, 'purchase_order': PurchaseOrder}

    class Meta:
        model = SupplierPayment
        fields = '__all__'
        read_only_fields = [
            'id', 'organization', 'payment_number',
            'fx_rate_to_base', 'created_by', 'deleted_by', 'deleted_at',
            'created_at', 'updated_at',
        ]

    def validate(self, attrs):
        attrs = super().validate(attrs)
        amount = attrs.get('amount', getattr(self.instance, 'amount', None))
        amount_paid = attrs.get(
            'amount_paid',
            getattr(self.instance, 'amount_paid', Decimal('0')) if self.instance else Decimal('0'),
        )
        if amount is None:
            return attrs
        amount = Decimal(amount)
        amount_paid = Decimal(amount_paid)
        if amount_paid < 0:
            raise serializers.ValidationError({'amount_paid': 'amount_paid cannot be negative.'})
        if amount_paid > amount:
            raise serializers.ValidationError(
                {'amount_paid': 'amount_paid cannot exceed amount.'}
            )
        return attrs

    def create(self, validated_data):
        from django.db import transaction

        org = validated_data['organization']
        from . import services
        request = self.context.get('request')
        if request and getattr(request.user, 'is_authenticated', False):
            validated_data.setdefault('created_by', request.user)
        # Recording a payment with amount_paid=0 would not credit كشف حساب; default to full amount.
        amount = Decimal(validated_data.get('amount') or 0)
        amount_paid = Decimal(validated_data.get('amount_paid') or 0)
        if amount_paid == 0 and amount > 0:
            validated_data['amount_paid'] = amount
        validated_data['payment_number'] = services.next_sequence(org, 'payment', 'PAY')
        try:
            validated_data['fx_rate_to_base'] = services.snapshot_fx_rate(
                org, validated_data.get('currency', 'USD')
            )
        except services.MissingFxRateError as exc:
            raise serializers.ValidationError({'currency': str(exc)})
        with transaction.atomic():
            payment = super().create(validated_data)
            services.record_money_audit(
                organization=org,
                entity_type='payment',
                entity_id=payment.id,
                action='create',
                user=validated_data.get('created_by'),
                after={
                    'amount': str(payment.amount),
                    'amount_paid': str(payment.amount_paid),
                    'currency': payment.currency,
                },
            )
        return payment

    def update(self, instance, validated_data):
        from django.db import transaction

        # Amount/currency immutable — correct via soft-delete + new payment
        for field in ('amount', 'currency', 'fx_rate_to_base'):
            if field in validated_data and validated_data[field] != getattr(instance, field):
                raise serializers.ValidationError(
                    {field: 'Immutable after create. Soft-delete and create a correcting payment.'}
                )
        old_paid = instance.amount_paid
        with transaction.atomic():
            payment = super().update(instance, validated_data)
            if 'amount_paid' in validated_data and validated_data['amount_paid'] != old_paid:
                from . import services
                request = self.context.get('request')
                services.record_money_audit(
                    organization=payment.organization,
                    entity_type='payment',
                    entity_id=payment.id,
                    action='amount_paid_update',
                    user=request.user if request else None,
                    before={'amount_paid': str(old_paid)},
                    after={'amount_paid': str(payment.amount_paid)},
                )
        return payment


class SupplierAdjustmentSerializer(OrgScopedSerializerMixin, serializers.ModelSerializer):
    ORG_FK_FIELDS = {'supplier': Supplier}

    class Meta:
        model = SupplierAdjustment
        fields = '__all__'
        read_only_fields = [
            'id', 'organization',
            'fx_rate_to_base', 'created_by', 'deleted_by', 'deleted_at',
            'created_at', 'updated_at',
        ]

    def create(self, validated_data):
        from django.db import transaction
        from . import services
        request = self.context.get('request')
        if request and getattr(request.user, 'is_authenticated', False):
            validated_data.setdefault('created_by', request.user)
        org = validated_data['organization']
        try:
            validated_data['fx_rate_to_base'] = services.snapshot_fx_rate(
                org, validated_data.get('currency', 'USD')
            )
        except services.MissingFxRateError as exc:
            raise serializers.ValidationError({'currency': str(exc)})
        with transaction.atomic():
            adj = super().create(validated_data)
            services.record_money_audit(
                organization=org,
                entity_type='adjustment',
                entity_id=adj.id,
                action='create',
                user=validated_data.get('created_by'),
                after={'amount': str(adj.amount), 'type': adj.type, 'currency': adj.currency},
            )
        return adj

    def update(self, instance, validated_data):
        for field in ('amount', 'currency', 'type', 'fx_rate_to_base'):
            if field in validated_data and validated_data[field] != getattr(instance, field):
                raise serializers.ValidationError(
                    {field: 'Immutable after create. Soft-delete and create a correcting adjustment.'}
                )
        return super().update(instance, validated_data)


class SupplierDocumentSerializer(OrgScopedSerializerMixin, serializers.ModelSerializer):
    ORG_FK_FIELDS = {'supplier': Supplier}
    MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024
    ALLOWED_FILE_TYPES = {
        'application/pdf',
        'image/jpeg',
        'image/png',
        'image/webp',
    }

    class Meta:
        model = SupplierDocument
        fields = '__all__'
        read_only_fields = [
            'id', 'organization', 'uploaded_at',
            'is_deleted', 'deleted_by', 'deleted_at',
            'created_at', 'updated_at',
        ]

    def validate(self, attrs):
        attrs = super().validate(attrs)
        file_type = attrs.get('file_type', getattr(self.instance, 'file_type', ''))
        file_size = attrs.get('file_size', getattr(self.instance, 'file_size', 0))
        file_data_url = attrs.get('file_data_url', getattr(self.instance, 'file_data_url', ''))

        if file_type not in self.ALLOWED_FILE_TYPES:
            raise serializers.ValidationError(
                {'file_type': 'Only PDF, JPEG, PNG, and WebP files are allowed.'}
            )
        if file_size <= 0 or file_size > self.MAX_FILE_SIZE_BYTES:
            raise serializers.ValidationError(
                {'file_size': 'File size must be between 1 byte and 10 MB.'}
            )
        expected_prefix = f'data:{file_type};base64,'
        if file_data_url and not file_data_url.startswith(expected_prefix):
            raise serializers.ValidationError(
                {'file_data_url': 'File payload type does not match file_type.'}
            )
        if file_data_url:
            payload = file_data_url[len(expected_prefix):]
            try:
                decoded = base64.b64decode(payload, validate=True)
            except (binascii.Error, ValueError):
                raise serializers.ValidationError({'file_data_url': 'Invalid base64 file payload.'})
            if len(decoded) != file_size:
                raise serializers.ValidationError(
                    {'file_size': 'Declared file size does not match uploaded payload.'}
                )
        return attrs


class SupplierCommunicationSerializer(OrgScopedSerializerMixin, serializers.ModelSerializer):
    ORG_FK_FIELDS = {'supplier': Supplier}

    class Meta:
        model = SupplierCommunication
        fields = '__all__'
        read_only_fields = ['id', 'organization', 'created_at', 'updated_at']


class SupplierTaskSerializer(OrgScopedSerializerMixin, serializers.ModelSerializer):
    ORG_FK_FIELDS = {
        'supplier': Supplier,
        'purchase_order': PurchaseOrder,
        'payment': SupplierPayment,
    }

    class Meta:
        model = SupplierTask
        fields = '__all__'
        read_only_fields = ['id', 'organization', 'created_at', 'updated_at']


class SupplierRatingSerializer(OrgScopedSerializerMixin, serializers.ModelSerializer):
    ORG_FK_FIELDS = {'supplier': Supplier}

    class Meta:
        model = SupplierRating
        fields = '__all__'
        read_only_fields = ['id', 'organization', 'overall', 'rated_at', 'created_at', 'updated_at']

    def create(self, validated_data):
        scores = [
            validated_data.get('quality', 0),
            validated_data.get('communication', 0),
            validated_data.get('delivery_speed', 0),
            validated_data.get('reliability', 0),
            validated_data.get('pricing', 0),
            validated_data.get('flexibility', 0),
        ]
        validated_data['overall'] = sum(scores) / len(scores)
        return super().create(validated_data)

    def update(self, instance, validated_data):
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        scores = [
            instance.quality, instance.communication, instance.delivery_speed,
            instance.reliability, instance.pricing, instance.flexibility,
        ]
        instance.overall = sum(scores) / len(scores)
        instance.save()
        return instance


class CurrencySerializer(serializers.ModelSerializer):
    class Meta:
        model = Currency
        fields = '__all__'
        read_only_fields = ['id', 'organization', 'created_at', 'updated_at']

    def validate(self, attrs):
        attrs = super().validate(attrs)
        is_base = attrs.get('is_base', getattr(self.instance, 'is_base', False))
        rate = attrs.get('rate_to_base', getattr(self.instance, 'rate_to_base', None))
        if is_base and rate is not None and rate != 1:
            raise serializers.ValidationError({'rate_to_base': 'Base currency must have rate 1.'})
        if attrs.get('is_base') and self.instance and self.instance.is_base is False:
            org = self.instance.organization
            Currency.objects.filter(organization=org, is_base=True).exclude(pk=self.instance.pk).update(is_base=False)
        return attrs


class ConversionRecordSerializer(serializers.ModelSerializer):
    class Meta:
        model = ConversionRecord
        fields = '__all__'
        read_only_fields = ['id', 'organization', 'timestamp', 'created_at', 'updated_at']


class CalculatorRecordSerializer(serializers.ModelSerializer):
    class Meta:
        model = CalculatorRecord
        fields = '__all__'
        read_only_fields = ['id', 'organization', 'timestamp', 'created_at', 'updated_at']
