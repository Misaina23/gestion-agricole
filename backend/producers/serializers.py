"""
Serializers for Producers App
"""
import logging
from django.db.models import Q
from rest_framework import serializers
from core.models import Region, Commune, District
from .models import Producer, Cooperative, ProducerPhoto

logger = logging.getLogger(__name__)


class ProducerPhotoSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProducerPhoto
        fields = ['id', 'producer', 'photo', 'caption', 'taken_at', 'created_at']
        read_only_fields = ['id', 'created_at']


class CooperativeSerializer(serializers.ModelSerializer):
    region_name = serializers.CharField(source='region.name', read_only=True)
    commune_name = serializers.CharField(source='commune.name', read_only=True)
    members_count = serializers.ReadOnlyField()
    
    class Meta:
        model = Cooperative
        fields = [
            'id', 'name', 'code', 'region', 'region_name', 'commune',
            'commune_name', 'address', 'phone', 'email', 'president',
            'registration_number', 'is_active', 'members_count', 'notes',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class ProducerListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for list views"""
    region_name = serializers.CharField(source='region.name', read_only=True)
    commune_name = serializers.CharField(source='commune.name', read_only=True)
    district_name = serializers.SerializerMethodField()
    cooperative_name = serializers.SerializerMethodField()
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    parcels_count = serializers.ReadOnlyField(source='ann_parcels_count')
    total_area = serializers.ReadOnlyField(source='ann_total_area')

    class Meta:
        model = Producer
        fields = [
            'id', 'code', 'name', 'phone', 'region', 'region_name',
            'district', 'district_name', 'commune', 'commune_name', 'status', 'status_display',
            'is_certified', 'cooperative', 'cooperative_name',
            'parcels_count', 'total_area', 'created_at'
        ]

    def get_district_name(self, obj):
        return obj.district.name if obj.district else None

    def get_cooperative_name(self, obj):
        return obj.cooperative.name if obj.cooperative else None


class ProducerDetailSerializer(serializers.ModelSerializer):
    """Full serializer for detail views"""
    region_name = serializers.CharField(source='region.name', read_only=True)
    commune_name = serializers.CharField(source='commune.name', read_only=True)
    district_name = serializers.SerializerMethodField()
    fokontany_name = serializers.SerializerMethodField()
    cooperative_name = serializers.SerializerMethodField()
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    gender_display = serializers.CharField(source='get_gender_display', read_only=True)
    registered_by_name = serializers.SerializerMethodField()
    parcels_count = serializers.ReadOnlyField(source='ann_parcels_count')
    total_area = serializers.ReadOnlyField(source='ann_total_area')
    total_plants = serializers.ReadOnlyField(source='ann_total_plants')
    
    class Meta:
        model = Producer
        fields = [
            'id', 'code', 'name', 'gender', 'gender_display', 'birth_date',
            'cin', 'phone', 'phone_secondary', 'email',
            'region', 'region_name', 'district', 'district_name',
            'commune', 'commune_name', 'fokontany', 'fokontany_name', 'address',
            'status', 'status_display', 'is_certified',
            'certification_date', 'certification_number', 'certification_expiry',
            'cooperative', 'cooperative_name', 'photo', 'notes',
            'joined_at', 'risk_category', 'identified_risks', 'member_processing', 'processing_activities',
            'last_internal_inspection_at', 'internal_inspector_name', 'last_external_inspection_at', 'eu_status', 'nop_status',
            'registered_by', 'registered_by_name',
            'parcels_count', 'total_area', 'total_plants',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_registered_by_name(self, obj):
        return obj.registered_by.full_name if obj.registered_by else None

    def get_district_name(self, obj):
        return obj.district.name if obj.district else None

    def get_fokontany_name(self, obj):
        return obj.fokontany.name if obj.fokontany else None

    def get_cooperative_name(self, obj):
        return obj.cooperative.name if obj.cooperative else None


class ProducerCreateUpdateSerializer(serializers.ModelSerializer):
    """Serializer for create/update operations.

    The producer code is NEVER provided by the client: it is generated
    automatically (and atomically) by ``Producer.save()`` from the
    region + district, guaranteeing a unique, sequential code such as
    ``PRD-REG01-DIS001-0001``.
    """
    region = serializers.CharField(required=False, allow_blank=True, write_only=True)
    commune = serializers.CharField(required=False, allow_blank=True, write_only=True)
    district = serializers.CharField(required=False, allow_blank=True, write_only=True)

    class Meta:
        model = Producer
        fields = [
            'name', 'gender', 'birth_date', 'cin',
            'phone', 'phone_secondary', 'email',
            'region', 'commune', 'district', 'fokontany', 'address',
            'status', 'is_certified', 'certification_date',
            'certification_number', 'certification_expiry',
            'cooperative', 'photo', 'notes'
        ]
        read_only_fields = ['id', 'code', 'created_at', 'updated_at']

    def _resolve_region(self, value):
        if not value:
            raise serializers.ValidationError({'region': ['La région est obligatoire.']})
        if isinstance(value, int) or (isinstance(value, str) and value.isdigit()):
            region = Region.objects.filter(pk=int(value)).first()
            if region:
                return region
        region = Region.objects.filter(Q(name__iexact=value) | Q(code__iexact=value)).first()
        if region:
            return region
        raise serializers.ValidationError({'region': [f"La région '{value}' est introuvable."]})

    def _resolve_commune(self, value, region):
        if not value:
            raise serializers.ValidationError({'commune': ['La commune est obligatoire.']})
        if isinstance(value, int) or (isinstance(value, str) and value.isdigit()):
            commune = Commune.objects.filter(pk=int(value)).first()
            if commune:
                return commune
        queryset = Commune.objects.filter(Q(name__iexact=value) | Q(code__iexact=value))
        if region:
            queryset = queryset.filter(region=region)
        commune = queryset.first()
        if commune:
            return commune
        raise serializers.ValidationError({'commune': [f"La commune '{value}' est introuvable."]})

    def _resolve_district(self, value, region):
        if not value:
            return None
        if isinstance(value, int) or (isinstance(value, str) and value.isdigit()):
            district = District.objects.filter(pk=int(value)).first()
            if district:
                return district
        queryset = District.objects.filter(Q(name__iexact=value) | Q(code__iexact=value))
        if region:
            queryset = queryset.filter(region=region)
        district = queryset.first()
        if district:
            return district
        return None

    def validate(self, attrs):
        region_value = attrs.pop('region', None)
        commune_value = attrs.pop('commune', None)
        district_value = attrs.pop('district', None)

        if region_value is not None:
            attrs['region'] = self._resolve_region(region_value)
        elif self.instance is None:
            raise serializers.ValidationError({'region': ['La région est obligatoire.']})

        if commune_value is not None:
            attrs['commune'] = self._resolve_commune(commune_value, attrs.get('region'))
        elif self.instance is None:
            raise serializers.ValidationError({'commune': ['La commune est obligatoire.']})

        district = None
        if district_value is not None:
            district = self._resolve_district(district_value, attrs.get('region'))
        if district is None and attrs.get('commune'):
            district = attrs['commune'].district
        if district is None and self.instance is not None:
            district = self.instance.district
        if district is not None:
            attrs['district'] = district

        return attrs

    def create(self, validated_data):
        request = self.context.get('request')
        if request and getattr(request, 'user', None) and request.user.is_authenticated:
            validated_data['registered_by'] = request.user
        validated_data.setdefault('synced', True)
        try:
            producer = super().create(validated_data)
            logger.info('Producer created successfully', extra={'producer_code': producer.code, 'created_by': getattr(getattr(request, 'user', None), 'id', None)})
            return producer
        except Exception:
            logger.exception('Producer creation failed', extra={'validated_data': validated_data})
            raise
