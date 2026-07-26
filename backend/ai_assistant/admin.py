from django.contrib import admin
from .models import ChatSession, ChatMessage, AgriculturalRecommendation, MonthlyReport, AILog


@admin.register(ChatSession)
class ChatSessionAdmin(admin.ModelAdmin):
    list_display = ['id', 'user', 'title', 'topic', 'is_active', 'created_at']
    list_filter = ['topic', 'is_active', 'created_at']
    search_fields = ['title', 'user__username']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(ChatMessage)
class ChatMessageAdmin(admin.ModelAdmin):
    list_display = ['id', 'session', 'role', 'content_preview', 'is_read', 'created_at']
    list_filter = ['role', 'is_read', 'created_at']
    search_fields = ['content', 'session__title']
    readonly_fields = ['created_at']

    def content_preview(self, obj):
        return obj.content[:80]
    content_preview.short_description = 'Apercu'


@admin.register(AgriculturalRecommendation)
class AgriculturalRecommendationAdmin(admin.ModelAdmin):
    list_display = [
        'id', 'title', 'recommendation_type', 'priority',
        'producer', 'parcel', 'is_read', 'is_applied', 'created_at',
    ]
    list_filter = ['recommendation_type', 'priority', 'is_read', 'is_applied', 'created_at']
    search_fields = ['title', 'description', 'producer__name']
    readonly_fields = ['created_at', 'updated_at']
    actions = ['mark_as_read', 'mark_as_applied']

    def mark_as_read(self, request, queryset):
        queryset.update(is_read=True)
    mark_as_read.short_description = 'Marquer comme lu'

    def mark_as_applied(self, request, queryset):
        queryset.update(is_applied=True)
    mark_as_applied.short_description = 'Marquer comme applique'


@admin.register(MonthlyReport)
class MonthlyReportAdmin(admin.ModelAdmin):
    list_display = [
        'id', 'title', 'report_type', 'status', 'period_start',
        'period_end', 'generated_by', 'created_at',
    ]
    list_filter = ['report_type', 'status', 'created_at']
    search_fields = ['title', 'region', 'generated_by__username']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(AILog)
class AILogAdmin(admin.ModelAdmin):
    list_display = [
        'id', 'endpoint', 'user', 'tokens_used',
        'processing_time', 'is_successful', 'created_at',
    ]
    list_filter = ['endpoint', 'is_successful', 'created_at']
    search_fields = ['prompt', 'response', 'endpoint']
    readonly_fields = ['created_at']
