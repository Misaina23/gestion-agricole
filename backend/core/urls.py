"""
URL Configuration for Core App
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    RegionViewSet, CommuneViewSet, DistrictViewSet, FokontanyViewSet,
    VanillaVarietyViewSet, QualityGradeViewSet, SeasonViewSet,
    SyncLogViewSet, dashboard_stats, dashboard_activity,
    dashboard_sync_status, reference_data, parse_qr_code, generate_qr_code,
    sig_producers_locations, sig_parcels_polygons, sig_production_zones
)
from .search_views import global_search
from .anomaly_views import detect_anomalies
from .mobile_views import (
    sync_producer, sync_parcel, sync_production, sync_inspection,
    sync_collecte, sync_field_inspection, pending_producers, pending_parcels,
    pending_productions, pending_inspections, sync_status
)

router = DefaultRouter()
router.register(r'regions', RegionViewSet, basename='region')
router.register(r'districts', DistrictViewSet, basename='district')
router.register(r'communes', CommuneViewSet, basename='commune')
router.register(r'fokontanys', FokontanyViewSet, basename='fokontany')
router.register(r'varieties', VanillaVarietyViewSet, basename='variety')
router.register(r'quality-grades', QualityGradeViewSet, basename='quality-grade')
router.register(r'seasons', SeasonViewSet, basename='season')
router.register(r'sync-logs', SyncLogViewSet, basename='sync-log')

urlpatterns = [
    path('', include(router.urls)),
    path('dashboard/', dashboard_stats, name='dashboard-stats'),
    path('dashboard/activity/', dashboard_activity, name='dashboard-activity'),
    path('dashboard/sync-status/', dashboard_sync_status, name='dashboard-sync-status'),
    path('reference-data/', reference_data, name='reference-data'),
    path('search/', global_search, name='global-search'),
    path('anomalies/detect/', detect_anomalies, name='detect-anomalies'),
    path('parse-qr/', parse_qr_code, name='parse-qr'),
    path('generate-qr/', generate_qr_code, name='generate-qr'),
    path('sig/producers/', sig_producers_locations, name='sig-producers'),
    path('sig/parcels/', sig_parcels_polygons, name='sig-parcels'),
    path('sig/zones/', sig_production_zones, name='sig-zones'),
    path('mobile/status/', sync_status, name='mobile-sync-status'),
    path('mobile/producers/pending/', pending_producers, name='mobile-pending-producers'),
    path('mobile/producers/sync/', sync_producer, name='mobile-sync-producer'),
    path('mobile/parcels/pending/', pending_parcels, name='mobile-pending-parcels'),
    path('mobile/parcels/sync/', sync_parcel, name='mobile-sync-parcel'),
    path('mobile/productions/pending/', pending_productions, name='mobile-pending-productions'),
    path('mobile/productions/sync/', sync_production, name='mobile-sync-production'),
    path('mobile/inspections/pending/', pending_inspections, name='mobile-pending-inspections'),
    path('mobile/inspections/sync/', sync_inspection, name='mobile-sync-inspection'),
    path('mobile/collectes/sync/', sync_collecte, name='mobile-sync-collecte'),
    path('mobile/field-inspections/sync/', sync_field_inspection, name='mobile-sync-field-inspection'),
]
