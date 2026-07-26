"""
Serializers for Projects App
"""
from rest_framework import serializers
from .models import Project, ProjectActivity, Beneficiary


class ProjectSerializer(serializers.ModelSerializer):
    managed_by_name = serializers.CharField(source='managed_by.full_name', read_only=True)
    
    class Meta:
        model = Project
        fields = [
            'id', 'name', 'description', 'donor', 'budget', 'start_date',
            'end_date', 'intervention_zone', 'objectives', 'status',
            'managed_by', 'managed_by_name', 'is_active', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class ProjectActivitySerializer(serializers.ModelSerializer):
    project_name = serializers.CharField(source='project.name', read_only=True)
    
    class Meta:
        model = ProjectActivity
        fields = [
            'id', 'project', 'project_name', 'name', 'activity_type',
            'description', 'planned_date', 'actual_date', 'location',
            'target_audience', 'participants_count', 'budget', 'status',
            'notes', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class BeneficiarySerializer(serializers.ModelSerializer):
    project_name = serializers.CharField(source='project.name', read_only=True)
    producer_name = serializers.CharField(source='producer.name', read_only=True)
    
    class Meta:
        model = Beneficiary
        fields = [
            'id', 'project', 'project_name', 'beneficiary_type', 'producer',
            'producer_name', 'household_name', 'household_size',
            'enrollment_date', 'indicators_reached', 'is_active', 'notes'
        ]
        read_only_fields = ['id']