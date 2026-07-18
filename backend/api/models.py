import uuid

from django.db import models


class OrgModel(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    organization = models.ForeignKey(
        'accounts.Organization',
        on_delete=models.CASCADE,
        related_name='%(class)s_set',
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True


class SequenceCounter(models.Model):
    organization = models.ForeignKey('accounts.Organization', on_delete=models.CASCADE)
    key = models.CharField(max_length=64)
    year = models.IntegerField(null=True, blank=True)
    count = models.IntegerField(default=0)

    class Meta:
        unique_together = ('organization', 'key', 'year')


class Agent(OrgModel):
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('traveling', 'Traveling'),
        ('delivered', 'Delivered'),
        ('delayed', 'Delayed'),
        ('inactive', 'Inactive'),
    ]

    name = models.CharField(max_length=255)
    name_fr = models.CharField(max_length=255, blank=True, default='')
    phone = models.CharField(max_length=64)
    passport = models.CharField(max_length=64)
    country = models.CharField(max_length=128)
    status = models.CharField(max_length=32, choices=STATUS_CHOICES, default='active')
    reliability_score = models.IntegerField(default=0)
    total_deliveries = models.IntegerField(default=0)
    delayed_deliveries = models.IntegerField(default=0)
    last_active = models.DateTimeField(null=True, blank=True)
    notes = models.TextField(blank=True, default='')

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=['organization', 'passport'],
                name='uniq_agent_org_passport',
            ),
            models.UniqueConstraint(
                fields=['organization', 'phone'],
                name='uniq_agent_org_phone',
            ),
        ]

class Goods(OrgModel):
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('assigned', 'Assigned'),
        ('ready_for_departure', 'Ready'),
        ('in_transit', 'In Transit'),
        ('arrived', 'Arrived'),
        ('warehouse', 'Warehouse'),
        ('delivered', 'Delivered'),
        ('delayed', 'Delayed'),
        ('cancelled', 'Cancelled'),
    ]
    PRIORITY_CHOICES = [('low', 'Low'), ('medium', 'Medium'), ('high', 'High')]
    TRANSPORT_CHOICES = [
        ('air', 'Air'),
        ('sea', 'Sea'),
        ('land', 'Land'),
        ('express', 'Express'),
        ('other', 'Other'),
    ]

    tracking_number = models.CharField(max_length=64)
    description = models.TextField()
    description_fr = models.TextField(blank=True, default='')
    category = models.CharField(max_length=128)
    quantity = models.IntegerField(default=1)
    weight = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    agent = models.ForeignKey(Agent, null=True, blank=True, on_delete=models.SET_NULL)
    status = models.CharField(max_length=32, choices=STATUS_CHOICES, default='draft')
    priority = models.CharField(max_length=16, choices=PRIORITY_CHOICES, default='medium')
    departure_date = models.DateField(null=True, blank=True)
    expected_arrival_date = models.DateField(null=True, blank=True)
    arrival_date = models.DateField(null=True, blank=True)
    transport_type = models.CharField(max_length=16, choices=TRANSPORT_CHOICES, blank=True, default='')
    notes = models.TextField(blank=True, default='')
    notes_fr = models.TextField(blank=True, default='')
    photos = models.JSONField(default=list, blank=True)
    value = models.DecimalField(max_digits=14, decimal_places=2, null=True, blank=True)
    value_currency = models.CharField(max_length=8, default='USD')
    hs_code = models.CharField(max_length=32, blank=True, default='')
    incoterm = models.CharField(max_length=8, blank=True, default='')
    freight_cost = models.DecimalField(max_digits=14, decimal_places=2, null=True, blank=True)
    insurance_cost = models.DecimalField(max_digits=14, decimal_places=2, null=True, blank=True)
    duty_amount = models.DecimalField(max_digits=14, decimal_places=2, null=True, blank=True)
    CUSTOMS_STATUS_CHOICES = [
        ('not_started', 'Not started'),
        ('pending', 'Pending clearance'),
        ('held', 'Held'),
        ('cleared', 'Cleared'),
    ]
    customs_status = models.CharField(
        max_length=16,
        choices=CUSTOMS_STATUS_CHOICES,
        default='not_started',
    )
    duty_rate = models.DecimalField(
        max_digits=8,
        decimal_places=4,
        null=True,
        blank=True,
        help_text='Percent duty rate used to suggest duty_amount from goods value.',
    )
    is_deleted = models.BooleanField(default=False)
    deleted_by = models.ForeignKey(
        'auth.User',
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='deleted_goods',
    )
    deleted_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        verbose_name_plural = 'goods'
        unique_together = ('organization', 'tracking_number')


class GoodsQrCode(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    organization = models.ForeignKey(
        'accounts.Organization',
        on_delete=models.CASCADE,
        related_name='goods_qr_codes',
    )
    goods = models.OneToOneField(Goods, on_delete=models.CASCADE, related_name='qr_code')
    token = models.UUIDField(default=uuid.uuid4, unique=True, db_index=True, editable=False)
    created_by = models.ForeignKey(
        'auth.User',
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='created_goods_qr_codes',
    )
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [
            models.Index(fields=['token']),
        ]


class GoodsTrackingEvent(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    organization = models.ForeignKey(
        'accounts.Organization',
        on_delete=models.CASCADE,
        related_name='goods_tracking_events',
    )
    goods = models.ForeignKey(Goods, on_delete=models.CASCADE, related_name='tracking_events')
    from_status = models.CharField(max_length=32, blank=True, default='')
    to_status = models.CharField(max_length=32)
    user = models.ForeignKey(
        'auth.User',
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='goods_tracking_events',
    )
    office = models.CharField(max_length=128, blank=True, default='')
    notes = models.TextField(blank=True, default='')
    photos = models.JSONField(default=list, blank=True)
    latitude = models.DecimalField(max_digits=10, decimal_places=7, null=True, blank=True)
    longitude = models.DecimalField(max_digits=10, decimal_places=7, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at']
        indexes = [
            models.Index(fields=['goods', 'created_at']),
        ]


class GoodsCustomsEvent(models.Model):
    """Append-only customs clearance audit."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    organization = models.ForeignKey(
        'accounts.Organization',
        on_delete=models.CASCADE,
        related_name='goods_customs_events',
    )
    goods = models.ForeignKey(Goods, on_delete=models.CASCADE, related_name='customs_events')
    from_status = models.CharField(max_length=16, blank=True, default='')
    to_status = models.CharField(max_length=16)
    user = models.ForeignKey(
        'auth.User',
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='goods_customs_events',
    )
    notes = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at']


class GoodsScanLog(models.Model):
    ACTION_CHOICES = [
        ('view', 'View'),
        ('status_update', 'Status Update'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    organization = models.ForeignKey(
        'accounts.Organization',
        on_delete=models.CASCADE,
        related_name='goods_scan_logs',
    )
    goods = models.ForeignKey(Goods, on_delete=models.CASCADE, related_name='scan_logs')
    qr = models.ForeignKey(
        GoodsQrCode,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='scan_logs',
    )
    user = models.ForeignKey(
        'auth.User',
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='goods_scan_logs',
    )
    action = models.CharField(max_length=32, choices=ACTION_CHOICES)
    device = models.CharField(max_length=255, blank=True, default='')
    from_status = models.CharField(max_length=32, blank=True, default='')
    to_status = models.CharField(max_length=32, blank=True, default='')
    notes = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['goods', 'created_at']),
        ]


class Notification(OrgModel):
    TYPE_CHOICES = [
        ('goods', 'Goods'),
        ('agent', 'Agent'),
        ('chat', 'Chat'),
        ('system', 'System'),
    ]

    type = models.CharField(max_length=16, choices=TYPE_CHOICES)
    title_ar = models.CharField(max_length=255)
    title_fr = models.CharField(max_length=255)
    message_ar = models.TextField()
    message_fr = models.TextField()
    read = models.BooleanField(default=False)
    timestamp = models.DateTimeField()
    related_id = models.CharField(max_length=64, blank=True, default='')


class DocumentTemplate(OrgModel):
    TYPE_CHOICES = [
        ('reception', 'Reception'),
        ('delivery', 'Delivery'),
        ('general', 'General'),
    ]

    name = models.CharField(max_length=255)
    type = models.CharField(max_length=16, choices=TYPE_CHOICES)
    content = models.TextField()
    is_default = models.BooleanField(default=False)


class SupplierDocumentTemplate(OrgModel):
    template_name = models.CharField(max_length=255)
    template_body = models.TextField()


class Supplier(OrgModel):
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('inactive', 'Inactive'),
        ('suspended', 'Suspended'),
        ('blacklisted', 'Blacklisted'),
    ]

    code = models.CharField(max_length=32)
    name = models.CharField(max_length=255)
    name_fr = models.CharField(max_length=255, blank=True, default='')
    country = models.CharField(max_length=128)
    city = models.CharField(max_length=128, blank=True, default='')
    address = models.TextField(blank=True, default='')
    phones = models.JSONField(default=list, blank=True)
    email = models.EmailField(blank=True, default='')
    whatsapp = models.CharField(max_length=64, blank=True, default='')
    wechat = models.CharField(max_length=64, blank=True, default='')
    website = models.URLField(blank=True, default='')
    primary_contact = models.CharField(max_length=255, blank=True, default='')
    secondary_contact = models.CharField(max_length=255, blank=True, default='')
    categories = models.JSONField(default=list, blank=True)
    payment_preferences = models.TextField(blank=True, default='')
    preferred_currency = models.CharField(max_length=8, default='USD')
    lead_time_days = models.IntegerField(default=0)
    minimum_order_qty = models.IntegerField(default=0)
    business_notes = models.TextField(blank=True, default='')
    status = models.CharField(max_length=16, choices=STATUS_CHOICES, default='active')
    total_purchased = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    total_paid = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    outstanding = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    balance_currency = models.CharField(max_length=8, default='USD')
    is_deleted = models.BooleanField(default=False)
    deleted_by = models.ForeignKey(
        'auth.User',
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='deleted_suppliers',
    )
    deleted_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        unique_together = ('organization', 'code')


class SupplierProduct(OrgModel):
    supplier = models.ForeignKey(Supplier, on_delete=models.CASCADE, related_name='products')
    name = models.CharField(max_length=255)
    category = models.CharField(max_length=128)
    sku = models.CharField(max_length=64, blank=True, default='')
    unit_cost = models.DecimalField(max_digits=14, decimal_places=2)
    currency = models.CharField(max_length=8, default='USD')
    notes = models.TextField(blank=True, default='')


class SupplierCategoryEntity(OrgModel):
    name = models.CharField(max_length=128)
    name_fr = models.CharField(max_length=128)
    is_editable = models.BooleanField(default=True)


class PurchaseOrder(OrgModel):
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('sent', 'Sent'),
        ('confirmed', 'Confirmed'),
        ('in_production', 'In Production'),
        ('ready', 'Ready'),
        ('shipped', 'Shipped'),
        ('received', 'Received'),
        ('cancelled', 'Cancelled'),
    ]

    po_number = models.CharField(max_length=32)
    supplier = models.ForeignKey(Supplier, on_delete=models.CASCADE, related_name='purchase_orders')
    order_date = models.DateField()
    expected_completion_date = models.DateField(null=True, blank=True)
    received_date = models.DateField(null=True, blank=True)
    currency = models.CharField(max_length=8, default='USD')
    fx_rate_to_base = models.DecimalField(
        max_digits=14,
        decimal_places=6,
        null=True,
        blank=True,
        help_text='Snapshot of currency→base rate at create time.',
    )
    status = models.CharField(max_length=32, choices=STATUS_CHOICES, default='draft')
    notes = models.TextField(blank=True, default='')
    linked_shipment = models.ForeignKey(Goods, null=True, blank=True, on_delete=models.SET_NULL)
    total_amount = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    is_deleted = models.BooleanField(default=False)
    created_by = models.ForeignKey(
        'auth.User',
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='created_purchase_orders',
    )
    deleted_by = models.ForeignKey(
        'auth.User',
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='deleted_purchase_orders',
    )
    deleted_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        unique_together = ('organization', 'po_number')


class PurchaseOrderItem(OrgModel):
    purchase_order = models.ForeignKey(PurchaseOrder, on_delete=models.CASCADE, related_name='items')
    product_name = models.CharField(max_length=255)
    quantity = models.IntegerField(default=1)
    unit_cost = models.DecimalField(max_digits=14, decimal_places=2)
    total_cost = models.DecimalField(max_digits=14, decimal_places=2)


class PriceHistoryEntry(OrgModel):
    supplier = models.ForeignKey(Supplier, on_delete=models.CASCADE, related_name='price_history')
    product_name = models.CharField(max_length=255)
    unit_cost = models.DecimalField(max_digits=14, decimal_places=2)
    currency = models.CharField(max_length=8)
    source_po = models.ForeignKey(PurchaseOrder, on_delete=models.CASCADE, related_name='price_entries')
    recorded_at = models.DateTimeField()


class SupplierPayment(OrgModel):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('partially_paid', 'Partially Paid'),
        ('fully_paid', 'Fully Paid'),
        ('overdue', 'Overdue'),
    ]
    METHOD_CHOICES = [
        ('bank_transfer', 'Bank Transfer'),
        ('cash', 'Cash'),
        ('wise', 'Wise'),
        ('western_union', 'Western Union'),
        ('paypal', 'PayPal'),
        ('other', 'Other'),
    ]

    payment_number = models.CharField(max_length=32)
    supplier = models.ForeignKey(Supplier, on_delete=models.CASCADE, related_name='payments')
    purchase_order = models.ForeignKey(PurchaseOrder, null=True, blank=True, on_delete=models.SET_NULL)
    amount = models.DecimalField(max_digits=14, decimal_places=2)
    amount_paid = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    currency = models.CharField(max_length=8, default='USD')
    fx_rate_to_base = models.DecimalField(
        max_digits=14,
        decimal_places=6,
        null=True,
        blank=True,
        help_text='Snapshot of currency→base rate at create time.',
    )
    payment_method = models.CharField(max_length=32, choices=METHOD_CHOICES, default='bank_transfer')
    payment_date = models.DateField()
    status = models.CharField(max_length=32, choices=STATUS_CHOICES, default='pending')
    notes = models.TextField(blank=True, default='')
    is_deleted = models.BooleanField(default=False)
    created_by = models.ForeignKey(
        'auth.User',
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='created_supplier_payments',
    )
    deleted_by = models.ForeignKey(
        'auth.User',
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='deleted_supplier_payments',
    )
    deleted_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        unique_together = ('organization', 'payment_number')
        constraints = [
            models.CheckConstraint(
                check=models.Q(amount_paid__gte=0) & models.Q(amount_paid__lte=models.F('amount')),
                name='payment_amount_paid_within_amount',
            ),
        ]


class SupplierAdjustment(OrgModel):
    TYPE_CHOICES = [('credit', 'Credit'), ('debit', 'Debit')]

    supplier = models.ForeignKey(Supplier, on_delete=models.CASCADE, related_name='adjustments')
    date = models.DateField()
    type = models.CharField(max_length=16, choices=TYPE_CHOICES)
    amount = models.DecimalField(max_digits=14, decimal_places=2)
    currency = models.CharField(max_length=8, default='USD')
    fx_rate_to_base = models.DecimalField(
        max_digits=14,
        decimal_places=6,
        null=True,
        blank=True,
        help_text='Snapshot of currency→base rate at create time.',
    )
    reason = models.TextField()
    is_deleted = models.BooleanField(default=False)
    created_by = models.ForeignKey(
        'auth.User',
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='created_supplier_adjustments',
    )
    deleted_by = models.ForeignKey(
        'auth.User',
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='deleted_supplier_adjustments',
    )
    deleted_at = models.DateTimeField(null=True, blank=True)


class SupplierDocument(OrgModel):
    DOC_TYPE_CHOICES = [
        ('invoice', 'Invoice'),
        ('contract', 'Contract'),
        ('certificate_of_origin', 'Certificate of Origin'),
        ('packing_list', 'Packing List'),
        ('bill_of_lading', 'Bill of Lading'),
        ('customs_declaration', 'Customs Declaration'),
        ('power_of_attorney', 'Power of Attorney'),
        ('other', 'Other'),
    ]

    supplier = models.ForeignKey(Supplier, on_delete=models.CASCADE, related_name='documents')
    document_type = models.CharField(max_length=32, choices=DOC_TYPE_CHOICES)
    custom_document_type_label = models.CharField(max_length=128, blank=True, default='')
    document_number = models.CharField(max_length=128)
    document_date = models.DateField()
    expiry_date = models.DateField(null=True, blank=True)
    notes = models.TextField(blank=True, default='')
    file_name = models.CharField(max_length=255)
    file_type = models.CharField(max_length=128)
    file_size = models.IntegerField(default=0)
    file_data_url = models.TextField(blank=True, default='')
    uploaded_at = models.DateTimeField(auto_now_add=True)
    is_deleted = models.BooleanField(default=False)
    deleted_by = models.ForeignKey(
        'auth.User',
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='deleted_supplier_documents',
    )
    deleted_at = models.DateTimeField(null=True, blank=True)


class SupplierCommunication(OrgModel):
    TYPE_CHOICES = [
        ('phone_call', 'Phone Call'),
        ('meeting', 'Meeting'),
        ('email', 'Email'),
        ('wechat', 'WeChat'),
        ('whatsapp', 'WhatsApp'),
        ('other', 'Other'),
    ]

    supplier = models.ForeignKey(Supplier, on_delete=models.CASCADE, related_name='communications')
    date = models.DateField()
    type = models.CharField(max_length=32, choices=TYPE_CHOICES)
    summary = models.TextField()
    follow_up_required = models.BooleanField(default=False)
    follow_up_date = models.DateField(null=True, blank=True)
    is_deleted = models.BooleanField(default=False)


class SupplierTask(OrgModel):
    STATUS_CHOICES = [('pending', 'Pending'), ('completed', 'Completed')]
    PRIORITY_CHOICES = [('low', 'Low'), ('medium', 'Medium'), ('high', 'High')]

    supplier = models.ForeignKey(Supplier, null=True, blank=True, on_delete=models.SET_NULL)
    purchase_order = models.ForeignKey(PurchaseOrder, null=True, blank=True, on_delete=models.SET_NULL)
    payment = models.ForeignKey(SupplierPayment, null=True, blank=True, on_delete=models.SET_NULL)
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, default='')
    due_date = models.DateField()
    priority = models.CharField(max_length=16, choices=PRIORITY_CHOICES, default='medium')
    status = models.CharField(max_length=16, choices=STATUS_CHOICES, default='pending')
    completed_at = models.DateTimeField(null=True, blank=True)
    is_deleted = models.BooleanField(default=False)


class SupplierRating(OrgModel):
    supplier = models.OneToOneField(Supplier, on_delete=models.CASCADE, related_name='rating')
    quality = models.IntegerField(default=0)
    communication = models.IntegerField(default=0)
    delivery_speed = models.IntegerField(default=0)
    reliability = models.IntegerField(default=0)
    pricing = models.IntegerField(default=0)
    flexibility = models.IntegerField(default=0)
    overall = models.DecimalField(max_digits=4, decimal_places=2, default=0)
    note = models.TextField(blank=True, default='')
    rated_at = models.DateTimeField(auto_now=True)


class MoneyAuditEvent(models.Model):
    """Immutable audit of money-affecting create / soft-delete / payment progress."""

    ENTITY_CHOICES = [
        ('purchase_order', 'Purchase Order'),
        ('payment', 'Payment'),
        ('adjustment', 'Adjustment'),
        ('supplier', 'Supplier'),
    ]
    ACTION_CHOICES = [
        ('create', 'Create'),
        ('soft_delete', 'Soft Delete'),
        ('mark_paid', 'Mark Paid'),
        ('amount_paid_update', 'Amount Paid Update'),
        ('status_change', 'Status Change'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    organization = models.ForeignKey(
        'accounts.Organization',
        on_delete=models.CASCADE,
        related_name='money_audit_events',
    )
    entity_type = models.CharField(max_length=32, choices=ENTITY_CHOICES)
    entity_id = models.UUIDField()
    action = models.CharField(max_length=32, choices=ACTION_CHOICES)
    user = models.ForeignKey(
        'auth.User',
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='money_audit_events',
    )
    before = models.JSONField(default=dict, blank=True)
    after = models.JSONField(default=dict, blank=True)
    notes = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']


class Currency(OrgModel):
    code = models.CharField(max_length=8)
    name = models.CharField(max_length=128)
    name_fr = models.CharField(max_length=128)
    symbol = models.CharField(max_length=16)
    rate_to_base = models.DecimalField(max_digits=14, decimal_places=6)
    is_base = models.BooleanField(default=False)
    is_enabled = models.BooleanField(default=True)
    is_default = models.BooleanField(default=False)

    class Meta:
        unique_together = ('organization', 'code')


class ConversionRecord(OrgModel):
    from_code = models.CharField(max_length=8)
    to_code = models.CharField(max_length=8)
    from_amount = models.DecimalField(max_digits=14, decimal_places=2)
    to_amount = models.DecimalField(max_digits=14, decimal_places=2)
    rate = models.DecimalField(max_digits=14, decimal_places=6)
    timestamp = models.DateTimeField(auto_now_add=True)


class CalculatorRecord(OrgModel):
    TYPE_CHOICES = [
        ('shipment_cost', 'Shipment Cost'),
        ('profit', 'Profit'),
        ('basic', 'Basic'),
        ('landed_cost', 'Landed Cost'),
    ]

    type = models.CharField(max_length=32, choices=TYPE_CHOICES)
    label = models.CharField(max_length=255)
    inputs = models.JSONField(default=dict)
    result = models.DecimalField(max_digits=14, decimal_places=2)
    currency = models.CharField(max_length=8, default='DZD')
    timestamp = models.DateTimeField(auto_now_add=True)
