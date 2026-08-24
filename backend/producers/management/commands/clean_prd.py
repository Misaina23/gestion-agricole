from django.core.management.base import BaseCommand
from producers.models import Producer
from parcels.models import Parcel

class Command(BaseCommand):
    help = 'Clean PRD- fake data'

    def handle(self, *args, **options):
        prd = Producer.objects.filter(code__startswith='PRD-')
        count = prd.count()
        print(f'Found {count} PRD- producers')
        parcels = Parcel.objects.filter(producer__in=prd)
        print(f'Found {parcels.count()} parcels for PRD- producers')
        parcels.delete()
        prd.delete()
        print('Deleted.')
        print(f'Remaining: {Producer.objects.count()} producers, {Parcel.objects.count()} parcels')
