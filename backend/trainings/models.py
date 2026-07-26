"""
Trainings App Models
"""
from django.db import models
from core.models import TimeStampedModel
from accounts.models import User


class Training(TimeStampedModel):
    """Training session"""
    title = models.CharField(max_length=200, verbose_name='Titre')
    subject = models.CharField(max_length=200, verbose_name='Sujet')
    description = models.TextField(blank=True, null=True, verbose_name='Description')
    training_date = models.DateField(verbose_name='Date de formation')
    location = models.CharField(max_length=200, blank=True, null=True, verbose_name='Lieu')
    trainer = models.ForeignKey(
        'accounts.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='trainings_given',
        verbose_name='Formateur'
    )
    project = models.ForeignKey(
        'projects.Project',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='trainings',
        verbose_name='Projet'
    )
    max_participants = models.IntegerField(blank=True, null=True, verbose_name='Nombre max de participants')
    evaluation_criteria = models.JSONField(default=dict, blank=True, null=True, verbose_name="Critères d'évaluation")
    notes = models.TextField(blank=True, null=True, verbose_name='Notes')

    class Meta:
        verbose_name = 'Formation'
        verbose_name_plural = 'Formations'
        ordering = ['-training_date']

    def __str__(self):
        return f"{self.title} ({self.training_date})"


class TrainingAttendance(TimeStampedModel):
    """Training attendance record"""
    PRESENCE_CHOICES = [
        ('present', 'Present'),
        ('absent', 'Absent'),
        ('late', 'Retard'),
        ('partial', 'Partiel'),
    ]

    training = models.ForeignKey(Training, on_delete=models.CASCADE, related_name='attendances', verbose_name='Formation')
    producer = models.ForeignKey(
        'producers.Producer',
        on_delete=models.CASCADE,
        related_name='training_attendances',
        verbose_name='Producteur'
    )
    presence = models.CharField(max_length=20, choices=PRESENCE_CHOICES, default='present', verbose_name='Presence')
    attendance_time = models.DateTimeField(blank=True, null=True, verbose_name='Heure de presence')
    evaluation_score = models.IntegerField(blank=True, null=True, verbose_name="Score d'évaluation")
    evaluation_notes = models.TextField(blank=True, null=True, verbose_name="Notes d'évaluation")
    signature_uri = models.CharField(max_length=500, blank=True, null=True, verbose_name='Signature')
    photos = models.JSONField(default=list, blank=True, null=True, verbose_name='Photos')
    notes = models.TextField(blank=True, null=True, verbose_name='Notes')

    class Meta:
        verbose_name = 'Presence à formation'
        verbose_name_plural = 'Presences à formation'
        ordering = ['-training__training_date']
        unique_together = ['training', 'producer']

    def __str__(self):
        return f"{self.producer.name} - {self.training.title}"
