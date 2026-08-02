"""
Views for Audit Log
"""
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.filters import OrderingFilter, SearchFilter
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from .models import ActivityLog
from .serializers import ActivityLogSerializer


class ActivityLogViewSet(viewsets.ReadOnlyModelViewSet):
    """Read-only API exposing the activity history."""

    http_method_names = ['get', 'post', 'head', 'options']
    queryset = ActivityLog.objects.select_related('user').all()
    serializer_class = ActivityLogSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['action', 'module', 'user']
    search_fields = ['module', 'object_repr', 'action', 'user__username', 'user__full_name']
    ordering_fields = ['timestamp', 'action', 'module']
    ordering = ['-timestamp']

    @action(detail=False, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def reset_history(self, request):
        """Clear the entire activity history after confirming the connected
        admin's login password."""
        if request.user.role not in ['admin', 'manager']:
            return Response(
                {'detail': "Seuls les administrateurs et gestionnaires peuvent réinitialiser l'historique."},
                status=status.HTTP_403_FORBIDDEN,
            )
        password = (request.data or {}).get('password', '')
        if not password or not request.user.check_password(password):
            return Response(
                {'detail': 'Mot de passe incorrect.'},
                status=status.HTTP_403_FORBIDDEN,
            )
        deleted, _ = ActivityLog.objects.all().delete()
        ActivityLog.objects.create(
            user=request.user,
            action='DELETE',
            module='auditlog',
            object_repr='historique_reinitialise',
        )
        return Response({'message': 'Historique réinitialisé.', 'deleted': deleted})
