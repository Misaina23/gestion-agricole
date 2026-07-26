from datetime import date, datetime
from decimal import Decimal, InvalidOperation
import json
import re
import uuid

from django.db import transaction
from django.db.models import Q
from django.utils import timezone
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status

from core.models import Commune, Fokontany, Region, District, Season
from inspections.models import Inspection
from parcels.models import Parcel
from producers.models import Producer
from productions.models import Production


def normalize_code(value):
    return str(value or '').strip().upper()


def parse_decimal(value, default=None):
    if value in (None, ''):
        return default
    try:
        return Decimal(str(value).replace(',', '.'))
    except (InvalidOperation, ValueError):
        return default


def parse_int(value, default=0):
    if value in (None, ''):
        return default
    try:
        return int(float(str(value).replace(',', '.')))
    except (TypeError, ValueError):
        return default


def parse_date_value(value):
    if value in (None, ''):
        return None
    if isinstance(value, datetime):
        return value.date()
    if isinstance(value, date):
        return value

    text = str(value).strip()
    for fmt in ('%Y-%m-%d', '%Y/%m/%d', '%d/%m/%Y', '%d-%m-%Y'):
        try:
            return datetime.strptime(text, fmt).date()
        except ValueError:
            continue

    if 'T' in text:
        try:
            return datetime.fromisoformat(text.replace('Z', '+00:00')).date()
        except ValueError:
            return None

    return None


def parse_coordinates(value):
    if isinstance(value, dict):
        lat = value.get('lat') if value.get('lat') is not None else value.get('latitude')
        lng = value.get('lng') if value.get('lng') is not None else value.get('longitude')
        return parse_decimal(lat), parse_decimal(lng)

    if isinstance(value, (list, tuple)) and len(value) >= 2:
        return parse_decimal(value[0]), parse_decimal(value[1])

    if isinstance(value, str):
        parts = [part for part in re.split(r'[,;\s]+', value.strip()) if part]
        if len(parts) >= 2:
            return parse_decimal(parts[0]), parse_decimal(parts[1])

    return None, None


def first_reference_location():
    region = Region.objects.filter(is_active=True).first()
    if not region:
        raise ValueError('Aucune région de référence disponible. Exécutez load_initial_data.')
    commune = Commune.objects.filter(region=region, is_active=True).first()
    if not commune:
        raise ValueError('Aucune commune de référence disponible. Exécutez load_initial_data.')
    return region, commune


def resolve_region(value):
    if not value:
        return first_reference_location()[0]

    if isinstance(value, dict):
        if value.get('id') or value.get('pk'):
            return Region.objects.get(pk=value.get('id') or value.get('pk'))
        for key in ('code', 'name'):
            if value.get(key):
                return Region.objects.filter(Q(code__iexact=value[key]) | Q(name__iexact=value[key])).first()
        return None

    if isinstance(value, int):
        return Region.objects.get(pk=value)

    text = str(value).strip()
    return Region.objects.filter(Q(code__iexact=text) | Q(name__iexact=text)).first()


def resolve_commune(value, region=None):
    if not value:
        return first_reference_location()[1]

    if isinstance(value, dict):
        if value.get('id') or value.get('pk'):
            return Commune.objects.get(pk=value.get('id') or value.get('pk'))
        for key in ('code', 'name'):
            if value.get(key):
                queryset = Commune.objects.filter(Q(code__iexact=value[key]) | Q(name__iexact=value[key]))
                if region:
                    queryset = queryset.filter(region=region)
                return queryset.first()
        return None

    if isinstance(value, int):
        return Commune.objects.get(pk=value)

    text = str(value).strip()
    queryset = Commune.objects.filter(Q(code__iexact=text) | Q(name__iexact=text))
    if region:
        queryset = queryset.filter(region=region)
    return queryset.first()


def resolve_fokontany(value, commune=None):
    if not value:
        return None

    if isinstance(value, dict):
        if value.get('id') or value.get('pk'):
            return Fokontany.objects.get(pk=value.get('id') or value.get('pk'))
        for key in ('code', 'name'):
            if value.get(key):
                queryset = Fokontany.objects.filter(Q(code__iexact=value[key]) | Q(name__iexact=value[key]))
                if commune:
                    queryset = queryset.filter(commune=commune)
                return queryset.first()
        return None

    if isinstance(value, int):
        return Fokontany.objects.get(pk=value)

    text = str(value).strip()
    queryset = Fokontany.objects.filter(Q(code__iexact=text) | Q(name__iexact=text))
    if commune:
        queryset = queryset.filter(commune=commune)
    return queryset.first()


def resolve_district(value, region=None):
    if not value:
        return None

    if isinstance(value, dict):
        if value.get('id') or value.get('pk'):
            return District.objects.get(pk=value.get('id') or value.get('pk'))
        for key in ('code', 'name', 'codeDistrict', 'code_district'):
            if value.get(key):
                queryset = District.objects.filter(Q(code__iexact=value[key]) | Q(name__iexact=value[key]))
                if region:
                    queryset = queryset.filter(region=region)
                return queryset.first()
        return None

    if isinstance(value, int):
        return District.objects.get(pk=value)

    text = str(value).strip()
    queryset = District.objects.filter(Q(code__iexact=text) | Q(name__iexact=text))
    if region:
        queryset = queryset.filter(region=region)
    return queryset.first()


def resolve_producer(value):
    if not value:
        return None

    if isinstance(value, dict):
        if value.get('id') or value.get('pk'):
            return Producer.objects.get(pk=value.get('id') or value.get('pk'))
        for key in ('code', 'codeProducteur', 'code_producteur'):
            if value.get(key):
                return Producer.objects.filter(code__iexact=value[key]).first()
        return None

    if isinstance(value, int):
        return Producer.objects.get(pk=value)

    return Producer.objects.filter(code__iexact=str(value)).first()


def resolve_parcel(value, producer=None):
    if not value:
        return None

    if isinstance(value, dict):
        if value.get('id') or value.get('pk'):
            return Parcel.objects.get(pk=value.get('id') or value.get('pk'))
        for key in ('code', 'codeUniqueParcelle', 'code_unique_parcelle', 'parcel_code'):
            if value.get(key):
                queryset = Parcel.objects.filter(code__iexact=value[key])
                if producer:
                    queryset = queryset.filter(producer=producer)
                return queryset.first()
        return None

    if isinstance(value, int):
        return Parcel.objects.get(pk=value)

    queryset = Parcel.objects.filter(code__iexact=str(value))
    if producer:
        queryset = queryset.filter(producer=producer)
    return queryset.first()


def normalize_inspection_type(value):
    value = str(value or 'routine').strip().lower()
    mapping = {
        'followup': 'follow_up',
        'follow-up': 'follow_up',
        'suivi': 'follow_up',
        'routine': 'routine',
        'certification': 'certification',
        'qualite': 'quality',
        'quality': 'quality',
        'phytosanitaire': 'phytosanitary',
        'phytosanitary': 'phytosanitary',
        'traceabilite': 'traceability',
        'traceability': 'traceability',
    }
    return mapping.get(value, 'routine')


def normalize_result(value):
    value = str(value or 'pending').strip().lower()
    mapping = {
        'conforme': 'passed',
        'passed': 'passed',
        'non conforme': 'failed',
        'non_conforme': 'failed',
        'failed': 'failed',
        'partiel': 'conditional',
        'partial': 'conditional',
        'conditional': 'conditional',
        'en attente': 'pending',
        'pending': 'pending',
    }
    return mapping.get(value, 'pending')


def inspection_score(result):
    return {'passed': 100, 'conditional': 60, 'failed': 0}.get(result)


def build_notes(data, keys):
    parts = []
    for key in keys:
        if data.get(key):
            parts.append(f'{key}: {data.get(key)}')
    return '\n'.join(parts) if parts else None


@transaction.atomic
def create_or_update_producer(data, request, *, require_location=True):
    region = resolve_region(data.get('region') or data.get('region_name'))
    commune = resolve_commune(data.get('commune') or data.get('commune_name'), region)
    district = resolve_district(data.get('district') or data.get('district_name'), region)
    fokontany = resolve_fokontany(data.get('fokontany'), commune)

    if require_location and (not region or not commune):
        region, commune = first_reference_location()

    if commune and not district:
        district = commune.district

    if not region or not commune:
        raise ValueError('region et commune sont obligatoires')

    code = normalize_code(
        data.get('code') or data.get('codeProducteur') or data.get('code_producteur')
    )
    existing = Producer.objects.filter(code=code).first() if code else None

    defaults = {
        'name': data.get('name') or data.get('nomPrenom') or data.get('nom_producteur') or (existing.code if existing else 'Producteur'),
        'phone': data.get('phone') or data.get('telephone') or None,
        'email': data.get('email') or None,
        'cin': data.get('cin') or None,
        'region': region,
        'commune': commune,
        'district': district,
        'fokontany': fokontany,
        'address': data.get('address') or data.get('nomSite') or data.get('site') or None,
        'status': data.get('status') or 'pending',
        'is_certified': bool(data.get('is_certified', False)),
        'notes': build_notes(data, ['culture', 'interculture', 'estimationRecolte', 'rendement', 'quantiteLivree', 'dateIntegration', 'date_integration']),
        'synced': True,
        'registered_by': request.user,
    }

    if existing:
        for key, value in defaults.items():
            setattr(existing, key, value)
        existing.save()
        return existing, False

    producer = Producer(**{key: value for key, value in defaults.items() if key != 'code'})
    producer.save()
    return producer, True


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def sync_producer(request):
    try:
        producer, created = create_or_update_producer(request.data, request)
        from producers.serializers import ProducerDetailSerializer
        return Response(ProducerDetailSerializer(producer).data, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)
    except Exception as exc:
        return Response({'detail': str(exc)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def pending_producers(request):
    from producers.serializers import ProducerDetailSerializer
    producers = Producer.objects.filter(synced=False).select_related('region', 'commune', 'fokontany')[:100]
    return Response(ProducerDetailSerializer(producers, many=True).data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def sync_collecte(request):
    try:
        producer, _ = create_or_update_producer(request.data, request, require_location=True)

        lat, lng = parse_coordinates(request.data.get('gpsParcelle1') or request.data.get('gps_parcelle_1'))
        area = parse_decimal(request.data.get('superficie') or request.data.get('area'), Decimal('0'))
        vanilla_plants = parse_int(request.data.get('nombreArbres') or request.data.get('vanilla_plants'), 0)
        parcel_code = normalize_code(
            request.data.get('codeUniqueParcelle')
            or request.data.get('code_unique_parcelle')
            or f"PC-{producer.code}-{date.today().strftime('%Y%m%d')}"
        )
        notes = build_notes(
            request.data,
            ['nomSite', 'culture', 'interculture', 'estimationRecolte', 'rendement', 'quantiteLivree', 'dateIntegration', 'gpsMenage']
        )

        parcel, parcel_created = Parcel.objects.update_or_create(
            code=parcel_code,
            defaults={
                'producer': producer,
                'name': request.data.get('nomSite') or f'Parcelle {parcel_code}',
                'latitude': lat,
                'longitude': lng,
                'area': area,
                'vanilla_plants': vanilla_plants,
                'productive_plants': vanilla_plants,
                'status': 'new',
                'notes': notes,
                'synced': True,
                'registered_by': request.user,
            }
        )

        return Response({
            'status': 'created' if parcel_created else 'updated',
            'producer_id': producer.id,
            'producer_code': producer.code,
            'parcel_id': parcel.id,
            'parcel_code': parcel.code,
        }, status=status.HTTP_201_CREATED if parcel_created else status.HTTP_200_OK)
    except Exception as exc:
        return Response({'detail': str(exc)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def sync_parcel(request):
    try:
        producer = resolve_producer(
            request.data.get('producer')
            or request.data.get('producer_id')
            or request.data.get('producer_code')
            or request.data.get('codeProducteur')
        )
        if not producer:
            raise ValueError('producteur requis')

        code = normalize_code(request.data.get('code') or request.data.get('codeUniqueParcelle') or request.data.get('code_unique_parcelle'))
        if not code:
            raise ValueError('code parcelle requis')

        lat, lng = parse_coordinates(request.data.get('gps') or request.data.get('coordinates'))
        if lat is None:
            lat = parse_decimal(request.data.get('latitude'))
        if lng is None:
            lng = parse_decimal(request.data.get('longitude'))

        parcel, created = Parcel.objects.update_or_create(
            code=code,
            defaults={
                'producer': producer,
                'name': request.data.get('name') or f'Parcelle {code}',
                'latitude': lat,
                'longitude': lng,
                'altitude': parse_decimal(request.data.get('altitude')),
                'area': parse_decimal(request.data.get('area'), Decimal('0')),
                'vanilla_plants': parse_int(request.data.get('vanilla_plants'), 0),
                'productive_plants': parse_int(request.data.get('productive_plants'), 0),
                'status': request.data.get('status') or 'new',
                'notes': request.data.get('notes'),
                'synced': True,
                'registered_by': request.user,
            }
        )
        from parcels.serializers import ParcelDetailSerializer
        return Response(ParcelDetailSerializer(parcel).data, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)
    except Exception as exc:
        return Response({'detail': str(exc)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def pending_parcels(request):
    from parcels.serializers import ParcelDetailSerializer
    parcels = Parcel.objects.filter(synced=False).select_related('producer', 'producer__region', 'producer__commune')[:100]
    return Response(ParcelDetailSerializer(parcels, many=True).data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def sync_production(request):
    try:
        parcel = resolve_parcel(
            request.data.get('parcel')
            or request.data.get('parcel_id')
            or request.data.get('parcel_code')
            or request.data.get('codeUniqueParcelle'),
        )
        if not parcel:
            raise ValueError('parcelle introuvable')

        season = None
        if request.data.get('season') or request.data.get('season_id'):
            season = Season.objects.get(pk=request.data.get('season') or request.data.get('season_id'))
        else:
            season = Season.objects.filter(is_current=True).first() or Season.objects.order_by('-year').first()
        if not season:
            raise ValueError('saison requise')

        harvest_date = parse_date_value(request.data.get('harvest_date') or request.data.get('actual_date')) or date.today()
        code = normalize_code(request.data.get('code') or request.data.get('code_production')) or f"PRD-{uuid.uuid4().hex[:8].upper()}"

        production, created = Production.objects.update_or_create(
            code=code,
            defaults={
                'parcel': parcel,
                'season': season,
                'harvest_date': harvest_date,
                'weight_green': parse_decimal(request.data.get('weight_green'), Decimal('0')),
                'weight_prepared': parse_decimal(request.data.get('weight_prepared')),
                'pods_count': parse_int(request.data.get('pods_count'), 0),
                'status': request.data.get('status') or 'harvested',
                'notes': request.data.get('notes') or json.dumps(request.data.get('collector_gps') or {}, ensure_ascii=False),
                'registered_by': request.user,
            }
        )
        from productions.serializers import ProductionDetailSerializer
        return Response(ProductionDetailSerializer(production).data, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)
    except Exception as exc:
        return Response({'detail': str(exc)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def pending_productions(request):
    from productions.serializers import ProductionDetailSerializer
    productions = Production.objects.filter(registered_by__isnull=False)[:100]
    return Response(ProductionDetailSerializer(productions, many=True).data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def sync_inspection(request):
    try:
        producer = resolve_producer(
            request.data.get('producer')
            or request.data.get('producer_id')
            or request.data.get('producer_code')
            or request.data.get('codeProducteur')
        )
        if not producer:
            raise ValueError('producteur requis')

        parcel = resolve_parcel(
            request.data.get('parcel')
            or request.data.get('parcel_id')
            or request.data.get('parcel_code')
            or request.data.get('codeUniqueParcelle'),
            producer=producer
        )

        inspection_type = normalize_inspection_type(request.data.get('inspection_type'))
        result = normalize_result(request.data.get('result') or request.data.get('conformite'))
        actual_date = parse_date_value(request.data.get('actual_date') or request.data.get('dateInspection')) or date.today()
        planned_date = parse_date_value(request.data.get('planned_date')) or actual_date
        score_overall = parse_int(request.data.get('score') or request.data.get('score_overall'), inspection_score(result) or 0)
        code = normalize_code(request.data.get('code') or request.data.get('code_inspection')) or f"INS-{uuid.uuid4().hex[:8].upper()}"

        inspection, created = Inspection.objects.update_or_create(
            code=code,
            defaults={
                'producer': producer,
                'parcel': parcel,
                'inspection_type': inspection_type,
                'planned_date': planned_date,
                'actual_date': actual_date,
                'inspector': request.user,
                'status': 'completed',
                'result': result,
                'score_overall': score_overall,
                'score_cultivation': score_overall,
                'score_processing': score_overall,
                'score_storage': score_overall,
                'score_traceability': score_overall,
                'score_environment': score_overall,
                'observations': request.data.get('observations'),
                'recommendations': request.data.get('recommendations'),
                'non_conformities': request.data.get('non_conformities') or request.data.get('actionsCorrectives'),
                'corrective_actions': request.data.get('corrective_actions') or request.data.get('actionsCorrectives'),
                'follow_up_required': result in ['failed', 'conditional'],
                'follow_up_date': parse_date_value(request.data.get('follow_up_date')),
                'follow_up_notes': request.data.get('follow_up_notes'),
                'notes': request.data.get('notes'),
            }
        )
        from inspections.serializers import InspectionDetailSerializer
        return Response(InspectionDetailSerializer(inspection).data, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)
    except Exception as exc:
        return Response({'detail': str(exc)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def sync_field_inspection(request):
    data = request.data.copy() if hasattr(request.data, 'copy') else dict(request.data)
    data['inspection_type'] = data.get('inspection_type') or 'followup'
    data['result'] = data.get('result') or data.get('conformite') or 'pending'
    data['actual_date'] = data.get('actual_date') or data.get('dateInspection')
    request.data = data
    return sync_inspection(request)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def pending_inspections(request):
    from inspections.serializers import InspectionDetailSerializer
    inspections = Inspection.objects.filter(status='completed').order_by('-created_at')[:100]
    return Response(InspectionDetailSerializer(inspections, many=True).data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def sync_status(request):
    return Response({
        'server_time': timezone.now().isoformat(),
        'status': 'ok',
    })
