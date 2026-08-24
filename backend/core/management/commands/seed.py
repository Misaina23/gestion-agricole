"""Reproducible seed for VIDEEKO VANILLA from the real cooperative register.

Reads the JSON files produced by ``scripts/extract_vintsy_data.py`` (the real
data extracted from the T06 Excel register) and rebuilds the database with
correct relations:

    Producteur  ->  Parcelle  ->  Inspection / Récolte (ParcelRegisterHarvest)

The command is idempotent (``update_or_create`` on natural keys) and runs
inside a single transaction: if anything fails the database is left untouched.

Usage::

    python manage.py seed                # full reproducible seed
    python manage.py migrate --seed       # migrate then seed (Django 3.2+)

The Excel workbook itself is never read at runtime: it only served to build the
JSON data files, which are committed to the repository.
"""
from __future__ import annotations

import json
from datetime import datetime
from decimal import Decimal, ROUND_HALF_UP
from pathlib import Path

from django.core.management.base import BaseCommand, CommandError
from django.core.management import call_command
from django.db import transaction

from core.models import Region, District, Commune, Fokontany
from producers.models import Producer
from parcels.models import Parcel, ParcelRegisterHarvest
from inspections.models import Inspection
from django.contrib.auth import get_user_model


DATA_DIR = Path(__file__).resolve().parent.parent.parent.parent / "database" / "data"

RISK_MAP = {
    "faible": "low",
    "moyen": "medium",
    "fort": "high",
}
YN_MAP = {"oui": "yes", "non": "no", "yes": "yes", "no": "no"}
EU_MAP = {
    "actif": "active",
    "suspendu": "suspended",
    "retiré": "withdrawn",
    "retire": "withdrawn",
    "abandonné": "abandoned",
    "abandonne": "abandoned",
}
NOP_MAP = {
    "actif": "active",
    "suspendu": "suspended",
    "abandonné": "abandoned",
    "abandonne": "abandoned",
}
CONVERSION_MAP = {
    "biologique": "organic",
    "en conversion": "conversion",
    "conversion": "conversion",
    "conventionnel": "conventional",
    "conventionnelle": "conventional",
}


def slug(text, length=24):
    import re

    return "VINTSY-" + re.sub(r"[^A-Z0-9]+", "-", (text or "NR").upper()).strip("-")[:length]


def load_json(name):
    path = DATA_DIR / name
    if not path.is_file():
        raise CommandError(
            f"Fichier de données introuvable : {path}\n"
            f"Exécutez d'abord scripts/extract_vintsy_data.py"
        )
    with path.open(encoding="utf-8") as handle:
        return json.load(handle)


def to_date(text):
    if not text:
        return None
    try:
        return datetime.strptime(text, "%Y-%m-%d").date()
    except ValueError:
        return None


def to_decimal(value, places=None):
    if value is None:
        return None
    number = Decimal(str(value))
    if places is not None:
        quant = Decimal(1).scaleb(-places)
        number = number.quantize(quant, rounding=ROUND_HALF_UP)
    return number


def map_choice(mapping, raw):
    if not raw:
        return None
    return mapping.get(str(raw).strip().lower())


class Command(BaseCommand):
    help = "Seed the database with the real Vintsy cooperative register data."

    def add_arguments(self, parser):
        parser.add_argument(
            "--no-reference",
            action="store_true",
            help="Skip reference data (regions, varieties, grades, seasons, admin).",
        )
        parser.add_argument(
            "--keep",
            action="store_true",
            help="Keep existing real records instead of clearing the four models first.",
        )

    @transaction.atomic
    def handle(self, *args, **options):
        if not options["no_reference"]:
            self.stdout.write("Creating reference data (regions, varieties, grades, seasons, admin)...")
            call_command("load_initial_data")

        region, _ = Region.objects.get_or_create(
            code="VINTSY", defaults={"name": "Coopérative Vintsy"}
        )
        district, _ = District.objects.get_or_create(
            code="VINTSY", defaults={"name": "Coopérative Vintsy", "region": region}
        )

        producers_data = load_json("producers.json")
        parcels_data = load_json("parcels.json")
        harvests_data = load_json("parcel_harvests.json")

        # --- Geo hierarchy derived from the real village/zone names ---------
        commune_cache: dict[str, Commune] = {}
        fokontany_cache: dict[str, Fokontany] = {}

        def get_commune(zone):
            key = slug(zone)
            if key not in commune_cache:
                commune, _ = Commune.objects.get_or_create(
                    code=key,
                    defaults={"name": (zone or "Non renseigné")[:100], "region": region, "district": district},
                )
                commune_cache[key] = commune
            return commune_cache[key]

        def get_fokontany(zone, commune):
            key = slug(zone) + "-FKT"
            if key not in fokontany_cache:
                fokontany, _ = Fokontany.objects.get_or_create(
                    code=key, defaults={"name": (zone or "Non renseigné")[:100], "commune": commune}
                )
                fokontany_cache[key] = fokontany
            return fokontany_cache[key]

        # --- Clear previous (fake or stale) records ------------------------
        if not options["keep"]:
            self.stdout.write("Clearing previous producer/parcel/inspection records...")
            Producer.objects.all().delete()

        # --- Producers -----------------------------------------------------
        producer_by_code: dict[str, Producer] = {}
        created = updated = 0
        for item in producers_data:
            zone = item.get("unit_name")
            commune = get_commune(zone)
            fokontany = get_fokontany(zone, commune)
            eu = map_choice(EU_MAP, item.get("eu_status"))
            defaults = {
                "last_name": item.get("last_name") or "",
                "first_name": item.get("first_name"),
                "unit_name": zone,
                "region": region,
                "district": district,
                "commune": commune,
                "fokontany": fokontany,
                "phone": item.get("phone"),
                "joined_at": to_date(item.get("joined_at")),
                "risk_category": map_choice(RISK_MAP, item.get("risk_category")),
                "identified_risks": item.get("identified_risks"),
                "member_processing": map_choice(YN_MAP, item.get("member_processing")),
                "processing_activities": item.get("processing_activities"),
                "last_internal_inspection_at": to_date(item.get("last_internal_inspection_at")),
                "internal_inspector_name": item.get("internal_inspector_name"),
                "last_external_inspection_at": to_date(item.get("last_external_inspection_at")),
                "eu_status": item.get("eu_status"),
                "nop_status": item.get("nop_status"),
                "exclusion_reason": item.get("exclusion_reason"),
                "exclusion_date": to_date(item.get("exclusion_date")),
                "status": {
                    "active": "active",
                    "suspended": "suspended",
                    "withdrawn": "inactive",
                    "abandoned": "inactive",
                }.get(eu, "pending"),
            }
            producer, was_created = Producer.objects.update_or_create(
                code=item["code"], defaults=defaults
            )
            producer_by_code[item["code"]] = producer
            if was_created:
                created += 1
            else:
                updated += 1
        self.stdout.write(self.style.SUCCESS(f"Producteurs : {created} créés, {updated} mis à jour."))

        # --- Parcels -------------------------------------------------------
        parcel_keys: set[tuple[str, str]] = set()
        p_created = p_updated = 0
        for item in parcels_data:
            producer = producer_by_code.get(item["producer_code"])
            if not producer:
                continue
            conversion_status = map_choice(CONVERSION_MAP, item.get("conversion_status"))
            level = item.get("conversion_level")
            if conversion_status != "conversion":
                level = None
            defaults = {
                "name": item["code"],
                "registration_date": to_date(item.get("registration_date")),
                "area": to_decimal(item.get("area"), 4),
                "main_crop": item.get("main_crop"),
                "intercrop": item.get("intercrop"),
                "vanilla_plants": int(item["vanilla_plants"] or 0),
                "bio_location": item.get("bio_location"),
                "latitude": to_decimal(item.get("latitude"), 7),
                "longitude": to_decimal(item.get("longitude"), 7),
                "conversion_start_date": to_date(item.get("conversion_start_date")),
                "conversion_status": conversion_status,
                "conversion_level": level,
                "last_used_date": to_date(item.get("last_used_date")),
                "eu_status": item.get("eu_status"),
                "nop_status": item.get("nop_status"),
                "estimated_yield": to_decimal(item.get("estimated_yield"), 3),
                "actual_harvest": to_decimal(item.get("actual_harvest"), 3),
                "delivered_quantity": to_decimal(item.get("delivered_quantity"), 3),
                "status": "active",
                "is_certified": conversion_status == "organic",
            }
            parcel, was_created = Parcel.objects.update_or_create(
                producer=producer, code=item["code"], defaults=defaults
            )
            parcel_keys.add((item["producer_code"], item["code"]))
            if was_created:
                p_created += 1
            else:
                p_updated += 1
        self.stdout.write(self.style.SUCCESS(f"Parcelles : {p_created} créées, {p_updated} mises à jour."))

        # --- Register harvests (real recolte/livraison) -------------------
        h_created = h_updated = 0
        for item in harvests_data:
            parcel = Parcel.objects.filter(
                producer__code=item["producer_code"], code=item["parcel_code"]
            ).first()
            if not parcel:
                continue
            defaults = {
                "estimated_yield": to_decimal(item.get("estimated_yield"), 3),
                "actual_harvest": to_decimal(item.get("actual_harvest"), 3),
                "actual_yield": to_decimal(item.get("actual_yield"), 3),
                "delivered_quantity": to_decimal(item.get("delivered_quantity"), 3),
            }
            _, was_created = ParcelRegisterHarvest.objects.update_or_create(
                parcel=parcel, period=item["period"], crop_slot=item["crop_slot"], defaults=defaults
            )
            if was_created:
                h_created += 1
            else:
                h_updated += 1
        self.stdout.write(self.style.SUCCESS(f"Récoltes (registre) : {h_created} créées, {h_updated} mises à jour."))

        # --- Inspections (derived from the real member inspection dates) --
        User = get_user_model()
        inspector_cache: dict[str, User] = {}
        i_created = i_updated = 0
        for item in producers_data:
            producer = producer_by_code.get(item["code"])
            if not producer:
                continue
            internal_date = to_date(item.get("last_internal_inspection_at"))
            internal_inspector = item.get("internal_inspector_name")
            if internal_date:
                inspector = None
                if internal_inspector:
                    username = internal_inspector.strip().lower()
                    if username not in inspector_cache:
                        inspector, _ = User.objects.get_or_create(
                            username=username,
                            defaults={
                                "email": f"{username}@videeko.local",
                                "first_name": internal_inspector,
                                "role": "inspector",
                                "registration_status": "approved",
                            },
                        )
                        inspector.set_unusable_password()
                        inspector.save()
                        inspector_cache[username] = inspector
                    else:
                        inspector = inspector_cache[username]
                _, was_created = Inspection.objects.update_or_create(
                    code=f"INS-{item['code']}-INT",
                    defaults={
                        "producer": producer,
                        "inspection_type": "routine",
                        "planned_date": internal_date,
                        "actual_date": internal_date,
                        "inspector": inspector,
                        "status": "completed",
                        "result": "pending",
                        "observations": f"Inspection interne SCI — inspecteur : {internal_inspector or 'non renseigné'}.",
                    },
                )
                i_created += 1 if was_created else 0
                i_updated += 0 if was_created else 1
            external_date = to_date(item.get("last_external_inspection_at"))
            if external_date:
                _, was_created = Inspection.objects.update_or_create(
                    code=f"INS-{item['code']}-ECO",
                    defaults={
                        "producer": producer,
                        "inspection_type": "certification",
                        "planned_date": external_date,
                        "actual_date": external_date,
                        "status": "completed",
                        "result": "pending",
                        "observations": "Inspection externe ECOCERT.",
                    },
                )
                i_created += 1 if was_created else 0
                i_updated += 0 if was_created else 1
        self.stdout.write(self.style.SUCCESS(f"Inspections : {i_created} créées, {i_updated} mises à jour."))

        self.stdout.write(self.style.SUCCESS("Seed terminé avec les données réelles du registre Vintsy."))
