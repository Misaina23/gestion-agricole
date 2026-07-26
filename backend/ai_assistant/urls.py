from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    ChatSessionViewSet,
    RecommendationViewSet,
    MonthlyReportViewSet,
    AgriculturalAdviceView,
    LLMProxyView,
)

router = DefaultRouter()
router.register(r'chat/sessions', ChatSessionViewSet, basename='chat-session')
router.register(r'recommendations', RecommendationViewSet, basename='recommendation')
router.register(r'reports', MonthlyReportViewSet, basename='monthly-report')

urlpatterns = [
    path('', include(router.urls)),
    path('advice/', AgriculturalAdviceView.as_view({'get': 'daily_tip'}), name='daily-tip'),
    path('advice/ask/', AgriculturalAdviceView.as_view({'post': 'ask'}), name='ask-advice'),
    path('anomalies/', AgriculturalAdviceView.as_view({'get': 'anomalies'}), name='ai-anomalies'),
    path('llm/', LLMProxyView.as_view(), name='llm-proxy'),
]
