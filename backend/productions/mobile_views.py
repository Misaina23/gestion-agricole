"""
Views for Mobile sync - Productions
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import Production
from .serializers import ProductionDetailSerializer, ProductionCreateUpdateSerializer


class MobileProductionViewSet(viewsets.ModelViewSet):
    queryset = Production.objects.all()
    serializer_class = ProductionDetailSerializer
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return ProductionCreateUpdateSerializer
        return ProductionDetailSerializer

    @action(detail=False, methods=['post'])
    def sync(self, request):
        data = request.data
        production = Production.objects.create(**data)
        return Response(ProductionDetailSerializer(production).data, status=status.HTTP_201_CREATED)