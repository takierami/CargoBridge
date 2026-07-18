PO_STATUS_FLOW = {
    'draft': ['sent', 'cancelled'],
    'sent': ['confirmed', 'cancelled'],
    'confirmed': ['in_production', 'cancelled'],
    'in_production': ['ready', 'cancelled'],
    'ready': ['shipped', 'cancelled'],
    'shipped': ['received', 'cancelled'],
    'received': [],
    # Audited reopen for mistaken cancel
    'cancelled': ['draft'],
}

# POs that count toward supplier purchased totals (legacy / inclusiveness)
ACTIVE_PO_STATUSES = [
    'draft', 'sent', 'confirmed', 'in_production', 'ready', 'shipped', 'received',
]

# POs counted in analytics spend reports (excludes draft/sent)
ANALYTICS_PO_STATUSES = [
    'confirmed', 'in_production', 'ready', 'shipped', 'received',
]

# POs that create supplier debt / outstanding balance
BALANCE_PO_STATUSES = ANALYTICS_PO_STATUSES

GOODS_STATUS_FLOW = {
    'draft': ['assigned', 'cancelled'],
    'assigned': ['ready_for_departure', 'cancelled'],
    'ready_for_departure': ['in_transit', 'cancelled'],
    'in_transit': ['arrived', 'delayed', 'cancelled'],
    'arrived': ['warehouse', 'delayed'],
    'warehouse': ['delivered', 'delayed'],
    'delayed': ['in_transit', 'arrived', 'warehouse', 'cancelled'],
    # Audited reopen paths for mistaken terminal states
    'delivered': ['warehouse'],
    'cancelled': ['draft'],
}

GOODS_DELIVERED_STATUSES = ['delivered']
GOODS_DELAYED_STATUSES = ['delayed']

# Statuses that require an assigned agent (cannot clear agent while here)
GOODS_AGENT_REQUIRED_STATUSES = {
    'assigned',
    'ready_for_departure',
    'in_transit',
    'arrived',
    'warehouse',
    'delayed',
    'delivered',
}

# Role caps for goods status transitions (QR + update_status) — both admins share full set
_GOODS_ADMIN_STATUSES = {
    'assigned', 'ready_for_departure', 'in_transit', 'cancelled', 'draft',
    'arrived', 'delayed', 'warehouse', 'delivered',
}
GOODS_ROLE_ALLOWED_STATUSES = {
    'china_admin': set(_GOODS_ADMIN_STATUSES),
    'algeria_admin': set(_GOODS_ADMIN_STATUSES),
}

# Friendly action keys for QR UI (locale resolves labels)
GOODS_STATUS_ACTION_KEYS = {
    'assigned': 'assignAgent',
    'ready_for_departure': 'readyForDeparture',
    'in_transit': 'markInTransit',
    'arrived': 'markArrived',
    'warehouse': 'markWarehouse',
    'delayed': 'markDelayed',
    'delivered': 'markDelivered',
    'cancelled': 'cancel',
    'draft': 'reopenDraft',
}

# Business-facing display aliases (locale keys under goods.businessAliases.*)
GOODS_BUSINESS_ALIASES = {
    'draft': 'purchased',
    'assigned': 'packed',
    'ready_for_departure': 'waitingShipment',
    'in_transit': 'atSea',
    'arrived': 'arrived',
    'warehouse': 'warehouse',
    'delivered': 'delivered',
    'delayed': 'delayed',
    'cancelled': 'cancelled',
}

CUSTOMS_STATUS_FLOW = {
    'not_started': ['pending'],
    'pending': ['cleared', 'held'],
    'held': ['pending', 'cleared'],
    'cleared': [],
}

CUSTOMS_ROLE_ALLOWED_STATUSES = {
    'algeria_admin': {'pending', 'cleared', 'held'},
    'china_admin': {'pending', 'cleared', 'held'},
}

# Customs clearance only once shipment has reached Algeria-side stages
CUSTOMS_ALLOWED_GOODS_STATUSES = {'arrived', 'delayed', 'warehouse', 'delivered'}

INCOTERM_CHOICES = [
    'EXW', 'FCA', 'FOB', 'CFR', 'CIF', 'CPT', 'CIP', 'DAP', 'DPU', 'DDP',
]

# HS codes: 6–10 digits, or dotted chapters (e.g. 8471.30 / 847130)
HS_CODE_PATTERN = r'^(\d{6,10}|\d{4}(\.\d{2}){1,3})$'
