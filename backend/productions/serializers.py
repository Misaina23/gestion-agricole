"""
Serializers for Productions App
"""
from rest_framework import serializers
from .models import Production, ProductionBatch


class ProductionListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for list views"""
    producer_name = serializers.CharField(source='parcel.producer.name', read_only=True)
    producer_code = serializers.CharField(source='parcel.producer.code', read_only=True)
    parcel_code = serializers.CharField(source='parcel.code', read_only=True)
    region_name = serializers.CharField(source='parcel.producer.region.name', read_only=True)
    commune_name = serializers.CharField(source='parcel.producer.commune.name', read_only=True)
    actual_date = serializers.DateField(source='harvest_date', read_only=True)
    season_name = serializers.SerializerMethodField()
    quality_grade_name = serializers.SerializerMethodField()
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    conversion_rate = serializers.ReadOnlyField()

    class Meta:
        model = Production
        fields = [
            'id', 'code', 'parcel', 'parcel_code', 'producer_name',
            'producer_code', 'region_name', 'commune_name', 'actual_date',
            'season', 'season_name', 'harvest_date', 'weight_green', 'weight_prepared',
            'pods_count', 'quality_grade', 'quality_grade_name',
            'status', 'status_display', 'conversion_rate', 'created_at'
        ]

    def get_season_name(self, obj):
        return f"{obj.season.name} {obj.season.year}" if obj.season else None

    def get_quality_grade_name(self, obj):
        return obj.quality_grade.name if obj.quality_grade else None


class ProductionDetailSerializer(serializers.ModelSerializer):
    """Full serializer for detail views"""
    producer_name = serializers.CharField(source='parcel.producer.name', read_only=True)
    producer_code = serializers.CharField(source='parcel.producer.code', read_only=True)
    parcel_code = serializers.CharField(source='parcel.code', read_only=True)
    parcel_name = serializers.CharField(source='parcel.name', read_only=True)
    region_name = serializers.CharField(source='parcel.producer.region.name', read_only=True)
    commune_name = serializers.CharField(source='parcel.producer.commune.name', read_only=True)
    season_name = serializers.SerializerMethodField()
    quality_grade_name = serializers.SerializerMethodField()
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    registered_by_name = serializers.SerializerMethodField()
    conversion_rate = serializers.ReadOnlyField()
    avg_pod_weight = serializers.ReadOnlyField()

    class Meta:
        model = Production
        fields = [
            'id', 'code', 'parcel', 'parcel_code', 'parcel_name',
            'producer_name', 'producer_code', 'region_name', 'commune_name',
            'season', 'season_name', 'harvest_date', 'harvest_time',
            'weight_green', 'weight_prepared', 'conversion_rate',
            'pods_count', 'pods_grade_a', 'pods_grade_b', 'pods_grade_c', 'pods_rejected', 'avg_pod_weight',
            'quality_grade', 'quality_grade_name', 'vanillin_content', 'moisture_content',
            'status', 'status_display',
            'drying_start_date', 'drying_end_date', 'curing_start_date', 'curing_end_date',
            'sale_date', 'sale_price', 'buyer',
            'photo', 'notes', 'registered_by', 'registered_by_name',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_season_name(self, obj):
        return f"{obj.season.name} {obj.season.year}" if obj.season else None

    def get_quality_grade_name(self, obj):
        return obj.quality_grade.name if obj.quality_grade else None

    def get_registered_by_name(self, obj):
        return obj.registered_by.full_name if obj.registered_by else None


class ProductionCreateUpdateSerializer(serializers.ModelSerializer):
    """Serializer for create/update operations"""

    class Meta:
        model = Production
        fields = [
            'code', 'parcel', 'season', 'harvest_date', 'harvest_time',
            'weight_green', 'weight_prepared',
            'pods_count', 'pods_grade_a', 'pods_grade_b', 'pods_grade_c', 'pods_rejected',
            'quality_grade', 'vanillin_content', 'moisture_content', 'status',
            'drying_start_date', 'drying_end_date', 'curing_start_date', 'curing_end_date',
            'sale_date', 'sale_price', 'buyer', 'photo', 'notes'
        ]

    def create(self, validated_data):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            validated_data['registered_by'] = request.user
        return super().create(validated_data)


class ProductionBatchSerializer(serializers.ModelSerializer):
    quality_grade_name = serializers.SerializerMethodField()
    productions_count = serializers.SerializerMethodField()

    class Meta:
        model = ProductionBatch
        fields = [
            'id', 'code', 'name', 'productions', 'productions_count',
            'total_weight', 'quality_grade', 'quality_grade_name',
            'notes', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_quality_grade_name(self, obj):
        return obj.quality_grade.name if obj.quality_grade else None

    def get_productions_count(self, obj):
        return obj.productions.count()
