"""
URL Configuration for Parcels App
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ParcelViewSet, ParcelPhotoViewSet

router = DefaultRouter()
router.register(r'photos', ParcelPhotoViewSet, basename='parcel-photo')
router.register(r'', ParcelViewSet, basename='parcel')

urlpatterns = [
    path('', include(router.urls)),
    path('export/', ParcelViewSet.as_view({'get': 'export'})),
]
