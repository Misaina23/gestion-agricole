"""
Serializers for Inputs App
"""
from rest_framework import serializers
from .models import InputType, InputDistribution


class InputTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = InputType
        fields = ['id', 'name', 'type', 'unit', 'description', 'is_active']
        read_only_fields = ['id']


class InputDistributionSerializer(serializers.ModelSerializer):
    input_type_name = serializers.CharField(source='input_type.name', read_only=True)
    producer_name = serializers.CharField(source='producer.name', read_only=True)
    distributed_by_name = serializers.CharField(source='distributed_by.full_name', read_only=True)
    campaign_name = serializers.CharField(source='campaign.name', read_only=True)
    
    class Meta:
        model = InputDistribution
        fields = [
            'id', 'input_type', 'input_type_name', 'producer', 'producer_name',
            'quantity', 'unit', 'unit_value', 'total_value', 'distribution_date',
            'distributed_by', 'distributed_by_name', 'campaign', 'campaign_name',
            'notes', 'synced'
        ]
        read_only_fields = ['id', 'total_value']