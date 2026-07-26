"""
Serializers for Inspections App
"""
from rest_framework import serializers
from .models import Inspection, InspectionChecklist, InspectionPhoto, InspectionTemplate


class InspectionChecklistSerializer(serializers.ModelSerializer):
    class Meta:
        model = InspectionChecklist
        fields = [
            'id', 'inspection', 'category', 'item',
            'is_compliant', 'score', 'comment', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']


class InspectionPhotoSerializer(serializers.ModelSerializer):
    class Meta:
        model = InspectionPhoto
        fields = ['id', 'inspection', 'photo', 'caption', 'category', 'created_at']
        read_only_fields = ['id', 'created_at']


class InspectionListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for list views"""
    producer_name = serializers.CharField(source='producer.name', read_only=True)
    producer_code = serializers.CharField(source='producer.code', read_only=True)
    parcel_code = serializers.CharField(source='parcel.code', read_only=True)
    region_name = serializers.CharField(source='producer.region.name', read_only=True)
    inspector_name = serializers.SerializerMethodField()
    type_display = serializers.CharField(source='get_inspection_type_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    result_display = serializers.CharField(source='get_result_display', read_only=True)
    is_overdue = serializers.ReadOnlyField()

    class Meta:
        model = Inspection
        fields = [
            'id', 'code', 'producer', 'producer_name', 'producer_code',
            'parcel', 'parcel_code', 'region_name',
            'inspection_type', 'type_display', 'planned_date', 'actual_date',
            'inspector', 'inspector_name', 'status', 'status_display',
            'result', 'result_display', 'score_overall', 'is_overdue',
            'follow_up_required', 'created_at'
        ]

    def get_inspector_name(self, obj):
        return obj.inspector.full_name if obj.inspector else None


class InspectionDetailSerializer(serializers.ModelSerializer):
    """Full serializer for detail views"""
    producer_name = serializers.CharField(source='producer.name', read_only=True)
    producer_code = serializers.CharField(source='producer.code', read_only=True)
    parcel_code = serializers.CharField(source='parcel.code', read_only=True)
    parcel_name = serializers.CharField(source='parcel.name', read_only=True)
    region_name = serializers.CharField(source='producer.region.name', read_only=True)
    commune_name = serializers.CharField(source='producer.commune.name', read_only=True)
    inspector_name = serializers.SerializerMethodField()
    type_display = serializers.CharField(source='get_inspection_type_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    result_display = serializers.CharField(source='get_result_display', read_only=True)
    is_overdue = serializers.ReadOnlyField()
    checklist_items = InspectionChecklistSerializer(many=True, read_only=True)
    photos = InspectionPhotoSerializer(many=True, read_only=True)

    class Meta:
        model = Inspection
        fields = [
            'id', 'code', 'producer', 'producer_name', 'producer_code',
            'parcel', 'parcel_code', 'parcel_name', 'region_name', 'commune_name',
            'inspection_type', 'type_display', 'planned_date', 'actual_date',
            'inspector', 'inspector_name', 'status', 'status_display',
            'result', 'result_display',
            'score_overall', 'score_cultivation', 'score_processing',
            'score_storage', 'score_traceability', 'score_environment',
            'observations', 'recommendations', 'non_conformities', 'corrective_actions',
            'follow_up_required', 'follow_up_date', 'follow_up_notes',
            'photo', 'notes', 'is_overdue', 'checklist_items', 'photos',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_inspector_name(self, obj):
        return obj.inspector.full_name if obj.inspector else None


class InspectionCreateUpdateSerializer(serializers.ModelSerializer):
    """Serializer for create/update operations"""

    class Meta:
        model = Inspection
        fields = [
            'code', 'producer', 'parcel', 'inspection_type',
            'planned_date', 'actual_date', 'inspector', 'status', 'result',
            'score_overall', 'score_cultivation', 'score_processing',
            'score_storage', 'score_traceability', 'score_environment',
            'observations', 'recommendations', 'non_conformities', 'corrective_actions',
            'follow_up_required', 'follow_up_date', 'follow_up_notes',
            'photo', 'notes'
        ]


class InspectionTemplateSerializer(serializers.ModelSerializer):
    type_display = serializers.CharField(source='get_inspection_type_display', read_only=True)

    class Meta:
        model = InspectionTemplate
        fields = [
            'id', 'name', 'inspection_type', 'type_display',
            'checklist_template', 'is_active'
        ]
