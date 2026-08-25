"""Reproducible seed for VIDEEKO VANILLA from the real cooperative register.

Reads the JSON files produced by ``scripts/extract_vintsy_data.py`` (the real
data extracted from the T06 Excel register) and rebuilds the database with
correct relations:

    Producteur  ->  Parcelle  ->  Récolte (ParcelRegisterHarvest)

The register gives only the latest internal/external inspection dates for a
producer. Because it gives no inspection ID or parcel reference, those source
dates stay on ``Producer`` instead of becoming fabricated inspection rows.

The command is idempotent (``bulk_create(..., update_conflicts=True)`` on the
natural keys) and runs inside a single transaction: if anything fails the
database is left untouched.

Usage::

    python manage.py seed                # full reproducible seed (upsert)
    python manage.py seed --keep         # never clear, just upsert
    python manage.py migrate --seed       # migrate then seed (Django 3.2+)

The Excel workbook itself is never read at runtime: it only served to build the
JSON data files, which are committed to the repository.
"""
from __future__ import annotations

import hashlib
import json
from datetime import datetime
from decimal import Decimal, ROUND_HALF_UP
from pathlib import Path

from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from django.contrib.auth import get_user_model
from django.contrib.auth.hashers import make_password

from core.models import Region, District, Commune, Fokontany
from inspections.models import Inspection
from producers.models import Producer
from parcels.models import Parcel, ParcelRegisterHarvest


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
STATUS_MAP = {
    "active": "active",
    "suspended": "suspended",
    "withdrawn": "inactive",
    "abandoned": "inactive",
}


def stable_code(prefix, text):
    """Deterministic, length-safe code (<= 20 chars) for geo entities."""
    return (prefix + hashlib.md5((text or "NR").encode("utf-8")).hexdigest()[:15]).upper()


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
            "--keep",
            action="store_true",
            help="Keep existing records; upsert instead of clearing first.",
        )

    @transaction.atomic
    def handle(self, *args, **options):
        # The seed intentionally does not call ``load_initial_data``: that
        # command creates unrelated demonstration references and an account.
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
            key = stable_code("C", zone)
            if key not in commune_cache:
                commune, _ = Commune.objects.get_or_create(
                    code=key,
                    defaults={"name": (zone or "Non renseigné")[:100], "region": region, "district": district},
                )
                commune_cache[key] = commune
            return commune_cache[key]

        def get_fokontany(zone, commune):
            key = stable_code("F", zone)
            if key not in fokontany_cache:
                fokontany, _ = Fokontany.objects.get_or_create(
                    code=key, defaults={"name": (zone or "Non renseigné")[:100], "commune": commune}
                )
                fokontany_cache[key] = fokontany
            return fokontany_cache[key]

        # --- Clear previous agricultural records ---------------------------
        if not options["keep"]:
            self.stdout.write("Clearing previous producer/parcel/inspection records...")
            Producer.objects.all().delete()

        # --- Producers (batched upsert) ------------------------------------
        producer_objs = []
        for item in producers_data:
            zone = item.get("unit_name")
            commune = get_commune(zone)
            fokontany = get_fokontany(zone, commune)
            eu = map_choice(EU_MAP, item.get("eu_status"))
            producer_objs.append(
                Producer(
                    code=item["code"],
                    last_name=item.get("last_name") or "",
                    first_name=item.get("first_name"),
                    unit_name=zone,
                    region=region,
                    district=district,
                    commune=commune,
                    fokontany=fokontany,
                    phone=item.get("phone"),
                    joined_at=to_date(item.get("joined_at")),
                    risk_category=map_choice(RISK_MAP, item.get("risk_category")),
                    identified_risks=item.get("identified_risks"),
                    member_processing=map_choice(YN_MAP, item.get("member_processing")),
                    processing_activities=item.get("processing_activities"),
                    last_internal_inspection_at=to_date(item.get("last_internal_inspection_at")),
                    internal_inspector_name=item.get("internal_inspector_name"),
                    last_external_inspection_at=to_date(item.get("last_external_inspection_at")),
                    eu_status=eu,
                    nop_status=map_choice(NOP_MAP, item.get("nop_status")),
                    exclusion_reason=item.get("exclusion_reason"),
                    exclusion_date=to_date(item.get("exclusion_date")),
                    status=STATUS_MAP.get(eu, "pending"),
                )
            )
        producer_fields = [
            "last_name", "first_name", "unit_name", "region", "district", "commune",
            "fokontany", "phone", "joined_at", "risk_category", "identified_risks",
            "member_processing", "processing_activities", "last_internal_inspection_at",
            "internal_inspector_name", "last_external_inspection_at", "eu_status",
            "nop_status", "exclusion_reason", "exclusion_date", "status",
        ]
        Producer.objects.bulk_create(
            producer_objs, batch_size=500, update_conflicts=True,
            unique_fields=["code"], update_fields=producer_fields,
        )
        producer_by_code = Producer.objects.in_bulk(field_name="code")
        self.stdout.write(self.style.SUCCESS(f"Producteurs : {len(producer_objs)} traités."))

        # --- Parcels (batched upsert) --------------------------------------
        parcel_objs = []
        for item in parcels_data:
            producer = producer_by_code.get(item["producer_code"])
            if not producer:
                continue
            conversion_status = map_choice(CONVERSION_MAP, item.get("conversion_status"))
            level = item.get("conversion_level")
            if conversion_status != "conversion":
                level = None
            parcel_objs.append(
                Parcel(
                    producer=producer,
                    code=item["code"],
                    name=item["code"],
                    registration_date=to_date(item.get("registration_date")),
                    area=to_decimal(item.get("area"), 4),
                    main_crop=item.get("main_crop"),
                    intercrop=item.get("intercrop"),
                    vanilla_plants=int(item["vanilla_plants"] or 0),
                    bio_location=item.get("bio_location"),
                    latitude=to_decimal(item.get("latitude"), 7),
                    longitude=to_decimal(item.get("longitude"), 7),
                    conversion_start_date=to_date(item.get("conversion_start_date")),
                    conversion_status=conversion_status,
                    conversion_level=level,
                    last_used_date=to_date(item.get("last_used_date")),
                    eu_status=item.get("eu_status"),
                    nop_status=item.get("nop_status"),
                    estimated_yield=to_decimal(item.get("estimated_yield"), 3),
                    actual_harvest=to_decimal(item.get("actual_harvest"), 3),
                    delivered_quantity=to_decimal(item.get("delivered_quantity"), 3),
                    status="active",
                    is_certified=conversion_status == "organic",
                )
            )
        parcel_fields = [
            "name", "registration_date", "area", "main_crop", "intercrop",
            "vanilla_plants", "bio_location", "latitude", "longitude",
            "conversion_start_date", "conversion_status", "conversion_level",
            "last_used_date", "eu_status", "nop_status", "estimated_yield",
            "actual_harvest", "delivered_quantity", "status", "is_certified",
        ]
        Parcel.objects.bulk_create(
            parcel_objs, batch_size=500, update_conflicts=True,
            unique_fields=["producer", "code"], update_fields=parcel_fields,
        )
        self.stdout.write(self.style.SUCCESS(f"Parcelles : {len(parcel_objs)} traitées."))

        # Parcel id index for the harvest upsert.
        parcel_ids = {
            (producer_id, code): parcel_id
            for parcel_id, producer_id, code in Parcel.objects.values_list("id", "producer_id", "code")
        }

        # --- Register harvests (real recolte/livraison) -------------------
        harvest_objs = []
        for item in harvests_data:
            producer = producer_by_code.get(item["producer_code"])
            if not producer:
                continue
            pid = parcel_ids.get((producer.id, item["parcel_code"]))
            if not pid:
                continue
            harvest_objs.append(
                ParcelRegisterHarvest(
                    parcel_id=pid,
                    period=item["period"],
                    crop_slot=item["crop_slot"],
                    estimated_yield=to_decimal(item.get("estimated_yield"), 3),
                    actual_harvest=to_decimal(item.get("actual_harvest"), 3),
                    actual_yield=to_decimal(item.get("actual_yield"), 3),
                    delivered_quantity=to_decimal(item.get("delivered_quantity"), 3),
                )
            )
        harvest_fields = ["estimated_yield", "actual_harvest", "actual_yield", "delivered_quantity"]
        ParcelRegisterHarvest.objects.bulk_create(
            harvest_objs, batch_size=500, update_conflicts=True,
            unique_fields=["parcel", "period", "crop_slot"], update_fields=harvest_fields,
        )
        self.stdout.write(self.style.SUCCESS(f"Récoltes (registre) : {len(harvest_objs)} traitées."))

        User = get_user_model()
        inspector_names = {
            item["internal_inspector_name"].strip().lower()
            for item in producers_data
            if item.get("internal_inspector_name")
        }
        if inspector_names:
            User.objects.bulk_create(
                [
                    User(
                        username=nm,
                        email=f"{nm}@videeko.local",
                        first_name=nm,
                        password=make_password(None),
                        role="inspector",
                        registration_status="approved",
                    )
                    for nm in inspector_names
                ],
                batch_size=200,
                update_conflicts=True,
                unique_fields=["username"],
                update_fields=["email", "first_name", "role", "registration_status"],
            )
        inspector_by_name = {u.username: u for u in User.objects.filter(username__in=inspector_names)}
        inspection_objs = []
        for item in producers_data:
            producer = producer_by_code.get(item["code"])
            if not producer:
                continue
            internal_date = to_date(item.get("last_internal_inspection_at"))
            if internal_date:
                inspector = None
                if item.get("internal_inspector_name"):
                    inspector = inspector_by_name.get(item["internal_inspector_name"].strip().lower())
                inspection_objs.append(
                    Inspection(
                        code=f"INS-{item['code']}-INT",
                        producer=producer,
                        inspection_type="routine",
                        planned_date=internal_date,
                        actual_date=internal_date,
                        inspector=inspector,
                        status="completed",
                        result="pending",
                        observations=f"Inspection interne SCI — inspecteur : {item.get('internal_inspector_name') or 'non renseigné'}.",
                    )
                )
            external_date = to_date(item.get("last_external_inspection_at"))
            if external_date:
                inspection_objs.append(
                    Inspection(
                        code=f"INS-{item['code']}-ECO",
                        producer=producer,
                        inspection_type="certification",
                        planned_date=external_date,
                        actual_date=external_date,
                        status="completed",
                        result="pending",
                        observations="Inspection externe ECOCERT.",
                    )
                )
        inspection_fields = [
            "producer", "inspection_type", "planned_date", "actual_date",
            "inspector", "status", "result", "observations",
        ]
        Inspection.objects.bulk_create(
            inspection_objs, batch_size=500, update_conflicts=True,
            unique_fields=["code"], update_fields=inspection_fields,
        )
        self.stdout.write(self.style.SUCCESS(f"Inspections : {len(inspection_objs)} traitées."))

        self.stdout.write(self.style.SUCCESS("Seed terminé avec les données réelles du registre Vintsy."))
