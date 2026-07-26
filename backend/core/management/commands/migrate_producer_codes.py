"""
Management command: migrate existing producer codes to the new format

    PRD-REG{region_id:02d}-DIS{district_id:03d}-{sequence:04d}

Run once after deploying the District model + Producer.district field:

    python manage.py migrate_producer_codes

The command:
  1. Creates one District per Region that does not have one yet and links
     every Commune of that region to it.
  2. Assigns each Producer a District (derived from its Commune).
  3. Reassigns every Producer.code to the new sequential format, processing
     producers ordered by (region, district, created_at, id) so the numbering
     stays strictly 0001, 0002, ... per region+district and no number is
     ever reused.
Everything runs inside a single database transaction so the operation is
all-or-nothing.
"""
from django.core.management.base import BaseCommand
from django.db import transaction

from core.models import Region, Commune, District
from producers.models import Producer


class Command(BaseCommand):
    help = 'Migrate all producer codes to PRD-REGxx-DISyyy-NNNN format'

    def handle(self, *args, **options):
        with transaction.atomic():
            self._ensure_districts()
            self._link_communes()
            self._reassign_codes()
        self.stdout.write(self.style.SUCCESS('Producer codes migrated successfully.'))

    def _ensure_districts(self):
        created = 0
        for region in Region.objects.all().order_by('id'):
            district, was_created = District.objects.get_or_create(
                code=f"DIS-{region.code}",
                defaults={'name': region.name, 'region': region},
            )
            if was_created:
                created += 1
        if created:
            self.stdout.write(f'  Created {created} district(s).')

    def _link_communes(self):
        linked = 0
        for commune in Commune.objects.filter(district__isnull=True).select_related('region'):
            district = District.objects.filter(region=commune.region).first()
            if district:
                commune.district = district
                commune.save(update_fields=['district'])
                linked += 1
        if linked:
            self.stdout.write(f'  Linked {linked} commune(s) to a district.')

    def _reassign_codes(self):
        producers = list(
            Producer.objects.select_related('region', 'district', 'commune')
            .all()
            .order_by('region__id', 'district__id', 'created_at', 'id')
        )

        used = {}
        updated = 0
        for producer in producers:
            district = producer.district or (producer.commune.district if producer.commune else None)
            if not district:
                district = District.objects.filter(region=producer.region).first()
                if not district:
                    self.stderr.write(
                        self.style.WARNING(
                            f'  Skipping producer {producer.id} ({producer.name}): no district available.'
                        )
                    )
                    continue
                producer.district = district

            key = (producer.region_id, district.id)
            used.setdefault(key, set())

            district_changed = producer.district_id != district.id
            if (
                Producer.is_valid_code(producer.code)
                and Producer.CODE_PATTERN.match(producer.code).group(1) == f"{producer.region.id:02d}"
                and Producer.CODE_PATTERN.match(producer.code).group(2) == f"{district.id:03d}"
                and not district_changed
            ):
                used[key].add(int(Producer.CODE_PATTERN.match(producer.code).group(3)))
                continue

            seq = 1
            while seq in used[key]:
                seq += 1
            new_code = f"PRD-REG{producer.region_id:02d}-DIS{district.id:03d}-{seq:04d}"
            used[key].add(seq)

            save_fields = []
            if district_changed:
                producer.district_id = district.id
                save_fields.append('district')
            if producer.code != new_code:
                producer.code = new_code
                save_fields.append('code')
            if save_fields:
                producer.save(update_fields=save_fields)
            updated += 1

        self.stdout.write(f'  Reassigned {updated} producer code(s).')
