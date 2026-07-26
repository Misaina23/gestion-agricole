"""
Admin configuration for Inspections App
"""
from django.contrib import admin
from .models import Inspection, InspectionChecklist, InspectionPhoto, InspectionTemplate


class InspectionChecklistInline(admin.TabularInline):
    model = InspectionChecklist
    extra = 1


class InspectionPhotoInline(admin.TabularInline):
    model = InspectionPhoto
    extra = 1


@admin.register(Inspection)
class InspectionAdmin(admin.ModelAdmin):
    list_display = [
        'code', 'producer', 'inspection_type', 'planned_date',
        'inspector', 'status', 'result', 'score_overall', 'created_at'
    ]
    list_filter = ['inspection_type', 'status', 'result', 'producer__region', 'follow_up_required']
    search_fields = ['code', 'producer__name', 'producer__code', 'observations']
    readonly_fields = ['created_at', 'updated_at', 'is_overdue']
    date_hierarchy = 'planned_date'
    inlines = [InspectionChecklistInline, InspectionPhotoInline]
    
    fieldsets = (
        ('Identification', {
            'fields': ('code', 'producer', 'parcel')
        }),
        ('Planification', {
            'fields': ('inspection_type', 'planned_date', 'actual_date', 'inspector')
        }),
        ('Statut et resultat', {
            'fields': ('status', 'result', 'is_overdue')
        }),
        ('Scores', {
            'fields': (
                'score_overall', 'score_cultivation', 'score_processing',
                'score_storage', 'score_traceability', 'score_environment'
            )
        }),
        ('Observations', {
            'fields': ('observations', 'recommendations', 'non_conformities', 'corrective_actions')
        }),
        ('Suivi', {
            'fields': ('follow_up_required', 'follow_up_date', 'follow_up_notes')
        }),
        ('Autres', {
            'fields': ('photo', 'notes', 'created_at', 'updated_at')
        }),
    )


@admin.register(InspectionChecklist)
class InspectionChecklistAdmin(admin.ModelAdmin):
    list_display = ['inspection', 'category', 'item', 'is_compliant', 'score']
    list_filter = ['category', 'is_compliant']
    search_fields = ['inspection__code', 'item']


@admin.register(InspectionPhoto)
class InspectionPhotoAdmin(admin.ModelAdmin):
    list_display = ['inspection', 'caption', 'category', 'created_at']
    list_filter = ['category', 'created_at']
    search_fields = ['inspection__code', 'caption']


@admin.register(InspectionTemplate)
class InspectionTemplateAdmin(admin.ModelAdmin):
    list_display = ['name', 'inspection_type', 'is_active']
    list_filter = ['inspection_type', 'is_active']
    search_fields = ['name']
