"""
Alerts App Models
"""
from django.db import models
from core.models import TimeStampedModel
from accounts.models import User


class AlertType(models.Model):
    """Alert type configuration"""
    name = models.CharField(max_length=100, unique=True, verbose_name='Nom')
    code = models.CharField(max_length=50, unique=True, verbose_name='Code')
    description = models.TextField(blank=True, null=True, verbose_name='Description')
    severity = models.CharField(
        max_length=20,
        choices=[
            ('info', 'Information'),
            ('warning', 'Avertissement'),
            ('error', 'Erreur'),
            ('critical', 'Critique'),
        ],
        default='info',
        verbose_name='Severite'
    )
    auto_resolve = models.BooleanField(default=False, verbose_name='Resolution automatique')
    is_active = models.BooleanField(default=True, verbose_name='Actif')

    class Meta:
        verbose_name = "Type d'alerte"
        verbose_name_plural = "Types d'alertes"
        ordering = ['name']

    def __str__(self):
        return self.name


class Alert(TimeStampedModel):
    """Alert instance"""
    alert_type = models.ForeignKey(AlertType, on_delete=models.PROTECT, related_name='alerts', verbose_name="Type d'alerte")
    title = models.CharField(max_length=200, verbose_name='Titre')
    message = models.TextField(verbose_name='Message')
    severity = models.CharField(max_length=20, verbose_name='Severite')
    producer = models.ForeignKey(
        'producers.Producer',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='alerts',
        verbose_name='Producteur'
    )
    parcel = models.ForeignKey(
        'parcels.Parcel',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='alerts',
        verbose_name='Parcelle'
    )
    related_url = models.CharField(max_length=500, blank=True, null=True, verbose_name='URL associee')
    is_read = models.BooleanField(default=False, verbose_name='Lu')
    is_resolved = models.BooleanField(default=False, verbose_name='Resolu')
    resolved_at = models.DateTimeField(blank=True, null=True, verbose_name='Resolu le')
    resolved_by = models.ForeignKey(
        'accounts.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='resolved_alerts',
        verbose_name='Resolu par'
    )
    metadata = models.JSONField(blank=True, null=True, verbose_name='Metadonnees')

    class Meta:
        verbose_name = 'Alerte'
        verbose_name_plural = 'Alertes'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.alert_type.name} - {self.title}"
