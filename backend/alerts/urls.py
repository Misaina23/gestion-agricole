"""
URL Configuration for Alerts App
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import AlertTypeViewSet, AlertViewSet

router = DefaultRouter()
router.register(r'types', AlertTypeViewSet, basename='alert-type')
router.register(r'', AlertViewSet, basename='alert')

urlpatterns = [
    path('', include(router.urls)),
]
