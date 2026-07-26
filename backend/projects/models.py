"""
Projects App Models
"""
from django.db import models
from core.models import TimeStampedModel, Region
from accounts.models import User


class Project(TimeStampedModel):
    """Agricultural project model"""
    STATUS_CHOICES = [
        ('draft', 'Brouillon'),
        ('active', 'Actif'),
        ('completed', 'Termine'),
        ('suspended', 'Suspendu'),
        ('cancelled', 'Annule'),
    ]

    name = models.CharField(max_length=200, verbose_name='Nom du projet')
    description = models.TextField(blank=True, null=True, verbose_name='Description')
    donor = models.CharField(max_length=200, blank=True, null=True, verbose_name='Bailleur')
    budget = models.DecimalField(max_digits=15, decimal_places=2, blank=True, null=True, verbose_name='Budget')
    start_date = models.DateField(verbose_name='Date de debut')
    end_date = models.DateField(verbose_name='Date de fin')
    intervention_zone = models.JSONField(default=dict, blank=True, null=True, verbose_name="Zone d'intervention")
    objectives = models.JSONField(default=dict, blank=True, null=True, verbose_name='Objectifs')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft', verbose_name='Statut')
    managed_by = models.ForeignKey(
        'accounts.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='managed_projects',
        verbose_name='Gere par'
    )
    is_active = models.BooleanField(default=True, verbose_name='Actif')

    class Meta:
        verbose_name = 'Projet'
        verbose_name_plural = 'Projets'
        ordering = ['-start_date']

    def __str__(self):
        return self.name


class ProjectActivity(TimeStampedModel):
    """Project activity"""
    ACTIVITY_TYPE_CHOICES = [
        ('training', 'Formation'),
        ('distribution', 'Distribution'),
        ('sensitization', 'Sensibilisation'),
        ('follow_up', 'Suivi technique'),
        ('other', 'Autre'),
    ]

    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='activities', verbose_name='Projet')
    name = models.CharField(max_length=200, verbose_name="Nom de l'activité")
    activity_type = models.CharField(max_length=20, choices=ACTIVITY_TYPE_CHOICES, verbose_name="Type d'activité")
    description = models.TextField(blank=True, null=True, verbose_name='Description')
    planned_date = models.DateField(verbose_name='Date prevue')
    actual_date = models.DateField(blank=True, null=True, verbose_name='Date reelle')
    location = models.CharField(max_length=200, blank=True, null=True, verbose_name='Lieu')
    target_audience = models.CharField(max_length=200, blank=True, null=True, verbose_name='Public cible')
    participants_count = models.IntegerField(blank=True, null=True, verbose_name='Nombre de participants')
    budget = models.DecimalField(max_digits=12, decimal_places=2, blank=True, null=True, verbose_name='Budget')
    status = models.CharField(max_length=20, default='planned', verbose_name='Statut')
    notes = models.TextField(blank=True, null=True, verbose_name='Notes')

    class Meta:
        verbose_name = 'Activite de projet'
        verbose_name_plural = 'Activites de projet'
        ordering = ['-planned_date']

    def __str__(self):
        return f"{self.project.name} - {self.name}"


class Beneficiary(TimeStampedModel):
    """Project beneficiary"""
    BENEFICIARY_TYPE_CHOICES = [
        ('producer', 'Producteur'),
        ('household', 'Menage'),
        ('group', 'Groupe'),
        ('other', 'Autre'),
    ]

    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='beneficiaries', verbose_name='Projet')
    beneficiary_type = models.CharField(max_length=20, choices=BENEFICIARY_TYPE_CHOICES, verbose_name='Type de beneficiaire')
    producer = models.ForeignKey(
        'producers.Producer',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='project_beneficiaries',
        verbose_name='Producteur'
    )
    household_name = models.CharField(max_length=200, blank=True, null=True, verbose_name='Nom du menage')
    household_size = models.IntegerField(blank=True, null=True, verbose_name='Taille du menage')
    enrollment_date = models.DateField(verbose_name="Date d'inscription")
    indicators_reached = models.JSONField(default=dict, blank=True, null=True, verbose_name='Indicateurs atteints')
    is_active = models.BooleanField(default=True, verbose_name='Actif')
    notes = models.TextField(blank=True, null=True, verbose_name='Notes')

    class Meta:
        verbose_name = 'Beneficiaire'
        verbose_name_plural = 'Beneficiaires'
        ordering = ['-enrollment_date']

    def __str__(self):
        return f"{self.project.name} - {self.beneficiary_type}"
