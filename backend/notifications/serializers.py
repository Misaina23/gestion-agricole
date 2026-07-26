from rest_framework import serializers
from .models import Notification, ScheduledNotification


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = ['id', 'user', 'channel', 'title', 'message', 'is_read', 'sent_at', 'created_at']


class ScheduledNotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = ScheduledNotification
        fields = ['id', 'run_name', 'channel', 'status', 'run_at', 'payload']
