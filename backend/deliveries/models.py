"""
Deliveries App Models
"""
from django.db import models
from core.models import TimeStampedModel
from accounts.models import User


class Delivery(TimeStampedModel):
    """Agricultural delivery model"""
    STATUS_CHOICES = [
        ('pending', 'En attente'),
        ('in_transit', 'En transit'),
        ('delivered', 'Livree'),
        ('cancelled', 'Annulee'),
    ]

    product = models.CharField(max_length=200, verbose_name='Produit')
    quantity = models.DecimalField(max_digits=10, decimal_places=2, verbose_name='Quantité')
    quantity_unit = models.CharField(max_length=20, default='kg', verbose_name='Unité')
    unit_price = models.DecimalField(max_digits=10, decimal_places=2, verbose_name='Prix unitaire')
    total_price = models.DecimalField(max_digits=12, decimal_places=2, blank=True, null=True, verbose_name='Prix total')
    quality_bonus = models.DecimalField(max_digits=10, decimal_places=2, default=0, verbose_name='Prime qualité')
    buyer = models.CharField(max_length=200, verbose_name='Acheteur')
    collection_center = models.CharField(max_length=200, blank=True, null=True, verbose_name='Centre de collecte')
    delivery_date = models.DateField(verbose_name='Date de livraison')
    producer = models.ForeignKey(
        'producers.Producer',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='deliveries',
        verbose_name='Producteur'
    )
    campaign = models.ForeignKey(
        'campaigns.Campaign',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='deliveries',
        verbose_name='Campagne'
    )
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending', verbose_name='Statut')
    received_by = models.ForeignKey(
        'accounts.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='received_deliveries',
        verbose_name='Reçu par'
    )
    notes = models.TextField(blank=True, null=True, verbose_name='Notes')
    synced = models.BooleanField(default=True, verbose_name='Synchronisé')

    class Meta:
        verbose_name = 'Livraison'
        verbose_name_plural = 'Livraisons'
        ordering = ['-delivery_date']

    def save(self, *args, **kwargs):
        if self.unit_price and self.quantity:
            self.total_price = self.unit_price * self.quantity + self.quality_bonus
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.product} - {self.quantity}{self.quantity_unit} ({self.delivery_date})"
