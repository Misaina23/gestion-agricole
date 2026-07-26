"""
Add campaigns, cultures and inputs data
"""
import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'videeko_vanilla.settings')
django.setup()

from datetime import date
from campaigns.models import Campaign, CampaignProducer
from inputs.models import InputType, InputDistribution
from cultures.models import Culture
from producers.models import Producer
from core.models import Region
from accounts.models import User

admin_user, _ = User.objects.get_or_create(username='admin')

# Create vanilla culture
vanilla, _ = Culture.objects.get_or_create(
    name='Vanille',
    defaults={'culture_type': 'cash', 'is_active': True}
)

# Create input types if needed
types_map = {'Engrais': 'fertilizer', 'Semences': 'seed', 'Pesticide': 'pesticide'}
for name, input_type in types_map.items():
    InputType.objects.get_or_create(
        name=name,
        defaults={'type': input_type, 'unit': 'kg'}
    )

print(f"Input types: {InputType.objects.count()}")

# Create 4 campaigns
producers = list(Producer.objects.all())
regions = Region.objects.all()
for i, region in enumerate(regions[:4]):
    campaign, created = Campaign.objects.get_or_create(
        name=f'Campagne Vanille {region.code} 2024',
        defaults={
            'region': region,
            'culture': vanilla,
            'start_date': date(2024, 5, 1),
            'end_date': date(2025, 4, 30),
            'status': ['active', 'pending', 'completed', 'cancelled'][i % 4],
            'managed_by': admin_user,
        }
    )
    if created:
        for p in producers[:2]:
            CampaignProducer.objects.get_or_create(
                campaign=campaign,
                producer=p,
                defaults={'enrollment_date': date(2024, 5, 15), 'is_active': True}
            )
        print(f"Created campaign: {campaign.name}")

# Create 4 input distributions
input_types = list(InputType.objects.all())
for i, producer in enumerate(producers):
    InputDistribution.objects.get_or_create(
        input_type=input_types[i % len(input_types)],
        producer=producer,
        defaults={
            'quantity': 100 + i * 50,
            'unit': 'kg',
            'distribution_date': date(2024, 6, 1),
            'distributed_by': admin_user,
            'unit_value': 1000,
        }
    )
    print(f"Created input for: {producer.name}")

print("\nDone!")