from rest_framework import permissions


ROLE_CHINA_ADMIN = 'china_admin'
ROLE_ALGERIA_ADMIN = 'algeria_admin'


def user_role(user):
    profile = getattr(user, 'profile', None)
    return getattr(profile, 'role', None)


class RoleWritePermission(permissions.BasePermission):
    """
    Allows authenticated users to read org-scoped data, while restricting unsafe
    writes by role on each viewset.
    """

    message = 'Your role is not allowed to perform this action.'

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False

        if request.method in permissions.SAFE_METHODS:
            return True

        action_roles = getattr(view, 'action_write_roles', {})
        allowed_roles = action_roles.get(
            getattr(view, 'action', None),
            getattr(view, 'allowed_write_roles', None),
        )
        if allowed_roles is None:
            return True

        return user_role(request.user) in allowed_roles
