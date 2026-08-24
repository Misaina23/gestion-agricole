"""
Serializers for Parcels App
"""
from rest_framework import serializers
from .models import Parcel, ParcelPhoto, ParcelRegisterHarvest


class ParcelRegisterHarvestSerializer(serializers.ModelSerializer):
    class Meta:
        model = ParcelRegisterHarvest
        fields = ['id', 'period', 'crop_slot', 'estimated_yield', 'actual_harvest', 'actual_yield', 'delivered_quantity']


class ParcelPhotoSerializer(serializers.ModelSerializer):
    class Meta:
        model = ParcelPhoto
        fields = ['id', 'parcel', 'photo', 'caption', 'taken_at', 'created_at']
        read_only_fields = ['id', 'created_at']


class ParcelListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for list views"""
    producer_name = serializers.CharField(source='producer.name', read_only=True)
    producer_code = serializers.CharField(source='producer.code', read_only=True)
    region_name = serializers.CharField(source='producer.region.name', read_only=True)
    variety_name = serializers.CharField(source='variety.name', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    plant_density = serializers.ReadOnlyField()
    productivity_rate = serializers.ReadOnlyField()
    register_harvests = ParcelRegisterHarvestSerializer(many=True, read_only=True)
    
    class Meta:
        model = Parcel
        fields = [
            'id', 'code', 'name', 'producer', 'producer_name', 'producer_code',
            'region_name', 'latitude', 'longitude', 'area', 'vanilla_plants',
            'main_crop', 'intercrop', 'conversion_status', 'conversion_level',
            'estimated_yield', 'eu_status', 'nop_status',
            'register_harvests',
            'productive_plants', 'variety', 'variety_name', 'status',
            'status_display', 'is_certified', 'plant_density',
            'productivity_rate', 'created_at'
        ]


class ParcelDetailSerializer(serializers.ModelSerializer):
    """Full serializer for detail views"""
    producer_name = serializers.CharField(source='producer.name', read_only=True)
    producer_code = serializers.CharField(source='producer.code', read_only=True)
    region_name = serializers.CharField(source='producer.region.name', read_only=True)
    commune_name = serializers.CharField(source='producer.commune.name', read_only=True)
    variety_name = serializers.CharField(source='variety.name', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    soil_type_display = serializers.CharField(source='get_soil_type_display', read_only=True)
    registered_by_name = serializers.SerializerMethodField()
    plant_density = serializers.ReadOnlyField()
    productivity_rate = serializers.ReadOnlyField()
    photos = ParcelPhotoSerializer(many=True, read_only=True)
    register_harvests = ParcelRegisterHarvestSerializer(many=True, read_only=True)
    
    class Meta:
        model = Parcel
        fields = [
            'id', 'code', 'name', 'producer', 'producer_name', 'producer_code',
            'region_name', 'commune_name',
            'latitude', 'longitude', 'altitude', 'gps_accuracy', 'polygon_coordinates',
            'area', 'vanilla_plants', 'productive_plants', 'variety', 'variety_name',
            'main_crop', 'intercrop', 'conversion_status', 'conversion_level', 'conversion_start_date',
            'eu_status', 'nop_status', 'estimated_yield', 'actual_harvest', 'delivered_quantity',
            'soil_type', 'soil_type_display', 'shade_percentage', 'irrigation',
            'planting_date', 'first_harvest_date',
            'status', 'status_display', 'is_certified', 'certification_date',
            'photo', 'notes', 'registered_by', 'registered_by_name',
            'plant_density', 'productivity_rate', 'photos',
            'register_harvests',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_registered_by_name(self, obj):
        return obj.registered_by.full_name if obj.registered_by else None


class ParcelCreateUpdateSerializer(serializers.ModelSerializer):
    """Serializer for create/update operations"""
    
    class Meta:
        model = Parcel
        fields = [
            'code', 'name', 'producer',
            'latitude', 'longitude', 'altitude', 'gps_accuracy', 'polygon_coordinates',
            'area', 'vanilla_plants', 'productive_plants',
            'main_crop', 'intercrop', 'conversion_status', 'conversion_level', 'conversion_start_date',
            'eu_status', 'nop_status', 'estimated_yield', 'actual_harvest', 'delivered_quantity',
            'variety',
            'soil_type', 'shade_percentage', 'irrigation',
            'planting_date', 'first_harvest_date',
            'status', 'is_certified', 'certification_date',
            'photo', 'notes'
        ]
    
    def create(self, validated_data):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            validated_data['registered_by'] = request.user
        return super().create(validated_data)

    def validate(self, attrs):
        conversion_status = attrs.get('conversion_status', getattr(self.instance, 'conversion_status', None))
        conversion_level = attrs.get('conversion_level', getattr(self.instance, 'conversion_level', None))
        if conversion_status == 'conversion' and conversion_level not in {'C1', 'C2', 'C3'}:
            raise serializers.ValidationError({'conversion_level': 'C1, C2 ou C3 est obligatoire pour une parcelle en conversion.'})
        if conversion_status in {'organic', 'conventional'}:
            # Changing away from conversion must not leave a stale C1/C2/C3
            # value behind.
            attrs['conversion_level'] = None
        return attrs
