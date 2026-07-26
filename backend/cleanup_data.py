import django
import os
os.environ['DJANGO_SETTINGS_MODULE'] = 'videeko_vanilla.settings'
django.setup()

from deliveries.models import Delivery
# Remove duplicate deliveries (keep only unique products)
seen = set()
for d in Delivery.objects.all():
    if d.product in seen:
        print(f"Deleting duplicate: {d.product} (id={d.id})")
        d.delete()
    else:
        seen.add(d.product)

print(f"\nDeliveries after cleanup: {Delivery.objects.count()}")