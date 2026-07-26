"""
Serializers for Deliveries App
"""
from rest_framework import serializers
from .models import Delivery


class DeliverySerializer(serializers.ModelSerializer):
    producer_name = serializers.CharField(source='producer.name', read_only=True)
    producer_code = serializers.CharField(source='producer.code', read_only=True)
    received_by_name = serializers.CharField(source='received_by.full_name', read_only=True)
    campaign_name = serializers.CharField(source='campaign.name', read_only=True)
    
    class Meta:
        model = Delivery
        fields = [
            'id', 'product', 'quantity', 'quantity_unit', 'unit_price',
            'total_price', 'quality_bonus', 'buyer', 'collection_center',
            'delivery_date', 'producer', 'producer_name', 'producer_code',
            'campaign', 'campaign_name', 'status', 'received_by',
            'received_by_name', 'notes'
        ]
        read_only_fields = ['id', 'total_price']