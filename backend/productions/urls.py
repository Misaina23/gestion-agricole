"""
URL Configuration for Productions App
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ProductionViewSet, ProductionBatchViewSet

router = DefaultRouter()
router.register(r'batches', ProductionBatchViewSet, basename='production-batch')
router.register(r'', ProductionViewSet, basename='production')

urlpatterns = [
    path('', include(router.urls)),
    path('export/', ProductionViewSet.as_view({'get': 'export'})),
]
