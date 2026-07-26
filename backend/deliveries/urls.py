"""
URLs for Deliveries App
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import DeliveryViewSet, delivery_stats

router = DefaultRouter()
router.register(r'deliveries', DeliveryViewSet, basename='delivery')

urlpatterns = [
    path('', include(router.urls)),
    path('stats/', delivery_stats, name='delivery-stats'),
]