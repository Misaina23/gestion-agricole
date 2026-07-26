"""
Tasks App Models
"""
from django.db import models
from core.models import TimeStampedModel
from accounts.models import User


class Task(TimeStampedModel):
    """Task assigned to agents"""
    PRIORITY_CHOICES = [
        ('low', 'Basse'),
        ('medium', 'Moyenne'),
        ('high', 'Haute'),
        ('urgent', 'Urgente'),
    ]

    STATUS_CHOICES = [
        ('pending', 'A faire'),
        ('in_progress', 'En cours'),
        ('completed', 'Terminee'),
        ('cancelled', 'Annulee'),
    ]

    TASK_TYPE_CHOICES = [
        ('inspection', 'Inspection'),
        ('training', 'Formation'),
        ('survey', 'Enquête'),
        ('visit', 'Visite'),
        ('other', 'Autre'),
    ]

    title = models.CharField(max_length=200, verbose_name='Titre')
    description = models.TextField(blank=True, null=True, verbose_name='Description')
    task_type = models.CharField(max_length=20, choices=TASK_TYPE_CHOICES, verbose_name='Type de tâche')
    priority = models.CharField(max_length=20, choices=PRIORITY_CHOICES, default='medium', verbose_name='Priorité')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending', verbose_name='Statut')
    assigned_to = models.ForeignKey(
        'accounts.User',
        on_delete=models.CASCADE,
        related_name='tasks',
        verbose_name='Assigne a'
    )
    created_by = models.ForeignKey(
        'accounts.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='created_tasks',
        verbose_name='Cree par'
    )
    due_date = models.DateField(blank=True, null=True, verbose_name="Date d'echeance")
    completed_at = models.DateTimeField(blank=True, null=True, verbose_name='Termine le')
    location = models.CharField(max_length=200, blank=True, null=True, verbose_name='Lieu')
    notes = models.TextField(blank=True, null=True, verbose_name='Notes')

    class Meta:
        verbose_name = 'Tache'
        verbose_name_plural = 'Taches'
        ordering = ['-due_date', '-priority']

    def __str__(self):
        return f"{self.title} - {self.assigned_to.get_full_name()}"
