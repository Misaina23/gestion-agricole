"""
Views for Inspections App
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from django.db.models import Count, Avg
from django.utils import timezone

from .models import Inspection, InspectionChecklist, InspectionPhoto, InspectionTemplate
from .serializers import (
    InspectionListSerializer,
    InspectionDetailSerializer,
    InspectionCreateUpdateSerializer,
    InspectionChecklistSerializer,
    InspectionPhotoSerializer,
    InspectionTemplateSerializer
)
from core.export_utils import build_export_response


class InspectionViewSet(viewsets.ModelViewSet):
    """ViewSet for Inspection"""
    queryset = Inspection.objects.select_related(
        'producer', 'producer__region', 'producer__commune',
        'parcel', 'inspector'
    ).all()
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = [
        'producer', 'parcel', 'producer__region', 'inspection_type',
        'inspector', 'status', 'result', 'follow_up_required'
    ]
    search_fields = ['code', 'producer__name', 'producer__code', 'observations']
    ordering_fields = ['planned_date', 'actual_date', 'score_overall', 'created_at']
    ordering = ['-planned_date']
    
    def get_serializer_class(self):
        if self.action == 'list':
            return InspectionListSerializer
        elif self.action in ['create', 'update', 'partial_update']:
            return InspectionCreateUpdateSerializer
        return InspectionDetailSerializer
    
    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Get inspection statistics"""
        queryset = self.filter_queryset(self.get_queryset())
        
        today = timezone.now().date()
        
        stats = {
            'total': queryset.count(),
            'by_status': {},
            'by_result': {},
            'by_type': {},
            'avg_score': queryset.aggregate(Avg('score_overall'))['score_overall__avg'],
            'overdue': queryset.filter(
                status__in=['planned', 'in_progress'],
                planned_date__lt=today
            ).count(),
            'upcoming_week': queryset.filter(
                status='planned',
                planned_date__gte=today,
                planned_date__lte=today + timezone.timedelta(days=7)
            ).count(),
            'follow_up_required': queryset.filter(follow_up_required=True).count(),
            'by_inspector': list(
                queryset.exclude(inspector__isnull=True)
                .values('inspector__first_name', 'inspector__last_name')
                .annotate(count=Count('id'))
                .order_by('-count')[:10]
            ),
            'by_region': list(
                queryset.values('producer__region__name')
                .annotate(
                    count=Count('id'),
                    avg_score=Avg('score_overall')
                )
                .order_by('-count')
            ),
            'compliance_rate': None
        }
        
        for status_code, label in Inspection.STATUS_CHOICES:
            stats['by_status'][status_code] = queryset.filter(status=status_code).count()
        
        for result_code, label in Inspection.RESULT_CHOICES:
            stats['by_result'][result_code] = queryset.filter(result=result_code).count()
        
        for type_code, label in Inspection.TYPE_CHOICES:
            stats['by_type'][type_code] = queryset.filter(inspection_type=type_code).count()
        
        # Calculate compliance rate
        completed = queryset.filter(status='completed').count()
        if completed > 0:
            passed = queryset.filter(status='completed', result='passed').count()
            stats['compliance_rate'] = round((passed / completed) * 100, 1)
        
        return Response(stats)
    
    @action(detail=False, methods=['get'])
    def upcoming(self, request):
        """Get upcoming inspections"""
        today = timezone.now().date()
        queryset = self.get_queryset().filter(
            status='planned',
            planned_date__gte=today
        ).order_by('planned_date')[:20]
        serializer = InspectionListSerializer(queryset, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def overdue(self, request):
        """Get overdue inspections"""
        today = timezone.now().date()
        queryset = self.get_queryset().filter(
            status__in=['planned', 'in_progress'],
            planned_date__lt=today
        ).order_by('planned_date')
        serializer = InspectionListSerializer(queryset, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def start(self, request, pk=None):
        """Start an inspection"""
        inspection = self.get_object()
        inspection.status = 'in_progress'
        inspection.actual_date = timezone.now().date()
        if not inspection.inspector:
            inspection.inspector = request.user
        inspection.save()
        return Response(InspectionDetailSerializer(inspection).data)
    
    @action(detail=True, methods=['post'])
    def complete(self, request, pk=None):
        """Complete an inspection"""
        inspection = self.get_object()
        inspection.status = 'completed'
        inspection.result = request.data.get('result', 'pending')
        inspection.score_overall = request.data.get('score_overall')
        inspection.observations = request.data.get('observations')
        inspection.recommendations = request.data.get('recommendations')
        inspection.non_conformities = request.data.get('non_conformities')
        inspection.corrective_actions = request.data.get('corrective_actions')
        inspection.follow_up_required = request.data.get('follow_up_required', False)
        if inspection.follow_up_required:
            inspection.follow_up_date = request.data.get('follow_up_date')
        inspection.save()
        return Response(InspectionDetailSerializer(inspection).data)
    
    @action(detail=True, methods=['post'])
    def add_checklist_item(self, request, pk=None):
        """Add a checklist item to an inspection"""
        inspection = self.get_object()
        serializer = InspectionChecklistSerializer(data={
            **request.data,
            'inspection': inspection.id
        })
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    @action(detail=True, methods=['post'])
    def add_photo(self, request, pk=None):
        """Add a photo to an inspection"""
        inspection = self.get_object()
        serializer = InspectionPhotoSerializer(data={
            **request.data,
            'inspection': inspection.id
        })
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    @action(detail=False, methods=['get'])
    def export(self, request):
        """Export inspections data in xlsx, csv, pdf, or json format"""
        queryset = self.filter_queryset(self.get_queryset())
        export_format = request.query_params.get('format', 'xlsx')
        data = InspectionDetailSerializer(queryset, many=True).data
        content_type, content, filename = build_export_response(data, 'inspections', export_format)
        response = Response(content, content_type=content_type)
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        return response


class InspectionChecklistViewSet(viewsets.ModelViewSet):
    """ViewSet for Inspection Checklist Items"""
    queryset = InspectionChecklist.objects.select_related('inspection').all()
    serializer_class = InspectionChecklistSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['inspection', 'category', 'is_compliant']


class InspectionPhotoViewSet(viewsets.ModelViewSet):
    """ViewSet for Inspection Photos"""
    queryset = InspectionPhoto.objects.select_related('inspection').all()
    serializer_class = InspectionPhotoSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['inspection', 'category']


class InspectionTemplateViewSet(viewsets.ModelViewSet):
    """ViewSet for Inspection Templates"""
    queryset = InspectionTemplate.objects.all()
    serializer_class = InspectionTemplateSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter]
    filterset_fields = ['inspection_type', 'is_active']
    search_fields = ['name']
