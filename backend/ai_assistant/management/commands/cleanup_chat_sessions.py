from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from ai_assistant.models import ChatSession


class Command(BaseCommand):
    help = 'Nettoie les sessions de chat inactives de plus de 90 jours'

    def handle(self, *args, **options):
        cutoff = timezone.now() - timedelta(days=90)
        deleted, _ = ChatSession.objects.filter(
            is_active=False,
            updated_at__lt=cutoff,
        ).delete()
        self.stdout.write(
            self.style.SUCCESS(f'{deleted} sessions supprimees')
        )
