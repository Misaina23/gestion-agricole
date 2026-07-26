"""
Inputs App Models
"""
from django.db import models
from core.models import TimeStampedModel
from accounts.models import User


class InputType(models.Model):
    """Type of agricultural input"""
    TYPE_CHOICES = [
        ('fertilizer', 'Engrais'),
        ('seed', 'Semences'),
        ('pesticide', 'Pesticides'),
        ('tool', 'Outils'),
        ('plant', 'Plants'),
        ('other', 'Autre'),
    ]

    name = models.CharField(max_length=100, unique=True, verbose_name='Nom')
    type = models.CharField(max_length=20, choices=TYPE_CHOICES, verbose_name='Type')
    unit = models.CharField(max_length=20, verbose_name='Unité')
    description = models.TextField(blank=True, null=True, verbose_name='Description')
    is_active = models.BooleanField(default=True, verbose_name='Actif')

    class Meta:
        verbose_name = "Type d'intrant"
        verbose_name_plural = "Types d'intrants"
        ordering = ['name']

    def __str__(self):
        return self.name


class InputDistribution(TimeStampedModel):
    """Input distribution to producers"""
    input_type = models.ForeignKey(
        InputType,
        on_delete=models.PROTECT,
        related_name='distributions',
        verbose_name="Type d'intrant"
    )
    producer = models.ForeignKey(
        'producers.Producer',
        on_delete=models.CASCADE,
        related_name='input_distributions',
        verbose_name='Producteur'
    )
    quantity = models.DecimalField(max_digits=10, decimal_places=2, verbose_name='Quantité')
    unit = models.CharField(max_length=20, verbose_name='Unité')
    unit_value = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        blank=True,
        null=True,
        verbose_name='Valeur unitaire'
    )
    total_value = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        blank=True,
        null=True,
        verbose_name='Valeur totale'
    )
    distribution_date = models.DateField(verbose_name='Date de distribution')
    distributed_by = models.ForeignKey(
        'accounts.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='input_distributions',
        verbose_name='Distribué par'
    )
    campaign = models.ForeignKey(
        'campaigns.Campaign',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='input_distributions',
        verbose_name='Campagne'
    )
    notes = models.TextField(blank=True, null=True, verbose_name='Notes')
    synced = models.BooleanField(default=True, verbose_name='Synchronisé')

    class Meta:
        verbose_name = "Distribution d'intrant"
        verbose_name_plural = "Distributions d'intrants"
        ordering = ['-distribution_date']

    def save(self, *args, **kwargs):
        if self.unit_value and self.quantity:
            self.total_value = self.unit_value * self.quantity
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.input_type.name} - {self.producer.name} ({self.distribution_date})"
