"""
Admin configuration for Producers App
"""
from django.contrib import admin
from .models import Producer, Cooperative


@admin.register(Producer)
class ProducerAdmin(admin.ModelAdmin):
    list_display = ['code', 'name', 'region', 'commune', 'status', 'is_certified', 'created_at']
    list_filter = ['status', 'is_certified', 'region', 'commune', 'cooperative']
    search_fields = ['code', 'name', 'phone', 'cin', 'email']
    readonly_fields = ['created_at', 'updated_at']
    date_hierarchy = 'created_at'
    
    fieldsets = (
        ('Identification', {
            'fields': ('code', 'name', 'gender', 'birth_date', 'cin', 'photo')
        }),
        ('Contact', {
            'fields': ('phone', 'phone_secondary', 'email')
        }),
        ('Localisation', {
            'fields': ('region', 'commune', 'fokontany', 'address')
        }),
        ('Statut et certification', {
            'fields': ('status', 'is_certified', 'certification_date', 'certification_number', 'certification_expiry')
        }),
        ('Cooperative', {
            'fields': ('cooperative',)
        }),
        ('Notes', {
            'fields': ('notes', 'registered_by')
        }),
        ('Dates', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(Cooperative)
class CooperativeAdmin(admin.ModelAdmin):
    list_display = ['code', 'name', 'region', 'president', 'is_active', 'members_count']
    list_filter = ['is_active', 'region']
    search_fields = ['code', 'name', 'president']
    readonly_fields = ['created_at', 'updated_at']
