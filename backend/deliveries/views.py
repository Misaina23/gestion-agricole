"""
Views for Deliveries App
"""
from rest_framework import viewsets, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.db.models import Sum
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from .models import Delivery
from .serializers import DeliverySerializer


class DeliveryViewSet(viewsets.ModelViewSet):
    queryset = Delivery.objects.select_related(
        'producer', 'producer__region', 'producer__commune',
        'campaign', 'received_by'
    ).all()
    serializer_class = DeliverySerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = [
        'producer', 'campaign', 'status', 'product',
        'producer__region', 'delivery_date'
    ]
    search_fields = ['product', 'buyer', 'collection_center', 'producer__name', 'producer__code']
    ordering_fields = ['delivery_date', 'quantity', 'unit_price', 'total_price', 'created_at']
    ordering = ['-delivery_date']


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def delivery_stats(request):
    """Get delivery statistics"""
    qs = Delivery.objects.all()
    stats = {
        'total': qs.count(),
        'pending': qs.filter(status='pending').count(),
        'in_transit': qs.filter(status='in_transit').count(),
        'delivered': qs.filter(status='delivered').count(),
        'cancelled': qs.filter(status='cancelled').count(),
        'total_quantity': float(qs.aggregate(Sum('quantity'))['quantity__sum'] or 0),
        'total_revenue': float(qs.aggregate(Sum('total_price'))['total_price__sum'] or 0),
    }
    return Response(stats)