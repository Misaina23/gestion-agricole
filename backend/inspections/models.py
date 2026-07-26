"""
Inspection Models
"""
from django.db import models
from core.models import TimeStampedModel


class Inspection(TimeStampedModel):
    """Field inspection model"""
    TYPE_CHOICES = [
        ('routine', 'Routine'),
        ('certification', 'Certification'),
        ('quality', 'Controle qualite'),
        ('phytosanitary', 'Phytosanitaire'),
        ('traceability', 'Tracabilite'),
        ('follow_up', 'Suivi'),
    ]
    
    STATUS_CHOICES = [
        ('planned', 'Planifie'),
        ('in_progress', 'En cours'),
        ('completed', 'Termine'),
        ('cancelled', 'Annule'),
    ]
    
    RESULT_CHOICES = [
        ('passed', 'Conforme'),
        ('failed', 'Non conforme'),
        ('conditional', 'Conditionnel'),
        ('pending', 'En attente'),
    ]
    
    # Identification
    code = models.CharField(
        max_length=50,
        unique=True,
        verbose_name='Code inspection'
    )
    
    # Target
    producer = models.ForeignKey(
        'producers.Producer',
        on_delete=models.CASCADE,
        related_name='inspections',
        verbose_name='Producteur'
    )
    parcel = models.ForeignKey(
        'parcels.Parcel',
        on_delete=models.CASCADE,
        related_name='inspections',
        blank=True,
        null=True,
        verbose_name='Parcelle'
    )
    
    # Type and dates
    inspection_type = models.CharField(
        max_length=20,
        choices=TYPE_CHOICES,
        default='routine',
        verbose_name='Type inspection'
    )
    planned_date = models.DateField(
        verbose_name='Date prevue'
    )
    actual_date = models.DateField(
        blank=True,
        null=True,
        verbose_name='Date effective'
    )
    
    # Inspector
    inspector = models.ForeignKey(
        'accounts.User',
        on_delete=models.SET_NULL,
        related_name='inspections_conducted',
        blank=True,
        null=True,
        verbose_name='Inspecteur'
    )
    
    # Status and result
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='planned',
        verbose_name='Statut'
    )
    result = models.CharField(
        max_length=20,
        choices=RESULT_CHOICES,
        default='pending',
        verbose_name='Resultat'
    )
    
    # Scores (0-100)
    score_overall = models.PositiveIntegerField(
        blank=True,
        null=True,
        verbose_name='Score global'
    )
    score_cultivation = models.PositiveIntegerField(
        blank=True,
        null=True,
        verbose_name='Score culture'
    )
    score_processing = models.PositiveIntegerField(
        blank=True,
        null=True,
        verbose_name='Score transformation'
    )
    score_storage = models.PositiveIntegerField(
        blank=True,
        null=True,
        verbose_name='Score stockage'
    )
    score_traceability = models.PositiveIntegerField(
        blank=True,
        null=True,
        verbose_name='Score tracabilite'
    )
    score_environment = models.PositiveIntegerField(
        blank=True,
        null=True,
        verbose_name='Score environnement'
    )
    
    # Observations
    observations = models.TextField(
        blank=True,
        null=True,
        verbose_name='Observations'
    )
    recommendations = models.TextField(
        blank=True,
        null=True,
        verbose_name='Recommandations'
    )
    non_conformities = models.TextField(
        blank=True,
        null=True,
        verbose_name='Non-conformites'
    )
    corrective_actions = models.TextField(
        blank=True,
        null=True,
        verbose_name='Actions correctives'
    )
    
    # Follow-up
    follow_up_required = models.BooleanField(
        default=False,
        verbose_name='Suivi requis'
    )
    follow_up_date = models.DateField(
        blank=True,
        null=True,
        verbose_name='Date suivi'
    )
    follow_up_notes = models.TextField(
        blank=True,
        null=True,
        verbose_name='Notes suivi'
    )
    
    # Photos
    photo = models.ImageField(
        upload_to='inspections/photos/',
        blank=True,
        null=True,
        verbose_name='Photo'
    )
    
    # Notes
    notes = models.TextField(
        blank=True,
        null=True,
        verbose_name='Notes'
    )
    
    class Meta:
        verbose_name = 'Inspection'
        verbose_name_plural = 'Inspections'
        ordering = ['-planned_date', '-created_at']
    
    def __str__(self):
        return f"{self.code} - {self.producer.name} ({self.planned_date})"
    
    @property
    def is_overdue(self):
        from django.utils import timezone
        if self.status in ['planned', 'in_progress']:
            return self.planned_date < timezone.now().date()
        return False


class InspectionChecklist(TimeStampedModel):
    """Checklist items for inspections"""
    inspection = models.ForeignKey(
        Inspection,
        on_delete=models.CASCADE,
        related_name='checklist_items',
        verbose_name='Inspection'
    )
    category = models.CharField(
        max_length=100,
        verbose_name='Categorie'
    )
    item = models.CharField(
        max_length=500,
        verbose_name='Element'
    )
    is_compliant = models.BooleanField(
        default=False,
        verbose_name='Conforme'
    )
    score = models.PositiveIntegerField(
        blank=True,
        null=True,
        verbose_name='Score'
    )
    comment = models.TextField(
        blank=True,
        null=True,
        verbose_name='Commentaire'
    )
    
    class Meta:
        verbose_name = 'Element checklist'
        verbose_name_plural = 'Elements checklist'
        ordering = ['category', 'item']
    
    def __str__(self):
        return f"{self.category}: {self.item}"


class InspectionPhoto(TimeStampedModel):
    """Additional photos for inspections"""
    inspection = models.ForeignKey(
        Inspection,
        on_delete=models.CASCADE,
        related_name='photos',
        verbose_name='Inspection'
    )
    photo = models.ImageField(
        upload_to='inspections/gallery/',
        verbose_name='Photo'
    )
    caption = models.CharField(
        max_length=200,
        blank=True,
        null=True,
        verbose_name='Legende'
    )
    category = models.CharField(
        max_length=50,
        blank=True,
        null=True,
        verbose_name='Categorie'
    )
    
    class Meta:
        verbose_name = 'Photo inspection'
        verbose_name_plural = 'Photos inspection'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Photo {self.inspection.code}"


class InspectionTemplate(models.Model):
    """Templates for different inspection types"""
    name = models.CharField(
        max_length=200,
        verbose_name='Nom'
    )
    inspection_type = models.CharField(
        max_length=20,
        choices=Inspection.TYPE_CHOICES,
        verbose_name='Type inspection'
    )
    checklist_template = models.JSONField(
        default=list,
        verbose_name='Modele checklist'
    )
    is_active = models.BooleanField(
        default=True,
        verbose_name='Actif'
    )
    
    class Meta:
        verbose_name = 'Modele inspection'
        verbose_name_plural = 'Modeles inspection'
        ordering = ['name']
    
    def __str__(self):
        return self.name
