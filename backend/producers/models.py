"""
Producer Models
"""
import re
from django.db import models, transaction
from django.db.models import Sum
from django.utils import timezone
from core.models import TimeStampedModel, Region, Commune, Fokontany, District


class Producer(TimeStampedModel):
    """Producer/Farmer model aligned to the T06 cooperative register."""

    # --- Status & decision fields (mapped from Excel Sheet 2) ---
    STATUS_CHOICES = [
        ('active', 'Actif'),
        ('inactive', 'Inactif'),
        ('suspended', 'Suspendu'),
        ('pending', 'En attente'),
    ]

    RISK_CATEGORY_CHOICES = [
        ('low', 'Faible'),
        ('medium', 'Moyen'),
        ('high', 'Fort'),
    ]

    YN_CHOICES = [
        ('yes', 'Oui'),
        ('no', 'Non'),
    ]

    EU_STATUS_CHOICES = [
        ('active', 'Actif'),
        ('suspended', 'Suspendu'),
        ('withdrawn', 'Retiré'),
        ('abandoned', 'Abandonné'),
    ]

    NOP_STATUS_CHOICES = [
        ('active', 'Actif'),
        ('suspended', 'Suspendu'),
        ('abandoned', 'Abandonné'),
    ]

    # --- Identification ---
    code = models.CharField(
        max_length=50,
        unique=True,
        verbose_name='Code producteur'
    )
    last_name = models.CharField(max_length=200, default='', verbose_name='Nom du membre')
    first_name = models.CharField(max_length=200, blank=True, null=True, verbose_name='Prénom du membre')

    # --- Production unit / location (from register) ---
    unit_name = models.CharField(
        max_length=200,
        blank=True,
        null=True,
        verbose_name="Nom de l'unité de production"
    )

    # Geographical hierarchy (used for import grouping / filtering)
    region = models.ForeignKey(
        Region,
        on_delete=models.PROTECT,
        related_name='producers',
        verbose_name='Region'
    )
    district = models.ForeignKey(
        District,
        on_delete=models.PROTECT,
        related_name='producers',
        blank=True,
        null=True,
        verbose_name='District'
    )
    commune = models.ForeignKey(
        Commune,
        on_delete=models.PROTECT,
        related_name='producers',
        verbose_name='Commune'
    )
    fokontany = models.ForeignKey(
        Fokontany,
        on_delete=models.PROTECT,
        related_name='producers',
        blank=True,
        null=True,
        verbose_name='Fokontany'
    )

    # --- Contact ---
    phone = models.CharField(
        max_length=20,
        blank=True,
        null=True,
        verbose_name='Téléphone'
    )

    # --- Registration ---
    joined_at = models.DateField(blank=True, null=True, verbose_name="Date d'intgration")

    # --- Risk assessment (Sheet 2, cols 9-13) ---
    risk_category = models.CharField(
        max_length=20,
        choices=RISK_CATEGORY_CHOICES,
        blank=True, null=True,
        verbose_name='Catégorie de risque'
    )
    identified_risks = models.TextField(blank=True, null=True, verbose_name='Risques identifiés')
    member_processing = models.CharField(
        max_length=10,
        choices=YN_CHOICES,
        blank=True, null=True,
        verbose_name='Préparation ou transformation simple'
    )
    processing_activities = models.TextField(blank=True, null=True, verbose_name='Activités de préparation')

    # --- Inspections (Sheet 2, cols 14-16) ---
    last_internal_inspection_at = models.DateField(
        blank=True, null=True, verbose_name='Dernière inspection interne'
    )
    internal_inspector_name = models.CharField(
        max_length=200, blank=True, null=True, verbose_name='Inspecteur SCI'
    )
    last_external_inspection_at = models.DateField(
        blank=True, null=True, verbose_name='Dernière inspection ECOCERT'
    )

    # --- Status (Sheet 2, cols 17-20) ---
    eu_status = models.CharField(
        max_length=20,
        choices=EU_STATUS_CHOICES,
        blank=True, null=True,
        verbose_name='Statut UE'
    )
    nop_status = models.CharField(
        max_length=20,
        choices=NOP_STATUS_CHOICES,
        blank=True, null=True,
        verbose_name='Statut NOP'
    )
    exclusion_reason = models.TextField(blank=True, null=True, verbose_name="Raison de l'exclusion")
    exclusion_date = models.DateField(blank=True, null=True, verbose_name="Date de l'exclusion")

    # --- System fields ---
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='pending',
        verbose_name='Statut système'
    )
    synced = models.BooleanField(default=True, verbose_name='Synchronisé')
    registered_by = models.ForeignKey(
        'accounts.User',
        on_delete=models.SET_NULL,
        related_name='registered_producers',
        blank=True,
        null=True,
        verbose_name='Enregistré par'
    )

    class Meta:
        verbose_name = 'Producteur'
        verbose_name_plural = 'Producteurs'
        ordering = ['-created_at']

    CODE_PATTERN = re.compile(r'^[A-Z]+-\d{4}-\d{4}$')
    CODE_PREFIX = 'PRD'

    @classmethod
    def is_valid_code(cls, code):
        return bool(code and cls.CODE_PATTERN.match(code or ''))

    @classmethod
    @transaction.atomic
    def generate_next_code(cls):
        """Generate the next available code with year-based sequence (e.g. ``PRD-2026-0042``).

        The sequence is derived from the highest existing sequence number for the
        current year so that deleted numbers are never reused.
        """
        year = timezone.now().year
        max_seq = 0
        for producer in cls.objects.select_for_update().all():
            match = cls.CODE_PATTERN.match(producer.code or '')
            if match:
                code_year = int(producer.code.split('-')[1])
                if code_year == year:
                    seq = int(producer.code.split('-')[-1])
                    if seq > max_seq:
                        max_seq = seq
        return f"{cls.CODE_PREFIX}-{year}-{max_seq + 1:04d}"

    @property
    def full_name(self):
        """Full display name combining first and last name."""
        parts = [self.last_name, self.first_name]
        return ' '.join(p for p in parts if p).strip() or self.code

    @property
    def name(self):
        """Display name used by the API and related ``__str__`` methods.

        The cooperative register stores the member name as separate last/first
        names, so ``name`` is derived rather than stored.
        """
        return self.full_name

    @property
    def parcels_count(self):
        return self.parcels.count()

    @property
    def total_area(self):
        return self.parcels.aggregate(Sum('area'))['area__sum'] or 0

    @property
    def total_plants(self):
        return self.parcels.aggregate(Sum('vanilla_plants'))['vanilla_plants__sum'] or 0

    @property
    def biological_area(self):
        return self.parcels.filter(conversion_status='organic').aggregate(Sum('area'))['area__sum'] or 0

    @property
    def conversion_area(self):
        return self.parcels.filter(conversion_status='conversion').aggregate(Sum('area'))['area__sum'] or 0

    @property
    def conventional_area(self):
        return self.parcels.filter(conversion_status='conventional').aggregate(Sum('area'))['area__sum'] or 0

    def save(self, *args, **kwargs):
        if not self.code:
            self.code = self.generate_next_code()
        max_attempts = 5
        for attempt in range(max_attempts):
            try:
                return super().save(*args, **kwargs)
            except Exception as exc:
                if attempt < max_attempts - 1 and 'code' in str(exc).lower():
                    self.code = self.generate_next_code()
                    continue
                raise

    def __str__(self):
        return f"{self.code} - {self.full_name}"


class ProducerPhoto(TimeStampedModel):
    """Additional photos for producers"""
    producer = models.ForeignKey(
        Producer,
        on_delete=models.CASCADE,
        related_name='gallery',
        verbose_name='Producteur'
    )
    photo = models.ImageField(
        upload_to='producers/gallery/',
        verbose_name='Photo'
    )
    caption = models.CharField(
        max_length=200,
        blank=True,
        null=True,
        verbose_name='Légende'
    )
    taken_at = models.DateTimeField(
        blank=True,
        null=True,
        verbose_name='Date de prise'
    )

    class Meta:
        verbose_name = 'Photo de producteur'
        verbose_name_plural = 'Photos de producteurs'
        ordering = ['-created_at']

    def __str__(self):
        return f"Photo {self.producer.code} - {self.created_at.strftime('%Y-%m-%d')}"


class Cooperative(TimeStampedModel):
    """Cooperative/Producer Group model"""
    name = models.CharField(max_length=200, unique=True, verbose_name='Nom')
    code = models.CharField(max_length=50, unique=True, verbose_name='Code')
    region = models.ForeignKey(
        Region,
        on_delete=models.PROTECT,
        related_name='cooperatives',
        verbose_name='Region'
    )
    commune = models.ForeignKey(
        Commune,
        on_delete=models.PROTECT,
        related_name='cooperatives',
        blank=True,
        null=True,
        verbose_name='Commune'
    )
    address = models.TextField(blank=True, null=True, verbose_name='Adresse')
    phone = models.CharField(max_length=20, blank=True, null=True, verbose_name='Telephone')
    email = models.EmailField(blank=True, null=True, verbose_name='Email')
    president = models.CharField(max_length=200, blank=True, null=True, verbose_name='Président')
    registration_number = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        verbose_name='Numéro enregistrement'
    )
    is_active = models.BooleanField(default=True, verbose_name='Actif')
    notes = models.TextField(blank=True, null=True, verbose_name='Notes')

    class Meta:
        verbose_name = 'Cooperative'
        verbose_name_plural = 'Cooperatives'
        ordering = ['name']

    def __str__(self):
        return f"{self.code} - {self.name}"
