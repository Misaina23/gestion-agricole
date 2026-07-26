"""
Views for Core App
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from django.db.models import Avg, Count, F, Q, Sum
from django.db.models.functions import TruncMonth
from django.utils import timezone
from datetime import timedelta, date

from .models import Region, Commune, District, Fokontany, VanillaVariety, QualityGrade, Season, SyncLog
from .serializers import (
    RegionSerializer, CommuneSerializer, DistrictSerializer, FokontanySerializer,
    VanillaVarietySerializer, QualityGradeSerializer, SeasonSerializer,
    SyncLogSerializer
)


class RegionViewSet(viewsets.ModelViewSet):
    """ViewSet for Region"""
    queryset = Region.objects.all()
    serializer_class = RegionSerializer
    permission_classes = [AllowAny]
    pagination_class = None
    filter_backends = [DjangoFilterBackend, SearchFilter]
    filterset_fields = ['is_active']
    search_fields = ['name', 'code']
    
    @action(detail=True, methods=['get'])
    def communes(self, request, pk=None):
        """Get all communes for a region"""
        region = self.get_object()
        communes = region.communes.filter(is_active=True)
        serializer = CommuneSerializer(communes, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def districts(self, request, pk=None):
        """Get all districts for a region"""
        region = self.get_object()
        districts = region.districts.filter(is_active=True)
        serializer = DistrictSerializer(districts, many=True)
        return Response(serializer.data)


class DistrictViewSet(viewsets.ModelViewSet):
    """ViewSet for District"""
    queryset = District.objects.select_related('region').all()
    serializer_class = DistrictSerializer
    permission_classes = [AllowAny]
    pagination_class = None
    filter_backends = [DjangoFilterBackend, SearchFilter]
    filterset_fields = ['region', 'is_active']
    search_fields = ['name', 'code']

    @action(detail=True, methods=['get'])
    def communes(self, request, pk=None):
        """Get all communes for a district"""
        district = self.get_object()
        communes = district.communes.filter(is_active=True)
        serializer = CommuneSerializer(communes, many=True)
        return Response(serializer.data)


class CommuneViewSet(viewsets.ModelViewSet):
    """ViewSet for Commune"""
    queryset = Commune.objects.select_related('region', 'district').all()
    serializer_class = CommuneSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter]
    filterset_fields = ['region', 'district', 'is_active']
    search_fields = ['name', 'code']
    
    @action(detail=True, methods=['get'])
    def fokontanys(self, request, pk=None):
        """Get all fokontanys for a commune"""
        commune = self.get_object()
        fokontanys = commune.fokontanys.filter(is_active=True)
        serializer = FokontanySerializer(fokontanys, many=True)
        return Response(serializer.data)


class FokontanyViewSet(viewsets.ModelViewSet):
    """ViewSet for Fokontany"""
    queryset = Fokontany.objects.select_related('commune', 'commune__region').all()
    serializer_class = FokontanySerializer
    filter_backends = [DjangoFilterBackend, SearchFilter]
    filterset_fields = ['commune', 'commune__region', 'is_active']
    search_fields = ['name', 'code']


class VanillaVarietyViewSet(viewsets.ModelViewSet):
    """ViewSet for Vanilla Variety"""
    queryset = VanillaVariety.objects.all()
    serializer_class = VanillaVarietySerializer
    filter_backends = [DjangoFilterBackend, SearchFilter]
    pagination_class = None
    filterset_fields = ['is_active']
    search_fields = ['name', 'code']


class QualityGradeViewSet(viewsets.ModelViewSet):
    """ViewSet for Quality Grade"""
    queryset = QualityGrade.objects.all()
    serializer_class = QualityGradeSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter]
    pagination_class = None
    filterset_fields = ['is_active']
    search_fields = ['name', 'code']


class SeasonViewSet(viewsets.ModelViewSet):
    """ViewSet for Season"""
    queryset = Season.objects.all()
    serializer_class = SeasonSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter]
    pagination_class = None
    filterset_fields = ['year', 'is_current', 'is_active']
    search_fields = ['name']
    
    @action(detail=False, methods=['get'])
    def current(self, request):
        """Get current season"""
        season = Season.objects.filter(is_current=True).first()
        if season:
            return Response(SeasonSerializer(season).data)
        return Response({'detail': 'Aucune saison en cours'}, status=status.HTTP_404_NOT_FOUND)


class SyncLogViewSet(viewsets.ModelViewSet):
    """ViewSet for Sync Log"""
    queryset = SyncLog.objects.select_related('user').all()
    serializer_class = SyncLogSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['user', 'status']
    search_fields = ['user__username', 'user__first_name']
    ordering_fields = ['started_at', 'completed_at']
    ordering = ['-started_at']


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard_stats(request):
    """Get dashboard statistics"""
    from producers.models import Producer
    from parcels.models import Parcel
    from productions.models import Production
    from inspections.models import Inspection
    from accounts.models import User
    from deliveries.models import Delivery
    from campaigns.models import Campaign, CampaignProducer
    from inputs.models import InputDistribution

    now = timezone.now()
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

    current_season = Season.objects.filter(is_current=True).first()

    producers_qs = Producer.objects.all()
    parcels_qs = Parcel.objects.all()
    productions_qs = Production.objects.all()
    inspections_qs = Inspection.objects.all()

    producer_agg = producers_qs.aggregate(
        total=Count('id'),
        active=Count('id', filter=Q(status='active')),
        pending=Count('id', filter=Q(status='pending')),
        inactive=Count('id', filter=Q(status='inactive')),
        new_this_month=Count('id', filter=Q(created_at__gte=month_start)),
    )
    producer_stats = {
        'total': producer_agg['total'],
        'active': producer_agg['active'],
        'pending': producer_agg['pending'],
        'inactive': producer_agg['inactive'],
        'new_this_month': producer_agg['new_this_month'],
    }

    parcel_agg = parcels_qs.aggregate(
        total=Count('id'),
        active=Count('id', filter=Q(status='active')),
        inactive=Count('id', filter=Q(status='inactive')),
        fallow=Count('id', filter=Q(status='fallow')),
        new=Count('id', filter=Q(status='new')),
        total_surface=Sum('area'),
        total_vanilla_trees=Sum('vanilla_plants'),
    )
    parcel_stats = {
        'total': parcel_agg['total'],
        'active': parcel_agg['active'],
        'inactive': parcel_agg['inactive'],
        'fallow': parcel_agg['fallow'],
        'new': parcel_agg['new'],
        'total_surface': float(parcel_agg['total_surface'] or 0),
        'total_vanilla_trees': parcel_agg['total_vanilla_trees'] or 0,
    }

    quality_counts = {
        'premium': 0,
        'standard': 0,
        'second': 0,
        'other': 0,
    }

    for row in productions_qs.values('quality_grade__name').annotate(count=Count('id')):
        label = (row['quality_grade__name'] or '').lower()
        if 'premium' in label:
            quality_counts['premium'] += row['count']
        elif 'standard' in label:
            quality_counts['standard'] += row['count']
        elif 'second' in label or 'sec' in label:
            quality_counts['second'] += row['count']
        else:
            quality_counts['other'] += row['count']

    status_map = {
        'harvested': 'collected',
        'drying': 'processing',
        'curing': 'processing',
        'ready': 'processing',
        'sold': 'shipped',
    }
    production_status_counts = {
        'collected': 0,
        'processing': 0,
        'shipped': 0,
        'unknown': 0,
    }
    for row in productions_qs.values('status').annotate(count=Count('id')):
        mapped = status_map.get(row['status'], 'unknown')
        production_status_counts[mapped] += row['count']

    month_start = date(now.year, now.month, 1)
    month_offsets = [5, 4, 3, 2, 1, 0]
    months = []
    for offset in month_offsets:
        year = month_start.year
        month = month_start.month - offset
        while month <= 0:
            month += 12
            year -= 1
        months.append(date(year, month, 1))

    monthly_harvest_qs = productions_qs.filter(harvest_date__gte=months[0])
    if current_season:
        monthly_harvest_qs = monthly_harvest_qs.filter(season=current_season)
    monthly_harvest = [
        {
            'month': m.strftime('%b %Y'),
            'green_weight': 0.0,
            'prepared_weight': 0.0,
        }
        for m in months
    ]
    for row in monthly_harvest_qs.annotate(month=TruncMonth('harvest_date')).values('month').annotate(
        green_weight=Sum('weight_green'),
        prepared_weight=Sum('weight_prepared')
    ).order_by('month'):
        month_label = row['month'].strftime('%b %Y')
        for entry in monthly_harvest:
            if entry['month'] == month_label:
                entry['green_weight'] = float(row['green_weight'] or 0)
                entry['prepared_weight'] = float(row['prepared_weight'] or 0)
                break

    production_agg = productions_qs.aggregate(
        total=Count('id'),
        total_green_weight=Sum('weight_green'),
        total_prepared_weight=Sum('weight_prepared'),
        total_revenue=Sum('sale_price'),
    )
    production_stats = {
        'total': production_agg['total'],
        'total_green_weight': float(production_agg['total_green_weight'] or 0),
        'total_prepared_weight': float(production_agg['total_prepared_weight'] or 0),
        'total_revenue': float(production_agg['total_revenue'] or 0),
        'by_quality': quality_counts,
        'by_status': production_status_counts,
    }

    inspection_agg = inspections_qs.aggregate(
        total=Count('id'),
        passed=Count('id', filter=Q(result='passed')),
        failed=Count('id', filter=Q(result='failed')),
        conditional=Count('id', filter=Q(result='conditional')),
        pending=Count('id', filter=Q(result='pending')),
        average_score=Avg('score_overall'),
    )
    inspection_stats = {
        'total': inspection_agg['total'],
        'passed': inspection_agg['passed'],
        'failed': inspection_agg['failed'],
        'conditional': inspection_agg['conditional'],
        'pending': inspection_agg['pending'],
        'average_score': float(inspection_agg['average_score'] or 0),
    }

    region_stats = list(
        producers_qs.values('region__name')
        .annotate(
            producers=Count('id', distinct=True),
            parcels_count=Count('parcels__id', distinct=True),
            surface=Sum('parcels__area')
        )
        .order_by('-producers')[:10]
    )

    recent_producers = list(
        producers_qs.select_related('region')
        .annotate(parcels_count=Count('parcels__id'))
        .order_by('-created_at')[:4]
        .values('id', 'code', 'name', 'status', 'parcels_count', 'created_at', region_name=F('region__name'))
    )

    delivery_agg = Delivery.objects.aggregate(
        total=Count('id'),
        pending=Count('id', filter=Q(status='pending')),
        in_transit=Count('id', filter=Q(status='in_transit')),
        delivered=Count('id', filter=Q(status='delivered')),
        total_quantity=Sum('quantity'),
        total_revenue=Sum('total_price'),
    )
    campaign_agg = Campaign.objects.aggregate(
        total=Count('id'),
        active=Count('id', filter=Q(status='active')),
        pending=Count('id', filter=Q(status='pending')),
        completed=Count('id', filter=Q(status='completed')),
        cancelled=Count('id', filter=Q(status='cancelled')),
    )
    input_agg = InputDistribution.objects.aggregate(
        total=Count('id'),
        total_quantity=Sum('quantity'),
        total_value=Sum('total_value'),
    )

    stats = {
        'producers': producer_stats,
        'parcels': parcel_stats,
        'productions': production_stats,
        'inspections': inspection_stats,
        'deliveries': {
            'total': delivery_agg['total'],
            'pending': delivery_agg['pending'],
            'in_transit': delivery_agg['in_transit'],
            'delivered': delivery_agg['delivered'],
            'total_quantity': float(delivery_agg['total_quantity'] or 0),
            'total_revenue': float(delivery_agg['total_revenue'] or 0),
        },
        'campaigns': {
            'total': campaign_agg['total'],
            'active': campaign_agg['active'],
            'pending': campaign_agg['pending'],
            'completed': campaign_agg['completed'],
            'cancelled': campaign_agg['cancelled'],
            'producers_enrolled': CampaignProducer.objects.filter(is_active=True).count(),
        },
        'inputs': {
            'total': input_agg['total'],
            'total_quantity': float(input_agg['total_quantity'] or 0),
            'total_value': float(input_agg['total_value'] or 0),
        },
        'monthly_harvest': monthly_harvest,
        'recent_producers': recent_producers,
        'regions': [
            {
                'name': row['region__name'] or 'Non définie',
                'producers': row['producers'],
                'parcels': row['parcels_count'],
                'surface': float(row['surface'] or 0),
            }
            for row in region_stats
        ],
        'agents': {
            'total': User.objects.filter(is_field_agent=True).count(),
            'active': User.objects.filter(
                is_field_agent=True,
                last_sync__gte=timezone.now() - timedelta(hours=24)
            ).count(),
        },
        'current_season': SeasonSerializer(current_season).data if current_season else None,
    }

    return Response(stats)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard_activity(request):
    """Get recent activity for dashboard feed"""
    from accounts.models import User
    from producers.models import Producer
    from parcels.models import Parcel
    from productions.models import Production
    from inspections.models import Inspection
    
    limit = int(request.query_params.get('limit', 10))
    activities = []
    
    recent_productions = Production.objects.select_related(
        'parcel__producer', 'season', 'registered_by'
    ).order_by('-created_at')[:limit // 2]
    for prod in recent_productions:
        activities.append({
            'type': 'production',
            'id': prod.id,
            'code': prod.code,
            'message': f"Production de {prod.weight_green} kg sur {prod.parcel.name} ({prod.parcel.producer.name})",
            'date': prod.created_at.isoformat(),
            'status': prod.status,
            'user': prod.registered_by.full_name if prod.registered_by else 'Système',
        })
    
    recent_producers = Producer.objects.select_related('region', 'registered_by').order_by('-created_at')[:limit // 4]
    for producer in recent_producers:
        activities.append({
            'type': 'producer',
            'id': producer.id,
            'code': producer.code,
            'message': f"Nouveau producteur enregistré: {producer.name} ({producer.region.name})",
            'date': producer.created_at.isoformat(),
            'status': producer.status,
            'user': producer.registered_by.full_name if producer.registered_by else 'Système',
        })
    
    recent_inspections = Inspection.objects.select_related(
        'producer', 'parcel', 'inspector'
    ).order_by('-created_at')[:limit // 4]
    for inspection in recent_inspections:
        activities.append({
            'type': 'inspection',
            'id': inspection.id,
            'code': inspection.code,
            'message': f"Inspection {inspection.get_inspection_type_display()} réalisée pour {inspection.producer.name}",
            'date': inspection.created_at.isoformat(),
            'status': inspection.status,
            'user': inspection.inspector.full_name if inspection.inspector else 'Système',
        })
    
    activities.sort(key=lambda x: x['date'], reverse=True)
    return Response(activities[:limit])


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard_sync_status(request):
    """Get synchronization status for dashboard"""
    last_completed = SyncLog.objects.filter(status='completed').order_by('-completed_at').first()
    pending_sync = SyncLog.objects.filter(status__in=['pending', 'syncing']).count()

    last_sync = last_completed.completed_at.isoformat() if last_completed else None
    is_online = False
    if last_completed and timezone.now() - last_completed.completed_at <= timedelta(hours=24):
        is_online = True

    return Response({
        'last_sync': last_sync,
        'is_online': is_online,
        'pending_sync': pending_sync,
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def reference_data(request):
    """Get all reference data for dropdowns"""
    data = {
        'regions': RegionSerializer(Region.objects.filter(is_active=True), many=True).data,
        'varieties': VanillaVarietySerializer(VanillaVariety.objects.filter(is_active=True), many=True).data,
        'quality_grades': QualityGradeSerializer(QualityGrade.objects.filter(is_active=True), many=True).data,
        'seasons': SeasonSerializer(Season.objects.filter(is_active=True), many=True).data,
    }
    return Response(data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def parse_qr_code(request):
    """Parse a QR code scanned on mobile and return the relevant data for pre-filling forms"""
    qr_data = request.data.get('qr_data', '')
    if not qr_data:
        return Response({'error': 'qr_data requis'}, status=status.HTTP_400_BAD_REQUEST)
    try:
        qr_type, code_value = qr_data.split(':', 1)
    except ValueError:
        return Response({'error': 'Format QR code invalide. Attendu: type:code'}, status=status.HTTP_400_BAD_REQUEST)
    if qr_type == 'producer':
        from producers.serializers import ProducerDetailSerializer
        from producers.models import Producer
        try:
            producer = Producer.objects.select_related('region', 'commune', 'fokontany', 'cooperative').get(code__iexact=code_value)
        except Producer.DoesNotExist:
            return Response({'error': 'Producteur introuvable', 'type': qr_type, 'code': code_value}, status=status.HTTP_404_NOT_FOUND)
        data = ProducerDetailSerializer(producer).data
        return Response({
            'type': 'producer',
            'code': producer.code,
            'name': producer.name,
            'phone': producer.phone,
            'region': producer.region.name if producer.region else None,
            'commune': producer.commune.name if producer.commune else None,
            'fokontany': producer.fokontany.name if producer.fokontany else None,
            'address': producer.address,
            'gender': producer.gender,
            'cin': producer.cin,
            'parcels': [
                {
                    'code': p.code,
                    'name': p.name,
                    'area': float(p.area),
                    'variety': p.variety.name if p.variety else None,
                    'vanilla_plants': p.vanilla_plants,
                    'latitude': float(p.latitude) if p.latitude else None,
                    'longitude': float(p.longitude) if p.longitude else None,
                }
                for p in producer.parcels.all()
            ],
            'data': data,
        })
    elif qr_type == 'parcel':
        from parcels.serializers import ParcelDetailSerializer
        from parcels.models import Parcel
        try:
            parcel = Parcel.objects.select_related('producer', 'producer__region', 'producer__commune', 'variety').get(code__iexact=code_value)
        except Parcel.DoesNotExist:
            return Response({'error': 'Parcelle introuvable', 'type': qr_type, 'code': code_value}, status=status.HTTP_404_NOT_FOUND)
        data = ParcelDetailSerializer(parcel).data
        return Response({
            'type': 'parcel',
            'code': parcel.code,
            'name': parcel.name,
            'area': float(parcel.area),
            'vanilla_plants': parcel.vanilla_plants,
            'productive_plants': parcel.productive_plants,
            'variety': parcel.variety.name if parcel.variety else None,
            'soil_type': parcel.soil_type,
            'irrigation': parcel.irrigation,
            'latitude': float(parcel.latitude) if parcel.latitude else None,
            'longitude': float(parcel.longitude) if parcel.longitude else None,
            'altitude': float(parcel.altitude) if parcel.altitude else None,
            'producer': {
                'id': parcel.producer.id,
                'code': parcel.producer.code,
                'name': parcel.producer.name,
                'region': parcel.producer.region.name if parcel.producer.region else None,
                'commune': parcel.producer.commune.name if parcel.producer.commune else None,
            },
            'data': data,
        })
    return Response({'error': f'Type de QR code inconnu: {qr_type}'}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def generate_qr_code(request):
    """Generate a QR code PNG for a given type:code pair (used by the mobile QR generator screen)"""
    import qrcode
    import io
    qr_type = request.data.get('type', 'producer')
    code = request.data.get('code', '')
    if not code:
        return Response({'error': 'code requis'}, status=status.HTTP_400_BAD_REQUEST)
    qr_data = f"{qr_type}:{code}"
    qr = qrcode.QRCode(version=3, box_size=10, border=2)
    qr.add_data(qr_data)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white")
    buffer = io.BytesIO()
    img.save(buffer, format='PNG')
    buffer.seek(0)
    return HttpResponse(buffer, content_type='image/png')


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def sig_producers_locations(request):
    """Get producer locations for SIG map"""
    from producers.models import Producer
    producers = Producer.objects.filter(
        latitude__isnull=False,
        longitude__isnull=False
    ).values('id', 'code', 'name', 'latitude', 'longitude', 'region__name')[:100]
    return Response([{
        'id': p['id'],
        'code': p['code'],
        'name': p['name'],
        'latitude': float(p['latitude']),
        'longitude': float(p['longitude']),
        'region': p['region__name'] or 'Non définie',
    } for p in producers])


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def sig_parcels_polygons(request):
    """Get parcel polygons for SIG map"""
    from parcels.models import Parcel
    parcels = Parcel.objects.filter(
        latitude__isnull=False,
        longitude__isnull=False
    ).select_related('producer').values(
        'id', 'code', 'producer_id', 'producer__name',
        'latitude', 'longitude', 'area', 'status', 'polygon_coordinates'
    )[:200]
    return Response([{
        'id': p['id'],
        'code': p['code'],
        'producer': p['producer_id'],
        'producer_name': p['producer__name'],
        'latitude': float(p['latitude']) if p['latitude'] else None,
        'longitude': float(p['longitude']) if p['longitude'] else None,
        'area': float(p['area']) if p['area'] else 0,
        'status': p['status'],
        'polygon_coordinates': p.get('polygon_coordinates'),
    } for p in parcels])


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def sig_production_zones(request):
    """Get production zones summary for SIG map"""
    from parcels.models import Parcel

    zones = (
        Parcel.objects.select_related('producer__region')
        .exclude(producer__region__isnull=True)
        .values('producer__region__name')
        .annotate(
            total_surface=Sum('area'),
            total_plants=Sum('vanilla_plants'),
            parcels_count=Count('id')
        )
        .order_by('-parcels_count')[:50]
    )

    return Response([
        {
            'name': z['producer__region__name'],
            'region': z['producer__region__name'],
            'center_lat': -18.8792,
            'center_lng': 47.5079,
            'total_surface': float(z['total_surface'] or 0),
            'total_plants': z['total_plants'] or 0,
            'parcels_count': z['parcels_count'] or 0,
        }
        for z in zones
    ])
