"""
Views for Projects App
"""
from rest_framework import viewsets, permissions
from .models import Project, ProjectActivity, Beneficiary
from .serializers import ProjectSerializer, ProjectActivitySerializer, BeneficiarySerializer


class ProjectViewSet(viewsets.ModelViewSet):
    queryset = Project.objects.filter(is_active=True)
    serializer_class = ProjectSerializer
    permission_classes = [permissions.IsAuthenticated]


class ProjectActivityViewSet(viewsets.ModelViewSet):
    queryset = ProjectActivity.objects.all()
    serializer_class = ProjectActivitySerializer
    permission_classes = [permissions.IsAuthenticated]


class BeneficiaryViewSet(viewsets.ModelViewSet):
    queryset = Beneficiary.objects.filter(is_active=True)
    serializer_class = BeneficiarySerializer
    permission_classes = [permissions.IsAuthenticated]