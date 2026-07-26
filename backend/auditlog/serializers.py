"""
Serializers for Audit Log
"""
from rest_framework import serializers
from .models import ActivityLog


class ActivityLogSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.full_name', read_only=True)
    user_username = serializers.CharField(source='user.username', read_only=True)
    action_display = serializers.CharField(source='get_action_display', read_only=True)

    class Meta:
        model = ActivityLog
        fields = [
            'id', 'user', 'user_name', 'user_username', 'action', 'action_display',
            'module', 'object_repr', 'object_id', 'old_value', 'new_value',
            'ip_address', 'timestamp',
        ]
        read_only_fields = fields
