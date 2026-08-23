"""
Producer Models
"""
import re
from django.db import connection, models, transaction
from core.models import TimeStampedModel, Region, Commune, Fokontany, District


class Producer(TimeStampedModel):
    """Producer/Farmer model"""
    STATUS_CHOICES = [
        ('active', 'Actif'),
        ('inactive', 'Inactif'),
        ('suspended', 'Suspendu'),
        ('pending', 'En attente'),
    ]
    
    GENDER_CHOICES = [
        ('M', 'Masculin'),
        ('F', 'Feminin'),
    ]
    
    # Identification
    code = models.CharField(
        max_length=50,
        unique=True,
        verbose_name='Code producteur'
    )
    name = models.CharField(max_length=200, verbose_name='Nom complet')
    gender = models.CharField(
        max_length=1,
        choices=GENDER_CHOICES,
        blank=True,
        null=True,
        verbose_name='Genre'
    )
    birth_date = models.DateField(
        blank=True,
        null=True,
        verbose_name='Date de naissance'
    )
    cin = models.CharField(
        max_length=50,
        blank=True,
        null=True,
        verbose_name='CIN'
    )
    
    # Contact
    phone = models.CharField(
        max_length=20,
        blank=True,
        null=True,
        verbose_name='Telephone'
    )
    phone_secondary = models.CharField(
        max_length=20,
        blank=True,
        null=True,
        verbose_name='Telephone secondaire'
    )
    email = models.EmailField(
        blank=True,
        null=True,
        verbose_name='Email'
    )
    
    # Location
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
    address = models.TextField(
        blank=True,
        null=True,
        verbose_name='Adresse'
    )
    
    # Status and certification
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='pending',
        verbose_name='Statut'
    )
    is_certified = models.BooleanField(
        default=False,
        verbose_name='Certifie'
    )
    certification_date = models.DateField(
        blank=True,
        null=True,
        verbose_name='Date de certification'
    )
    certification_number = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        verbose_name='Numero de certification'
    )
    certification_expiry = models.DateField(
        blank=True,
        null=True,
        verbose_name='Expiration certification'
    )
    
    # Cooperative/Group
    cooperative = models.ForeignKey(
        'Cooperative',
        on_delete=models.SET_NULL,
        related_name='members',
        blank=True,
        null=True,
        verbose_name='Cooperative'
    )
    
    # Photo
    photo = models.ImageField(
        upload_to='producers/photos/',
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
    # Fields supplied by the members register, kept verbatim rather than inferred.
    joined_at = models.DateField(blank=True, null=True, verbose_name="Date d'intégration")
    risk_category = models.CharField(max_length=100, blank=True, null=True, verbose_name='Catégorie de risque')
    identified_risks = models.TextField(blank=True, null=True, verbose_name='Risques identifiés')
    member_processing = models.CharField(max_length=30, blank=True, null=True, verbose_name='Préparation/transformation')
    processing_activities = models.TextField(blank=True, null=True, verbose_name='Activités de préparation')
    last_internal_inspection_at = models.DateField(blank=True, null=True, verbose_name='Dernière inspection interne')
    internal_inspector_name = models.CharField(max_length=200, blank=True, null=True, verbose_name='Inspecteur SCI')
    last_external_inspection_at = models.DateField(blank=True, null=True, verbose_name='Dernière inspection externe')
    eu_status = models.CharField(max_length=30, blank=True, null=True, verbose_name='Statut UE')
    nop_status = models.CharField(max_length=30, blank=True, null=True, verbose_name='Statut NOP')
    synced = models.BooleanField(default=True, verbose_name='Synchronise')
    
    # Agent who registered
    registered_by = models.ForeignKey(
        'accounts.User',
        on_delete=models.SET_NULL,
        related_name='registered_producers',
        blank=True,
        null=True,
        verbose_name='Enregistre par'
    )
    
    class Meta:
        verbose_name = 'Producteur'
        verbose_name_plural = 'Producteurs'
        ordering = ['-created_at']

    CODE_PATTERN = re.compile(r'^PRD-REG(\d{2})-DIS(\d{3})-(\d{4})$')
    CODE_PREFIX = 'PRD'

    @classmethod
    def is_valid_code(cls, code):
        return bool(code and cls.CODE_PATTERN.match(code or ''))

    @classmethod
    def generate_next_code(cls, region, district):
        """Compute the next available producer code for the given region+district.

        The sequence is derived from the highest existing sequence number already
        used for that region+district, so deleted numbers are never reused and the
        numbering stays strictly increasing. The region row is locked (on engines
        that support it) to prevent two concurrent insertions from generating the
        same code.
        """
        if not region:
            raise ValueError("La région est requise pour générer un code producteur.")
        if not district:
            raise ValueError("Le district est requis pour générer un code producteur.")

        with transaction.atomic():
            if connection.vendor != 'sqlite':
                Region.objects.select_for_update().filter(pk=region.pk).first()
                locked = cls.objects.select_for_update().filter(region=region, district=district)
            else:
                locked = cls.objects.filter(region=region, district=district)

            max_seq = 0
            for producer in locked:
                match = cls.CODE_PATTERN.match(producer.code or '')
                if match:
                    seq = int(match.group(3))
                    if seq > max_seq:
                        max_seq = seq

            return f"PRD-REG{region.id:02d}-DIS{district.id:03d}-{max_seq + 1:04d}"

    def save(self, *args, **kwargs):
        if not self.code:
            if not self.region:
                raise ValueError("La région est requise pour générer un code producteur.")
            if not self.district and self.commune and self.commune.district:
                self.district = self.commune.district
            if not self.district:
                raise ValueError("Le district est requis pour générer un code producteur.")
            self.code = self.generate_next_code(self.region, self.district)
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.code} - {self.name}"
    
    @property
    def parcels_count(self):
        return self.parcels.count()
    
    @property
    def total_area(self):
        return self.parcels.aggregate(models.Sum('area'))['area__sum'] or 0
    
    @property
    def total_plants(self):
        return self.parcels.aggregate(models.Sum('vanilla_plants'))['vanilla_plants__sum'] or 0


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
        verbose_name='Legende'
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
    president = models.CharField(max_length=200, blank=True, null=True, verbose_name='President')
    registration_number = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        verbose_name='Numero enregistrement'
    )
    is_active = models.BooleanField(default=True, verbose_name='Actif')
    notes = models.TextField(blank=True, null=True, verbose_name='Notes')
    
    class Meta:
        verbose_name = 'Cooperative'
        verbose_name_plural = 'Cooperatives'
        ordering = ['name']
    
    def __str__(self):
        return f"{self.code} - {self.name}"
    
    @property
    def members_count(self):
        return self.members.count()
