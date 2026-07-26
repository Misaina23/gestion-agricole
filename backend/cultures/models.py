"""
Cultures App Models
"""
from django.db import models
from core.models import TimeStampedModel


class Culture(TimeStampedModel):
    """Agricultural culture/crop model"""
    TYPE_CHOICES = [
        ('cash', 'Culture de rente'),
        ('food', 'Culture vivrière'),
        ('vegetable', 'Maraîchère'),
        ('fruit', 'Fruitière'),
        ('other', 'Autre'),
    ]

    name = models.CharField(max_length=100, unique=True, verbose_name='Nom')
    variety = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        verbose_name='Variété'
    )
    culture_type = models.CharField(
        max_length=20,
        choices=TYPE_CHOICES,
        default='cash',
        verbose_name='Type de culture'
    )
    growth_duration_days = models.IntegerField(
        blank=True,
        null=True,
        verbose_name='Durée de production (jours)'
    )
    average_yield = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        blank=True,
        null=True,
        verbose_name='Rendement moyen'
    )
    yield_unit = models.CharField(
        max_length=20,
        blank=True,
        null=True,
        verbose_name='Unité de rendement'
    )
    ideal_season = models.CharField(
        max_length=50,
        blank=True,
        null=True,
        verbose_name='Saison idéale'
    )
    market_price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        blank=True,
        null=True,
        verbose_name='Prix moyen du marché'
    )
    price_unit = models.CharField(
        max_length=20,
        blank=True,
        null=True,
        verbose_name='Unité de prix'
    )
    description = models.TextField(
        blank=True,
        null=True,
        verbose_name='Description'
    )
    is_active = models.BooleanField(default=True, verbose_name='Actif')

    class Meta:
        verbose_name = 'Culture'
        verbose_name_plural = 'Cultures'
        ordering = ['name']

    def __str__(self):
        return self.name
