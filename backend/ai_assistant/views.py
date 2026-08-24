from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Count, Sum, Q, F
from django.utils import timezone
from datetime import timedelta, date
import random

from .models import ChatSession, ChatMessage, AgriculturalRecommendation, MonthlyReport
from .serializers import (
    ChatSessionSerializer,
    ChatSessionCreateSerializer,
    ChatMessageSerializer,
    SendMessageSerializer,
    AgriculturalRecommendationSerializer,
    MonthlyReportSerializer,
    GenerateReportSerializer,
)
import os
import requests
from rest_framework.views import APIView
import logging
from django.core.cache import cache
from django.conf import settings

logger = logging.getLogger(__name__)

# Rate limit defaults (requests per window)
LLM_RATE_LIMIT = int(os.getenv('LLM_RATE_LIMIT', '20'))  # requests
LLM_RATE_PERIOD = int(os.getenv('LLM_RATE_PERIOD', '60'))  # seconds


def visible_producers(user):
    """Administrators analyse the cooperative register; field users see theirs."""
    from producers.models import Producer
    return Producer.objects.all() if getattr(user, 'role', None) in ('admin', 'manager') else Producer.objects.filter(registered_by=user)


class ChatSessionViewSet(viewsets.ModelViewSet):
    serializer_class = ChatSessionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return ChatSession.objects.filter(user=self.request.user).prefetch_related(
            'messages'
        )

    def get_serializer_class(self):
        if self.action == 'create':
            return ChatSessionCreateSerializer
        return ChatSessionSerializer

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=True, methods=['post'])
    def send_message(self, request, pk=None):
        session = self.get_object()
        serializer = SendMessageSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        message_text = serializer.validated_data['message']
        topic = serializer.validated_data.get('topic', session.topic)

        user_message = ChatMessage.objects.create(
            session=session,
            role='user',
            content=message_text,
        )

        ai_response = self._generate_ai_response(message_text, topic, request.user)

        assistant_message = ChatMessage.objects.create(
            session=session,
            role='assistant',
            content=ai_response['response'],
            metadata=ai_response.get('metadata', {}),
        )

        if not session.title:
            session.title = message_text[:50]
            session.save()

        return Response({
            'user_message': ChatMessageSerializer(user_message).data,
            'assistant_message': ChatMessageSerializer(assistant_message).data,
            'suggestions': ai_response.get('suggestions', []),
        })

    @action(detail=False, methods=['get'])
    def my_sessions(self, request):
        sessions = self.get_queryset()[:20]
        serializer = self.get_serializer(sessions, many=True)
        return Response(serializer.data)

    def _generate_ai_response(self, message: str, topic: str, user) -> dict:
        message_lower = message.lower()

        if any(kw in message_lower for kw in ['bonjour', 'salut', 'hello', 'bonsoir']):
            return {
                'response': (
                    f"Bonjour {user.get_full_name() or user.username} ! "
                    "Je suis votre assistant agricole intelligent. "
                    "Comment puis-je vous aider aujourd'hui ?"
                ),
                'suggestions': [
                    'Conseils pour ameliorer le rendement de vanille',
                    'Comment detecter les parasites ?',
                    'Quand recolter la vanille ?',
                ],
            }

        if any(kw in message_lower for kw in ['rendement', 'production', 'productivite']):
            return self._yield_advice(user, message)

        if any(kw in message_lower for kw in ['parasite', 'maladie', 'infection', ' Champignon']):
            return self._pest_advice(message)

        if any(kw in message_lower for kw in ['recolte', 'cueillette', 'maturite']):
            return self._harvest_advice()

        if any(kw in message_lower for kw in ['meteo', 'temps', 'pluie', 'secheresse']):
            return self._weather_advice()

        if any(kw in message_lower for kw in ['engrais', 'fertilisant', 'amendement']):
            return self._fertilizer_advice()

        if any(kw in message_lower for kw in ['statistique', 'rapport', 'resume']):
            return self._stats_response(user)

        return {
            'response': (
                "Je comprends votre question. En analysant vos donnees agricoles, "
                "je peux vous conseiller sur l'amelioration des rendements, la gestion "
                "des parasites, les bonnes pratiques culturales et bien plus encore. "
                "N'hesitez pas a me poser des questions precises sur vos cultures."
            ),
            'suggestions': [
                'Quelle est la methode de fertilisation recommandee ?',
                'Comment optimiser mes recoltes ?',
                'Generer un rapport mensuel',
            ],
        }

    def _yield_advice(self, user, message: str) -> dict:
        from producers.models import Producer, Parcel
        from productions.models import Production

        producers = Producer.objects.filter(registered_by=user)
        if not producers.exists():
            return {
                'response': (
                    "Aucun producteur enregistre dans votre zone. "
                    "Commencez par enregistrer des producteurs pour obtenir "
                    "des recommandations personnalisees de rendement."
                ),
                'suggestions': ['Enregistrer un producteur'],
            }

        stats = []
        for producer in producers[:5]:
            parcels = Parcel.objects.filter(producer=producer)
            total_area = sum(p.area for p in parcels) or 0
            productions = Production.objects.filter(parcel__in=parcels)
            total_yield = sum(
                float(p.weight_green) for p in productions
            )
            avg_yield = (total_yield / total_area) if total_area > 0 else 0

            if avg_yield < 500:
                advice = (
                    f"Le rendement de {producer.name} est faible ({avg_yield:.0f} kg/ha). "
                    "Recommandations : ameliorer la fertilisation, verifier la qualite "
                    "des plants, optimiser l'espacement des pieds de vanille."
                )
            elif avg_yield < 1000:
                advice = (
                    f"Le rendement de {producer.name} est moyen ({avg_yield:.0f} kg/ha). "
                    "Recommandations : intensifier la taille, optimiser la greffe, "
                    "ameliorer le drainage."
                )
            else:
                advice = (
                    f"Le rendement de {producer.name} est bon ({avg_yield:.0f} kg/ha). "
                    "Maintenez ces pratiques et partagez votre experience avec d'autres producteurs."
                )
            stats.append(advice)

        return {
            'response': "\n\n".join(stats),
            'suggestions': [
                'Comment ameliorer la fertilisation ?',
                'Quelles sont les bonnes pratiques de taille ?',
            ],
        }

    def _pest_advice(self, message: str) -> dict:
        if 'feuille' in message.lower():
            return {
                'response': (
                    "Les maladies foliaires sont souvent causees par un exces d'humidite. "
                    "Recommandations : "
                    "1. Ameliorer l'aeration entre les plants. "
                    "2. Traiter avec un fongicide biologique (Bouillie Bordelaise). "
                    "3. Ramasser et detruire les feuilles infectees. "
                    "4. Eviter l'arrosage par aspersion."
                ),
                'suggestions': [
                    'Quel fongicide utiliser ?',
                    'Comment prevenir les maladies ?',
                ],
            }

        return {
            'response': (
                "Pour lutter contre les parasites de la vanille : "
                "1. Constater regulierement les plantations. "
                "2. Utiliser des pieges a pheromones pour les insectes. "
                "3. Traiter preventivement avec des produits homologues. "
                "4. Favoriser la biodiversite autour des plantations."
            ),
            'suggestions': [
                'Quels sont les parasites les plus courants ?',
                'Comment utiliser les pieges a pheromones ?',
            ],
        }

    def _harvest_advice(self) -> dict:
        return {
            'response': (
                "Le moment optimal de recolte de la vanille : "
                "1. Observer la couleur des gousses : elles doivent etre jaunes au debut. "
                "2. Verifier la maturite : les gousses doivent etre lourdes et brillantes. "
                "3. La recolte se fait manuellement, 9 a 12 mois apres la fecondation. "
                "4. Ne pas attendre trop longtemps : les gousses peuvent eclater. "
                "5. Recolter le matin pour une meilleure qualite."
            ),
            'suggestions': [
                'Comment stocker la vanille apres recolte ?',
                'Quelle est la duree de stockage ?',
            ],
        }

    def _weather_advice(self) -> dict:
        return {
            'response': (
                "Conseils meteorologiques pour la vanille : "
                "1. Temperature ideale : 22-28°C. "
                "2. Humidite : 70-80%. "
                "3. Periode de pluie : prevoir des protections contre l'exces d'eau. "
                "4. Periode seche : prevoir l'irrigation reguliere. "
                "5. Cyclones : proteger les plants avec des tuteurs renforces."
            ),
            'suggestions': [
                'Comment proteger les plants des cyclones ?',
                'Quand irriguer ?',
            ],
        }

    def _fertilizer_advice(self) -> dict:
        return {
            'response': (
                "Fertilisation de la vanille : "
                "1. Utiliser du compost organique bien decompose. "
                "2. Apport d'azote : favoriser les feuilles vertes. "
                "3. Phosphore : stimuler le developpement racinaire. "
                "4. Potassium : ameliorer la qualite des gousses. "
                "5. Apports fractionnes tous les 3-4 mois. "
                "6. Eviter les engrais chimiques trop concentres."
            ),
            'suggestions': [
                "Quelle dose d'engrais utiliser ?",
                'Quand appliquer la fertilisation ?',
            ],
        }

    def _stats_response(self, user) -> dict:
        from producers.models import Producer
        from parcels.models import Parcel
        from parcels.models import ParcelRegisterHarvest

        producers = visible_producers(user)
        parcels = Parcel.objects.filter(producer__in=producers)
        harvests = ParcelRegisterHarvest.objects.filter(parcel__in=parcels, period='current')
        totals = harvests.aggregate(harvested=Sum('actual_harvest'), delivered=Sum('delivered_quantity'))

        return {
            'response': (
                f"Données du registre : {producers.count()} producteurs, "
                f"{parcels.count()} parcelles, {float(totals['harvested'] or 0):.2f} kg récoltés et "
                f"{float(totals['delivered'] or 0):.2f} kg livrés."
            ),
            'suggestions': ['Générer un rapport coopératif', 'Voir les écarts récolte/livraison'],
        }


class RecommendationViewSet(viewsets.ModelViewSet):
    serializer_class = AgriculturalRecommendationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = AgriculturalRecommendation.objects.all()
        producer_id = self.request.query_params.get('producer_id')
        if producer_id:
            queryset = queryset.filter(producer_id=producer_id)
        type_req = self.request.query_params.get('type')
        if type_req:
            queryset = queryset.filter(recommendation_type=type_req)
        is_read = self.request.query_params.get('is_read')
        if is_read is not None:
            queryset = queryset.filter(is_read=is_read.lower() == 'true')
        return queryset.select_related('producer', 'parcel')

    @action(detail=False, methods=['post'])
    def generate_for_user(self, request):
        user = request.user
        from parcels.models import Parcel, ParcelRegisterHarvest

        producers = visible_producers(user)
        count = 0

        for producer in producers:
            parcels = Parcel.objects.filter(producer=producer)
            if not parcels.exists():
                continue
            for parcel in parcels:
                harvest = ParcelRegisterHarvest.objects.filter(parcel=parcel, period='current', crop_slot='main').first()
                if not harvest or harvest.actual_yield is None:
                    continue
                estimated = float(harvest.estimated_yield or 0)
                actual = float(harvest.actual_yield)
                difference = actual - estimated if estimated else None
                rec_type, title = 'yield', f"Contrôle de rendement — {parcel.code}"
                priority = 'high' if difference is not None and difference < 0 else 'medium'
                description = f"Registre T06 : rendement effectif {actual:.2f} kg/ha."
                if difference is not None:
                    description += f" Écart avec l’estimation : {difference:.2f} kg/ha. À vérifier lors de la prochaine inspection."

                AgriculturalRecommendation.objects.get_or_create(
                    producer=producer,
                    parcel=parcel,
                    recommendation_type=rec_type,
                    title=title,
                    defaults={
                        'description': description,
                        'priority': priority,
                    },
                )
                count += 1

        return Response({
            'count': count,
            'message': f'{count} recommandations generees',
        })

    @action(detail=True, methods=['post'])
    def mark_read(self, request, pk=None):
        rec = self.get_object()
        rec.is_read = True
        rec.save()
        return Response({'status': 'Lu'})

    @action(detail=True, methods=['post'])
    def mark_applied(self, request, pk=None):
        rec = self.get_object()
        rec.is_applied = True
        rec.save()
        return Response({'status': 'Applique'})


class MonthlyReportViewSet(viewsets.ModelViewSet):
    serializer_class = MonthlyReportSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return MonthlyReport.objects.all().order_by('-period_start')

    def get_serializer_class(self):
        if self.action == 'generate_report':
            return GenerateReportSerializer
        return MonthlyReportSerializer

    @action(detail=False, methods=['post'])
    def generate_report(self, request):
        serializer = GenerateReportSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        data = serializer.validated_data
        report_type = data['report_type']
        period_start = data['period_start']
        period_end = data['period_end']
        region = data.get('region', '')
        include_charts = data.get('include_charts', True)
        include_recommendations = data.get('include_recommendations', True)

        report = MonthlyReport.objects.create(
            title=self._build_title(report_type, period_start, period_end, region),
            report_type=report_type,
            period_start=period_start,
            period_end=period_end,
            region=region,
            generated_by=request.user,
            status='generating',
        )

        try:
            report_data = self._build_report_data(
                report_type, period_start, period_end, region,
                include_charts, include_recommendations, request.user
            )
            report.report_data = report_data
            report.summary = report_data.get('summary', '')
            report.status = 'completed'
            report.save()

            return Response(MonthlyReportSerializer(report).data)
        except Exception as e:
            report.status = 'failed'
            report.save()
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    def _build_title(self, report_type, start, end, region):
        type_labels = dict(MonthlyReport.REPORT_TYPE_CHOICES)
        title = f"Rapport {type_labels.get(report_type, report_type)}"
        if region:
            title += f" - {region}"
        title += f" ({start} au {end})"
        return title

    def _build_report_data(self, report_type, start, end, region, include_charts, include_recommendations, user):
        from parcels.models import Parcel, ParcelRegisterHarvest
        from inspections.models import Inspection

        report_data = {
            'summary': '',
            'kpis': {},
            'charts': {},
            'recommendations': [],
            'details': [],
        }

        if report_type in ('producers', 'global', 'region'):
            producers = visible_producers(user)
            if region:
                producers = producers.filter(region__name__icontains=region)
            report_data['kpis']['producers'] = {
                'total': producers.count(),
                'active': producers.filter(status='active').count(),
                'certified': producers.filter(parcels__conversion_status='organic').distinct().count(),
                'pending': producers.filter(status='pending').count(),
            }

        if report_type in ('parcels', 'global', 'region'):
            producers = visible_producers(user)
            if region:
                producers = producers.filter(region__name__icontains=region)
            parcels = Parcel.objects.filter(producer__in=producers)
            report_data['kpis']['parcels'] = {
                'total': parcels.count(),
                'total_area': float(
                    parcels.aggregate(total=Sum('area'))['total'] or 0
                ),
                'avg_area': float(
                    parcels.aggregate(avg=Sum('area'))['avg'] or 0
                ) / max(parcels.count(), 1),
            }

        if report_type in ('productions', 'global', 'region'):
            producers = visible_producers(user)
            if region:
                producers = producers.filter(region__name__icontains=region)
            harvests = ParcelRegisterHarvest.objects.filter(parcel__producer__in=producers, period='current')
            production_agg = harvests.aggregate(total=Sum('actual_harvest'), delivered=Sum('delivered_quantity'), estimated=Avg('estimated_yield'), actual=Avg('actual_yield'))
            report_data['kpis']['productions'] = {
                'register_records': harvests.count(),
                'total_harvested_kg': float(production_agg['total'] or 0),
                'total_delivered_kg': float(production_agg['delivered'] or 0),
                'estimated_yield_average': float(production_agg['estimated'] or 0),
                'actual_yield_average': float(production_agg['actual'] or 0),
            }

        if report_type in ('inspections', 'global', 'region'):
            producers = visible_producers(user)
            if region:
                producers = producers.filter(region__name__icontains=region)
            inspections = Inspection.objects.filter(
                producer__in=producers,
                planned_date__gte=start,
                planned_date__lte=end,
            )
            report_data['kpis']['inspections'] = {
                'total': inspections.count(),
                'compliant': inspections.filter(result='passed').count(),
                'non_compliant': inspections.filter(result='failed').count(),
                'partial': inspections.filter(result='conditional').count(),
            }

        if include_recommendations:
            recs = AgriculturalRecommendation.objects.filter(
                producer__in=visible_producers(user),
                is_applied=False,
            )[:10]
            report_data['recommendations'] = [
                {
                    'title': r.title,
                    'description': r.description,
                    'priority': r.priority,
                    'type': r.recommendation_type,
                }
                for r in recs
            ]

        summary_parts = []
        for section, kpis in report_data['kpis'].items():
            summary_parts.append(f"{section}: {kpis}")
        report_data['summary'] = ' | '.join(summary_parts)

        if include_charts:
            report_data['charts'] = {
                'productions_by_month': {},
                'inspections_trend': {},
            }

        return report_data


class AgriculturalAdviceView(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]

    @action(detail=False, methods=['get'])
    def daily_tip(self, request):
        tips = AgriculturalRecommendation.objects.filter(
            producer__in=visible_producers(request.user), is_read=False
        ).order_by('-created_at')[:5]
        return Response(AgriculturalRecommendationSerializer(tips, many=True).data)

    @action(detail=False, methods=['post'])
    def ask(self, request):
        message = request.data.get('message', '')
        if not message:
            return Response(
                {'error': 'Message requis'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        session, created = ChatSession.objects.get_or_create(
            user=request.user,
            is_active=True,
            defaults={'topic': 'general', 'title': message[:50]},
        )

        viewset = ChatSessionViewSet()
        viewset.request = request
        result = viewset._generate_ai_response(message, session.topic, request.user)

        ChatMessage.objects.create(
            session=session,
            role='user',
            content=message,
        )
        ChatMessage.objects.create(
            session=session,
            role='assistant',
            content=result['response'],
            metadata={'suggestions': result.get('suggestions', [])},
        )

        return Response({
            'response': result['response'],
            'suggestions': result.get('suggestions', []),
            'session_id': session.id,
        })

    @action(detail=False, methods=['get'])
    def anomalies(self, request):
        user = request.user
        from producers.models import Producer
        from parcels.models import Parcel
        from productions.models import Production
        from datetime import timedelta
        from django.utils import timezone

        now = timezone.now()
        recent_limit = now - timedelta(days=90)

        producers_qs = Producer.objects.filter(registered_by=user)
        parcels_qs = Parcel.objects.filter(producer__in=producers_qs)
        productions_qs = Production.objects.filter(parcel__in=parcels_qs)

        inactive_producers = producers_qs.filter(status='inactive').values('id', 'name', 'region__name')[:50]
        low_yields = []
        for parcel in parcels_qs.select_related('producer', 'producer__region')[:50]:
            recent = productions_qs.filter(parcel=parcel, created_at__gte=recent_limit)
            total_qty = sum(float(p.weight_green or 0) for p in recent)
            area = float(parcel.area or 0)
            avg_yield = (total_qty / area) if area > 0 else 0
            if avg_yield < 500:
                low_yields.append({
                    'parcel_id': parcel.id,
                    'parcel': str(parcel),
                    'producer': parcel.producer.name,
                    'region': getattr(parcel.producer.region, 'name', None),
                    'yield_kg_per_ha': round(avg_yield, 2),
                    'area_ha': round(area, 4),
                })

        inconsistent_records = productions_qs.filter(
            Q(weight_green__isnull=True) |
            Q(weight_green__lt=0) |
            Q(harvest_date__gt=now.date())
        ).values('id', 'parcel__code', 'weight_green', 'harvest_date')[:50]

        return Response({
            'generated_at': now.isoformat(),
            'inactive_producers': list(inactive_producers),
            'low_yields': low_yields,
            'inconsistent_records': list(inconsistent_records),
            'counts': {
                'inactive_producers': len(inactive_producers),
                'low_yields': len(low_yields),
                'inconsistent_records': len(inconsistent_records),
            },
        })


def _demo_response(prompt: str) -> str:
    """Offline fallback answer used when no LLM_API_KEY is configured.

    Provides a helpful, context-aware reply in French based on keywords so the
    assistant remains usable without an external LLM provider.
    """
    p = (prompt or '').lower()
    lines = []

    if any(k in p for k in ['inspect', 'inspection', 'visite']):
        lines.append("Pour suivre les inspections : allez dans le menu « Inspections », "
                     "créez une nouvelle inspection (initiale, de suivi ou de certification) "
                     "et renseignez le producteur, la parcelle et le score.")
    if any(k in p for k in ['rendement', 'faible', 'production', 'récolte', 'yield']):
        lines.append("Les producteurs à faible rendement apparaissent dans l'Assistant IA "
                     "(détection d'anomalies) et dans les statistiques de production par région.")
    if any(k in p for k in ['commune', 'région', 'region', 'zone']):
        lines.append("La carte « Parcelles GPS » affiche la répartition par région et les "
                     "producteurs les plus actifs. Filtrez par commune ou région depuis le menu déroulant.")
    if any(k in p for k in ['prévision', 'prevision', 'predict', 'forecast', 'revenu']):
        lines.append("Les prévisions de récoltes et de revenus sont disponibles via l'Assistant IA "
                     "et les rapports mensuels générés depuis le tableau de bord.")
    if any(k in p for k in ['anomal', 'gps', 'doublon', 'duplicate', 'coordonnée', 'incohérent']):
        lines.append("La détection d'anomalies (GPS incohérents, doublons, valeurs aberrantes, "
                     "livraisons impossibles) est accessible dans l'Assistant IA, onglet « Détection d'anomalies ».")
    if any(k in p for k in ['intrant', 'input', 'engrais', 'fertil']):
        lines.append("La gestion des intrants (distributions d'engrais, etc.) se fait dans le menu « Intrants ».")
    if any(k in p for k in ['producteur', 'agriculteur', 'farmer']):
        lines.append("Pour gérer les producteurs : menu « Producteurs » (ajout, modification, "
                     "inscription, affectation aux campagnes).")

    if not lines:
        lines.append("Je suis l'assistant agricole VIDEEKO VANILLA. Sans clé LLM configurée, "
                     "je peux vous orienter vers les modules : Producteurs, Parcelles GPS, "
                     "Productions, Inspections, Intrants, Livraisons, Campagnes et l'Historique.")
        lines.append("Posez une question sur les inspections, le rendement, les régions, "
                     "les prévisions, les anomalies ou les intrants pour obtenir de l'aide.")

    return "\n\n".join(lines)


class LLMProxyView(APIView):
    """Simple proxy to call external LLM providers securely from the server.

    Reads LLM_API_KEY and optional LLM_PROVIDER from environment variables.
    Currently supports 'openai' provider.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        prompt = request.data.get('prompt') or request.data.get('message')
        if not prompt:
            return Response({'error': 'prompt is required'}, status=status.HTTP_400_BAD_REQUEST)

        # Basic input validation
        if not isinstance(prompt, str) or len(prompt.strip()) == 0:
            return Response({'error': 'prompt must be a non-empty string'}, status=status.HTTP_400_BAD_REQUEST)
        if len(prompt) > int(os.getenv('LLM_MAX_PROMPT_CHARS', '20000')):
            return Response({'error': 'prompt too long'}, status=status.HTTP_400_BAD_REQUEST)

        # Simple per-user rate limiting using cache
        user = request.user
        rate_key = f"llm_rate_{user.id}"
        try:
            count = cache.get(rate_key, 0)
            if count >= LLM_RATE_LIMIT:
                logger.warning('LLM rate limit exceeded for user %s', user.id)
                return Response({'error': 'rate limit exceeded'}, status=429)
            cache.set(rate_key, int(count) + 1, LLM_RATE_PERIOD)
        except Exception:
            # Fail-open: if cache unavailable, allow but log
            logger.exception('Cache error when enforcing LLM rate limit')

        model = request.data.get('model', os.getenv('LLM_DEFAULT_MODEL', 'gpt-4o'))
        try:
            max_tokens = int(request.data.get('max_tokens', 512))
        except Exception:
            max_tokens = 512
        # enforce a server-side cap on tokens
        max_tokens = min(max_tokens, int(os.getenv('LLM_MAX_TOKENS', '2048')))
        provider = os.getenv('LLM_PROVIDER', 'openai').lower()
        api_key = os.getenv('LLM_API_KEY')

        if not api_key:
            logger.warning('LLM_API_KEY not set in environment')
            return Response({'error': 'Service IA non configuré.'}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

        try:
            logger.info('LLM proxy request user=%s model=%s prompt_len=%s', getattr(request.user, 'id', None), model, len(prompt))
            if provider == 'openai':
                url = 'https://api.openai.com/v1/chat/completions'
                headers = {
                    'Authorization': f'Bearer {api_key}',
                    'Content-Type': 'application/json',
                }
                payload = {
                    'model': model,
                    'messages': [{'role': 'user', 'content': prompt}],
                    'max_tokens': max_tokens,
                    'temperature': float(request.data.get('temperature', 0.7)),
                }
                resp = requests.post(url, json=payload, headers=headers, timeout=30)
                resp.raise_for_status()
                data = resp.json()
                # extract assistant text (best-effort)
                assistant = None
                try:
                    assistant = data.get('choices', [])[0].get('message', {}).get('content')
                except Exception:
                    assistant = None

                return Response({'response': assistant or '', 'raw': data})
            else:
                return Response({'error': f'Unsupported LLM provider: {provider}'}, status=status.HTTP_400_BAD_REQUEST)
        except requests.RequestException as e:
            logger.exception('LLM proxy request failed')
            return Response({'error': 'LLM provider request failed', 'details': str(e)}, status=status.HTTP_502_BAD_GATEWAY)
