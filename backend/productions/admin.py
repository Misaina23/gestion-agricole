"""
Admin configuration for Productions App
"""
from django.contrib import admin
from .models import Production, ProductionBatch


@admin.register(Production)
class ProductionAdmin(admin.ModelAdmin):
    list_display = [
        'code', 'parcel', 'harvest_date', 'weight_green',
        'weight_prepared', 'quality_grade', 'status', 'created_at'
    ]
    list_filter = ['status', 'quality_grade', 'season', 'parcel__producer__region']
    search_fields = ['code', 'parcel__code', 'parcel__producer__name']
    readonly_fields = ['created_at', 'updated_at', 'conversion_rate', 'avg_pod_weight']
    date_hierarchy = 'harvest_date'
    
    fieldsets = (
        ('Identification', {
            'fields': ('code', 'parcel', 'season')
        }),
        ('Recolte', {
            'fields': ('harvest_date', 'harvest_time', 'weight_green', 'weight_prepared', 'conversion_rate')
        }),
        ('Gousses', {
            'fields': ('pods_count', 'pods_grade_a', 'pods_grade_b', 'pods_grade_c', 'pods_rejected', 'avg_pod_weight')
        }),
        ('Qualite', {
            'fields': ('quality_grade', 'vanillin_content', 'moisture_content')
        }),
        ('Traitement', {
            'fields': ('status', 'drying_start_date', 'drying_end_date', 'curing_start_date', 'curing_end_date')
        }),
        ('Vente', {
            'fields': ('sale_date', 'sale_price', 'buyer')
        }),
        ('Autres', {
            'fields': ('photo', 'notes', 'registered_by', 'created_at', 'updated_at')
        }),
    )


@admin.register(ProductionBatch)
class ProductionBatchAdmin(admin.ModelAdmin):
    list_display = ['code', 'name', 'total_weight', 'quality_grade', 'created_at']
    list_filter = ['quality_grade', 'created_at']
    search_fields = ['code', 'name']
    filter_horizontal = ['productions']
