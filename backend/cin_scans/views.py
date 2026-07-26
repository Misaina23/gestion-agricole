"""
Views for cin_scans.

Exposes:
  - CINScan ModelViewSet (CRUD, admin/dashboard)
  - POST /api/cin/scans/sync/   : offline sync from mobile (spec §14)
  - POST /api/cin/ocr/           : OCR endpoint consumed by the mobile app
  - POST /api/cin/scans/<id>/photo/ : attach original/enhanced photos
"""
from datetime import datetime, date

from django.db import transaction
from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser

from .models import CINScan
from .serializers import CINScanSerializer, CINScanCreateSerializer
from auditlog.models import ActivityLog
from auditlog.context import get_audit_user, get_audit_ip


def parse_date_value(value):
    if value in (None, ''):
        return None
    if isinstance(value, datetime):
        return value.date()
    if isinstance(value, date):
        return value
    text = str(value).strip()
    for fmt in ('%d/%m/%Y', '%d-%m-%Y', '%Y-%m-%d', '%Y/%m/%d'):
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


def parse_sex(value):
    if not value:
        return ''
    v = str(value).strip().upper()
    if v in ('M', 'H', 'MASCULIN', 'LAHY'):
        return 'M'
    if v in ('F', 'FEMME', 'FEMININ', 'VAVY'):
        return 'F'
    return ''


class CINScanViewSet(viewsets.ModelViewSet):
    queryset = CINScan.objects.select_related('agent').all()
    serializer_class = CINScanSerializer
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    search_fields = ['nom', 'prenom', 'numero_cin']
    ordering_fields = ['created_at', 'nom', 'numero_cin']
    ordering = ['-created_at']

    @action(detail=True, methods=['post'], parser_classes=[MultiPartParser, FormParser])
    def photo(self, request, pk=None):
        """Attach original / enhanced photos for a scan."""
        scan = self.get_object()
        kind = request.data.get('kind')
        file = request.data.get('file')
        allowed = {'recto', 'verso', 'recto_enhanced', 'verso_enhanced', 'beneficiaire'}
        if not file or kind not in allowed:
            return Response({'detail': 'kind et file requis'}, status=status.HTTP_400_BAD_REQUEST)
        field = 'photo_beneficiaire' if kind == 'beneficiaire' else f'photo_{kind}'
        setattr(scan, field, file)
        scan.save()
        return Response(CINScanSerializer(scan).data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def sync_cin_scan(request):
    """Sync a CIN scan recorded offline on the mobile app (spec §14)."""
    try:
        data = request.data
        numero = str(data.get('numero_cin') or '').strip()
        with transaction.atomic():
            scan, created = CINScan.objects.update_or_create(
                numero_cin=numero or f"UNKNOWN-{request.user.id}-{date.today()}",
                defaults={
                    'agent': request.user,
                    'nom': str(data.get('nom') or '').strip(),
                    'prenom': str(data.get('prenom') or '').strip(),
                    'date_naissance': parse_date_value(data.get('date_naissance')),
                    'lieu_naissance': str(data.get('lieu_naissance') or '').strip(),
                    'sexe': parse_sex(data.get('sexe')),
                    'pere': str(data.get('pere') or '').strip(),
                    'mere': str(data.get('mere') or '').strip(),
                    'profession': str(data.get('profession') or '').strip(),
                    'adresse': str(data.get('adresse') or '').strip(),
                    'arrondissement': str(data.get('arrondissement') or '').strip(),
                    'date_delivrance': parse_date_value(data.get('date_delivrance')),
                    'date_expiration': parse_date_value(data.get('date_expiration')),
                    'telephone': str(data.get('telephone') or '').strip(),
                    'email': str(data.get('email') or '').strip(),
                    'observations': str(data.get('observations') or '').strip(),
                    'confidence': data.get('confidence') or {},
                    'corrected_fields': data.get('corrected_fields') or [],
                    'scan_metadata': data.get('scan_metadata') or {},
                    'age': data.get('age'),
                    'source': 'manual' if data.get('scan_metadata', {}).get('manual_mode') else 'auto',
                    'synced': True,
                },
            )
            ActivityLog.objects.create(
                user=get_audit_user() or request.user,
                action='CREATE' if created else 'UPDATE',
                module='cin_scans',
                object_repr=str(scan),
                object_id=str(scan.pk),
                new_value={
                    'nom': scan.nom,
                    'numero_cin': scan.numero_cin,
                    'sexe': scan.sexe,
                    'confidence': scan.confidence,
                },
                ip_address=get_audit_ip(),
            )
        return Response(
            {'status': 'created' if created else 'updated', 'id': scan.pk, 'numero_cin': scan.numero_cin},
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
        )
    except Exception as exc:
        return Response({'detail': str(exc)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def cin_ocr(request):
    """OCR endpoint: returns recognized text lines for a CIN image.

    Pluggable OCR engine (spec §15). Out of the box we try pytesseract
    (Tesseract optimised for fra + mlg). If no engine is configured, the
    endpoint returns 501 so the mobile app gracefully falls back to manual
    entry (spec §11).
    """
    image_file = request.FILES.get('image')
    if not image_file:
        return Response({'detail': 'image requise'}, status=status.HTTP_400_BAD_REQUEST)
    try:
        import pytesseract  # type: ignore
        from PIL import Image
        import io
        img = Image.open(io.BytesIO(image_file.read()))
        raw = pytesseract.image_to_string(img, lang='fra+mlg')
        lines = [{'text': l.strip(), 'confidence': 0.9} for l in raw.splitlines() if l.strip()]
        return Response({'lines': lines})
    except ImportError:
        return Response(
            {'detail': 'Moteur OCR non configuré sur le serveur', 'lines': []},
            status=status.HTTP_501_NOT_IMPLEMENTED,
        )
    except Exception as exc:
        return Response({'detail': str(exc)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
