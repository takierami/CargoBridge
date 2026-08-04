from rest_framework import permissions

from accounts.models import UserProfile

# Legacy aliases kept for imports during transition
ROLE_CHINA_ADMIN = 'china_admin'
ROLE_ALGERIA_ADMIN = 'algeria_admin'

ROLE_OWNER = UserProfile.ROLE_OWNER
ROLE_ADMIN = UserProfile.ROLE_ADMIN
ROLE_MANAGER = UserProfile.ROLE_MANAGER
ROLE_EMPLOYEE = UserProfile.ROLE_EMPLOYEE
ROLE_READONLY = UserProfile.ROLE_READONLY

DOMAIN_WRITE_ROLES = (
    ROLE_OWNER,
    ROLE_ADMIN,
    ROLE_MANAGER,
    ROLE_EMPLOYEE,
    # Legacy office-admin labels (pre-migration rows / old tokens)
    ROLE_CHINA_ADMIN,
    ROLE_ALGERIA_ADMIN,
)

ORG_ADMIN_ROLES = (
    ROLE_OWNER,
    ROLE_ADMIN,
    ROLE_CHINA_ADMIN,
    ROLE_ALGERIA_ADMIN,
)

# Equal write privileges for domain CRUD (replaces BOTH_ADMINS for ViewSets)
BOTH_ADMINS = DOMAIN_WRITE_ROLES


def user_role(user):
    profile = getattr(user, 'profile', None)
    return getattr(profile, 'role', None)


def user_office(user):
    profile = getattr(user, 'profile', None)
    if not profile:
        return None
    office = getattr(profile, 'office', None)
    if office:
        return office
    # Legacy role → office mapping
    role = getattr(profile, 'role', None)
    if role == ROLE_CHINA_ADMIN:
        return UserProfile.OFFICE_CHINA
    if role == ROLE_ALGERIA_ADMIN:
        return UserProfile.OFFICE_ALGERIA
    return UserProfile.OFFICE_CHINA


def is_org_admin_role(role: str | None) -> bool:
    return role in ORG_ADMIN_ROLES


def is_domain_writer(role: str | None) -> bool:
    return role in DOMAIN_WRITE_ROLES


class RoleWritePermission(permissions.BasePermission):
    """
    Authenticated users may read org-scoped data.
    Unsafe methods require an allowed write role (default: domain writers).
    """

    message = 'Your role is not allowed to perform this action.'

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if not hasattr(request.user, 'profile'):
            return False

        if request.method in permissions.SAFE_METHODS:
            return True

        role = user_role(request.user)
        if role == ROLE_READONLY:
            return False

        action_roles = getattr(view, 'action_write_roles', {})
        allowed_roles = action_roles.get(
            getattr(view, 'action', None),
            getattr(view, 'allowed_write_roles', None),
        )
        if allowed_roles is None:
            return is_domain_writer(role)

        return role in allowed_roles


class OrgObjectPermission(permissions.BasePermission):
    """Object must belong to the caller's organization (404/403 via DRF)."""

    message = 'Object does not belong to your organization.'

    def has_object_permission(self, request, view, obj):
        if not request.user or not request.user.is_authenticated:
            return False
        profile = getattr(request.user, 'profile', None)
        if not profile:
            return False
        org_id = profile.organization_id
        obj_org_id = getattr(obj, 'organization_id', None)
        if obj_org_id is None and hasattr(obj, 'organization'):
            org = getattr(obj, 'organization', None)
            obj_org_id = getattr(org, 'id', None) if org is not None else None
        if obj_org_id is None:
            # Nested objects without direct org FK — allow if queryset already scoped
            return True
        return obj_org_id == org_id
