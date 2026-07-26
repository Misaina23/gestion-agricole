"""
Views for Mobile sync - Parcels
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import Parcel
from .serializers import ParcelDetailSerializer, ParcelCreateUpdateSerializer


class MobileParcelViewSet(viewsets.ModelViewSet):
    queryset = Parcel.objects.all()
    serializer_class = ParcelDetailSerializer
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return ParcelCreateUpdateSerializer
        return ParcelDetailSerializer

    @action(detail=False, methods=['get'])
    def pending(self, request):
        parcels = Parcel.objects.filter(synced=False)[:100]
        serializer = self.get_serializer_class()(parcels, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['post'])
    def sync(self, request):
        data = request.data
        parcel = Parcel.objects.create(**data)
        return Response(ParcelDetailSerializer(parcel).data, status=status.HTTP_201_CREATED)