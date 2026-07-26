"""
Management command to seed comprehensive demo data for VIDEEKO VANILLA
Creates 4+ consistent records in each module with proper FK relationships.
"""
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import date, timedelta
import random

from core.models import Region, Commune, Fokontany, VanillaVariety, QualityGrade, Season
from producers.models import Producer, Cooperative
from parcels.models import Parcel
from productions.models import Production, ProductionBatch
from inspections.models import Inspection, InspectionChecklist, InspectionTemplate
from inputs.models import InputType, InputDistribution
from deliveries.models import Delivery
from campaigns.models import Campaign, CampaignProducer
from cultures.models import Culture
from ai_assistant.models import ChatSession, ChatMessage, AgriculturalRecommendation, MonthlyReport


class Command(BaseCommand):
    help = 'Seed comprehensive demo data for VIDEEKO VANILLA'

    def handle(self, *args, **options):
        self.stdout.write('Seeding comprehensive demo data...')
        User = get_user_model()

        # Ensure regions and communes exist
        regions_data = [
            ('Analamanga', 'ANM', [('Antananarivo', 'ANM-001'), ('Ambohidratrimo', 'ANM-002'), ('Andohatapenaka', 'ANM-003')]),
            ('Alaotra-Mangoro', 'ALM', [('Ambatondrazaka', 'ALM-001'), ('Amparafaravola', 'ALM-002'), ('Moramanga', 'ALM-003')]),
            ('Amoron\'i Mania', 'AMI', [('Ambatofinandrahana', 'AMI-001'), ('Fandriana', 'AMI-002'), ('Manandriana', 'AMI-003')]),
            ('Analanjirofo', 'ANJ', [('Fenoarivo Atsinanana', 'ANJ-001'), ('Sainte Marie', 'ANJ-002'), ('Soanierana Ivongo', 'ANJ-003')]),
            ('Androy', 'AND', [('Ambovombe', 'AND-001'), ('Bekily', 'AND-002'), ('Tsihombe', 'AND-003')]),
            ('Anosy', 'ANS', [('Tôlanaro', 'ANS-001'), ('Amboasary Sud', 'ANS-002'), ('Betroka', 'ANS-003')]),
            ('Atsimo-Andrefana', 'AAF', [('Toliara I', 'AAF-001'), ('Toliara II', 'AAF-002'), ('Betioky', 'AAF-003')]),
            ('Atsimo-Atsinanana', 'AAS', [('Farafangana', 'AAS-001'), ('Vangaindrano', 'AAS-002'), ('Midongy', 'AAS-003')]),
            ('Atsinanana', 'ATS', [('Toamasina I', 'ATS-001'), ('Toamasina II', 'ATS-002'), ('Maroantsetra', 'ATS-003')]),
            ('Betsiboka', 'BET', [('Maevatanana', 'BET-001'), ('Tsaratanana', 'BET-002'), ('Kandreho', 'BET-003')]),
            ('Boeny', 'BOE', [('Mahajanga I', 'BOE-001'), ('Mahajanga II', 'BOE-002'), ('Marovoay', 'BOE-003')]),
            ('Bongolava', 'BNG', [('Tsiroanomandidy', 'BNG-001'), ('Fenoarivobe', 'BNG-002'), ('Mandehany', 'BNG-003')]),
            ('Diana', 'DIA', [('Antsiranana I', 'DIA-001'), ('Antsiranana II', 'DIA-002'), ('Ambilobe', 'DIA-003')]),
            ('Haute Matsiatra', 'HMT', [('Fianarantsoa', 'HMT-001'), ('Ambalavao', 'HMT-002'), ('Lalangina', 'HMT-003')]),
            ('Ihorombe', 'IHO', [('Ihosy', 'IHO-001'), ('Iakora', 'IHO-002'), ('Ranohira', 'IHO-003')]),
            ('Itasy', 'ITA', [('Arivonimamo', 'ITA-001'), ('Miarinarivo', 'ITA-002'), ('Soavinandriana', 'ITA-003')]),
            ('Melaky', 'MEL', [('Maintirano', 'MEL-001'), ('Besalampy', 'MEL-002'), ('Ambatomainty', 'MEL-003')]),
            ('Menabe', 'MEN', [('Morondava', 'MEN-001'), ('Belon\'i Tsiribihina', 'MEN-002'), ('Mahabo', 'MEN-003')]),
            ('Sava', 'SAV', [('Sambava', 'SAV-001'), ('Antalaha', 'SAV-002'), ('Andapa', 'SAV-003')]),
            ('Sofia', 'SOF', [('Port Bergé', 'SOF-001'), ('Bealanana', 'SOF-002'), ('Mampikony', 'SOF-003')]),
            ('Vatovavy-Fitovinany', 'VTF', [('Manakara', 'VTF-001'), ('Ifanadiana', 'VTF-002'), ('Ikongo', 'VTF-003')]),
            ('Vakinankaratra', 'VKN', [('Antsirabe I', 'VKN-001'), ('Antsirabe II', 'VKN-002'), ('Betafo', 'VKN-003')]),
            ('Avaratra', 'AVA', [('Antsiranana', 'AVA-001'), ('Ambanja', 'AVA-002'), ('Vohemar', 'AVA-003')]),
        ]

        region_lookup = {}
        for name, code, communes_data in regions_data:
            region, _ = Region.objects.get_or_create(
                name=name,
                defaults={'code': code}
            )
            region_lookup[name] = region
            for commune_name, commune_code in communes_data:
                Commune.objects.get_or_create(
                    code=commune_code,
                    defaults={'name': commune_name, 'region': region}
                )

        # Create users
        admin, _ = User.objects.get_or_create(
            username='admin',
            defaults={'email': 'admin@videeko.mg', 'first_name': 'Admin', 'last_name': 'System', 'role': 'admin', 'is_staff': True, 'is_superuser': True}
        )
        admin.set_password('admin123')
        admin.save()

        manager, _ = User.objects.get_or_create(
            username='manager',
            defaults={'email': 'manager@videeko.mg', 'first_name': 'Jean', 'last_name': 'Rabe', 'role': 'manager'}
        )
        manager.set_password('manager123')
        manager.save()

        agent1, _ = User.objects.get_or_create(
            username='agent1',
            defaults={'email': 'agent1@videeko.mg', 'first_name': 'Hery', 'last_name': 'Rakoto', 'role': 'agent'}
        )
        agent1.set_password('agent123')
        agent1.save()

        inspector1, _ = User.objects.get_or_create(
            username='inspector1',
            defaults={'email': 'inspector1@videeko.mg', 'first_name': 'Solo', 'last_name': 'Andriana', 'role': 'inspector'}
        )
        inspector1.set_password('inspector123')
        inspector1.save()

        # Create cooperative
        coop, _ = Cooperative.objects.get_or_create(
            code='COOP-001',
            defaults={
                'name': 'Cooperative Vanilla Sava',
                'region': region_lookup['Sava'],
                'commune': Commune.objects.get(code='SAV-001', region=region_lookup['Sava']),
                'is_active': True,
            }
        )

        # Create 4+ producers with full details
        producers_data = [
            ('Rabenja Jean', 'PRD-001', 'Sava', 'Sambava', 'M', '+261 34 111 11 11', 'active'),
            ('Rakoto Hery', 'PRD-002', 'Haute Matsiatra', 'Fianarantsoa', 'M', '+261 34 222 22 22', 'active'),
            ('Andriana Solo', 'PRD-003', 'Atsimo-Andrefana', 'Toliara I', 'M', '+261 34 333 33 33', 'active'),
            ('Mialy Fetra', 'PRD-004', 'Analamanga', 'Antananarivo', 'F', '+261 34 444 44 44', 'active'),
            ('Rasoanirina Julie', 'PRD-005', 'Diana', 'Antsiranana I', 'F', '+261 34 555 55 55', 'inactive'),
            ('Randria Paul', 'PRD-006', 'Boeny', 'Mahajanga I', 'M', '+261 34 666 66 66', 'pending'),
        ]

        producers = []
        for name, code, region_name, commune_name, gender, phone, status in producers_data:
            region = region_lookup[region_name]
            commune = Commune.objects.filter(name=commune_name, region=region).first()
            fokontany = Fokontany.objects.filter(commune=commune).first()
            producer, _ = Producer.objects.get_or_create(
                code=code,
                defaults={
                    'name': name,
                    'region': region,
                    'commune': commune,
                    'fokontany': fokontany,
                    'gender': gender,
                    'phone': phone,
                    'status': status,
                    'cooperative': coop if status == 'active' else None,
                    'registered_by': admin,
                    'address': f"{commune.name}, {region.name}",
                }
            )
            producers.append(producer)

        # Create varieties and grades if not exist
        varieties = []
        for name, code, desc in [('Vanille Bourbon', 'VB', 'Variete traditionnelle'), ('Vanille Tahitensis', 'VT', 'Variete hybride'), ('Vanille Pompona', 'VP', 'Variete a gousses courtes')]:
            v, _ = VanillaVariety.objects.get_or_create(code=code, defaults={'name': name, 'description': desc})
            varieties.append(v)

        grades = []
        for name, code, desc, vanillin, min_m, max_m, factor in [
            ('Gourmet', 'A', 'Premium', 2.0, 25, 30, 1.5),
            ('TK', 'B', 'Standard', 1.5, 25, 35, 1.2),
            ('US', 'C', 'US standard', 1.0, 30, 38, 1.0),
        ]:
            g, _ = QualityGrade.objects.get_or_create(code=code, defaults={
                'name': name, 'description': desc, 'min_vanillin_content': vanillin,
                'min_moisture_content': min_m, 'max_moisture_content': max_m, 'price_factor': factor
            })
            grades.append(g)

        # Create seasons
        current_year = date.today().year
        seasons = []
        for year in [current_year - 1, current_year, current_year + 1]:
            s, _ = Season.objects.get_or_create(name='Campagne', year=year, defaults={
                'start_date': date(year, 6, 1), 'end_date': date(year + 1, 5, 31), 'is_current': year == current_year
            })
            seasons.append(s)
        current_season = [s for s in seasons if s.is_current][0]

        # Create 4+ parcels per active producer
        parcels = []
        parcel_varieties = list(zip(producers[:4], varieties * 2))
        for idx, (producer, variety) in enumerate(parcel_varieties[:8]):
            code = f"PAR-{producer.code}-{idx+1:03d}"
            p, _ = Parcel.objects.get_or_create(
                code=code,
                defaults={
                    'producer': producer,
                    'variety': variety,
                    'area': round(random.uniform(0.5, 3.0), 4),
                    'vanilla_plants': random.randint(100, 500),
                    'productive_plants': random.randint(80, 400),
                    'status': random.choice(['active', 'active', 'active', 'new']),
                    'soil_type': random.choice(['volcanic', 'loamy', 'clay', 'sandy']),
                    'latitude': -18.0 + random.uniform(-0.5, 0.5),
                    'longitude': 47.0 + random.uniform(-0.5, 0.5),
                    'altitude': random.randint(100, 1500),
                    'is_certified': producer.status == 'active' and random.random() > 0.5,
                    'registered_by': admin,
                }
            )
            parcels.append(p)

        # Create 4+ productions per parcel (harvests)
        productions = []
        for parcel in parcels:
            for i in range(4):
                harvest_date = date.today() - timedelta(days=random.randint(1, 180))
                prod, _ = Production.objects.get_or_create(
                    code=f"PRD-{parcel.code}-{i+1:03d}",
                    defaults={
                        'parcel': parcel,
                        'season': current_season,
                        'harvest_date': harvest_date,
                        'weight_green': round(random.uniform(10, 80), 3),
                        'weight_prepared': round(random.uniform(5, 40), 3),
                        'pods_count': random.randint(200, 800),
                        'pods_grade_a': random.randint(100, 400),
                        'pods_grade_b': random.randint(50, 200),
                        'pods_grade_c': random.randint(20, 100),
                        'pods_rejected': random.randint(5, 50),
                        'quality_grade': random.choice(grades),
                        'vanillin_content': round(random.uniform(1.0, 3.0), 2),
                        'moisture_content': round(random.uniform(20, 35), 2),
                        'status': random.choice(['harvested', 'drying', 'curing', 'ready']),
                        'sale_price': random.randint(15000, 45000) if random.random() > 0.5 else None,
                        'registered_by': admin,
                    }
                )
                productions.append(prod)

        # Create 4+ inspections per producer
        inspections = []
        for producer in producers[:4]:
            for i in range(4):
                planned_date = date.today() - timedelta(days=random.randint(1, 90))
                insp, _ = Inspection.objects.get_or_create(
                    code=f"INSP-{producer.code}-{i+1:03d}",
                    defaults={
                        'producer': producer,
                        'parcel': random.choice(parcels) if parcels else None,
                        'inspection_type': random.choice(['routine', 'certification', 'quality', 'phytosanitary']),
                        'planned_date': planned_date,
                        'actual_date': planned_date + timedelta(days=random.randint(0, 3)),
                        'inspector': inspector1,
                        'status': random.choice(['completed', 'completed', 'in_progress', 'planned']),
                        'result': random.choice(['passed', 'passed', 'conditional', 'pending']),
                        'score_overall': random.randint(60, 95),
                        'score_cultivation': random.randint(50, 100),
                        'score_processing': random.randint(40, 90),
                        'score_storage': random.randint(50, 95),
                        'score_traceability': random.randint(60, 100),
                        'score_environment': random.randint(50, 90),
                        'observations': 'Inspection realizee avec succes.',
                        'recommendations': 'Maintenir les bonnes pratiques.',
                    }
                )
                inspections.append(insp)

        # Create 4+ campaigns first (needed for inputs)
        cultures_list = []
        for name in ['Vanille Bourbon', 'Vanille Tahitensis', 'Cacao', 'Cafe']:
            c, _ = Culture.objects.get_or_create(name=name, defaults={'culture_type': 'cash', 'market_price': round(random.uniform(10000, 50000), 2)})
            cultures_list.append(c)

        campaigns = []
        for i in range(5):
            culture = random.choice(cultures_list)
            region = random.choice(list(region_lookup.values()))
            c, _ = Campaign.objects.get_or_create(
                name=f"Campagne {culture.name} {int(current_year) - i}",
                defaults={
                    'culture': culture,
                    'region': region,
                    'start_date': date(int(current_year) - i, 6, 1),
                    'end_date': date(int(current_year) - i + 1, 5, 31),
                    'status': random.choice(['active', 'completed', 'pending', 'cancelled']),
                    'managed_by': manager,
                    'is_active': True,
                    'description': f"Campagne de production de {culture.name}.",
                }
            )
            campaigns.append(c)

        # Create 4+ input types and distributions
        input_types = []
        for name, itype, unit in [
            ('Engrais NPK', 'fertilizer', 'kg'),
            ('Semences Vanille', 'seed', 'kg'),
            ('Pesticide Biologique', 'pesticide', 'L'),
            ('Tuteur en bois', 'tool', 'unite'),
            ('Plants de vanille', 'plant', 'unite'),
        ]:
            it, _ = InputType.objects.get_or_create(name=name, defaults={'type': itype, 'unit': unit, 'is_active': True})
            input_types.append(it)

        input_distributions = []
        for producer in producers[:5]:
            for i in range(4):
                dist, _ = InputDistribution.objects.get_or_create(
                    input_type=random.choice(input_types),
                    producer=producer,
                    distribution_date=date.today() - timedelta(days=random.randint(1, 60)),
                    defaults={
                        'quantity': round(random.uniform(5, 100), 2),
                        'unit': random.choice(['kg', 'L', 'unite']),
                        'unit_value': round(random.uniform(1000, 50000), 2),
                        'distributed_by': agent1,
                        'campaign': random.choice(campaigns),
                    }
                )
                input_distributions.append(dist)

        # Create 4+ deliveries
        deliveries = []
        for i in range(8):
            delivery_date = date.today() - timedelta(days=random.randint(1, 120))
            d, _ = Delivery.objects.get_or_create(
                producer=random.choice(producers),
                product='Vanille preparee',
                delivery_date=delivery_date,
                defaults={
                    'quantity': round(random.uniform(5, 50), 2),
                    'quantity_unit': 'kg',
                    'unit_price': round(random.uniform(15000, 40000), 2),
                    'quality_bonus': round(random.uniform(0, 5000), 2),
                    'buyer': random.choice(['SAVAN', 'Export Malgache', 'Local Buyer']),
                    'collection_center': random.choice(['Sambava Center', 'Fianarantsoa Center', 'Toliara Center']),
                    'status': random.choice(['pending', 'in_transit', 'delivered', 'delivered']),
                    'received_by': manager if random.random() > 0.5 else None,
                    'notes': 'Livraison standard.',
                }
                 )
            deliveries.append(d)

        campaign_producers = []
        for campaign in campaigns:
            for producer in random.sample(producers, min(3, len(producers))):
                cp, _ = CampaignProducer.objects.get_or_create(
                    campaign=campaign,
                    producer=producer,
                    defaults={'is_active': True, 'notes': 'Enrolled via seed script'}
                )
                campaign_producers.append(cp)

        # Create inspections templates
        template, _ = InspectionTemplate.objects.get_or_create(
            name='Template routine vanilla',
            defaults={
                'inspection_type': 'routine',
                'checklist_template': [
                    {'category': 'Culture', 'item': 'Plants en bonne sante'},
                    {'category': 'Culture', 'item': 'Espacement adequat'},
                    {'category': 'Stockage', 'item': 'Local sec et aere'},
                ],
                'is_active': True,
            }
        )

        # Create AI chat sessions
        chat_sessions = []
        for producer in producers[:3]:
            session, _ = ChatSession.objects.get_or_create(
                user=admin,
                is_active=True,
                defaults={'topic': 'rendement', 'title': f"Session {producer.name}"}
            )
            ChatMessage.objects.get_or_create(
                session=session,
                role='user',
                content=f"Quel est le rendement de {producer.name} ?",
            )
            ChatMessage.objects.get_or_create(
                session=session,
                role='assistant',
                content=f"Le rendement moyen est estime a 650 kg/ha.",
                metadata={'suggestions': ['Comment ameliorer ?', 'Generer un rapport']},
            )
            chat_sessions.append(session)

        # Create AI recommendations
        recommendations = []
        for producer in producers[:4]:
            for parcel in parcels[:2]:
                rec, _ = AgriculturalRecommendation.objects.get_or_create(
                    producer=producer,
                    parcel=parcel,
                    recommendation_type='yield',
                    title=f"Recommandation pour {producer.name}",
                    defaults={
                        'description': f"Rendement estime a 620 kg/ha. Actions: ameliorer la fertilisation.",
                        'priority': random.choice(['high', 'medium', 'low']),
                        'is_read': False,
                        'is_applied': False,
                    }
                )
                recommendations.append(rec)

        # Create monthly reports
        reports = []
        for i in range(3):
            start = date.today() - timedelta(days=30 * (i + 1))
            end = start + timedelta(days=30)
            report, _ = MonthlyReport.objects.get_or_create(
                report_type='global',
                period_start=start,
                period_end=end,
                defaults={
                    'title': f'Rapport global {start.strftime("%b %Y")}',
                    'generated_by': admin,
                    'status': 'completed',
                    'report_data': {'summary': 'Rapport genere automatiquement.'},
                }
            )
            reports.append(report)

        self.stdout.write(self.style.SUCCESS(f'Seed complete: {len(producers)} producers, {len(parcels)} parcels, {len(productions)} productions, {len(inspections)} inspections, {len(input_distributions)} inputs, {len(deliveries)} deliveries, {len(campaigns)} campaigns, {len(recommendations)} recommendations'))
