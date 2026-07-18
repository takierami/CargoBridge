from rest_framework import serializers


class OrgScopedSerializerMixin:
    """Validate FK fields belong to the request user's organization."""

    ORG_FK_FIELDS: dict[str, type] = {}

    def _get_org(self):
        request = self.context.get('request')
        if request and hasattr(request.user, 'profile'):
            return request.user.profile.organization
        return None

    def validate(self, attrs):
        attrs = super().validate(attrs)
        org = self._get_org()
        if not org:
            return attrs
        for field_name, model_class in self.ORG_FK_FIELDS.items():
            value = attrs.get(field_name)
            if value is None:
                continue
            qs = model_class.objects.filter(pk=value.pk, organization=org)
            if hasattr(model_class, 'is_deleted'):
                qs = qs.filter(is_deleted=False)
            if not qs.exists():
                raise serializers.ValidationError(
                    {field_name: 'Related object does not belong to your organization.'}
                )
        return attrs
