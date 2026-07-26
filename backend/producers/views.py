"""
Views for Producers App
"""
import logging
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from django.db.models import Count, Sum, Case, When, Value, DecimalField
from django.db.models.functions import Coalesce
from django.http import HttpResponse
from django.conf import settings
import qrcode
import io
import os

from .models import Producer, Cooperative
from .serializers import (
    ProducerListSerializer,
    ProducerDetailSerializer,
    ProducerCreateUpdateSerializer,
    CooperativeSerializer
)
from core.export_utils import build_export_response

logger = logging.getLogger(__name__)


class ProducerViewSet(viewsets.ModelViewSet):
    """ViewSet for Producer"""
    lookup_value_regex = r'\d+'
    queryset = (
        Producer.objects.select_related(
            'region', 'commune', 'fokontany', 'cooperative', 'registered_by'
        )
        .prefetch_related('parcels')
        .annotate(
            ann_parcels_count=Count('parcels'),
            ann_total_area=Coalesce(Sum('parcels__area'), Value(0), output_field=DecimalField()),
            ann_total_plants=Coalesce(Sum('parcels__vanilla_plants'), Value(0)),
        )
    )
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['region', 'commune', 'fokontany', 'status', 'is_certified', 'cooperative']
    search_fields = ['code', 'name', 'phone', 'cin', 'email']
    ordering_fields = ['created_at', 'name', 'code', 'status']
    ordering = ['-created_at']
    
    def get_serializer_class(self):
        if self.action == 'list':
            return ProducerListSerializer
        elif self.action in ['create', 'update', 'partial_update']:
            return ProducerCreateUpdateSerializer
        return ProducerDetailSerializer

    def create(self, request, *args, **kwargs):
        logger.info('Producer create request received', extra={'user_id': getattr(request.user, 'id', None), 'payload': request.data})
        try:
            return super().create(request, *args, **kwargs)
        except ValidationError as exc:
            logger.warning('Producer create validation failed', extra={'user_id': getattr(request.user, 'id', None), 'payload': request.data, 'errors': exc.detail})
            return Response(exc.detail, status=status.HTTP_400_BAD_REQUEST)
        except Exception as exc:
            logger.exception('Producer create failed', extra={'user_id': getattr(request.user, 'id', None), 'payload': request.data})
            return Response({'detail': 'Échec de la création du producteur.', 'error': str(exc)}, status=status.HTTP_400_BAD_REQUEST)

    def update(self, request, *args, **kwargs):
        logger.info('Producer update request received', extra={'user_id': getattr(request.user, 'id', None), 'payload': request.data})
        try:
            return super().update(request, *args, **kwargs)
        except ValidationError as exc:
            logger.warning('Producer update validation failed', extra={'user_id': getattr(request.user, 'id', None), 'payload': request.data, 'errors': exc.detail})
            return Response(exc.detail, status=status.HTTP_400_BAD_REQUEST)
        except Exception as exc:
            logger.exception('Producer update failed', extra={'user_id': getattr(request.user, 'id', None), 'payload': request.data})
            return Response({'detail': 'Échec de la mise à jour du producteur.', 'error': str(exc)}, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['get'])
    def qr_code(self, request, pk=None):
        """Generate QR code for a producer"""
        producer = self.get_object()
        qr_data = f"producer:{producer.code}"
        qr = qrcode.QRCode(version=3, box_size=10, border=2)
        qr.add_data(qr_data)
        qr.make(fit=True)
        img = qr.make_image(fill_color="black", back_color="white")
        buffer = io.BytesIO()
        img.save(buffer, format='PNG')
        buffer.seek(0)
        return HttpResponse(buffer, content_type='image/png')
    
    @action(detail=False, methods=['get'])
    def qr_code_batch(self, request):
        """Generate QR codes for multiple producers"""
        queryset = self.filter_queryset(self.get_queryset())
        ids = request.query_params.get('ids', '').split(',')
        producers = queryset.filter(id__in=ids) if ids[0] else queryset[:50]
        results = []
        for producer in producers:
            results.append({
                'id': producer.id,
                'code': producer.code,
                'name': producer.name,
                'qr_data': f"producer:{producer.code}",
            })
        return Response(results)
    
    @action(detail=True, methods=['get'])
    def qr_code_data(self, request, pk=None):
        """Get QR code data (JSON endpoint for mobile generation)"""
        producer = self.get_object()
        return Response({
            'qr_data': f"producer:{producer.code}",
            'type': 'producer',
            'code': producer.code,
            'name': producer.name,
            'url': f"{settings.API_URL}/producers/{producer.id}/",
        })
    
    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Get producer statistics"""
        queryset = self.filter_queryset(self.get_queryset())
        
        status_counts = dict(
            queryset.values('status').annotate(c=Count('id')).values_list('status', 'c')
        )
        stats = {
            'total': queryset.count(),
            'by_status': {code: status_counts.get(code, 0) for code, _ in Producer.STATUS_CHOICES},
            'certified': queryset.filter(is_certified=True).count(),
            'by_region': list(
                queryset.values('region__name')
                .annotate(count=Count('id'))
                .order_by('-count')
            ),
            'by_cooperative': list(
                queryset.exclude(cooperative__isnull=True)
                .values('cooperative__name')
                .annotate(count=Count('id'))
                .order_by('-count')[:10]
            ),
        }
        return Response(stats)
    
    @action(detail=True, methods=['get'])
    def parcels(self, request, pk=None):
        """Get all parcels for a producer"""
        producer = self.get_object()
        from parcels.serializers import ParcelListSerializer
        parcels = producer.parcels.all()
        serializer = ParcelListSerializer(parcels, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def productions(self, request, pk=None):
        """Get all productions for a producer"""
        producer = self.get_object()
        from productions.serializers import ProductionListSerializer
        from productions.models import Production
        productions = Production.objects.filter(parcel__producer=producer)
        serializer = ProductionListSerializer(productions, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def inspections(self, request, pk=None):
        """Get all inspections for a producer"""
        producer = self.get_object()
        from inspections.serializers import InspectionListSerializer
        from inspections.models import Inspection
        inspections = Inspection.objects.filter(producer=producer)
        serializer = InspectionListSerializer(inspections, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def certify(self, request, pk=None):
        """Certify a producer"""
        producer = self.get_object()
        producer.is_certified = True
        producer.certification_date = request.data.get('certification_date')
        producer.certification_number = request.data.get('certification_number')
        producer.certification_expiry = request.data.get('certification_expiry')
        producer.save()
        return Response(ProducerDetailSerializer(producer).data)
    
    @action(detail=False, methods=['get'])
    def export(self, request):
        """Export producers data in xlsx, csv, pdf, or json format"""
        queryset = self.filter_queryset(self.get_queryset())
        export_format = request.query_params.get('format', 'xlsx')
        data = ProducerDetailSerializer(queryset, many=True).data
        content_type, content, filename = build_export_response(data, 'producers', export_format)
        response = Response(content, content_type=content_type)
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        return response


class CooperativeViewSet(viewsets.ModelViewSet):
    """ViewSet for Cooperative"""
    queryset = Cooperative.objects.select_related('region', 'commune').all()
    serializer_class = CooperativeSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['region', 'commune', 'is_active']
    search_fields = ['code', 'name', 'president']
    ordering_fields = ['created_at', 'name']
    ordering = ['name']
    
    @action(detail=True, methods=['get'])
    def members(self, request, pk=None):
        """Get all members of a cooperative"""
        cooperative = self.get_object()
        members = cooperative.members.all()
        serializer = ProducerListSerializer(members, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Get cooperative statistics"""
        stats = {
            'total': Cooperative.objects.count(),
            'active': Cooperative.objects.filter(is_active=True).count(),
            'total_members': Producer.objects.exclude(cooperative__isnull=True).count(),
            'by_region': list(
                Cooperative.objects.values('region__name')
                .annotate(count=Count('id'))
                .order_by('-count')
            ),
        }
        return Response(stats)
