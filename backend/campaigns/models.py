"""
Campaigns App Models
"""
from django.db import models
from core.models import TimeStampedModel, Region
from accounts.models import User


class Campaign(TimeStampedModel):
    """Agricultural campaign model"""
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('completed', 'Terminee'),
        ('pending', 'En attente'),
        ('cancelled', 'Annulee'),
    ]

    name = models.CharField(max_length=200, verbose_name='Nom de la campagne')
    description = models.TextField(blank=True, null=True, verbose_name='Description')
    start_date = models.DateField(verbose_name='Date de debut')
    end_date = models.DateField(verbose_name='Date de fin')
    culture = models.ForeignKey(
        'cultures.Culture',
        on_delete=models.PROTECT,
        related_name='campaigns',
        verbose_name='Culture'
    )
    region = models.ForeignKey(
        Region,
        on_delete=models.PROTECT,
        related_name='campaigns',
        verbose_name='Region'
    )
    objectives = models.JSONField(
        default=dict,
        blank=True,
        null=True,
        verbose_name='Objectifs de production'
    )
    budget = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        blank=True,
        null=True,
        verbose_name='Budget'
    )
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='pending',
        verbose_name='Statut'
    )
    managed_by = models.ForeignKey(
        'accounts.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='managed_campaigns',
        verbose_name='Gere par'
    )
    is_active = models.BooleanField(default=True, verbose_name='Actif')

    class Meta:
        verbose_name = 'Campagne'
        verbose_name_plural = 'Campagnes'
        ordering = ['-start_date']

    def __str__(self):
        return f"{self.name} - {self.culture.name} ({self.start_date.year})"


class CampaignProducer(TimeStampedModel):
    """Link producers to campaigns"""
    campaign = models.ForeignKey(
        Campaign,
        on_delete=models.CASCADE,
        related_name='producers',
        verbose_name='Campagne'
    )
    producer = models.ForeignKey(
        'producers.Producer',
        on_delete=models.CASCADE,
        related_name='campaigns',
        verbose_name='Producteur'
    )
    enrollment_date = models.DateField(
        auto_now_add=True,
        verbose_name="Date d'inscription"
    )
    is_active = models.BooleanField(default=True, verbose_name='Actif')
    notes = models.TextField(blank=True, null=True, verbose_name='Notes')

    class Meta:
        verbose_name = 'Producteur de campagne'
        verbose_name_plural = 'Producteurs de campagne'
        unique_together = ['campaign', 'producer']
        ordering = ['-enrollment_date']

    def __str__(self):
        return f"{self.producer.name} - {self.campaign.name}"
