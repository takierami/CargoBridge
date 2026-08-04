from django.contrib import admin, messages
from django.contrib.auth.admin import UserAdmin as DjangoUserAdmin

from .deactivation import reactivate_organization, suspend_organization
from .models import Organization, User, UserProfile


@admin.register(User)
class UserAdmin(DjangoUserAdmin):
    list_display = ('username', 'email', 'first_name', 'last_name', 'is_staff', 'is_active')
    search_fields = ('username', 'email', 'first_name', 'last_name')
    ordering = ('username',)


@admin.register(Organization)
class OrganizationAdmin(admin.ModelAdmin):
    list_display = ('name', 'name_fr', 'is_active', 'created_at')
    list_filter = ('is_active',)
    actions = ('suspend_organizations', 'reactivate_organizations')

    def has_delete_permission(self, request, obj=None):
        # Hard-delete CASCADE wipes the entire tenant (goods, money, QR, audit).
        return False

    @admin.action(description='Suspend selected organizations')
    def suspend_organizations(self, request, queryset):
        count = 0
        for org in queryset:
            suspend_organization(org)
            count += 1
        self.message_user(
            request,
            f'Suspended {count} organization(s); members deactivated and tokens blacklisted.',
            messages.WARNING,
        )

    @admin.action(description='Reactivate selected organizations')
    def reactivate_organizations(self, request, queryset):
        count = 0
        for org in queryset:
            reactivate_organization(org)
            count += 1
        self.message_user(
            request,
            f'Reactivated {count} organization(s); members can log in again.',
            messages.SUCCESS,
        )


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'organization', 'role', 'office')
    list_filter = ('role', 'office', 'organization')
    search_fields = ('user__username', 'user__email', 'organization__name')

    def get_queryset(self, request):
        qs = super().get_queryset(request)
        if request.user.is_superuser:
            return qs
        profile = getattr(request.user, 'profile', None)
        if profile and profile.organization_id:
            return qs.filter(organization_id=profile.organization_id)
        return qs.none()
