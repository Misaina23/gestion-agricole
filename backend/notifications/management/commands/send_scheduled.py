from django.core.management.base import BaseCommand
from django.utils import timezone
from notifications.models import ScheduledNotification, Notification
from django.contrib.auth import get_user_model


class Command(BaseCommand):
    help = 'Envoie les notifications planifiées dont la date est arrivée'

    def handle(self, *args, **options):
        now = timezone.now()
        pending = ScheduledNotification.objects.filter(
            status='scheduled',
            run_at__lte=now,
        ).select_related('user')

        sent = 0
        for scheduled in pending:
            try:
                Notification.objects.create(
                    user=scheduled.user,
                    channel=scheduled.channel,
                    title=scheduled.payload.get('title', 'Notification'),
                    message=scheduled.payload.get('message', ''),
                    sent_at=now,
                )
                scheduled.status = 'sent'
                scheduled.sent_at = now
                scheduled.save()
                sent += 1
            except Exception as e:
                scheduled.status = 'failed'
                scheduled.save()
                self.stderr.write(f'Failed for {scheduled.id}: {e}')

        self.stdout.write(self.style.SUCCESS(f'{sent} notifications envoyées'))
