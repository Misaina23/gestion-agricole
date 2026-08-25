"""
URL configuration for VIDEEKO VANILLA project.
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework_simplejwt.views import (
    TokenRefreshView,
    TokenVerifyView,
)
from auditlog.auth_views import LoggingTokenObtainPairView, logout_view

urlpatterns = [
    path('admin/', admin.site.urls),
    
    # API Authentication
    path('api/token/', LoggingTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/token/verify/', TokenVerifyView.as_view(), name='token_verify'),
    path('api/logout/', logout_view, name='logout'),
    
    # API Endpoints
    path('api/', include('core.urls')),
    path('api/accounts/', include('accounts.urls')),
    path('api/producers/', include('producers.urls')),
    path('api/parcels/', include('parcels.urls')),
    path('api/productions/', include('productions.urls')),
    path('api/inspections/', include('inspections.urls')),
    path('api/ai/', include('ai_assistant.urls')),
    path('api/notifications/', include('notifications.urls')),
    path('api/campaigns/', include('campaigns.urls')),
    path('api/cultures/', include('cultures.urls')),
    path('api/inputs/', include('inputs.urls')),
    path('api/trainings/', include('trainings.urls')),
    path('api/projects/', include('projects.urls')),
    path('api/workflows/', include('workflows.urls')),
    path('api/audit-logs/', include('auditlog.urls')),
    path('api/cin/', include('cin_scans.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
