"""
Phytosanitary App Models
"""
from django.db import models
from core.models import TimeStampedModel


class Disease(models.Model):
    """Crop disease/pest model"""
    CATEGORY_CHOICES = [
        ('fungal', 'Fongique'),
        ('bacterial', 'Bacterienne'),
        ('viral', 'Virale'),
        ('pest', 'Parasite'),
        ('other', 'Autre'),
    ]

    name = models.CharField(max_length=200, verbose_name='Nom')
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES, verbose_name='Categorie')
    affected_crops = models.JSONField(default=list, blank=True, null=True, verbose_name='Cultures affectees')
    symptoms = models.TextField(blank=True, null=True, verbose_name='Symptômes')
    severity = models.CharField(
        max_length=20,
        choices=[('low', 'Faible'), ('medium', 'Moyen'), ('high', 'Eleve'), ('critical', 'Critique')],
        default='medium',
        verbose_name='Gravite'
    )
    treatment = models.TextField(blank=True, null=True, verbose_name='Traitement')
    prevention = models.TextField(blank=True, null=True, verbose_name='Prevention')
    photo_examples = models.JSONField(default=list, blank=True, null=True, verbose_name='Exemples de photos')
    is_active = models.BooleanField(default=True, verbose_name='Actif')

    class Meta:
        verbose_name = 'Maladie/Parasite'
        verbose_name_plural = 'Maladies/Parasites'
        ordering = ['name']

    def __str__(self):
        return self.name


class PhytosanitaryTreatment(TimeStampedModel):
    """Phytosanitary treatment record"""
    TREATMENT_TYPE_CHOICES = [
        ('preventive', 'Preventif'),
        ('curative', 'Curatif'),
        ('maintenance', 'Maintenance'),
    ]

    parcel = models.ForeignKey('parcels.Parcel', on_delete=models.CASCADE, related_name='treatments', verbose_name='Parcelle')
    disease = models.ForeignKey(Disease, on_delete=models.SET_NULL, null=True, blank=True, related_name='treatments', verbose_name='Maladie')
    treatment_type = models.CharField(max_length=20, choices=TREATMENT_TYPE_CHOICES, verbose_name='Type de traitement')
    product_used = models.CharField(max_length=200, verbose_name='Produit utilise')
    application_rate = models.CharField(max_length=100, blank=True, null=True, verbose_name="Dose d'application")
    application_date = models.DateField(verbose_name="Date d'application")
    applied_by = models.ForeignKey(
        'accounts.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='treatments_applied',
        verbose_name='Applique par'
    )
    severity = models.CharField(max_length=20, blank=True, null=True, verbose_name='Gravite avant traitement')
    result = models.CharField(
        max_length=20,
        choices=[('effective', 'Efficace'), ('partial', 'Partiel'), ('ineffective', 'Inefficace')],
        blank=True,
        null=True,
        verbose_name='Resultat'
    )
    photos = models.JSONField(default=list, blank=True, null=True, verbose_name='Photos')
    notes = models.TextField(blank=True, null=True, verbose_name='Notes')
    synced = models.BooleanField(default=True, verbose_name='Synchronise')

    class Meta:
        verbose_name = 'Traitement phytosanitaire'
        verbose_name_plural = 'Traitements phytosanitaires'
        ordering = ['-application_date']

    def __str__(self):
        return f"{self.disease.name if self.disease else 'Traitement'} - {self.parcel.code} ({self.application_date})"
