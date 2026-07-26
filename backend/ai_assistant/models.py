from django.db import models
from django.contrib.auth import get_user_model
from core.models import TimeStampedModel

User = get_user_model()


class ChatSession(TimeStampedModel):
    TOPIC_CHOICES = [
        ('general', 'General'),
        ('production', 'Production'),
        ('parcel', 'Parcelle'),
        ('inspection', 'Inspection'),
        ('harmless', 'Conseil agricole'),
        ('report', 'Rapport'),
    ]

    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='chat_sessions',
        verbose_name='Utilisateur',
    )
    title = models.CharField(max_length=200, verbose_name='Titre', blank=True)
    topic = models.CharField(
        max_length=30,
        choices=TOPIC_CHOICES,
        default='general',
        verbose_name='Sujet',
    )
    context_data = models.JSONField(
        blank=True, null=True, verbose_name='Donnees contextuelles'
    )
    is_active = models.BooleanField(default=True, verbose_name='Actif')

    class Meta:
        verbose_name = 'Session de chat'
        verbose_name_plural = 'Sessions de chat'
        ordering = ['-created_at']

    def __str__(self):
        return self.title or f"Session {self.id} - {self.get_topic_display()}"


class ChatMessage(TimeStampedModel):
    ROLE_CHOICES = [
        ('user', 'Utilisateur'),
        ('assistant', 'Assistant'),
        ('system', 'Systeme'),
    ]

    session = models.ForeignKey(
        ChatSession,
        on_delete=models.CASCADE,
        related_name='messages',
        verbose_name='Session',
    )
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, verbose_name='Role')
    content = models.TextField(verbose_name='Contenu')
    metadata = models.JSONField(blank=True, null=True, verbose_name='Metadonnees')
    is_read = models.BooleanField(default=False, verbose_name='Lu')

    class Meta:
        verbose_name = 'Message de chat'
        verbose_name_plural = 'Messages de chat'
        ordering = ['created_at']

    def __str__(self):
        return f"[{self.role}] {self.content[:50]}..."


class AgriculturalRecommendation(TimeStampedModel):
    TYPE_CHOICES = [
        ('yield', 'Amelioration rendement'),
        ('cultural', 'Pratique culturale'),
        ('pest', 'Lutte antiparasitaire'),
        ('weather', 'Conseil meteorologique'),
        ('market', 'Conseil marche'),
        ('general', 'Conseil general'),
    ]

    PRIORITY_CHOICES = [
        ('low', 'Basse'),
        ('medium', 'Moyenne'),
        ('high', 'Haute'),
        ('urgent', 'Urgente'),
    ]

    producer = models.ForeignKey(
        'producers.Producer',
        on_delete=models.CASCADE,
        related_name='ai_recommendations',
        verbose_name='Producteur',
        blank=True,
        null=True,
    )
    parcel = models.ForeignKey(
        'parcels.Parcel',
        on_delete=models.CASCADE,
        related_name='ai_recommendations',
        verbose_name='Parcelle',
        blank=True,
        null=True,
    )
    recommendation_type = models.CharField(
        max_length=30, choices=TYPE_CHOICES, verbose_name='Type'
    )
    title = models.CharField(max_length=200, verbose_name='Titre')
    description = models.TextField(verbose_name='Description')
    priority = models.CharField(
        max_length=20,
        choices=PRIORITY_CHOICES,
        default='medium',
        verbose_name='Priorite',
    )
    data = models.JSONField(blank=True, null=True, verbose_name='Donnees')
    is_read = models.BooleanField(default=False, verbose_name='Lu')
    is_applied = models.BooleanField(default=False, verbose_name='Applique')

    class Meta:
        verbose_name = 'Recommandation agricole'
        verbose_name_plural = 'Recommandations agricoles'
        ordering = ['-priority', '-created_at']

    def __str__(self):
        return self.title


class MonthlyReport(TimeStampedModel):
    REPORT_TYPE_CHOICES = [
        ('producers', 'Producteurs'),
        ('parcels', 'Parcelles'),
        ('productions', 'Productions'),
        ('inspections', 'Inspections'),
        ('global', 'Global'),
        ('region', 'Region'),
    ]

    STATUS_CHOICES = [
        ('pending', 'En attente'),
        ('generating', 'En generation'),
        ('completed', 'Termine'),
        ('failed', 'Echec'),
    ]

    title = models.CharField(max_length=200, verbose_name='Titre')
    report_type = models.CharField(
        max_length=30, choices=REPORT_TYPE_CHOICES, verbose_name='Type'
    )
    period_start = models.DateField(verbose_name='Debut periode')
    period_end = models.DateField(verbose_name='Fin periode')
    summary = models.TextField(blank=True, verbose_name='Resume')
    report_data = models.JSONField(blank=True, null=True, verbose_name='Donnees')
    generated_file = models.FileField(
        upload_to='reports/%Y/%m/', blank=True, null=True, verbose_name='Fichier'
    )
    status = models.CharField(
        max_length=20, choices=STATUS_CHOICES, default='pending', verbose_name='Statut'
    )
    generated_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='generated_reports',
        verbose_name='Genere par',
    )
    region = models.CharField(
        max_length=100, blank=True, null=True, verbose_name='Region'
    )

    class Meta:
        verbose_name = 'Rapport mensuel'
        verbose_name_plural = 'Rapports mensuels'
        ordering = ['-period_start']

    def __str__(self):
        return self.title


class AILog(TimeStampedModel):
    user = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='ai_logs',
        verbose_name='Utilisateur',
    )
    endpoint = models.CharField(max_length=100, verbose_name='Endpoint')
    prompt = models.TextField(verbose_name='Prompt')
    response = models.TextField(blank=True, verbose_name='Reponse')
    tokens_used = models.IntegerField(default=0, verbose_name='Tokens utilises')
    processing_time = models.FloatField(default=0, verbose_name='Temps traitement (s)')
    is_successful = models.BooleanField(default=True, verbose_name='Succes')
    error_message = models.TextField(blank=True, verbose_name="Message d'erreur")

    class Meta:
        verbose_name = "Log IA"
        verbose_name_plural = "Logs IA"
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.endpoint} - {self.created_at}"
