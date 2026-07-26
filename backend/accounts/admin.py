"""
Admin configuration for Accounts App
"""
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ['username', 'email', 'full_name', 'role', 'platform', 'registration_status', 'is_supervisor', 'is_active']
    list_filter = ['role', 'platform', 'registration_status', 'is_active', 'is_field_agent', 'is_supervisor', 'region']
    search_fields = ['username', 'email', 'first_name', 'last_name', 'phone']
    ordering = ['-created_at']
    
    fieldsets = BaseUserAdmin.fieldsets + (
        ('Informations complementaires', {
            'fields': ('role', 'platform', 'registration_status', 'is_supervisor', 'phone', 'region', 'commune', 'avatar', 'is_field_agent', 'last_sync')
        }),
    )
    
    add_fieldsets = BaseUserAdmin.add_fieldsets + (
        ('Informations complementaires', {
            'fields': ('role', 'platform', 'registration_status', 'is_supervisor', 'phone', 'region', 'commune', 'is_field_agent')
        }),
    )
