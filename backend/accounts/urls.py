"""
URL Configuration for Accounts App
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import UserViewSet, RegistrationView

router = DefaultRouter()
router.register(r'users', UserViewSet, basename='user')

urlpatterns = [
    path('register/', RegistrationView.as_view(), name='register'),
    path('', include(router.urls)),
]
