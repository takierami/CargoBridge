import uuid

from django.conf import settings
from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    """Custom user — keep minimal; org role/office stay on UserProfile."""

    class Meta(AbstractUser.Meta):
        swappable = 'AUTH_USER_MODEL'


class Organization(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    name_fr = models.CharField(max_length=255, blank=True, default='')
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name


class UserProfile(models.Model):
    ROLE_OWNER = 'owner'
    ROLE_ADMIN = 'admin'
    ROLE_MANAGER = 'manager'
    ROLE_EMPLOYEE = 'employee'
    ROLE_READONLY = 'readonly'

    ROLE_CHOICES = [
        (ROLE_OWNER, 'Owner'),
        (ROLE_ADMIN, 'Admin'),
        (ROLE_MANAGER, 'Manager'),
        (ROLE_EMPLOYEE, 'Employee'),
        (ROLE_READONLY, 'Read-only'),
    ]

    OFFICE_CHINA = 'china'
    OFFICE_ALGERIA = 'algeria'
    OFFICE_CHOICES = [
        (OFFICE_CHINA, 'China'),
        (OFFICE_ALGERIA, 'Algeria'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='profile',
    )
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE, related_name='members')
    role = models.CharField(max_length=32, choices=ROLE_CHOICES, default=ROLE_ADMIN)
    office = models.CharField(max_length=16, choices=OFFICE_CHOICES, default=OFFICE_CHINA)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f'{self.user.username} ({self.role}/{self.office})'
