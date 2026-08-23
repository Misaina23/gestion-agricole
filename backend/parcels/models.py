"""
Parcel Models
"""
from django.db import models
from core.models import TimeStampedModel, VanillaVariety


class Parcel(TimeStampedModel):
    """Parcel/Plot model for vanilla cultivation"""
    STATUS_CHOICES = [
        ('active', 'Actif'),
        ('inactive', 'Inactif'),
        ('fallow', 'En jachere'),
        ('new', 'Nouveau'),
    ]
    
    SOIL_TYPE_CHOICES = [
        ('clay', 'Argileux'),
        ('sandy', 'Sableux'),
        ('loamy', 'Limoneux'),
        ('volcanic', 'Volcanique'),
        ('mixed', 'Mixte'),
    ]
    
    # Identification
    code = models.CharField(
        max_length=50,
        verbose_name='Code parcelle'
    )
    name = models.CharField(
        max_length=200,
        blank=True,
        null=True,
        verbose_name='Nom/Description'
    )
    
    # Producer
    producer = models.ForeignKey(
        'producers.Producer',
        on_delete=models.CASCADE,
        related_name='parcels',
        verbose_name='Producteur'
    )
    
    # GPS Coordinates
    latitude = models.DecimalField(
        max_digits=10,
        decimal_places=7,
        blank=True,
        null=True,
        verbose_name='Latitude'
    )
    longitude = models.DecimalField(
        max_digits=10,
        decimal_places=7,
        blank=True,
        null=True,
        verbose_name='Longitude'
    )
    altitude = models.DecimalField(
        max_digits=7,
        decimal_places=2,
        blank=True,
        null=True,
        verbose_name='Altitude (m)'
    )
    gps_accuracy = models.DecimalField(
        max_digits=6,
        decimal_places=2,
        blank=True,
        null=True,
        verbose_name='Precision GPS (m)'
    )
    
    # Polygon coordinates (stored as JSON string)
    polygon_coordinates = models.TextField(
        blank=True,
        null=True,
        verbose_name='Coordonnees polygone (GeoJSON)'
    )
    
    # Parcel details
    area = models.DecimalField(
        max_digits=10,
        decimal_places=4,
        verbose_name='Superficie (ha)'
    )
    # Source register fields.  A parcel code such as "P1" is only unique for
    # its producer (the cooperative register reuses those codes).
    main_crop = models.CharField(max_length=200, blank=True, null=True, verbose_name='Culture principale')
    intercrop = models.CharField(max_length=300, blank=True, null=True, verbose_name='Interculture')
    conversion_status = models.CharField(
        max_length=20,
        choices=[('organic', 'Biologique'), ('conversion', 'En conversion'), ('conventional', 'Conventionnelle')],
        blank=True, null=True, verbose_name='Statut de conversion'
    )
    conversion_level = models.CharField(
        max_length=2,
        choices=[('C1', 'C1'), ('C2', 'C2'), ('C3', 'C3')],
        blank=True, null=True, verbose_name='Niveau de conversion'
    )
    conversion_start_date = models.DateField(blank=True, null=True, verbose_name='Début de conversion')
    eu_status = models.CharField(max_length=30, blank=True, null=True, verbose_name='Statut UE')
    nop_status = models.CharField(max_length=30, blank=True, null=True, verbose_name='Statut NOP')
    estimated_yield = models.DecimalField(max_digits=12, decimal_places=3, blank=True, null=True, verbose_name='Rendement estimé (kg/ha)')
    actual_harvest = models.DecimalField(max_digits=12, decimal_places=3, blank=True, null=True, verbose_name='Récolte effective (kg)')
    delivered_quantity = models.DecimalField(max_digits=12, decimal_places=3, blank=True, null=True, verbose_name='Quantité livrée (kg)')
    vanilla_plants = models.PositiveIntegerField(
        default=0,
        verbose_name='Nombre de pieds de vanille'
    )
    productive_plants = models.PositiveIntegerField(
        default=0,
        verbose_name='Pieds productifs'
    )
    
    # Vanilla type
    variety = models.ForeignKey(
        VanillaVariety,
        on_delete=models.SET_NULL,
        related_name='parcels',
        blank=True,
        null=True,
        verbose_name='Variete'
    )
    
    # Soil and environment
    soil_type = models.CharField(
        max_length=20,
        choices=SOIL_TYPE_CHOICES,
        blank=True,
        null=True,
        verbose_name='Type de sol'
    )
    shade_percentage = models.PositiveIntegerField(
        default=0,
        verbose_name='Pourcentage ombrage'
    )
    irrigation = models.BooleanField(
        default=False,
        verbose_name='Irrigation'
    )
    
    # Planting info
    planting_date = models.DateField(
        blank=True,
        null=True,
        verbose_name='Date de plantation'
    )
    first_harvest_date = models.DateField(
        blank=True,
        null=True,
        verbose_name='Premiere recolte'
    )
    
    # Status
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='new',
        verbose_name='Statut'
    )
    is_certified = models.BooleanField(
        default=False,
        verbose_name='Certifie'
    )
    certification_date = models.DateField(
        blank=True,
        null=True,
        verbose_name='Date certification'
    )
    
    # Photos
    photo = models.ImageField(
        upload_to='parcels/photos/',
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
    synced = models.BooleanField(default=True, verbose_name='Synchronise')
    
    # Agent
    registered_by = models.ForeignKey(
        'accounts.User',
        on_delete=models.SET_NULL,
        related_name='registered_parcels',
        blank=True,
        null=True,
        verbose_name='Enregistre par'
    )
    
    class Meta:
        verbose_name = 'Parcelle'
        verbose_name_plural = 'Parcelles'
        ordering = ['-created_at']
        constraints = [
            models.UniqueConstraint(fields=['producer', 'code'], name='unique_parcel_code_per_producer')
        ]
    
    def __str__(self):
        return f"{self.code} - {self.producer.name}"
    
    @property
    def plant_density(self):
        """Plants per hectare"""
        if self.area and self.area > 0:
            return round(self.vanilla_plants / float(self.area), 2)
        return 0
    
    @property
    def productivity_rate(self):
        """Percentage of productive plants"""
        if self.vanilla_plants and self.vanilla_plants > 0:
            return round((self.productive_plants / self.vanilla_plants) * 100, 1)
        return 0


class ParcelRegisterHarvest(TimeStampedModel):
    """Harvest/delivery values exactly as recorded in the T06 parcel register.

    This is deliberately separate from operational Production records: the
    register gives annual aggregate values but no harvest date or batch code.
    """
    PERIOD_CHOICES = [('current', 'Année en cours'), ('previous', 'Récolte N-1')]
    CROP_SLOT_CHOICES = [
        ('main', 'Culture principale'),
        ('intercrop_1', 'Interculture / rotation 1'),
        ('intercrop_2', 'Interculture / rotation 2'),
    ]
    parcel = models.ForeignKey(Parcel, on_delete=models.CASCADE, related_name='register_harvests')
    period = models.CharField(max_length=10, choices=PERIOD_CHOICES)
    crop_slot = models.CharField(max_length=15, choices=CROP_SLOT_CHOICES)
    estimated_yield = models.DecimalField(max_digits=12, decimal_places=3, blank=True, null=True, verbose_name='Rendement estimé (kg/ha)')
    actual_harvest = models.DecimalField(max_digits=12, decimal_places=3, blank=True, null=True, verbose_name='Récolte effective (kg)')
    actual_yield = models.DecimalField(max_digits=12, decimal_places=3, blank=True, null=True, verbose_name='Rendement effectif (kg/ha)')
    delivered_quantity = models.DecimalField(max_digits=12, decimal_places=3, blank=True, null=True, verbose_name='Quantité livrée (kg)')

    class Meta:
        constraints = [models.UniqueConstraint(fields=['parcel', 'period', 'crop_slot'], name='unique_register_harvest_slot')]
        verbose_name = 'Relevé récolte du registre'
        verbose_name_plural = 'Relevés récolte du registre'


class ParcelPhoto(TimeStampedModel):
    """Additional photos for parcels"""
    parcel = models.ForeignKey(
        Parcel,
        on_delete=models.CASCADE,
        related_name='photos',
        verbose_name='Parcelle'
    )
    photo = models.ImageField(
        upload_to='parcels/gallery/',
        verbose_name='Photo'
    )
    caption = models.CharField(
        max_length=200,
        blank=True,
        null=True,
        verbose_name='Legende'
    )
    taken_at = models.DateTimeField(
        blank=True,
        null=True,
        verbose_name='Date de prise'
    )
    
    class Meta:
        verbose_name = 'Photo de parcelle'
        verbose_name_plural = 'Photos de parcelles'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Photo {self.parcel.code} - {self.created_at.strftime('%Y-%m-%d')}"
