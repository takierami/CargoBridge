"""Soft-deactivate users and suspend organizations (no hard deletes)."""
from __future__ import annotations

from django.contrib.auth import get_user_model
from django.db import transaction

User = get_user_model()


def blacklist_user_tokens(user) -> int:
    """Blacklist all outstanding refresh tokens for ``user``. Returns count blacklisted."""
    from rest_framework_simplejwt.token_blacklist.models import (
        BlacklistedToken,
        OutstandingToken,
    )

    count = 0
    for outstanding in OutstandingToken.objects.filter(user=user):
        _, created = BlacklistedToken.objects.get_or_create(token=outstanding)
        if created:
            count += 1
    return count


def deactivate_user(user) -> None:
    if user.is_active:
        user.is_active = False
        user.save(update_fields=['is_active'])
    blacklist_user_tokens(user)


def reactivate_user(user) -> None:
    if not user.is_active:
        user.is_active = True
        user.save(update_fields=['is_active'])


@transaction.atomic
def suspend_organization(org) -> None:
    from accounts.models import UserProfile

    org.is_active = False
    org.save(update_fields=['is_active'])
    profiles = (
        UserProfile.objects.select_related('user')
        .filter(organization=org)
        .select_for_update()
    )
    for profile in profiles:
        deactivate_user(profile.user)


@transaction.atomic
def reactivate_organization(org) -> None:
    from accounts.models import UserProfile

    org.is_active = True
    org.save(update_fields=['is_active'])
    profiles = (
        UserProfile.objects.select_related('user')
        .filter(organization=org)
        .select_for_update()
    )
    for profile in profiles:
        reactivate_user(profile.user)
