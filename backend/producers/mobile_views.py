"""
Views for Mobile API - Offline sync endpoints
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from .models import Producer
from .serializers import ProducerDetailSerializer, ProducerCreateUpdateSerializer
from core.export_utils import build_export_response
import json


class MobileSyncMixin:
    """Mixin to handle offline sync operations"""
    def get_unsynced_queryset(self, model, user=None):
        """Get pending sync records for user"""
        # For offline, return all records with sync_pending flag
        # In production, filter by user region/permissions
        return model.objects.filter(synced=False)


class MobileProducerViewSet(viewsets.ModelViewSet):
    """API endpoints for mobile producer sync"""
    queryset = Producer.objects.all()
    serializer_class = ProducerDetailSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter]
    filterset_fields = ['region', 'status']
    search_fields = ['code', 'name', 'phone']
    
    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return ProducerCreateUpdateSerializer
        return ProducerDetailSerializer
    
    @action(detail=False, methods=['get'])
    def pending(self, request):
        """Get unsynced producers for offline sync"""
        # Return producers marked as needing sync (could use a sync_pending field)
        producers = Producer.objects.filter(synced=False)[:100]
        serializer = self.get_serializer(producers, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['post'])
    def sync(self, request):
        """Sync producer data from mobile app"""
        data = request.data
        # Handle offline data sync
        producer = Producer.objects.create(**data)
        producer.synced = True
        producer.save()
        return Response(ProducerDetailSerializer(producer).data, status=status.HTTP_201_CREATED)