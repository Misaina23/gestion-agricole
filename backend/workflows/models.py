"""
Workflows App Models
"""
from django.db import models
from core.models import TimeStampedModel
from accounts.models import User


class WorkflowStep(TimeStampedModel):
    """Workflow step configuration"""
    STEP_TYPE_CHOICES = [
        ('approval', 'Approbation'),
        ('review', 'Revue'),
        ('validation', 'Validation'),
        ('notification', 'Notification'),
    ]

    name = models.CharField(max_length=100, verbose_name='Nom')
    step_type = models.CharField(max_length=20, choices=STEP_TYPE_CHOICES, verbose_name='Type')
    order = models.IntegerField(verbose_name='Ordre')
    required_role = models.CharField(
        max_length=30,
        choices=[
            ('agent', 'Agent'),
            ('chef_zone', 'Chef de zone'),
            ('supervisor', 'Superviseur'),
            ('admin', 'Administrateur'),
        ],
        verbose_name='Role requis'
    )
    auto_approve = models.BooleanField(default=False, verbose_name='Approbation automatique')
    timeout_hours = models.IntegerField(blank=True, null=True, verbose_name='Delai (heures)')
    escalation_role = models.CharField(max_length=30, blank=True, null=True, verbose_name='Role d\'escalade')
    is_active = models.BooleanField(default=True, verbose_name='Actif')

    class Meta:
        verbose_name = 'Etape de workflow'
        verbose_name_plural = 'Etapes de workflow'
        ordering = ['order']

    def __str__(self):
        return f"{self.name} ({self.required_role})"


class WorkflowInstance(TimeStampedModel):
    """Running workflow instance"""
    STATUS_CHOICES = [
        ('pending', 'En attente'),
        ('in_progress', 'En cours'),
        ('approved', 'Approuve'),
        ('rejected', 'Rejete'),
        ('cancelled', 'Annule'),
    ]

    workflow_step = models.ForeignKey(WorkflowStep, on_delete=models.PROTECT, related_name='instances', verbose_name='Etape')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending', verbose_name='Statut')
    current_step = models.IntegerField(default=0, verbose_name='Etape actuelle')
    initiated_by = models.ForeignKey(
        'accounts.User',
        on_delete=models.SET_NULL,
        null=True,
        related_name='initiated_workflows',
        verbose_name='Initie par'
    )
    assigned_to = models.ForeignKey(
        'accounts.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='assigned_workflows',
        verbose_name='Assigne a'
    )
    entity_type = models.CharField(max_length=50, verbose_name="Type d'entité")
    entity_id = models.IntegerField(verbose_name='ID entité')
    comment = models.TextField(blank=True, null=True, verbose_name='Commentaire')
    action = models.CharField(max_length=50, blank=True, null=True, verbose_name='Action')
    completed_at = models.DateTimeField(blank=True, null=True, verbose_name='Termine le')

    class Meta:
        verbose_name = 'Instance de workflow'
        verbose_name_plural = 'Instances de workflow'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.workflow_step.name} - {self.entity_type} #{self.entity_id}"
