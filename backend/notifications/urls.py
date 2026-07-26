from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import NotificationViewSet, ScheduledNotificationViewSet

router = DefaultRouter()
router.register(r'notifications', NotificationViewSet, basename='notification')
router.register(r'scheduled-notifications', ScheduledNotificationViewSet, basename='scheduled-notification')

urlpatterns = [
    path('', include(router.urls)),
]
