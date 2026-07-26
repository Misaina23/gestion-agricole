"""
Serializers for Trainings App
"""
from rest_framework import serializers
from .models import Training, TrainingAttendance


class TrainingSerializer(serializers.ModelSerializer):
    trainer_name = serializers.CharField(source='trainer.full_name', read_only=True)
    
    class Meta:
        model = Training
        fields = [
            'id', 'title', 'subject', 'description', 'training_date', 'location',
            'trainer', 'trainer_name', 'max_participants', 'evaluation_criteria',
            'notes', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class TrainingAttendanceSerializer(serializers.ModelSerializer):
    producer_name = serializers.CharField(source='producer.name', read_only=True)
    producer_code = serializers.CharField(source='producer.code', read_only=True)
    training_title = serializers.CharField(source='training.title', read_only=True)
    
    class Meta:
        model = TrainingAttendance
        fields = [
            'id', 'training', 'training_title', 'producer', 'producer_name',
            'producer_code', 'presence', 'attendance_time', 'evaluation_score',
            'evaluation_notes', 'signature_uri', 'photos', 'notes'
        ]
        read_only_fields = ['id']