"""
URLs for Workflows App
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import WorkflowStepViewSet, WorkflowInstanceViewSet, workflow_stats

router = DefaultRouter()
router.register(r'workflow-steps', WorkflowStepViewSet, basename='workflow-step')
router.register(r'workflow-instances', WorkflowInstanceViewSet, basename='workflow-instance')

urlpatterns = [
    path('', include(router.urls)),
    path('stats/', workflow_stats, name='workflow-stats'),
]