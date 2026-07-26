"""
Certifications App Models
"""
from django.db import models
from core.models import TimeStampedModel
from accounts.models import User


class CertificationType(models.Model):
    """Certification type"""
    name = models.CharField(max_length=200, unique=True, verbose_name='Nom')
    code = models.CharField(max_length=50, unique=True, verbose_name='Code')
    description = models.TextField(blank=True, null=True, verbose_name='Description')
    validity_period_months = models.IntegerField(blank=True, null=True, verbose_name='Duree de validite (mois)')
    audit_required = models.BooleanField(default=True, verbose_name='Audit requis')
    is_active = models.BooleanField(default=True, verbose_name='Actif')

    class Meta:
        verbose_name = 'Type de certification'
        verbose_name_plural = 'Types de certifications'
        ordering = ['name']

    def __str__(self):
        return self.name


class ProducerCertification(TimeStampedModel):
    """Producer certification record"""
    STATUS_CHOICES = [
        ('pending', 'En attente'),
        ('in_progress', 'En cours'),
        ('certified', 'Certifie'),
        ('expired', 'Expiree'),
        ('revoked', 'Revoquee'),
    ]

    producer = models.ForeignKey(
        'producers.Producer',
        on_delete=models.CASCADE,
        related_name='certifications',
        verbose_name='Producteur'
    )
    certification_type = models.ForeignKey(
        CertificationType,
        on_delete=models.PROTECT,
        related_name='producer_certifications',
        verbose_name='Type de certification'
    )
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending', verbose_name='Statut')
    certificate_number = models.CharField(max_length=100, blank=True, null=True, verbose_name='Numero de certificat')
    issue_date = models.DateField(blank=True, null=True, verbose_name="Date de delivrance")
    expiry_date = models.DateField(blank=True, null=True, verbose_name="Date d'expiration")
    issued_by = models.ForeignKey(
        'accounts.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='issued_certifications',
        verbose_name='Delivre par'
    )
    last_audit_date = models.DateField(blank=True, null=True, verbose_name='Dernier audit')
    next_audit_date = models.DateField(blank=True, null=True, verbose_name='Prochain audit')
    audit_notes = models.TextField(blank=True, null=True, verbose_name="Notes d'audit")
    document = models.FileField(upload_to='certifications/', blank=True, null=True, verbose_name='Document')
    notes = models.TextField(blank=True, null=True, verbose_name='Notes')

    class Meta:
        verbose_name = 'Certification producteur'
        verbose_name_plural = 'Certifications producteurs'
        ordering = ['-issue_date']

    def __str__(self):
        return f"{self.producer.name} - {self.certification_type.name}"
