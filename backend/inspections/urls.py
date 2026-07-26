"""
URL Configuration for Inspections App
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    InspectionViewSet, InspectionChecklistViewSet,
    InspectionPhotoViewSet, InspectionTemplateViewSet
)

router = DefaultRouter()
router.register(r'checklist', InspectionChecklistViewSet, basename='inspection-checklist')
router.register(r'photos', InspectionPhotoViewSet, basename='inspection-photo')
router.register(r'templates', InspectionTemplateViewSet, basename='inspection-template')
router.register(r'', InspectionViewSet, basename='inspection')

urlpatterns = [
    path('', include(router.urls)),
]
