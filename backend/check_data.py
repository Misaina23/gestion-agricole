import django
import os
os.environ['DJANGO_SETTINGS_MODULE'] = 'videeko_vanilla.settings'
django.setup()

from producers.models import Producer
from parcels.models import Parcel
from productions.models import Production
from deliveries.models import Delivery

print('=== DATA SUMMARY ===')
print('Producers:', Producer.objects.count())
print('Parcels:', Parcel.objects.count())
print('Productions:', Production.objects.count())
print('Deliveries:', Delivery.objects.count())

print('\n=== Producer -> Parcel -> Production chain ===')
for p in Producer.objects.all():
    parcels_count = p.parcels.count()
    prods_count = sum(par.productions.count() for par in p.parcels.all())
    print(f'{p.name}: {parcels_count} parcels, {prods_count} productions')

print('\n=== Deliveries by Producer ===')
for d in Delivery.objects.all()[:5]:
    print(f'{d.product}: producer={d.producer.name if d.producer else "None"}, status={d.status}')