"""
Admin configuration for Parcels App
"""
from django.contrib import admin
from .models import Parcel, ParcelPhoto, ParcelRegisterHarvest


class ParcelPhotoInline(admin.TabularInline):
    model = ParcelPhoto
    extra = 1


class ParcelRegisterHarvestInline(admin.TabularInline):
    model = ParcelRegisterHarvest
    extra = 1


@admin.register(Parcel)
class ParcelAdmin(admin.ModelAdmin):
    list_display = ['code', 'producer', 'area', 'main_crop', 'intercrop', 'conversion_status', 'conversion_level', 'eu_status', 'nop_status', 'registration_date']
    list_filter = ['conversion_status', 'conversion_level', 'eu_status', 'nop_status', 'producer__region', 'main_crop']
    search_fields = ['code', 'producer__code', 'producer__last_name', 'main_crop', 'intercrop']
    readonly_fields = ['created_at', 'updated_at', 'plant_density', 'productivity_rate']
    date_hierarchy = 'created_at'
    inlines = [ParcelPhotoInline, ParcelRegisterHarvestInline]

    fieldsets = (
        ('Identification', {
            'fields': ('code', 'producer', 'registration_date')
        }),
        ('Superficie et culture', {
            'fields': ('area', 'main_crop', 'intercrop', 'vanilla_plants')
        }),
        ('Conversion et statuts', {
            'fields': ('conversion_status', 'conversion_level', 'conversion_start_date', 'eu_status', 'nop_status')
        }),
        ('Coordonnées GPS', {
            'fields': ('latitude', 'longitude', 'altitude', 'gps_accuracy', 'bio_location')
        }),
        ('Rendement et récolte', {
            'fields': ('estimated_yield', 'actual_harvest', 'actual_yield', 'delivered_quantity')
        }),
        ('Divers', {
            'fields': ('photo', 'notes', 'synced', 'registered_by', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(ParcelPhoto)
class ParcelPhotoAdmin(admin.ModelAdmin):
    list_display = ['parcel', 'caption', 'taken_at', 'created_at']
    list_filter = ['created_at']
    search_fields = ['parcel__code', 'caption']


@admin.register(ParcelRegisterHarvest)
class ParcelRegisterHarvestAdmin(admin.ModelAdmin):
    list_display = ['parcel', 'period', 'crop_slot', 'estimated_yield', 'actual_harvest', 'delivered_quantity']
    list_filter = ['period', 'crop_slot']
    search_fields = ['parcel__code', 'parcel__producer__code']
