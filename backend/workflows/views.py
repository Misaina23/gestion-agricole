"""
Views for Workflows App
"""
from rest_framework import viewsets, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.db.models import Count
from .models import WorkflowStep, WorkflowInstance
from .serializers import WorkflowStepSerializer, WorkflowInstanceSerializer


class WorkflowStepViewSet(viewsets.ModelViewSet):
    queryset = WorkflowStep.objects.filter(is_active=True)
    serializer_class = WorkflowStepSerializer
    permission_classes = [permissions.IsAuthenticated]


class WorkflowInstanceViewSet(viewsets.ModelViewSet):
    queryset = WorkflowInstance.objects.all()
    serializer_class = WorkflowInstanceSerializer
    permission_classes = [permissions.IsAuthenticated]


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def workflow_stats(request):
    """Get workflow instance statistics"""
    qs = WorkflowInstance.objects.all()
    stats = {
        'total': qs.count(),
        'pending': qs.filter(status='pending').count(),
        'in_progress': qs.filter(status='in_progress').count(),
        'approved': qs.filter(status='approved').count(),
        'rejected': qs.filter(status='rejected').count(),
        'cancelled': qs.filter(status='cancelled').count(),
    }
    return Response(stats)