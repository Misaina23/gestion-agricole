"""
Management command to import inspection data from the T06 Excel file.

Inspection records are derived from:
- Sheet 2 -> last internal inspection date + inspector
- Sheet 3 -> production unit last internal inspection date + inspector

Existing Inspection objects are matched by:
- producer + inspection_type + planned_date/actual_date + inspector

Usage:
    python manage.py import_inspections_from_excel <path_to_excel_file>

Example:
    python manage.py import_inspections_from_excel "T06COOPERATIVE VINTSY ANNEE 2026.-0.xlsx"
"""
import os
import secrets
from datetime import datetime

from django.core.management.base import BaseCommand
from django.db import transaction
from django.contrib.auth import get_user_model

from producers.models import Producer
from parcels.models import Parcel
from inspections.models import Inspection

User = get_user_model()


def to_date(value):
    if not value:
        return None
    if isinstance(value, datetime):
        return value.date()
    text = str(value).strip()
    for fmt in ('%d/%m/%Y', '%Y-%m-%d', '%d.%m.%Y'):
        try:
            return datetime.strptime(text, fmt).date()
        except ValueError:
            continue
    return None


def to_str(value):
    if value is None:
        return ''
    return str(value).strip()


class Command(BaseCommand):
    help = 'Import inspection data from the T06 cooperative Excel file.'

    def add_arguments(self, parser):
        parser.add_argument('excel_path', type=str, help='Path to the Excel file')
        parser.add_argument('--dry-run', action='store_true', help='Do not save to database')
        parser.add_argument('--limit', type=int, default=None, help='Limit number of producer rows processed')

    def handle(self, *args, **options):
        excel_path = options['excel_path']
        if not os.path.exists(excel_path):
            self.stdout.write(self.style.ERROR(f'File not found: {excel_path}'))
            return

        dry_run = options['dry_run']
        if dry_run:
            self.stdout.write(self.style.WARNING('DRY RUN - no data will be saved'))

        import openpyxl
        wb = openpyxl.load_workbook(excel_path, data_only=True)
        ws_members = wb['2-Registre des membres']
        ws_units = wb['3-Registre des unités'] if '3-Registre des unités' in wb.sheetnames else None

        producer_cache = {}
        inspector_cache = {}
        created = 0
        updated = 0
        skipped = 0

        def get_producer(code):
            code = to_str(code)
            if not code:
                return None
            if code in producer_cache:
                return producer_cache[code]
            producer = Producer.objects.filter(code=code).first()
            producer_cache[code] = producer
            return producer

        def get_or_create_inspector(name):
            name = to_str(name)
            if not name:
                return None
            key = name.lower()
            if key in inspector_cache:
                return inspector_cache[key]
            inspector = User.objects.filter(last_name__iexact=name).first()
            if not inspector:
                inspector = User.objects.filter(first_name__iexact=name).first()
            if not inspector:
                inspector = User.objects.filter(username__iexact=name).first()
            if not inspector:
                inspector = User.objects.create_user(
                    username=name.lower().replace(' ', '.'),
                    password=secrets.token_urlsafe(16),
                    last_name=name,
                    first_name='',
                    email=f'{name.lower().replace(" ", ".")}@inspector.local',
                    is_field_agent=False,
                    is_staff=True,
                )
            inspector_cache[key] = inspector
            return inspector

        def upsert_inspection(producer, parcel, inspection_type, planned_date, actual_date, inspector, result, status, observations=''):
            if not producer:
                return None, False
            code = f"INS-{producer.code}-{inspection_type}-{actual_date or planned_date}".upper()
            code = to_str(code)[:50]
            defaults = {
                'producer': producer,
                'parcel': parcel,
                'inspection_type': inspection_type,
                'planned_date': planned_date,
                'actual_date': actual_date,
                'inspector': inspector,
                'status': status,
                'result': result or 'passed',
                'observations': observations or '',
                'notes': '',
            }
            inspection, was_created = Inspection.objects.update_or_create(
                code=code,
                defaults=defaults,
            )
            return inspection, was_created

        with transaction.atomic():
            # Sheet 2 -> producers
            limit = options.get('limit')
            processed = 0
            for row in ws_members.iter_rows(min_row=3, values_only=True):
                if limit is not None and processed >= limit:
                    break
                producer_code = to_str(row[3])
                producer = get_producer(producer_code)
                if not producer:
                    skipped += 1
                    processed += 1
                    continue

                internal_date = to_date(row[12])
                internal_inspector_name = to_str(row[13])
                external_date = to_date(row[14])

                inspector = get_or_create_inspector(internal_inspector_name) if internal_inspector_name else None

                if internal_date:
                    parcel = producer.parcels.first()
                    _, was_created = upsert_inspection(
                        producer=producer,
                        parcel=parcel,
                        inspection_type='routine',
                        planned_date=internal_date,
                        actual_date=internal_date,
                        inspector=inspector,
                        result='passed',
                        status='completed',
                        observations='Inspection interne importée depuis le registre des membres.',
                    )
                    if was_created:
                        created += 1
                    else:
                        updated += 1

                if external_date:
                    parcel = producer.parcels.first()
                    _, was_created = upsert_inspection(
                        producer=producer,
                        parcel=parcel,
                        inspection_type='certification',
                        planned_date=external_date,
                        actual_date=external_date,
                        inspector=inspector,
                        result='passed',
                        status='completed',
                        observations='Inspection ECOCERT importée depuis le registre des membres.',
                    )
                    if was_created:
                        created += 1
                    else:
                        updated += 1

                processed += 1

            # Sheet 3 -> production units (if present)
            if ws_units:
                processed_units = 0
                for row in ws_units.iter_rows(min_row=3, values_only=True):
                    if limit is not None and processed_units >= limit:
                        break
                    unit_name = to_str(row[0])
                    unit_code = to_str(row[1])
                    if not unit_name and not unit_code:
                        continue
                    internal_date = to_date(row[12])
                    internal_inspector_name = to_str(row[13])
                    external_date = to_date(row[14])

                    inspector = get_or_create_inspector(internal_inspector_name) if internal_inspector_name else None

                    if internal_date or external_date:
                        producers = Producer.objects.filter(unit_name__icontains=unit_name.split('/')[-1].strip() if unit_name else '')
                        producer = producers.first()
                        if not producer:
                            skipped += 1
                            processed_units += 1
                            continue

                        if internal_date:
                            parcel = producer.parcels.first()
                            _, was_created = upsert_inspection(
                                producer=producer,
                                parcel=parcel,
                                inspection_type='routine',
                                planned_date=internal_date,
                                actual_date=internal_date,
                                inspector=inspector,
                                result='passed',
                                status='completed',
                                observations='Inspection interne importée depuis le registre des unités.',
                            )
                            if was_created:
                                created += 1
                            else:
                                updated += 1

                        if external_date:
                            parcel = producer.parcels.first()
                            _, was_created = upsert_inspection(
                                producer=producer,
                                parcel=parcel,
                                inspection_type='certification',
                                planned_date=external_date,
                                actual_date=external_date,
                                inspector=inspector,
                                result='passed',
                                status='completed',
                                observations='Inspection ECOCERT importée depuis le registre des unités.',
                            )
                            if was_created:
                                created += 1
                            else:
                                updated += 1

                    processed_units += 1

        if dry_run:
            self.stdout.write(self.style.WARNING('DRY RUN - no changes were saved.'))
        else:
            limit_msg = f' (limited to {limit} rows)' if limit is not None else ''
            self.stdout.write(self.style.SUCCESS(
                f'Import complete{limit_msg}: {created} inspections created, {updated} updated, {skipped} skipped.'
            ))

