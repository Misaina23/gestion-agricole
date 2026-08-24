"""
Data quality anomaly detection
"""
from django.db.models import Q
from django.http import JsonResponse
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from producers.models import Producer
from parcels.models import Parcel
from productions.models import Production
import re


def validate_phone(phone: str) -> bool:
    if not phone:
        return True
    phone_pattern = re.compile(r'^\+?[0-9\s\-\.]{8,20}$')
    return bool(phone_pattern.match(phone))


def validate_coordinates(lat: str, lng: str) -> bool:
    try:
        lat_f = float(lat)
        lng_f = float(lng)
        return -90 <= lat_f <= 90 and -180 <= lng_f <= 180
    except (TypeError, ValueError):
        return False


def validate_area(area: float) -> bool:
    return 0 < area < 10000


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def detect_anomalies(request):
    anomalies = {
        'invalid_phones': [],
        'invalid_gps': [],
        'duplicate_codes': [],
        'abnormal_areas': [],
    }
    
    # Invalid phone numbers
    producers = Producer.objects.exclude(phone__isnull=True).exclude(phone='')
    for p in producers:
        if not validate_phone(p.phone):
            anomalies['invalid_phones'].append({
                'id': p.id,
                'name': p.name,
                'phone': p.phone,
                'type': 'producer'
            })
    
    # Invalid GPS coordinates
    parcels = Parcel.objects.exclude(latitude__isnull=True).exclude(longitude__isnull=True)
    for p in parcels:
        if not validate_coordinates(p.latitude, p.longitude):
            anomalies['invalid_gps'].append({
                'id': p.id,
                'code': p.code,
                'latitude': p.latitude,
                'longitude': p.longitude
            })
    
    # Abnormal areas
    for p in parcels:
        try:
            if p.area and not validate_area(float(p.area)):
                anomalies['abnormal_areas'].append({
                    'id': p.id,
                    'code': p.code,
                    'area': p.area
                })
        except (TypeError, ValueError):
            pass
    
    # Duplicate codes
    from django.db.models import Count
    dup_producers = Producer.objects.values('code').annotate(count=Count('id')).filter(count__gt=1)
    for dup in dup_producers:
        anomalies['duplicate_codes'].append({
            'code': dup['code'],
            'count': dup['count'],
            'type': 'producer'
        })
    
    total_issues = sum(len(v) for v in anomalies.values())
    
    return JsonResponse({
        'total_issues': total_issues,
        'anomalies': anomalies
    })