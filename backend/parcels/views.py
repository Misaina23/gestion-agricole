"""
Views for Parcels App
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from django.db.models import Count, Sum, Avg
from django.http import HttpResponse
from django.conf import settings
from datetime import date
import qrcode
import io

from .models import Parcel, ParcelPhoto
from .serializers import (
    ParcelListSerializer,
    ParcelDetailSerializer,
    ParcelCreateUpdateSerializer,
    ParcelPhotoSerializer
)
from core.export_utils import build_export_response


class ParcelViewSet(viewsets.ModelViewSet):
    """ViewSet for Parcel"""
    queryset = Parcel.objects.select_related(
        'producer', 'producer__region', 'producer__commune', 'variety', 'registered_by'
    ).all()
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = [
        'producer', 'producer__region', 'producer__commune',
        'variety', 'status', 'is_certified', 'soil_type', 'irrigation'
    ]
    search_fields = ['code', 'name', 'producer__name', 'producer__code']
    ordering_fields = ['created_at', 'area', 'vanilla_plants', 'code']
    ordering = ['-created_at']
    
    def get_serializer_class(self):
        if self.action == 'list':
            return ParcelListSerializer
        elif self.action in ['create', 'update', 'partial_update']:
            return ParcelCreateUpdateSerializer
        return ParcelDetailSerializer
    
    @action(detail=True, methods=['get'])
    def qr_code(self, request, pk=None):
        """Generate QR code for a parcel"""
        parcel = self.get_object()
        qr_data = f"parcel:{parcel.code}"
        qr = qrcode.QRCode(version=3, box_size=10, border=2)
        qr.add_data(qr_data)
        qr.make(fit=True)
        img = qr.make_image(fill_color="black", back_color="white")
        buffer = io.BytesIO()
        img.save(buffer, format='PNG')
        buffer.seek(0)
        return HttpResponse(buffer, content_type='image/png')
    
    @action(detail=True, methods=['get'])
    def qr_code_data(self, request, pk=None):
        """Get QR code data for mobile generation"""
        parcel = self.get_object()
        return Response({
            'qr_data': f"parcel:{parcel.code}",
            'type': 'parcel',
            'code': parcel.code,
            'name': parcel.name or f"Parcelle {parcel.code}",
            'producer': parcel.producer.name,
            'area': float(parcel.area),
            'url': f"{settings.API_URL}/parcels/{parcel.id}/",
        })
    
    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Get parcel statistics"""
        queryset = self.filter_queryset(self.get_queryset())
        agg = queryset.aggregate(
            total_area=Sum('area'),
            total_plants=Sum('vanilla_plants'),
            total_productive=Sum('productive_plants'),
            avg_area=Avg('area'),
            avg_plants=Avg('vanilla_plants'),
        )
        status_counts = dict(
            queryset.values('status').annotate(c=Count('id')).values_list('status', 'c')
        )
        stats = {
            'total': queryset.count(),
            'total_area': float(agg['total_area'] or 0),
            'total_plants': agg['total_plants'] or 0,
            'total_productive': agg['total_productive'] or 0,
            'avg_area': float(agg['avg_area'] or 0),
            'avg_plants_per_parcel': agg['avg_plants'] or 0,
            'certified': queryset.filter(is_certified=True).count(),
            'by_status': {code: status_counts.get(code, 0) for code, _ in Parcel.STATUS_CHOICES},
            'by_region': list(
                queryset.values('producer__region__name')
                .annotate(
                    count=Count('id'),
                    total_area=Sum('area'),
                    total_plants=Sum('vanilla_plants')
                )
                .order_by('-count')
            ),
            'by_variety': list(
                queryset.exclude(variety__isnull=True)
                .values('variety__name')
                .annotate(count=Count('id'))
                .order_by('-count')
            ),
            'by_soil_type': list(
                queryset.exclude(soil_type__isnull=True)
                .values('soil_type')
                .annotate(count=Count('id'))
                .order_by('-count')
            ),
        }
        return Response(stats)
    
    @action(detail=True, methods=['get'])
    def productions(self, request, pk=None):
        """Get all productions for a parcel"""
        parcel = self.get_object()
        from productions.serializers import ProductionListSerializer
        productions = parcel.productions.all()
        serializer = ProductionListSerializer(productions, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def add_photo(self, request, pk=None):
        """Add a photo to a parcel"""
        parcel = self.get_object()
        serializer = ParcelPhotoSerializer(data={
            **request.data,
            'parcel': parcel.id
        })
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    @action(detail=True, methods=['post'])
    def verify(self, request, pk=None):
        """Mark parcel as verified"""
        parcel = self.get_object()
        parcel.is_certified = True
        parcel.certification_date = date.today()
        parcel.status = 'active'
        parcel.save()
        serializer = ParcelDetailSerializer(parcel)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def map_data(self, request):
        """Get parcel data for map display"""
        queryset = self.filter_queryset(
            self.get_queryset().exclude(latitude__isnull=True, longitude__isnull=True)
        )
        data = queryset.values(
            'id', 'code', 'name', 'latitude', 'longitude',
            'area', 'vanilla_plants', 'status', 'is_certified',
            'polygon_coordinates',
            'producer__name', 'producer__code',
            'producer__region__name', 'producer__commune__name'
        )[:1000]  # Limit for performance
        return Response(list(data))
    
    @action(detail=False, methods=['get'])
    def export(self, request):
        """Export parcels data in xlsx, csv, pdf, or json format"""
        queryset = self.filter_queryset(self.get_queryset())
        export_format = request.query_params.get('format', 'xlsx')
        data = ParcelDetailSerializer(queryset, many=True).data
        content_type, content, filename = build_export_response(data, 'parcels', export_format)
        response = Response(content, content_type=content_type)
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        return response


class ParcelPhotoViewSet(viewsets.ModelViewSet):
    """ViewSet for Parcel Photos"""
    queryset = ParcelPhoto.objects.select_related('parcel').all()
    serializer_class = ParcelPhotoSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['parcel']
