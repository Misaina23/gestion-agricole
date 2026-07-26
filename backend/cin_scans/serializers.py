"""Serializers for cin_scans."""
from rest_framework import serializers
from .models import CINScan


class CINScanSerializer(serializers.ModelSerializer):
    agent_email = serializers.CharField(source='agent.email', read_only=True)

    class Meta:
        model = CINScan
        fields = [
            'id', 'agent', 'agent_email',
            'nom', 'prenom', 'numero_cin', 'date_naissance', 'lieu_naissance',
            'sexe', 'pere', 'mere', 'profession', 'adresse', 'arrondissement',
            'date_delivrance', 'date_expiration',
            'telephone', 'email', 'observations',
            'confidence', 'corrected_fields', 'scan_metadata', 'age', 'source',
            'synced', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'agent', 'agent_email', 'synced', 'created_at', 'updated_at']


class CINScanCreateSerializer(serializers.ModelSerializer):
    """Used by the mobile offline-sync endpoint (no file upload)."""

    class Meta:
        model = CINScan
        fields = [
            'nom', 'prenom', 'numero_cin', 'date_naissance', 'lieu_naissance',
            'sexe', 'pere', 'mere', 'profession', 'adresse', 'arrondissement',
            'date_delivrance', 'date_expiration',
            'telephone', 'email', 'observations',
            'confidence', 'corrected_fields', 'scan_metadata', 'age', 'source',
        ]
