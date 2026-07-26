"""
URLs for Inputs App
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import InputTypeViewSet, InputDistributionViewSet, input_stats

router = DefaultRouter()
router.register(r'', InputDistributionViewSet, basename='input')
router.register(r'input-types', InputTypeViewSet, basename='input-type')

urlpatterns = [
    path('', include(router.urls)),
    path('stats/', input_stats, name='input-stats'),
]