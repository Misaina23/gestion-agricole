"""
Serializers for Workflows App
"""
from rest_framework import serializers
from .models import WorkflowStep, WorkflowInstance


class WorkflowStepSerializer(serializers.ModelSerializer):
    class Meta:
        model = WorkflowStep
        fields = [
            'id', 'name', 'step_type', 'order', 'required_role',
            'auto_approve', 'timeout_hours', 'escalation_role', 'is_active'
        ]
        read_only_fields = ['id']


class WorkflowInstanceSerializer(serializers.ModelSerializer):
    step_name = serializers.CharField(source='workflow_step.name', read_only=True)
    initiated_by_name = serializers.CharField(source='initiated_by.full_name', read_only=True)
    assigned_to_name = serializers.CharField(source='assigned_to.full_name', read_only=True)
    
    class Meta:
        model = WorkflowInstance
        fields = [
            'id', 'workflow_step', 'step_name', 'status', 'current_step',
            'initiated_by', 'initiated_by_name', 'assigned_to', 'assigned_to_name',
            'entity_type', 'entity_id', 'comment', 'action', 'completed_at',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']