"""
Management command to load initial data for VIDEEKO VANILLA
"""
from django.core.management.base import BaseCommand
from core.models import Region, Commune, District, VanillaVariety, QualityGrade, Season
from parcels.models import Parcel
from producers.models import Producer
from django.contrib.auth import get_user_model
from datetime import date


class Command(BaseCommand):
    help = 'Load initial reference data for VIDEEKO VANILLA'

    def handle(self, *args, **options):
        self.stdout.write('Loading initial data...')

        # Create default admin user
        User = get_user_model()
        admin, created = User.objects.get_or_create(
            username='andrianisaina23@gmail.com',
            defaults={
                'email': 'andrianisaina23@gmail.com',
                'first_name': 'Admin',
                'last_name': 'System',
                'role': 'admin',
                'registration_status': 'approved',
                'is_staff': True,
                'is_superuser': True,
            }
        )
        admin.set_password('2311Saina')
        admin.save()
        if created:
            self.stdout.write('  Created admin user: andrianisaina23@gmail.com')
        
        # Create a broader Madagascar administrative dataset for regions and communes.
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
            ("Menabe", 'MEN', [('Morondava', 'MEN-001'), ("Belon'i Tsiribihina", 'MEN-002'), ('Mahabo', 'MEN-003')]),
            ('Sava', 'SAV', [('Sambava', 'SAV-001'), ('Antalaha', 'SAV-002'), ('Andapa', 'SAV-003')]),
            ('Sofia', 'SOF', [('Port Bergé', 'SOF-001'), ('Bealanana', 'SOF-002'), ('Mampikony', 'SOF-003')]),
            ('Vatovavy-Fitovinany', 'VTF', [('Manakara', 'VTF-001'), ('Ifanadiana', 'VTF-002'), ('Ikongo', 'VTF-003')]),
            ('Vakinankaratra', 'VKN', [('Antsirabe I', 'VKN-001'), ('Antsirabe II', 'VKN-002'), ('Betafo', 'VKN-003')]),
            ('Avaratra', 'AVA', [('Antsiranana', 'AVA-001'), ('Ambanja', 'AVA-002'), ('Vohemar', 'AVA-003')]),
        ]

        region_lookup = {}
        district_lookup = {}
        for name, code, communes_data in regions_data:
            region, created = Region.objects.get_or_create(
                code=code,
                defaults={'name': name}
            )
            region_lookup[name] = region
            if created:
                self.stdout.write(f'  Created region: {name}')

            district_code = f"DIS-{code}"
            district, _ = District.objects.get_or_create(
                code=district_code,
                defaults={'name': name, 'region': region}
            )
            district_lookup[name] = district

            for commune_name, commune_code in communes_data:
                commune, _ = Commune.objects.get_or_create(
                    code=commune_code,
                    defaults={'name': commune_name, 'region': region, 'district': district}
                )
                if commune.region_id != region.id:
                    commune.region = region
                if commune.district_id != district.id:
                    commune.district = district
                    commune.save()

        # Create sample producers and parcels for testing the dashboard
        for index, (name, code, region_name, commune_name) in enumerate([
            ('Rabenja Jean', 'PRD-001', 'Analamanga', 'Antananarivo'),
            ('Rakoto Hery', 'PRD-002', 'Haute Matsiatra', 'Fianarantsoa'),
            ('Andriana Solo', 'PRD-003', 'Sava', 'Sambava'),
            ('Mialy Fetra', 'PRD-004', 'Atsimo-Andrefana', 'Toliara I'),
        ], start=1):
            region = region_lookup[region_name]
            commune = Commune.objects.get(name=commune_name, region=region)
            defaults = {
                'name': name,
                'region': region,
                'district': commune.district,
                'commune': commune,
                'phone': f'+261 {100000000 + index}',
                'status': 'active',
            }
            )
            if created:
                self.stdout.write(f'  Created producer: {name}')

            Parcel.objects.get_or_create(
                code=f'PAR-{index:03d}',
                defaults={
                    'producer': producer,
                    'area': 1.5 + index * 0.25,
                    'vanilla_plants': 120 + index * 20,
                    'status': 'active',
                }
            )
        
        # Create Vanilla Varieties
        varieties_data = [
            ('Vanille Bourbon', 'VB', 'Variete traditionnelle de Madagascar'),
            ('Vanille Tahitensis', 'VT', 'Variete hybride'),
            ('Vanille Pompona', 'VP', 'Variete a gousses courtes'),
        ]
        
        for name, code, desc in varieties_data:
            VanillaVariety.objects.get_or_create(
                code=code,
                defaults={'name': name, 'description': desc}
            )
            self.stdout.write(f'  Created variety: {name}')
        
        # Create Quality Grades
        grades_data = [
            ('Gourmet', 'A', 'Premium quality, > 2% vanillin', 2.0, 25, 30, 1.5),
            ('TK', 'B', 'Standard export quality', 1.5, 25, 35, 1.2),
            ('US', 'C', 'US market standard', 1.0, 30, 38, 1.0),
            ('Extraction', 'D', 'For extract production', 0.5, None, None, 0.7),
            ('Cuts', 'E', 'Split and broken pods', None, None, None, 0.5),
        ]
        
        for name, code, desc, vanillin, min_moist, max_moist, factor in grades_data:
            QualityGrade.objects.get_or_create(
                code=code,
                defaults={
                    'name': name,
                    'description': desc,
                    'min_vanillin_content': vanillin,
                    'min_moisture_content': min_moist,
                    'max_moisture_content': max_moist,
                    'price_factor': factor
                }
            )
            self.stdout.write(f'  Created grade: {name}')
        
        # Create Seasons
        current_year = date.today().year
        for year in range(current_year - 2, current_year + 2):
            season, created = Season.objects.get_or_create(
                name='Campagne',
                year=year,
                defaults={
                    'start_date': date(year, 6, 1),
                    'end_date': date(year + 1, 5, 31),
                    'is_current': year == current_year
                }
            )
            if created:
                self.stdout.write(f'  Created season: Campagne {year}')
        
        self.stdout.write(self.style.SUCCESS('Initial data loaded successfully!'))
