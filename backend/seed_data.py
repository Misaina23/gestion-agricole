"""
Script to seed sample data for testing.
Run with: python -c "exec(open('seed_data.py').read())"
"""
import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'videeko_vanilla.settings')
django.setup()

from datetime import date, timedelta
from core.models import Region, Commune, Season
from producers.models import Producer
from parcels.models import Parcel
from productions.models import Production
from deliveries.models import Delivery
from accounts.models import User

# Get or create superuser for registered_by
admin_user, created_user = User.objects.get_or_create(
    username='admin',
    defaults={
        'email': 'admin@videeko.mg',
        'first_name': 'Admin',
        'last_name': 'System',
        'is_staff': True,
        'is_superuser': True,
        'role': 'admin',
    }
)

# Use existing regions
regions_cache = {
    'IT': Region.objects.get(code='IT'),
    'VA': Region.objects.get(code='VA'),
    'HMT': Region.objects.get(code='HMT'),
}

# Get a commune for each region
communes_cache = {
    'IT': Commune.objects.filter(region=regions_cache['IT']).first(),
    'VA': Commune.objects.filter(region=regions_cache['VA']).first(),
    'HMT': Commune.objects.filter(region=regions_cache['HMT']).first(),
}

# Get or create current season
try:
    current_season = Season.objects.get(is_current=True)
except Season.DoesNotExist:
    current_season = Season.objects.create(
        name='Saison A',
        year=2024,
        start_date='2024-05-01',
        end_date='2025-04-30',
        target_weight=10000,
        is_current=True,
    )

# Count existing data
existing_producers = Producer.objects.count()
existing_deliveries = Delivery.objects.count()

print(f"\nStats before: {existing_producers} producers, {existing_deliveries} deliveries")

# Create producers if we have less than 4
if existing_producers < 4:
    new_producers = [
        ('PRD-RAK-NEW1', 'Rakoto Nouveau 1', '+261 34 00 000 101', 'IT'),
        ('PRD-RAK-NEW2', 'Rakoto Nouveau 2', '+261 34 00 000 102', 'VA'),
    ]
    for code, name, phone, reg_code in new_producers[:4-existing_producers]:
        region = regions_cache[reg_code]
        commune = communes_cache[reg_code]
        producer = Producer.objects.create(
            code=code,
            name=name,
            phone=phone,
            region=region,
            commune=commune,
            status='active',
            registered_by=admin_user,
        )
        print(f"Created producer: {producer.name}")

# Create parcels for new producers without parcels
all_producers = list(Producer.objects.all())
producers_without_parcels = [p for p in all_producers if p.parcels.count() == 0]
for i, producer in enumerate(producers_without_parcels):
    Parcel.objects.create(
        code=f'PAR-NEW-{producer.id:03d}',
        producer=producer,
        area=2.0 + i,
        vanilla_plants=450 + i * 50,
        status='active',
        registered_by=admin_user,
    )
    print(f"Created parcel for: {producer.name}")

# Create productions for new parcels
for parcel in Parcel.objects.all():
    if parcel.productions.count() == 0:
        Production.objects.create(
            code=f'PROD-NEW-{parcel.id:03d}',
            parcel=parcel,
            season=current_season,
            harvest_date=date(2024, 7, 1),
            weight_green=45.0,
            status='harvested',
            registered_by=admin_user,
        )
        print(f"Created production for parcel: {parcel.code}")

# Create deliveries if we have less than 4
if Delivery.objects.count() < 4:
    base_date = date(2024, 6, 1)
    for i in range(4 - Delivery.objects.count()):
        Delivery.objects.create(
            product=f'Vanille Grade {"A" if i % 2 == 0 else "B"} Final {i+1}',
            quantity=55.0 + i * 5,
            unit_price=5500 + i * 500,
            buyer=f'Exportateur Final {i+1}',
            producer=all_producers[i % len(all_producers)],
            status=['delivered', 'in_transit', 'pending', 'delivered'][i % 4],
            received_by=admin_user,
            delivery_date=base_date + timedelta(days=i*5),
        )
        print(f"Created delivery {i+1}")

print("\nSeed data completed!")