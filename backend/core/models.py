"""
Core Models - Base models and reference data
"""
from django.db import models


class TimeStampedModel(models.Model):
    """Abstract base model with timestamp fields"""
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Date de creation')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Date de modification')
    
    class Meta:
        abstract = True


class Region(models.Model):
    """Region model for Madagascar vanilla regions"""
    name = models.CharField(max_length=100, unique=True, verbose_name='Nom')
    code = models.CharField(max_length=10, unique=True, verbose_name='Code')
    description = models.TextField(blank=True, null=True, verbose_name='Description')
    is_active = models.BooleanField(default=True, verbose_name='Actif')
    
    class Meta:
        verbose_name = 'Region'
        verbose_name_plural = 'Regions'
        ordering = ['name']
    
    def __str__(self):
        return self.name


class District(models.Model):
    """District model (Région > District > Commune > Fokontany)"""
    name = models.CharField(max_length=100, verbose_name='Nom')
    code = models.CharField(max_length=20, unique=True, verbose_name='Code')
    region = models.ForeignKey(
        Region,
        on_delete=models.CASCADE,
        related_name='districts',
        verbose_name='Region'
    )
    is_active = models.BooleanField(default=True, verbose_name='Actif')

    class Meta:
        verbose_name = 'District'
        verbose_name_plural = 'Districts'
        ordering = ['region', 'name']

    def __str__(self):
        return f"{self.name} ({self.region.name})"


class Commune(models.Model):
    """Commune model"""
    name = models.CharField(max_length=100, verbose_name='Nom')
    code = models.CharField(max_length=20, unique=True, verbose_name='Code')
    region = models.ForeignKey(
        Region,
        on_delete=models.CASCADE,
        related_name='communes',
        verbose_name='Region'
    )
    district = models.ForeignKey(
        District,
        on_delete=models.PROTECT,
        related_name='communes',
        blank=True,
        null=True,
        verbose_name='District'
    )
    is_active = models.BooleanField(default=True, verbose_name='Actif')
    
    class Meta:
        verbose_name = 'Commune'
        verbose_name_plural = 'Communes'
        ordering = ['region', 'name']
    
    def __str__(self):
        return f"{self.name} ({self.region.name})"


class Fokontany(models.Model):
    """Fokontany (village) model"""
    name = models.CharField(max_length=100, verbose_name='Nom')
    code = models.CharField(max_length=30, unique=True, verbose_name='Code')
    commune = models.ForeignKey(
        Commune,
        on_delete=models.CASCADE,
        related_name='fokontanys',
        verbose_name='Commune'
    )
    is_active = models.BooleanField(default=True, verbose_name='Actif')
    
    class Meta:
        verbose_name = 'Fokontany'
        verbose_name_plural = 'Fokontanys'
        ordering = ['commune', 'name']
    
    def __str__(self):
        return f"{self.name} ({self.commune.name})"


class VanillaVariety(models.Model):
    """Vanilla variety types"""
    name = models.CharField(max_length=100, unique=True, verbose_name='Nom')
    code = models.CharField(max_length=20, unique=True, verbose_name='Code')
    description = models.TextField(blank=True, null=True, verbose_name='Description')
    is_active = models.BooleanField(default=True, verbose_name='Actif')
    
    class Meta:
        verbose_name = 'Variete de vanille'
        verbose_name_plural = 'Varietes de vanille'
        ordering = ['name']
    
    def __str__(self):
        return self.name


class QualityGrade(models.Model):
    """Quality grades for vanilla"""
    name = models.CharField(max_length=50, unique=True, verbose_name='Nom')
    code = models.CharField(max_length=10, unique=True, verbose_name='Code')
    description = models.TextField(blank=True, null=True, verbose_name='Description')
    min_vanillin_content = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        blank=True,
        null=True,
        verbose_name='Taux de vanilline minimum (%)'
    )
    min_moisture_content = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        blank=True,
        null=True,
        verbose_name='Taux humidite minimum (%)'
    )
    max_moisture_content = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        blank=True,
        null=True,
        verbose_name='Taux humidite maximum (%)'
    )
    price_factor = models.DecimalField(
        max_digits=4,
        decimal_places=2,
        default=1.0,
        verbose_name='Facteur de prix'
    )
    is_active = models.BooleanField(default=True, verbose_name='Actif')
    
    class Meta:
        verbose_name = 'Grade de qualite'
        verbose_name_plural = 'Grades de qualite'
        ordering = ['-price_factor']
    
    def __str__(self):
        return f"{self.name} ({self.code})"


class Season(models.Model):
    """Agricultural season"""
    name = models.CharField(max_length=50, verbose_name='Nom')
    year = models.PositiveIntegerField(verbose_name='Annee')
    start_date = models.DateField(verbose_name='Date de debut')
    end_date = models.DateField(verbose_name='Date de fin')
    is_current = models.BooleanField(default=False, verbose_name='Saison en cours')
    is_active = models.BooleanField(default=True, verbose_name='Actif')
    target_weight = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        blank=True,
        null=True,
        verbose_name='Objectif poids (kg)'
    )
    
    class Meta:
        verbose_name = 'Saison'
        verbose_name_plural = 'Saisons'
        ordering = ['-year', '-start_date']
        unique_together = ['name', 'year']
    
    def __str__(self):
        return f"{self.name} {self.year}"
    
    def save(self, *args, **kwargs):
        if self.is_current:
            Season.objects.exclude(pk=self.pk).update(is_current=False)
        super().save(*args, **kwargs)


class SyncLog(models.Model):
    """Synchronization log for offline/online data sync"""
    SYNC_STATUS = [
        ('pending', 'En attente'),
        ('syncing', 'En cours'),
        ('completed', 'Termine'),
        ('failed', 'Echoue'),
    ]
    
    user = models.ForeignKey(
        'accounts.User',
        on_delete=models.CASCADE,
        related_name='sync_logs',
        verbose_name='Utilisateur'
    )
    status = models.CharField(
        max_length=20,
        choices=SYNC_STATUS,
        default='pending',
        verbose_name='Statut'
    )
    records_sent = models.PositiveIntegerField(default=0, verbose_name='Enregistrements envoyes')
    records_received = models.PositiveIntegerField(default=0, verbose_name='Enregistrements recus')
    started_at = models.DateTimeField(auto_now_add=True, verbose_name='Debut')
    completed_at = models.DateTimeField(blank=True, null=True, verbose_name='Fin')
    error_message = models.TextField(blank=True, null=True, verbose_name='Message erreur')
    
    class Meta:
        verbose_name = 'Journal de synchronisation'
        verbose_name_plural = 'Journaux de synchronisation'
        ordering = ['-started_at']
    
    def __str__(self):
        return f"Sync {self.user.username} - {self.started_at.strftime('%Y-%m-%d %H:%M')}"


class ProductionUnit(TimeStampedModel):
    """Production unit / group from the cooperative register."""
    UNIT_TYPES = [
        ('group', 'Groupe'),
        ('site', 'Site'),
        ('village', 'Village'),
        ('region', 'Region'),
    ]

    STATUS_CHOICES = [
        ('active', 'Actif'),
        ('inactive', 'Inactif'),
        ('suspended', 'Suspendu'),
    ]

    name = models.CharField(max_length=200, verbose_name="Nom de l'unite")
    code = models.CharField(max_length=50, unique=True, verbose_name='Code unite')
    unit_type = models.CharField(max_length=20, choices=UNIT_TYPES, default='group', verbose_name="Type d'unite")
    region = models.ForeignKey(
        Region,
        on_delete=models.PROTECT,
        related_name='production_units',
        verbose_name='Region'
    )
    district = models.ForeignKey(
        District,
        on_delete=models.PROTECT,
        related_name='production_units',
        blank=True,
        null=True,
        verbose_name='District'
    )
    commune = models.ForeignKey(
        Commune,
        on_delete=models.PROTECT,
        related_name='production_units',
        blank=True,
        null=True,
        verbose_name='Commune'
    )
    manager_name = models.CharField(max_length=200, blank=True, null=True, verbose_name='Responsable')
    manager_function = models.CharField(max_length=200, blank=True, null=True, verbose_name='Fonction du responsable')
    phone = models.CharField(max_length=50, blank=True, null=True, verbose_name='Telephone')
    email = models.EmailField(blank=True, null=True, verbose_name='Email')
    members_count = models.PositiveIntegerField(default=0, verbose_name='Nombre de membres')
    total_area = models.DecimalField(max_digits=10, decimal_places=4, default=0, verbose_name='Superficie totale (ha)')
    creation_date = models.DateField(blank=True, null=True, verbose_name='Date de creation')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active', verbose_name='Statut')
    notes = models.TextField(blank=True, null=True, verbose_name='Observations')

    class Meta:
        verbose_name = "Unite de production"
        verbose_name_plural = "Unites de production"
        ordering = ['name']

    def __str__(self):
        return f"{self.name} ({self.code})"
