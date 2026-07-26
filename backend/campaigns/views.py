"""
Views for Campaigns App
"""
from rest_framework import viewsets, permissions
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from .models import Campaign, CampaignProducer
from .serializers import CampaignSerializer, CampaignProducerSerializer


class CampaignViewSet(viewsets.ModelViewSet):
    queryset = Campaign.objects.filter(is_active=True)
    serializer_class = CampaignSerializer
    permission_classes = [permissions.IsAuthenticated]


class CampaignProducerViewSet(viewsets.ModelViewSet):
    queryset = CampaignProducer.objects.select_related('campaign', 'producer').all()
    serializer_class = CampaignProducerSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['campaign', 'producer', 'is_active']
    search_fields = ['producer__name', 'producer__code', 'campaign__name']
    ordering_fields = ['enrollment_date', 'producer__name']
    ordering = ['-enrollment_date']