"""
Views for Productions App
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from django.db.models import Count, Sum, Avg
from django.db.models.functions import TruncMonth

from .models import Production, ProductionBatch
from .serializers import (
    ProductionListSerializer,
    ProductionDetailSerializer,
    ProductionCreateUpdateSerializer,
    ProductionBatchSerializer
)
from core.export_utils import build_export_response


class ProductionViewSet(viewsets.ModelViewSet):
    """ViewSet for Production"""
    queryset = Production.objects.select_related(
        'parcel', 'parcel__producer', 'parcel__producer__region',
        'parcel__producer__commune', 'season', 'quality_grade', 'registered_by'
    ).all()
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = [
        'parcel', 'parcel__producer', 'parcel__producer__region',
        'season', 'quality_grade', 'status'
    ]
    search_fields = ['code', 'parcel__code', 'parcel__producer__name', 'buyer']
    ordering_fields = ['harvest_date', 'weight_green', 'weight_prepared', 'created_at']
    ordering = ['-harvest_date']
    
    def get_serializer_class(self):
        if self.action == 'list':
            return ProductionListSerializer
        elif self.action in ['create', 'update', 'partial_update']:
            return ProductionCreateUpdateSerializer
        return ProductionDetailSerializer
    
    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Get production statistics"""
        queryset = self.filter_queryset(self.get_queryset())
        
        stats = {
            'total_records': queryset.count(),
            'total_weight_green': float(queryset.aggregate(Sum('weight_green'))['weight_green__sum'] or 0),
            'total_weight_prepared': float(queryset.aggregate(Sum('weight_prepared'))['weight_prepared__sum'] or 0),
            'total_pods': queryset.aggregate(Sum('pods_count'))['pods_count__sum'] or 0,
            'avg_conversion_rate': None,
            'by_status': {},
            'by_quality_grade': list(
                queryset.exclude(quality_grade__isnull=True)
                .values('quality_grade__name')
                .annotate(
                    count=Count('id'),
                    total_weight=Sum('weight_green')
                )
                .order_by('-count')
            ),
            'by_region': list(
                queryset.values('parcel__producer__region__name')
                .annotate(
                    count=Count('id'),
                    total_weight=Sum('weight_green')
                )
                .order_by('-total_weight')
            ),
            'by_month': list(
                queryset.annotate(month=TruncMonth('harvest_date'))
                .values('month')
                .annotate(
                    count=Count('id'),
                    total_weight=Sum('weight_green')
                )
                .order_by('month')
            ),
        }
        
        # Calculate average conversion rate
        with_prepared = queryset.exclude(weight_prepared__isnull=True)
        if with_prepared.exists():
            total_green = float(with_prepared.aggregate(Sum('weight_green'))['weight_green__sum'] or 0)
            total_prepared = float(with_prepared.aggregate(Sum('weight_prepared'))['weight_prepared__sum'] or 0)
            if total_green > 0:
                stats['avg_conversion_rate'] = round((total_prepared / total_green) * 100, 2)
        
        for status_code, label in Production.STATUS_CHOICES:
            stats['by_status'][status_code] = queryset.filter(status=status_code).count()
        
        return Response(stats)
    
    @action(detail=False, methods=['get'])
    def by_season(self, request):
        """Get production by season"""
        queryset = self.get_queryset()
        data = queryset.values('season__name', 'season__year').annotate(
            count=Count('id'),
            total_weight_green=Sum('weight_green'),
            total_weight_prepared=Sum('weight_prepared'),
            total_pods=Sum('pods_count')
        ).order_by('-season__year')
        return Response(list(data))
    
    @action(detail=True, methods=['post'])
    def update_status(self, request, pk=None):
        """Update production status"""
        production = self.get_object()
        new_status = request.data.get('status')
        if new_status not in dict(Production.STATUS_CHOICES):
            return Response(
                {'error': 'Statut invalide'},
                status=status.HTTP_400_BAD_REQUEST
            )
        production.status = new_status
        
        # Update related dates based on status
        if new_status == 'drying' and not production.drying_start_date:
            production.drying_start_date = request.data.get('date')
        elif new_status == 'curing':
            if not production.drying_end_date:
                production.drying_end_date = request.data.get('date')
            if not production.curing_start_date:
                production.curing_start_date = request.data.get('date')
        elif new_status == 'ready' and not production.curing_end_date:
            production.curing_end_date = request.data.get('date')
        elif new_status == 'sold':
            production.sale_date = request.data.get('date')
            production.sale_price = request.data.get('sale_price')
            production.buyer = request.data.get('buyer')
        
        production.save()
        return Response(ProductionDetailSerializer(production).data)
    
    @action(detail=False, methods=['get'])
    def export(self, request):
        """Export productions data in xlsx, csv, pdf, or json format"""
        queryset = self.filter_queryset(self.get_queryset())
        export_format = request.query_params.get('format', 'xlsx')
        data = ProductionDetailSerializer(queryset, many=True).data
        content_type, content, filename = build_export_response(data, 'productions', export_format)
        response = Response(content, content_type=content_type)
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        return response


class ProductionBatchViewSet(viewsets.ModelViewSet):
    """ViewSet for Production Batch"""
    queryset = ProductionBatch.objects.prefetch_related('productions').all()
    serializer_class = ProductionBatchSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter]
    filterset_fields = ['quality_grade']
    search_fields = ['code', 'name']
    ordering = ['-created_at']
