"""
Admin configuration for Parcels App
"""
from django.contrib import admin
from .models import Parcel, ParcelPhoto


class ParcelPhotoInline(admin.TabularInline):
    model = ParcelPhoto
    extra = 1


@admin.register(Parcel)
class ParcelAdmin(admin.ModelAdmin):
    list_display = ['code', 'producer', 'area', 'vanilla_plants', 'status', 'is_certified', 'created_at']
    list_filter = ['status', 'is_certified', 'producer__region', 'variety', 'soil_type']
    search_fields = ['code', 'name', 'producer__name', 'producer__code']
    readonly_fields = ['created_at', 'updated_at', 'plant_density', 'productivity_rate']
    date_hierarchy = 'created_at'
    inlines = [ParcelPhotoInline]
    
    fieldsets = (
        ('Identification', {
            'fields': ('code', 'name', 'producer')
        }),
        ('Coordonnees GPS', {
            'fields': ('latitude', 'longitude', 'altitude', 'gps_accuracy', 'polygon_coordinates')
        }),
        ('Details parcelle', {
            'fields': ('area', 'vanilla_plants', 'productive_plants', 'variety', 'plant_density', 'productivity_rate')
        }),
        ('Sol et environnement', {
            'fields': ('soil_type', 'shade_percentage', 'irrigation')
        }),
        ('Dates', {
            'fields': ('planting_date', 'first_harvest_date')
        }),
        ('Statut', {
            'fields': ('status', 'is_certified', 'certification_date')
        }),
        ('Autres', {
            'fields': ('photo', 'notes', 'registered_by', 'created_at', 'updated_at')
        }),
    )


@admin.register(ParcelPhoto)
class ParcelPhotoAdmin(admin.ModelAdmin):
    list_display = ['parcel', 'caption', 'taken_at', 'created_at']
    list_filter = ['created_at']
    search_fields = ['parcel__code', 'caption']
