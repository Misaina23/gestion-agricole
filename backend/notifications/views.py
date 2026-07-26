from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Notification, ScheduledNotification
from .serializers import NotificationSerializer, ScheduledNotificationSerializer
from django.utils import timezone


class NotificationViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user).order_by('-created_at')

    @action(detail=False, methods=['post'])
    def mark_read(self, request):
        Notification.objects.filter(user=request.user, is_read=False).update(is_read=True)
        return Response({'status': 'OK'})

    @action(detail=True, methods=['post'])
    def read(self, request, pk=None):
        notification = self.get_object()
        notification.is_read = True
        notification.sent_at = timezone.now()
        notification.save()
        return Response({'status': 'OK'})


class ScheduledNotificationViewSet(viewsets.ModelViewSet):
    queryset = ScheduledNotification.objects.select_related('user').all()
    serializer_class = ScheduledNotificationSerializer
    permission_classes = [permissions.IsAdminUser]

    def perform_create(self, serializer):
        serializer.save()
