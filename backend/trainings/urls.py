"""
URLs for Trainings App
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import TrainingViewSet, TrainingAttendanceViewSet, training_stats

router = DefaultRouter()
router.register(r'trainings', TrainingViewSet, basename='training')
router.register(r'training-attendances', TrainingAttendanceViewSet, basename='training-attendance')

urlpatterns = [
    path('', include(router.urls)),
    path('stats/', training_stats, name='training-stats'),
]