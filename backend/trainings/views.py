"""
Views for Trainings App
"""
from rest_framework import viewsets, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.db.models import Count, Sum
from django.utils import timezone
from .models import Training, TrainingAttendance
from .serializers import TrainingSerializer, TrainingAttendanceSerializer


class TrainingViewSet(viewsets.ModelViewSet):
    queryset = Training.objects.all()
    serializer_class = TrainingSerializer
    permission_classes = [permissions.IsAuthenticated]


class TrainingAttendanceViewSet(viewsets.ModelViewSet):
    queryset = TrainingAttendance.objects.all()
    serializer_class = TrainingAttendanceSerializer
    permission_classes = [permissions.IsAuthenticated]


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def training_stats(request):
    """Get training statistics"""
    trainings_qs = Training.objects.all()
    attendances = TrainingAttendance.objects.all()
    today = timezone.now().date()
    stats = {
        'total': trainings_qs.count(),
        'upcoming': trainings_qs.filter(training_date__gte=today).count(),
        'total_participants': attendances.count(),
        'present_count': attendances.filter(presence='present').count(),
        'absent_count': attendances.filter(presence='absent').count(),
        'late_count': attendances.filter(presence='late').count(),
        'avg_score': float(attendances.aggregate(avg_score=Sum('evaluation_score'))['avg_score'] or 0),
    }
    return Response(stats)