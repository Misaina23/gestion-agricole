"""
Documents App Models
"""
from django.db import models
from core.models import TimeStampedModel
from accounts.models import User


class DocumentType(models.Model):
    """Document type"""
    TYPE_CHOICES = [
        ('id_card', 'Carte d\'identité'),
        ('contract', 'Contrat'),
        ('certificate', 'Certificat'),
        ('attestation', 'Attestation'),
        ('land_title', 'Document foncier'),
        ('other', 'Autre'),
    ]

    name = models.CharField(max_length=100, unique=True, verbose_name='Nom')
    document_type = models.CharField(max_length=20, choices=TYPE_CHOICES, verbose_name='Type')
    description = models.TextField(blank=True, null=True, verbose_name='Description')
    required = models.BooleanField(default=False, verbose_name='Requis')
    is_active = models.BooleanField(default=True, verbose_name='Actif')

    class Meta:
        verbose_name = 'Type de document'
        verbose_name_plural = 'Types de documents'
        ordering = ['name']

    def __str__(self):
        return self.name


class Document(TimeStampedModel):
    """Uploaded document"""
    producer = models.ForeignKey(
        'producers.Producer',
        on_delete=models.CASCADE,
        related_name='documents',
        verbose_name='Producteur'
    )
    document_type = models.ForeignKey(
        DocumentType,
        on_delete=models.PROTECT,
        related_name='documents',
        verbose_name='Type de document'
    )
    title = models.CharField(max_length=200, verbose_name='Titre')
    file = models.FileField(upload_to='documents/producers/', verbose_name='Fichier')
    issue_date = models.DateField(blank=True, null=True, verbose_name="Date d'emission")
    expiry_date = models.DateField(blank=True, null=True, verbose_name="Date d'expiration")
    reference_number = models.CharField(max_length=100, blank=True, null=True, verbose_name='Numero de reference')
    uploaded_by = models.ForeignKey(
        'accounts.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='uploaded_documents',
        verbose_name='Telecharge par'
    )
    notes = models.TextField(blank=True, null=True, verbose_name='Notes')
    synced = models.BooleanField(default=True, verbose_name='Synchronisé')

    class Meta:
        verbose_name = 'Document'
        verbose_name_plural = 'Documents'
        ordering = ['-issue_date']

    def __str__(self):
        return f"{self.title} - {self.producer.name}"
