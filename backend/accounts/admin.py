from django.contrib import admin

from .models import Organization, UserProfile


@admin.register(Organization)
class OrganizationAdmin(admin.ModelAdmin):
    list_display = ('name', 'name_fr', 'created_at')

    def has_delete_permission(self, request, obj=None):
        # Hard-delete CASCADE wipes the entire tenant (goods, money, QR, audit).
        return False


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'organization', 'role')
