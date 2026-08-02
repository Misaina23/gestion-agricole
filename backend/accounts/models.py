"""
Custom User Model for VIDEEKO VANILLA
"""
import uuid

from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    """
    Custom user model with additional fields for agricultural management.
    """
    ROLE_CHOICES = [
        ('admin', 'Administrateur'),
        ('manager', 'Gestionnaire'),
        ('agent', 'Agent de terrain'),
        ('inspector', 'Inspecteur'),
        ('viewer', 'Observateur'),
    ]
    
    PLATFORM_CHOICES = [
        ('web', 'Web'),
        ('mobile', 'Mobile'),
    ]
    
    REGISTRATION_STATUS_CHOICES = [
        ('pending', 'En attente'),
        ('approved', 'Approuve'),
        ('rejected', 'Rejete'),
    ]
    
    role = models.CharField(
        max_length=20,
        choices=ROLE_CHOICES,
        default='agent',
        verbose_name='Role'
    )
    platform = models.CharField(
        max_length=10,
        choices=PLATFORM_CHOICES,
        default='web',
        verbose_name='Plateforme'
    )
    registration_status = models.CharField(
        max_length=20,
        choices=REGISTRATION_STATUS_CHOICES,
        default='approved',
        verbose_name='Statut d inscription'
    )
    phone = models.CharField(
        max_length=20,
        blank=True,
        null=True,
        verbose_name='Telephone'
    )
    region = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        verbose_name='Region'
    )
    commune = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        verbose_name='Commune'
    )
    avatar = models.ImageField(
        upload_to='avatars/',
        blank=True,
        null=True,
        verbose_name='Photo de profil'
    )
    is_field_agent = models.BooleanField(
        default=False,
        verbose_name='Agent de terrain'
    )
    is_supervisor = models.BooleanField(
        default=False,
        verbose_name='Superviseur'
    )
    code = models.CharField(
        max_length=50,
        unique=True,
        blank=True,
        null=True,
        verbose_name='Code utilisateur'
    )
    last_sync = models.DateTimeField(
        blank=True,
        null=True,
        verbose_name='Derniere synchronisation'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Utilisateur'
        verbose_name_plural = 'Utilisateurs'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.get_full_name() or self.username} ({self.get_role_display()})"
    
    @property
    def full_name(self):
        return self.get_full_name() or self.username

    def _generate_unique_code(self):
        return f"USR-{uuid.uuid4().hex[:8]}"

    def save(self, *args, **kwargs):
        if not self.code:
            code = self._generate_unique_code()
            while self.__class__.objects.filter(code=code).exists():
                code = self._generate_unique_code()
            self.code = code
        super().save(*args, **kwargs)
