"""
Production Models
"""
from django.db import models
from core.models import TimeStampedModel, QualityGrade, Season


class Production(TimeStampedModel):
    """Vanilla production/harvest record"""
    STATUS_CHOICES = [
        ('harvested', 'Recolte'),
        ('drying', 'Sechage'),
        ('curing', 'Affinage'),
        ('ready', 'Pret'),
        ('sold', 'Vendu'),
    ]
    
    # Identification
    code = models.CharField(
        max_length=50,
        unique=True,
        verbose_name='Code production'
    )
    
    # Parcel and Season
    parcel = models.ForeignKey(
        'parcels.Parcel',
        on_delete=models.CASCADE,
        related_name='productions',
        verbose_name='Parcelle'
    )
    season = models.ForeignKey(
        Season,
        on_delete=models.PROTECT,
        related_name='productions',
        verbose_name='Saison'
    )
    
    # Harvest details
    harvest_date = models.DateField(verbose_name='Date de recolte')
    harvest_time = models.TimeField(
        blank=True,
        null=True,
        verbose_name='Heure de recolte'
    )
    
    # Weights
    weight_green = models.DecimalField(
        max_digits=10,
        decimal_places=3,
        verbose_name='Poids vert (kg)'
    )
    weight_prepared = models.DecimalField(
        max_digits=10,
        decimal_places=3,
        blank=True,
        null=True,
        verbose_name='Poids prepare (kg)'
    )
    
    # Pod counts
    pods_count = models.PositiveIntegerField(
        default=0,
        verbose_name='Nombre de gousses'
    )
    pods_grade_a = models.PositiveIntegerField(
        default=0,
        verbose_name='Gousses Grade A'
    )
    pods_grade_b = models.PositiveIntegerField(
        default=0,
        verbose_name='Gousses Grade B'
    )
    pods_grade_c = models.PositiveIntegerField(
        default=0,
        verbose_name='Gousses Grade C'
    )
    pods_rejected = models.PositiveIntegerField(
        default=0,
        verbose_name='Gousses rejetees'
    )
    
    # Quality
    quality_grade = models.ForeignKey(
        QualityGrade,
        on_delete=models.SET_NULL,
        related_name='productions',
        blank=True,
        null=True,
        verbose_name='Grade de qualite'
    )
    vanillin_content = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        blank=True,
        null=True,
        verbose_name='Taux de vanilline (%)'
    )
    moisture_content = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        blank=True,
        null=True,
        verbose_name='Taux humidite (%)'
    )
    
    # Status
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='harvested',
        verbose_name='Statut'
    )
    
    # Processing dates
    drying_start_date = models.DateField(
        blank=True,
        null=True,
        verbose_name='Debut sechage'
    )
    drying_end_date = models.DateField(
        blank=True,
        null=True,
        verbose_name='Fin sechage'
    )
    curing_start_date = models.DateField(
        blank=True,
        null=True,
        verbose_name='Debut affinage'
    )
    curing_end_date = models.DateField(
        blank=True,
        null=True,
        verbose_name='Fin affinage'
    )
    
    # Sale info
    sale_date = models.DateField(
        blank=True,
        null=True,
        verbose_name='Date de vente'
    )
    sale_price = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        blank=True,
        null=True,
        verbose_name='Prix de vente (Ar)'
    )
    buyer = models.CharField(
        max_length=200,
        blank=True,
        null=True,
        verbose_name='Acheteur'
    )
    
    # Photo
    photo = models.ImageField(
        upload_to='productions/photos/',
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
    
    # Agent
    registered_by = models.ForeignKey(
        'accounts.User',
        on_delete=models.SET_NULL,
        related_name='registered_productions',
        blank=True,
        null=True,
        verbose_name='Enregistre par'
    )
    
    class Meta:
        verbose_name = 'Production'
        verbose_name_plural = 'Productions'
        ordering = ['-harvest_date', '-created_at']
    
    def __str__(self):
        return f"{self.code} - {self.parcel.producer.name} ({self.harvest_date})"
    
    @property
    def conversion_rate(self):
        """Conversion rate from green to prepared"""
        if self.weight_green and self.weight_green > 0 and self.weight_prepared:
            return round((float(self.weight_prepared) / float(self.weight_green)) * 100, 2)
        return None
    
    @property
    def producer(self):
        return self.parcel.producer
    
    @property
    def avg_pod_weight(self):
        """Average weight per pod"""
        if self.pods_count and self.pods_count > 0:
            return round(float(self.weight_green) * 1000 / self.pods_count, 2)  # in grams
        return None


class ProductionBatch(TimeStampedModel):
    """Batch of productions for processing or sale"""
    code = models.CharField(
        max_length=50,
        unique=True,
        verbose_name='Code lot'
    )
    name = models.CharField(
        max_length=200,
        blank=True,
        null=True,
        verbose_name='Nom du lot'
    )
    productions = models.ManyToManyField(
        Production,
        related_name='batches',
        verbose_name='Productions'
    )
    total_weight = models.DecimalField(
        max_digits=10,
        decimal_places=3,
        default=0,
        verbose_name='Poids total (kg)'
    )
    quality_grade = models.ForeignKey(
        QualityGrade,
        on_delete=models.SET_NULL,
        related_name='batches',
        blank=True,
        null=True,
        verbose_name='Grade qualite'
    )
    notes = models.TextField(
        blank=True,
        null=True,
        verbose_name='Notes'
    )
    
    class Meta:
        verbose_name = 'Lot de production'
        verbose_name_plural = 'Lots de production'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.code} - {self.total_weight} kg"
