"""
Models for the CIN (Carte d'Identité Nationale) intelligent scan module.
Stores extracted data, original + enhanced photos, confidence scores,
manual corrections and scan metadata for traceability (spec §13).
"""
from django.db import models
from core.models import TimeStampedModel
from accounts.models import User

SEX_CHOICES = [
    ('M', 'Masculin'),
    ('F', 'Feminin'),
]


class CINScan(TimeStampedModel):
    """A single CIN scan (recto + verso merged) registered by a field agent."""

    SOURCE_CHOICES = [
        ('auto', 'Lecture automatique'),
        ('manual', 'Saisie manuelle'),
    ]

    agent = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='cin_scans',
        verbose_name='Agent',
    )

    # --- Extracted identity fields ---
    nom = models.CharField(max_length=200, verbose_name='Nom')
    prenom = models.CharField(max_length=200, blank=True, verbose_name='Prénom(s)')
    numero_cin = models.CharField(max_length=50, verbose_name='Numéro CIN')
    date_naissance = models.DateField(null=True, blank=True, verbose_name='Date de naissance')
    lieu_naissance = models.CharField(max_length=200, blank=True, verbose_name='Lieu de naissance')
    sexe = models.CharField(max_length=1, choices=SEX_CHOICES, blank=True, verbose_name='Sexe')
    pere = models.CharField(max_length=200, blank=True, verbose_name='Père')
    mere = models.CharField(max_length=200, blank=True, verbose_name='Mère')
    profession = models.CharField(max_length=200, blank=True, verbose_name='Profession')
    adresse = models.TextField(blank=True, verbose_name='Adresse')
    arrondissement = models.CharField(max_length=200, blank=True, verbose_name='Arrondissement')
    date_delivrance = models.DateField(null=True, blank=True, verbose_name='Date de délivrance')
    date_expiration = models.DateField(null=True, blank=True, verbose_name="Date d'expiration")

    # --- Complementary info (not printed on the card) ---
    telephone = models.CharField(max_length=20, blank=True, verbose_name='Téléphone')
    email = models.EmailField(blank=True, verbose_name='Email')
    observations = models.TextField(blank=True, verbose_name='Observations')

    # --- AI / quality metadata ---
    confidence = models.JSONField(default=dict, blank=True, verbose_name='Scores de confiance')
    corrected_fields = models.JSONField(default=list, blank=True, verbose_name='Champs corrigés')
    scan_metadata = models.JSONField(default=dict, blank=True, verbose_name='Métadonnées du scan')
    age = models.PositiveIntegerField(null=True, blank=True, verbose_name='Âge calculé')
    source = models.CharField(max_length=10, choices=SOURCE_CHOICES, default='auto', verbose_name='Source')

    # --- Photos (stored securely, access controlled) ---
    photo_recto = models.ImageField(upload_to='cin/recto/', blank=True, null=True)
    photo_verso = models.ImageField(upload_to='cin/verso/', blank=True, null=True)
    photo_recto_enhanced = models.ImageField(upload_to='cin/recto_enhanced/', blank=True, null=True)
    photo_verso_enhanced = models.ImageField(upload_to='cin/verso_enhanced/', blank=True, null=True)
    photo_beneficiaire = models.ImageField(upload_to='cin/beneficiaire/', blank=True, null=True)

    synced = models.BooleanField(default=False, verbose_name='Synchronisé')

    class Meta:
        verbose_name = 'Scan CIN'
        verbose_name_plural = 'Scans CIN'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.nom} {self.prenom} — CIN {self.numero_cin}"
