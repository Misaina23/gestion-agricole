from rest_framework import serializers
from .models import ChatSession, ChatMessage, AgriculturalRecommendation, MonthlyReport


class ChatMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChatMessage
        fields = [
            'id', 'session', 'role', 'content',
            'metadata', 'is_read', 'created_at',
        ]
        read_only_fields = ['id', 'created_at']


class ChatMessageCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChatMessage
        fields = ['session', 'role', 'content']
        write_only_fields = ['session']


class ChatSessionSerializer(serializers.ModelSerializer):
    messages = ChatMessageSerializer(many=True, read_only=True)
    message_count = serializers.SerializerMethodField()

    class Meta:
        model = ChatSession
        fields = [
            'id', 'user', 'title', 'topic', 'context_data',
            'is_active', 'messages', 'message_count',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_message_count(self, obj):
        return obj.messages.count()


class ChatSessionCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChatSession
        fields = ['title', 'topic', 'context_data']


class SendMessageSerializer(serializers.Serializer):
    message = serializers.CharField(max_length=5000)
    session_id = serializers.IntegerField(required=False, allow_null=True)
    topic = serializers.ChoiceField(
        choices=ChatSession.TOPIC_CHOICES, default='general'
    )


class AgriculturalRecommendationSerializer(serializers.ModelSerializer):
    producer_name = serializers.CharField(
        source='producer.name', read_only=True, default=''
    )
    parcel_name = serializers.CharField(
        source='parcel.__str__', read_only=True, default=''
    )

    class Meta:
        model = AgriculturalRecommendation
        fields = [
            'id', 'producer', 'producer_name', 'parcel', 'parcel_name',
            'recommendation_type', 'title', 'description', 'priority',
            'data', 'is_read', 'is_applied', 'created_at',
        ]
        read_only_fields = ['id', 'created_at']


class MonthlyReportSerializer(serializers.ModelSerializer):
    generated_by_name = serializers.CharField(
        source='generated_by.get_full_name', read_only=True, default=''
    )

    class Meta:
        model = MonthlyReport
        fields = [
            'id', 'title', 'report_type', 'period_start', 'period_end',
            'summary', 'report_data', 'generated_file', 'status',
            'generated_by', 'generated_by_name', 'region',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class GenerateReportSerializer(serializers.Serializer):
    report_type = serializers.ChoiceField(
        choices=MonthlyReport.REPORT_TYPE_CHOICES
    )
    period_start = serializers.DateField()
    period_end = serializers.DateField()
    region = serializers.CharField(max_length=100, required=False, allow_blank=True)
    include_charts = serializers.BooleanField(default=True)
    include_recommendations = serializers.BooleanField(default=True)
