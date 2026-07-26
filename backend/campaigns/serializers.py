"""
Serializers for Campaigns App
"""
from rest_framework import serializers
from .models import Campaign, CampaignProducer
from core.models import Region
from cultures.models import Culture


class CampaignSerializer(serializers.ModelSerializer):
    culture_name = serializers.CharField(source='culture.name', read_only=True)
    region_name = serializers.CharField(source='region.name', read_only=True)
    managed_by_name = serializers.CharField(source='managed_by.full_name', read_only=True)
    producers_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Campaign
        fields = [
            'id', 'name', 'description', 'start_date', 'end_date',
            'culture', 'culture_name', 'region', 'region_name',
            'objectives', 'budget', 'status', 'managed_by', 'managed_by_name',
            'producers_count', 'is_active', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_producers_count(self, obj):
        return obj.producers.filter(is_active=True).count()


class CampaignProducerSerializer(serializers.ModelSerializer):
    producer_name = serializers.CharField(source='producer.name', read_only=True)
    producer_code = serializers.CharField(source='producer.code', read_only=True)
    
    class Meta:
        model = CampaignProducer
        fields = [
            'id', 'campaign', 'producer', 'producer_name', 'producer_code',
            'enrollment_date', 'is_active', 'notes'
        ]
        read_only_fields = ['id']