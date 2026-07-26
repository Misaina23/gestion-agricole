from django.contrib import admin
from .models import Notification, ScheduledNotification


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ['id', 'user', 'channel', 'title', 'is_read', 'created_at']
    list_filter = ['channel', 'is_read', 'created_at']
    search_fields = ['title', 'message', 'user__username']


@admin.register(ScheduledNotification)
class ScheduledNotificationAdmin(admin.ModelAdmin):
    list_display = ['id', 'run_name', 'channel', 'status', 'run_at', 'created_at']
    list_filter = ['channel', 'status']
