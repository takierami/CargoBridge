"""DRF mixin that records create / update / soft-delete activity."""

from __future__ import annotations

from . import activity as activity_mod


class ActivityLoggingMixin:
    """
    Attach to OrgViewSet subclasses.
    Set `activity_module`. Set `activity_enabled=False` when dual-write already covers the entity
    (e.g. money audit for POs/payments).
    Overrides that reimplement perform_* should call log_create / log_update / log_destroy.
    """

    activity_module: str = ''
    activity_enabled: bool = True
    activity_snapshot_fields: list[str] | None = None

    def log_create(self, instance, *, action: str = 'create', **kwargs):
        if not self.activity_enabled or not self.activity_module or instance is None:
            return
        activity_mod.record_model_activity(
            organization=self.get_organization(),
            module=self.activity_module,
            action=action,
            instance=instance,
            user=self.request.user,
            before={},
            after=activity_mod.snapshot_fields(instance, self.activity_snapshot_fields),
            **kwargs,
        )

    def log_update(self, instance, before: dict, *, action: str = 'update', **kwargs):
        if not self.activity_enabled or not self.activity_module or instance is None:
            return
        after = activity_mod.snapshot_fields(instance, self.activity_snapshot_fields)
        activity_mod.record_model_activity(
            organization=self.get_organization(),
            module=self.activity_module,
            action=action,
            instance=instance,
            user=self.request.user,
            before=before,
            after=after,
            **kwargs,
        )

    def log_destroy(self, instance, before: dict | None = None, *, action: str = 'soft_delete', **kwargs):
        if not self.activity_enabled or not self.activity_module or instance is None:
            return
        before = before or activity_mod.snapshot_fields(instance, self.activity_snapshot_fields)
        activity_mod.record_model_activity(
            organization=self.get_organization(),
            module=self.activity_module,
            action=action,
            instance=instance,
            user=self.request.user,
            before=before,
            after={'is_deleted': True},
            entity_label=activity_mod.entity_label_for(instance),
            **kwargs,
        )

    def perform_create(self, serializer):
        super().perform_create(serializer)
        self.log_create(serializer.instance)

    def perform_update(self, serializer):
        instance = serializer.instance
        before = activity_mod.snapshot_fields(instance, self.activity_snapshot_fields)
        super().perform_update(serializer)
        self.log_update(serializer.instance, before)

    def perform_destroy(self, instance):
        before = activity_mod.snapshot_fields(instance, self.activity_snapshot_fields)
        super().perform_destroy(instance)
        self.log_destroy(instance, before)
