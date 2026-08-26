from io import StringIO

from django.core.management import call_command
from django.test import TestCase
from rest_framework.test import APIClient

from accounts.models import User
from core.models import Commune, Region
from parcels.models import Parcel
from producers.models import Producer
from django.utils import timezone


class InitialDataCommandTests(TestCase):
    def test_load_initial_data_creates_madagascar_regions_and_communes(self):
        out = StringIO()
        call_command("load_initial_data", stdout=out, stderr=StringIO())

        region_names = set(Region.objects.values_list("name", flat=True))

        self.assertGreaterEqual(Region.objects.count(), 23)
        self.assertIn("Analamanga", region_names)
        self.assertIn("Haute Matsiatra", region_names)
        self.assertIn("Sava", region_names)
        self.assertIn("Atsimo-Andrefana", region_names)
        self.assertIn("Alaotra-Mangoro", region_names)
        self.assertIn("Analanjirofo", region_names)
        self.assertTrue(Commune.objects.filter(region__name="Analamanga").exists())
        self.assertGreaterEqual(Commune.objects.count(), 50)
        self.assertGreaterEqual(Producer.objects.count(), 4)
        self.assertGreaterEqual(Parcel.objects.count(), 4)

    def test_list_endpoints_use_four_items_per_page_by_default(self):
        user = User.objects.create_user(username="tester", email="tester@example.com", password="secret123")
        client = APIClient()
        client.force_authenticate(user)

        for index in range(5):
            User.objects.create_user(username=f"agent{index}", email=f"agent{index}@example.com", password="secret123")

        response = client.get("/api/accounts/users/")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["count"], 7)
        self.assertEqual(len(response.data["results"]), 4)
        self.assertIsNotNone(response.data["next"])

    def test_sig_production_zones_uses_producer_regions(self):
        user = User.objects.create_user(username="mapper", email="mapper@example.com", password="secret123")
        client = APIClient()
        client.force_authenticate(user)

        region = Region.objects.create(name="Analamanga", code="ANM")
        commune = Commune.objects.create(name="Antananarivo", code="ANT01", region=region)
        producer = Producer.objects.create(
            code="PRD-2026-0001",
            name="Rakoto",
            region=region,
            commune=commune,
            phone="0320000000",
            status="active",
        )
        Parcel.objects.create(
            code="PRC-2026-0001",
            producer=producer,
            area=2.5,
            vanilla_plants=200,
            latitude=18.8792,
            longitude=47.5079,
        )

        response = client.get("/api/sig/zones/")

        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.data)
        self.assertEqual(response.data[0]["region"], "Analamanga")
