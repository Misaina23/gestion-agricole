from django.core.management.base import BaseCommand
from producers.models import Producer
from parcels.models import Parcel
import re

class Command(BaseCommand):
    help = 'Remove legacy PRD records that do not match the current year-based format PRD-YYYY-NNNN'

    def handle(self, *args, **options):
        pattern = re.compile(r'^PRD-\d{4}-\d{4}$')
        prd = Producer.objects.exclude(code__regex=r'^PRD-\d{4}-\d{4}$')
        count = prd.count()
        print(f'Found {count} legacy PRD producers')
        parcels = Parcel.objects.filter(producer__in=prd)
        print(f'Found {parcels.count()} parcels for legacy PRD producers')
        parcels.delete()
        prd.delete()
        print('Deleted.')
        print(f'Remaining: {Producer.objects.count()} producers, {Parcel.objects.count()} parcels')
