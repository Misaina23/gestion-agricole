"""
Views for Mobile sync - Inspections
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import Inspection
from .serializers import InspectionDetailSerializer, InspectionCreateUpdateSerializer


class MobileInspectionViewSet(viewsets.ModelViewSet):
    queryset = Inspection.objects.all()
    serializer_class = InspectionDetailSerializer
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return InspectionCreateUpdateSerializer
        return InspectionDetailSerializer

    @action(detail=False, methods=['post'])
    def sync(self, request):
        data = request.data
        inspection = Inspection.objects.create(**data)
        return Response(InspectionDetailSerializer(inspection).data, status=status.HTTP_201_CREATED)