"""
Serializers for Cultures App
"""
from rest_framework import serializers
from .models import Culture


class CultureSerializer(serializers.ModelSerializer):
    class Meta:
        model = Culture
        fields = [
            'id', 'name', 'variety', 'culture_type', 'growth_duration_days',
            'average_yield', 'yield_unit', 'ideal_season', 'market_price',
            'price_unit', 'description', 'is_active'
        ]
        read_only_fields = ['id']


class CultureListSerializer(serializers.ModelSerializer):
    campaigns_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Culture
        fields = ['id', 'name', 'variety', 'culture_type', 'average_yield', 'is_active', 'campaigns_count']
    
    def get_campaigns_count(self, obj):
        return obj.campaigns.filter(is_active=True).count()