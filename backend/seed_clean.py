"""
Cleanup to have exactly 4 producers, 4 parcels, 4 productions, 4 deliveries
"""
import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'videeko_vanilla.settings')
django.setup()

from core.models import Region, Commune, Season
from producers.models import Producer
from parcels.models import Parcel
from productions.models import Production
from deliveries.models import Delivery
from accounts.models import User
from datetime import date, timedelta

admin_user, _ = User.objects.get_or_create(username='admin')

regions_cache = {
    'IT': Region.objects.get(code='IT'),
    'VA': Region.objects.get(code='VA'),
    'HMT': Region.objects.get(code='HMT'),
}

communes_cache = {
    'IT': Commune.objects.filter(region=regions_cache['IT']).first(),
    'VA': Commune.objects.filter(region=regions_cache['VA']).first(),
    'HMT': Commune.objects.filter(region=regions_cache['HMT']).first(),
}

current_season, _ = Season.objects.get_or_create(is_current=True)

# Clean existing data and recreate
Production.objects.all().delete()
Parcel.objects.all().delete()
Delivery.objects.all().delete()
Producer.objects.all().delete()

print("Cleaned existing data")

# Create exactly 4 producers
producers_data = [
    ('PRD-001', 'Rakoto Jean', '+261 34 00 000 001', 'IT'),
    ('PRD-002', 'Rakoto Marie', '+261 34 00 000 002', 'IT'),
    ('PRD-003', 'Rasolofonirina Patrick', '+261 33 00 000 003', 'VA'),
    ('PRD-004', 'Andriamamonjy Sophie', '+261 32 00 000 004', 'HMT'),
]

producers = []
for code, name, phone, reg_code in producers_data:
    producer = Producer.objects.create(
        code=code,
        name=name,
        phone=phone,
        region=regions_cache[reg_code],
        commune=communes_cache[reg_code],
        status='active',
        registered_by=admin_user,
    )
    producers.append(producer)
    print(f"Created producer: {producer.name}")

# Create exactly 4 parcels (one per producer)
for i, producer in enumerate(producers):
    Parcel.objects.create(
        code=f'PAR-{i+1:03d}',
        producer=producer,
        area=2.0 + i,
        vanilla_plants=400 + i * 100,
        status='active',
        registered_by=admin_user,
    )
    print(f"Created parcel: PAR-{i+1:03d} for {producer.name}")

# Create exactly 4 productions (one per parcel)
parcels = Parcel.objects.all()
for i, parcel in enumerate(parcels):
    Production.objects.create(
        code=f'PROD-{i+1:03d}',
        parcel=parcel,
        season=current_season,
        harvest_date=date(2024, 6, 15 + i * 5),
        weight_green=50.0 + i * 10,
        status=['ready', 'curing', 'drying', 'harvested'][i % 4],
        registered_by=admin_user,
    )
    print(f"Created production: PROD-{i+1:03d}")

# Create exactly 4 deliveries (one per producer)
for i, producer in enumerate(producers):
    Delivery.objects.create(
        product=f'Vanille Grade {"A" if i % 2 == 0 else "B"}',
        quantity=50.0 + i * 10,
        unit_price=5000 + i * 1000,
        buyer=f'Exportateur {i+1}',
        producer=producer,
        status=['delivered', 'in_transit', 'pending', 'delivered'][i % 4],
        received_by=admin_user,
        delivery_date=date(2024, 7, 1) + timedelta(days=i*7),
    )
    print(f"Created delivery for: {producer.name}")

print("\nData seeding completed with 4 of each entity!")