"""
Models for Audit Log / Activity History
"""
from django.db import models
from accounts.models import User


class ActivityLog(models.Model):
    """Traceability log of every important action in the system."""

    ACTION_CHOICES = [
        ('CREATE', 'Création'),
        ('UPDATE', 'Modification'),
        ('DELETE', 'Suppression'),
        ('LOGIN', 'Connexion'),
        ('LOGIN_FAILED', 'Échec de connexion'),
        ('LOGOUT', 'Déconnexion'),
        ('EXPORT', 'Export'),
        ('SYNC', 'Synchronisation'),
    ]

    user = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='activity_logs',
        verbose_name='Utilisateur',
    )
    action = models.CharField(max_length=20, choices=ACTION_CHOICES, verbose_name='Action')
    module = models.CharField(max_length=50, verbose_name='Module')
    object_repr = models.CharField(max_length=255, blank=True, null=True, verbose_name='Élément')
    object_id = models.CharField(max_length=50, blank=True, null=True, verbose_name='ID élément')
    old_value = models.JSONField(blank=True, null=True, verbose_name='Ancienne valeur')
    new_value = models.JSONField(blank=True, null=True, verbose_name='Nouvelle valeur')
    ip_address = models.GenericIPAddressField(blank=True, null=True, verbose_name='Adresse IP')
    timestamp = models.DateTimeField(auto_now_add=True, verbose_name='Date et heure')

    class Meta:
        verbose_name = "Journal d'activité"
        verbose_name_plural = "Journal d'activité"
        ordering = ['-timestamp']

    def __str__(self):
        return f"[{self.timestamp}] {self.get_action_display()} - {self.module} - {self.object_repr}"
