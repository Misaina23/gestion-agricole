"""
Admin configuration for Core App
"""
from django.contrib import admin
from .models import Region, Commune, Fokontany, VanillaVariety, QualityGrade, Season, SyncLog, ProductionUnit


@admin.register(Region)
class RegionAdmin(admin.ModelAdmin):
    list_display = ['name', 'code', 'is_active']
    list_filter = ['is_active']
    search_fields = ['name', 'code']


@admin.register(Commune)
class CommuneAdmin(admin.ModelAdmin):
    list_display = ['name', 'code', 'region', 'is_active']
    list_filter = ['region', 'is_active']
    search_fields = ['name', 'code']


@admin.register(Fokontany)
class FokontanyAdmin(admin.ModelAdmin):
    list_display = ['name', 'code', 'commune', 'is_active']
    list_filter = ['commune__region', 'commune', 'is_active']
    search_fields = ['name', 'code']


@admin.register(VanillaVariety)
class VanillaVarietyAdmin(admin.ModelAdmin):
    list_display = ['name', 'code', 'is_active']
    list_filter = ['is_active']
    search_fields = ['name', 'code']


@admin.register(QualityGrade)
class QualityGradeAdmin(admin.ModelAdmin):
    list_display = ['name', 'code', 'price_factor', 'is_active']
    list_filter = ['is_active']
    search_fields = ['name', 'code']


@admin.register(Season)
class SeasonAdmin(admin.ModelAdmin):
    list_display = ['name', 'year', 'start_date', 'end_date', 'is_current', 'is_active']
    list_filter = ['year', 'is_current', 'is_active']
    search_fields = ['name']


@admin.register(SyncLog)
class SyncLogAdmin(admin.ModelAdmin):
    list_display = ['user', 'status', 'records_sent', 'records_received', 'started_at', 'completed_at']
    list_filter = ['status', 'started_at']
    search_fields = ['user__username']
    readonly_fields = ['started_at']


@admin.register(ProductionUnit)
class ProductionUnitAdmin(admin.ModelAdmin):
    list_display = ['name', 'code', 'unit_type', 'region', 'commune', 'manager_name', 'members_count', 'total_area', 'status']
    list_filter = ['unit_type', 'status', 'region', 'commune']
    search_fields = ['name', 'code', 'manager_name', 'phone', 'email']
    readonly_fields = ['created_at', 'updated_at']
