from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()


class Notification(models.Model):
    CHANNEL_CHOICES = [
        ('in_app', 'Application'),
        ('email', 'Email'),
        ('sms', 'SMS'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    channel = models.CharField(max_length=20, choices=CHANNEL_CHOICES, default='in_app')
    title = models.CharField(max_length=255)
    message = models.TextField()
    is_read = models.BooleanField(default=False)
    metadata = models.JSONField(default=dict, blank=True)
    sent_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']


class ScheduledNotification(models.Model):
    STATUS_CHOICES = [
        ('scheduled', 'Scheduled'),
        ('sent', 'Sent'),
        ('failed', 'Failed'),
    ]

    run_name = models.CharField(max_length=255)
    channel = models.CharField(max_length=20, choices=Notification.CHANNEL_CHOICES)
    payload = models.JSONField(default=dict)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='scheduled')
    run_at = models.DateTimeField()
    sent_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-run_at']
