"""
Finance App Models
"""
from django.db import models
from core.models import TimeStampedModel
from accounts.models import User


class TransactionType(models.Model):
    """Transaction type/category"""
    TYPE_CHOICES = [
        ('income', 'Revenu'),
        ('expense', 'Depense'),
        ('subvention', 'Subvention'),
        ('credit', 'Credit'),
        ('remboursement', 'Remboursement'),
    ]

    name = models.CharField(max_length=100, unique=True, verbose_name='Nom')
    type = models.CharField(max_length=20, choices=TYPE_CHOICES, verbose_name='Type')
    description = models.TextField(blank=True, null=True, verbose_name='Description')
    is_active = models.BooleanField(default=True, verbose_name='Actif')

    class Meta:
        verbose_name = 'Type de transaction'
        verbose_name_plural = 'Types de transaction'
        ordering = ['name']

    def __str__(self):
        return self.name


class FinancialTransaction(TimeStampedModel):
    """Financial transaction record"""
    transaction_type = models.ForeignKey(
        TransactionType,
        on_delete=models.PROTECT,
        related_name='transactions',
        verbose_name='Type de transaction'
    )
    amount = models.DecimalField(max_digits=12, decimal_places=2, verbose_name='Montant')
    currency = models.CharField(max_length=3, default='MGA', verbose_name='Devise')
    description = models.TextField(blank=True, null=True, verbose_name='Description')
    transaction_date = models.DateField(verbose_name='Date de transaction')
    producer = models.ForeignKey(
        'producers.Producer',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='transactions',
        verbose_name='Producteur'
    )
    project = models.ForeignKey(
        'projects.Project',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='transactions',
        verbose_name='Projet'
    )
    campaign = models.ForeignKey(
        'campaigns.Campaign',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='transactions',
        verbose_name='Campagne'
    )
    recorded_by = models.ForeignKey(
        'accounts.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='transactions',
        verbose_name='Enregistre par'
    )
    reference_number = models.CharField(max_length=100, blank=True, null=True, verbose_name='Numero de reference')
    notes = models.TextField(blank=True, null=True, verbose_name='Notes')
    synced = models.BooleanField(default=True, verbose_name='Synchronisé')

    class Meta:
        verbose_name = 'Transaction financière'
        verbose_name_plural = 'Transactions financières'
        ordering = ['-transaction_date']

    def __str__(self):
        return f"{self.transaction_type.name} - {self.amount} {self.currency} ({self.transaction_date})"
