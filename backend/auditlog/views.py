"""
Views for Audit Log
"""
from rest_framework import viewsets, permissions
from rest_framework.filters import OrderingFilter, SearchFilter
from django_filters.rest_framework import DjangoFilterBackend
from .models import ActivityLog
from .serializers import ActivityLogSerializer


class ActivityLogViewSet(viewsets.ReadOnlyModelViewSet):
    """Read-only API exposing the activity history."""

    queryset = ActivityLog.objects.select_related('user').all()
    serializer_class = ActivityLogSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['action', 'module', 'user']
    search_fields = ['module', 'object_repr', 'action', 'user__username', 'user__full_name']
    ordering_fields = ['timestamp', 'action', 'module']
    ordering = ['-timestamp']
