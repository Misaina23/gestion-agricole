"""
URLs for Cultures App
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CultureViewSet

router = DefaultRouter()
router.register(r'cultures', CultureViewSet, basename='culture')

urlpatterns = router.urls