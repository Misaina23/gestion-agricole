"""
Serializers for Core App
"""
from rest_framework import serializers
from .models import Region, Commune, District, Fokontany, VanillaVariety, QualityGrade, Season, SyncLog, ProductionUnit


class DistrictSerializer(serializers.ModelSerializer):
    region_name = serializers.CharField(source='region.name', read_only=True)
    communes_count = serializers.SerializerMethodField()

    class Meta:
        model = District
        fields = ['id', 'name', 'code', 'region', 'region_name', 'is_active', 'communes_count']

    def get_communes_count(self, obj):
        return obj.communes.count()


class RegionSerializer(serializers.ModelSerializer):
    districts_count = serializers.SerializerMethodField()
    communes_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Region
        fields = ['id', 'name', 'code', 'description', 'is_active', 'districts_count', 'communes_count']
    
    def get_districts_count(self, obj):
        return obj.districts.count()

    def get_communes_count(self, obj):
        return obj.communes.count()


class CommuneSerializer(serializers.ModelSerializer):
    region_name = serializers.CharField(source='region.name', read_only=True)
    district_name = serializers.CharField(source='district.name', read_only=True)
    fokontanys_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Commune
        fields = ['id', 'name', 'code', 'region', 'region_name', 'district', 'district_name', 'is_active', 'fokontanys_count']
    
    def get_fokontanys_count(self, obj):
        return obj.fokontanys.count()


class FokontanySerializer(serializers.ModelSerializer):
    commune_name = serializers.CharField(source='commune.name', read_only=True)
    region_name = serializers.CharField(source='commune.region.name', read_only=True)
    
    class Meta:
        model = Fokontany
        fields = ['id', 'name', 'code', 'commune', 'commune_name', 'region_name', 'is_active']


class VanillaVarietySerializer(serializers.ModelSerializer):
    class Meta:
        model = VanillaVariety
        fields = ['id', 'name', 'code', 'description', 'is_active']


class QualityGradeSerializer(serializers.ModelSerializer):
    class Meta:
        model = QualityGrade
        fields = [
            'id', 'name', 'code', 'description',
            'min_vanillin_content', 'min_moisture_content',
            'max_moisture_content', 'price_factor', 'is_active'
        ]


class SeasonSerializer(serializers.ModelSerializer):
    class Meta:
        model = Season
        fields = ['id', 'name', 'year', 'start_date', 'end_date', 'is_current', 'is_active', 'target_weight']


class SyncLogSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.full_name', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    class Meta:
        model = SyncLog
        fields = [
            'id', 'user', 'user_name', 'status', 'status_display',
            'records_sent', 'records_received', 'started_at',
            'completed_at', 'error_message'
        ]
        read_only_fields = ['id', 'started_at']


class ProductionUnitSerializer(serializers.ModelSerializer):
    region_name = serializers.CharField(source='region.name', read_only=True)
    district_name = serializers.CharField(source='district.name', read_only=True)
    commune_name = serializers.CharField(source='commune.name', read_only=True)
    producers_count = serializers.SerializerMethodField()

    class Meta:
        model = ProductionUnit
        fields = [
            'id', 'name', 'code', 'unit_type',
            'region', 'region_name', 'district', 'district_name', 'commune', 'commune_name',
            'manager_name', 'manager_function', 'phone', 'email',
            'members_count', 'total_area', 'creation_date', 'status', 'notes',
            'producers_count', 'created_at', 'updated_at'
        ]

    def get_producers_count(self, obj):
        return obj.producers.count()
