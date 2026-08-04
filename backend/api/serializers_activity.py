from rest_framework import serializers

from .models import BusinessActivityEvent


class BusinessActivityEventSerializer(serializers.ModelSerializer):
    class Meta:
        model = BusinessActivityEvent
        fields = [
            'id',
            'occurred_at',
            'actor',
            'actor_username',
            'actor_display_name',
            'module',
            'action',
            'entity_type',
            'entity_id',
            'entity_label',
            'summary',
            'summary_ar',
            'summary_fr',
            'before',
            'after',
            'changed_fields',
            'supplier_id',
            'agent_id',
            'goods_id',
            'currency',
            'country',
            'status',
            'tags',
            'metadata',
            'related_url',
            'is_archived',
            'source',
        ]
        read_only_fields = fields
