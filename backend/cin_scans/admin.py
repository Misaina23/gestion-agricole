"""Admin registration for cin_scans."""
from django.contrib import admin
from .models import CINScan


@admin.register(CINScan)
class CINScanAdmin(admin.ModelAdmin):
    list_display = ('id', 'nom', 'prenom', 'numero_cin', 'sexe', 'agent', 'source', 'created_at')
    list_filter = ('sexe', 'source', 'synced', 'created_at')
    search_fields = ('nom', 'prenom', 'numero_cin')
    readonly_fields = ('created_at', 'updated_at', 'confidence', 'scan_metadata')

    def has_add_permission(self, request):
        return False
