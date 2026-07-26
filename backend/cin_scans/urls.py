"""URL configuration for cin_scans."""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CINScanViewSet, sync_cin_scan, cin_ocr

router = DefaultRouter()
router.register(r'', CINScanViewSet, basename='cin-scan')

urlpatterns = [
    path('', include(router.urls)),
    path('scans/sync/', sync_cin_scan, name='cin-scan-sync'),
    path('ocr/', cin_ocr, name='cin-ocr'),
]
