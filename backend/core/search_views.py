"""
Global search across entities
"""
from django.db.models import Q
from django.http import JsonResponse
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from producers.models import Producer
from parcels.models import Parcel
from productions.models import Production
from inspections.models import Inspection
from core.models import Region


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def global_search(request):
    query = request.GET.get('q', '')
    if not query or len(query) < 2:
        return JsonResponse({'results': []})
    
    results = {
        'producers': [],
        'parcels': [],
        'productions': [],
        'inspections': [],
        'regions': [],
    }
    
    producers = Producer.objects.filter(
        Q(name__icontains=query) |
        Q(code__icontains=query) |
        Q(phone__icontains=query)
    )[:5]
    results['producers'] = [{'id': p.id, 'name': p.name, 'code': p.code, 'type': 'producer'} for p in producers]
    
    parcels = Parcel.objects.filter(
        Q(code__icontains=query)
    )[:5]
    results['parcels'] = [{'id': p.id, 'code': p.code, 'type': 'parcel'} for p in parcels]
    
    productions = Production.objects.filter(code__icontains=query)[:5]
    results['productions'] = [{'id': p.id, 'code': p.code, 'type': 'production'} for p in productions]
    
    inspections = Inspection.objects.filter(code__icontains=query)[:5]
    results['inspections'] = [{'id': i.id, 'code': i.code, 'type': 'inspection'} for i in inspections]
    
    regions = Region.objects.filter(name__icontains=query)[:5]
    results['regions'] = [{'id': r.id, 'name': r.name, 'type': 'region'} for r in regions]
    
    return JsonResponse({'results': results, 'query': query})