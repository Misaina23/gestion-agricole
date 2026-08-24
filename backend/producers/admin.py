"""
Admin configuration for Producers App
"""
from django.contrib import admin
from .models import Producer, Cooperative


@admin.register(Producer)
class ProducerAdmin(admin.ModelAdmin):
    list_display = ['code', 'last_name', 'first_name', 'unit_name', 'region', 'commune', 'eu_status', 'nop_status', 'joined_at']
    list_filter = ['eu_status', 'nop_status', 'risk_category', 'region', 'commune']
    search_fields = ['code', 'last_name', 'first_name', 'phone']
    readonly_fields = ['created_at', 'updated_at', 'full_name', 'parcels_count', 'total_area']
    date_hierarchy = 'created_at'

    fieldsets = (
        ('Identification', {
            'fields': ('code', 'last_name', 'first_name', 'unit_name')
        }),
        ('Localisation', {
            'fields': ('region', 'district', 'commune', 'fokontany')
        }),
        ('Contact', {
            'fields': ('phone',)
        }),
        ('Inscription', {
            'fields': ('joined_at',)
        }),
        ('Risques', {
            'fields': ('risk_category', 'identified_risks')
        }),
        ('Préparation / transformation', {
            'fields': ('member_processing', 'processing_activities')
        }),
        ('Inspections', {
            'fields': ('last_internal_inspection_at', 'internal_inspector_name', 'last_external_inspection_at')
        }),
        ('Statuts certification', {
            'fields': ('eu_status', 'nop_status', 'exclusion_reason', 'exclusion_date')
        }),
        ('Résumé', {
            'fields': ('full_name', 'parcels_count', 'total_area')
        }),
        ('Système', {
            'fields': ('status', 'synced', 'registered_by', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(Cooperative)
class CooperativeAdmin(admin.ModelAdmin):
    list_display = ['code', 'name', 'region', 'president', 'is_active']
    list_filter = ['is_active', 'region']
    search_fields = ['code', 'name', 'president']
    readonly_fields = ['created_at', 'updated_at']
