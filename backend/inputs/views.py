"""
Views for Inputs App
"""
from rest_framework import viewsets, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.db.models import Sum
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from .models import InputType, InputDistribution
from .serializers import InputTypeSerializer, InputDistributionSerializer


class InputTypeViewSet(viewsets.ModelViewSet):
    lookup_value_regex = r'\d+'
    queryset = InputType.objects.filter(is_active=True)
    serializer_class = InputTypeSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter]
    filterset_fields = ['type', 'is_active']
    search_fields = ['name', 'description', 'unit']
    ordering_fields = ['name', 'type']
    ordering = ['name']


class InputDistributionViewSet(viewsets.ModelViewSet):
    lookup_value_regex = r'\d+'
    queryset = InputDistribution.objects.select_related(
        'input_type', 'producer', 'producer__region', 'producer__commune',
        'campaign', 'distributed_by'
    ).all()
    serializer_class = InputDistributionSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = [
        'input_type', 'producer', 'campaign', 'distributed_by',
        'producer__region', 'distribution_date'
    ]
    search_fields = [
        'input_type__name', 'producer__name', 'producer__code',
        'notes', 'unit'
    ]
    ordering_fields = ['distribution_date', 'quantity', 'unit_value', 'total_value', 'created_at']
    ordering = ['-distribution_date']


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def input_stats(request):
    """Get input distribution statistics"""
    qs = InputDistribution.objects.all()
    stats = {
        'total': qs.count(),
        'total_quantity': float(qs.aggregate(Sum('quantity'))['quantity__sum'] or 0),
        'total_value': float(qs.aggregate(Sum('total_value'))['total_value__sum'] or 0),
    }
    return Response(stats)