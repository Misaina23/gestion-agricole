"""
Views for Cultures App
"""
from rest_framework import viewsets, permissions
from .models import Culture
from .serializers import CultureSerializer, CultureListSerializer


class CultureViewSet(viewsets.ModelViewSet):
    queryset = Culture.objects.filter(is_active=True)
    serializer_class = CultureSerializer
    permission_classes = [permissions.IsAuthenticated]